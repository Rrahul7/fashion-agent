import axios, { AxiosResponse, AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import Toast from 'react-native-toast-message';

// Environment-based API URL configuration
const getApiUrl = () => {
  if (__DEV__) {
    // Development - use your local IP address
    const localIP = '192.168.1.24'; // Your actual IP address
    return Platform.select({
      ios: `http://${localIP}:5000/api`,
      android: `http://${localIP}:5000/api`,
      default: `http://${localIP}:5000/api`,
    });
  }
  
  // Production - use your deployed backend URL
  return 'https://your-backend-url.up.railway.app/api';
};

const API_BASE_URL = getApiUrl();

// Security constants
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Create axios instance with security defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for image uploads
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Security utility functions
export const SecurityUtils = {
  // Generate request signature for sensitive operations
  generateRequestSignature: async (data: any, timestamp: number): Promise<string> => {
    const payload = JSON.stringify(data) + timestamp.toString();
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      payload,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  },

  // Secure token storage
  storeTokenSecurely: async (token: string, expiresIn?: number) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (expiresIn) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
    } catch (error) {
      console.error('Error storing token:', error);
    }
  },

  // Get stored token
  getStoredToken: async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
      
      if (token && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() > expiryTime) {
          // Token expired, clean up
          await SecurityUtils.clearTokens();
          return null;
        }
      }
      
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  // Clear all stored tokens
  clearTokens: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },

  // Force clear all authentication and guest data
  clearAllAuth: async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('token_expiry');
      await SecureStore.deleteItemAsync('user_data');
      await SecureStore.deleteItemAsync('guest_session_id');
      console.log('🧹 All authentication data cleared');
    } catch (error) {
      console.error('Error clearing all auth data:', error);
    }
  },

  // Validate API response integrity
  validateResponse: (response: AxiosResponse): boolean => {
    // Basic response validation
    if (!response || !response.data) return false;
    
    // Check for expected structure
    if (response.status < 200 || response.status >= 300) return false;
    
    return true;
  },
};

// Guest session management
const GUEST_SESSION_KEY = 'guest_session_id';

const GuestUtils = {
  // Get stored guest session ID
  getGuestSessionId: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(GUEST_SESSION_KEY);
    } catch (error) {
      console.error('Error retrieving guest session:', error);
      return null;
    }
  },

  // Store guest session ID
  setGuestSessionId: async (sessionId: string) => {
    try {
      await SecureStore.setItemAsync(GUEST_SESSION_KEY, sessionId);
    } catch (error) {
      console.error('Error storing guest session:', error);
    }
  },

  // Generate new guest session ID
  generateGuestSessionId: (): string => {
    return 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  },

  // Clear guest session
  clearGuestSession: async () => {
    try {
      await SecureStore.deleteItemAsync(GUEST_SESSION_KEY);
    } catch (error) {
      console.error('Error clearing guest session:', error);
    }
  },
};

// Request interceptor - Add auth token and security headers
api.interceptors.request.use(
  async (config) => {
    try {
      // Add authentication token
      const token = await SecurityUtils.getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // For guest users, add guest session ID
        let guestSessionId = await GuestUtils.getGuestSessionId();
        if (!guestSessionId) {
          guestSessionId = GuestUtils.generateGuestSessionId();
          await GuestUtils.setGuestSessionId(guestSessionId);
        }
        config.headers['Guest-Session'] = guestSessionId;
        console.log('🔐 Adding Guest-Session header:', guestSessionId);
      }

      // Add security headers for sensitive operations
      if (['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
        const timestamp = Date.now();
        config.headers['X-Timestamp'] = timestamp.toString();
        
        // Add request signature for extra security
        if (config.data) {
          const signature = await SecurityUtils.generateRequestSignature(config.data, timestamp);
          config.headers['X-Signature'] = signature;
        }
      }

      // Add device info for analytics and security
      config.headers['X-Platform'] = Platform.OS;
      config.headers['X-App-Version'] = '1.0.0';

      // Log requests in development
      if (__DEV__) {
        console.log(`🔐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        if (config.data) {
          console.log('📤 Request data:', JSON.stringify(config.data, null, 2));
        }
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Validate response integrity
    if (!SecurityUtils.validateResponse(response)) {
      console.warn('⚠️ Response validation failed');
    }

    if (__DEV__) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }

    return response;
  },
  async (error: AxiosError) => {
    const { response, request, config } = error;

    if (__DEV__) {
      console.error(`❌ API Error: ${response?.status || 'Network'} ${config?.url}`);
      if (response?.data) {
        console.error('📥 Error response:', response.data);
      }
    }

    // Handle specific error cases
    if (response?.status === 401) {
      // Unauthorized - token expired or invalid
      await SecurityUtils.clearTokens();
      
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please log in again',
      });

      // Navigate to login screen (implement based on your navigation)
      // You might want to use a navigation service here
      
    } else if (response?.status === 403) {
      // Forbidden - insufficient permissions
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'You don\'t have permission for this action',
      });
      
    } else if (response?.status === 429) {
      // Rate limited
      Toast.show({
        type: 'error',
        text1: 'Too Many Requests',
        text2: 'Please wait a moment and try again',
      });
      
    } else if (!response && request) {
      // Network error
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please check your internet connection',
      });
      
    } else if (response?.status && response.status >= 500) {
      // Server error
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: 'Something went wrong. Please try again later.',
      });
    }

    return Promise.reject(error);
  }
);

// API endpoints with security features
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Store token securely if login successful
    if (response.data.token) {
      await SecurityUtils.storeTokenSecurely(
        response.data.token,
        response.data.expiresIn
      );
    }
    
    return response;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    
    // Store token securely if registration successful
    if (response.data.token) {
      await SecurityUtils.storeTokenSecurely(
        response.data.token,
        response.data.expiresIn
      );
    }
    
    return response;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, clearing local tokens anyway');
    } finally {
      await SecurityUtils.clearTokens();
    }
  },

  getProfile: () => api.get('/profile'),
  
  updateProfile: (profileData: any) => api.put('/profile', profileData),
};

export const fashionAPI = {
  // Secure image upload with progress tracking
  uploadImage: (imageUri: string, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'outfit.jpg',
    } as any);

    return api.post('/reviews', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
      timeout: 60000, // 60 seconds for image uploads
    });
  },

  getAnalysisHistory: () => api.get('/reviews'),
  
  getAnalysis: (id: string) => api.get(`/reviews/${id}`),
  
  deleteAnalysis: (id: string) => api.delete(`/reviews/${id}`),
};

export const guestAPI = {
  // Test guest session endpoint
  testSession: () => {
    console.log('🧪 Testing guest session...');
    return api.get('/guest/reviews/test');
  },

  // Guest image upload with progress tracking
  uploadImage: (imageUri: string, description?: string, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'outfit.jpg',
    } as any);
    
    if (description) {
      formData.append('description', description);
    }

    return api.post('/guest/reviews', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
      timeout: 60000, // 60 seconds for image uploads
    });
  },

  // Get guest usage info
  getUsage: () => api.get('/guest/reviews/usage'),

  // Submit guest feedback
  submitFeedback: (reviewId: string, feedbackData: {
    feedbackRating?: number;
    userFeedback?: string;
    accepted?: boolean;
  }) => {
    return api.post(`/guest/reviews/${reviewId}/feedback`, feedbackData);
  },
};

// Health check endpoint
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default api;
