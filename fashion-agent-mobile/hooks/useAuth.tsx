import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, SecurityUtils } from '../services/api';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';

// User type definition
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

// Auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuthError: () => void;
  authError: string | null;
}

// Registration data type
interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if user is already authenticated on app start
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Check if we have a valid stored token
      const token = await SecurityUtils.getStoredToken();
      
      if (token) {
        // Try to get user profile with stored token
        const response = await authAPI.getProfile();
        setUser(response.data);
        
        // Log successful authentication restoration
        console.log('✅ Authentication restored from stored token');
        
        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
          text2: response.data.name ? `Hello, ${response.data.name}!` : 'Hello!',
          visibilityTime: 2000,
        });
      } else {
        console.log('ℹ️ No stored authentication found');
      }
    } catch (error: any) {
      console.error('❌ Auth status check failed:', error);
      
      // Clear invalid tokens
      await SecurityUtils.clearTokens();
      setUser(null);
      
      // Don't show error toast on app start - user might not have been logged in
      if (error.response?.status !== 401) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Please log in again',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Login function with security features
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('🔐 Attempting login for:', email);
      
      const response = await authAPI.login(email, password);
      const { userId, email: userEmail, token } = response.data;

      // Validate response data
      if (!userId || !token || !userEmail) {
        throw new Error('Invalid server response');
      }

      // Create user object from backend response
      const userData = {
        id: userId,
        email: userEmail,
        name: userEmail.split('@')[0], // Derive name from email
        createdAt: new Date().toISOString(),
        preferences: {
          notifications: true,
          theme: 'auto' as const,
        },
      };

      // Store token securely (already handled in authAPI.login)
      setUser(userData);

      console.log('✅ Login successful for:', userData.name);
      
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: userData.name ? `Welcome back, ${userData.name}!` : 'Welcome back!',
      });

      // Optional: Store additional user preferences
      await storeUserPreferences(userData);

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please try again.';
      
      setAuthError(errorMessage);
      
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });
      
      throw error; // Re-throw so UI can handle it
    } finally {
      setLoading(false);
    }
  };

  // Register function with validation
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setAuthError(null);

      // Input validation
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('All fields are required');
      }

      if (!isValidEmail(userData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (!isStrongPassword(userData.password)) {
        throw new Error('Password must contain uppercase, lowercase, and numbers');
      }

      console.log('📝 Attempting registration for:', userData.email);

      const response = await authAPI.register({
        name: userData.name.trim(),
        email: userData.email.toLowerCase(),
        password: userData.password,
      });

      const { userId, email: userEmail, token } = response.data;

      if (!userId || !token || !userEmail) {
        throw new Error('Invalid server response');
      }

      // Create user object from backend response
      const newUser = {
        id: userId,
        email: userEmail,
        name: userData.name.trim(),
        createdAt: new Date().toISOString(),
        preferences: {
          notifications: true,
          theme: 'auto' as const,
        },
      };

      setUser(newUser);

      console.log('✅ Registration successful for:', newUser.name);

      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: newUser.name ? `Welcome to Drip, ${newUser.name}!` : 'Welcome to Drip!',
      });

      // Store user preferences
      await storeUserPreferences(newUser);

    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.';
      
      setAuthError(errorMessage);
      
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: errorMessage,
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function with cleanup
  const logout = async () => {
    try {
      setLoading(true);
      
      console.log('🚪 Logging out user:', user?.name);
      
      // Call logout API endpoint
      await authAPI.logout();
      
      // Clear user state
      setUser(null);
      setAuthError(null);
      
      // Clear stored preferences
      await clearUserPreferences();
      
      console.log('✅ Logout successful');
      
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'See you next time!',
      });

    } catch (error: any) {
      console.error('❌ Logout error:', error);
      
      // Even if API call fails, clear local state
      setUser(null);
      setAuthError(null);
      await SecurityUtils.clearTokens();
      await clearUserPreferences();
      
      Toast.show({
        type: 'info',
        text1: 'Logged Out',
        text2: 'You have been logged out',
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile
  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      console.log('✅ User profile refreshed');
    } catch (error: any) {
      console.error('❌ Failed to refresh user profile:', error);
      
      if (error.response?.status === 401) {
        // Token expired, log out
        await logout();
      }
    }
  };

  // Clear auth error
  const clearAuthError = () => {
    setAuthError(null);
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    clearAuthError,
    authError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

const storeUserPreferences = async (user: User) => {
  try {
    await SecureStore.setItemAsync('user_preferences', JSON.stringify({
      theme: user.preferences?.theme || 'auto',
      notifications: user.preferences?.notifications ?? true,
      lastLogin: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to store user preferences:', error);
  }
};

const clearUserPreferences = async () => {
  try {
    await SecureStore.deleteItemAsync('user_preferences');
  } catch (error) {
    console.error('Failed to clear user preferences:', error);
  }
};

// Export the context for advanced use cases
export { AuthContext };
