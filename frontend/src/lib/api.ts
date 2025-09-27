import axios from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('auth-token')
      Cookies.remove('user-data')
      window.location.reload()
    }
    
    const message = error.response?.data?.error || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password })
    return response.data
  },
}

// Profile API
export const profileApi = {
  get: async () => {
    const response = await api.get('/profile')
    return response.data
  },

  update: async (profile: any) => {
    const response = await api.put('/profile', profile)
    return response.data
  },
}

// Reviews API
export const reviewsApi = {
  create: async (imageFile: File, description?: string) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    if (description) {
      formData.append('description', description)
    }

    const response = await api.post('/reviews', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getAll: async () => {
    const response = await api.get('/reviews')
    return response.data
  },

  compare: async (reviewId: string, previousReviewIds: string[]) => {
    const response = await api.post(`/reviews/${reviewId}/compare`, {
      previousReviewIds,
    })
    return response.data
  },

  accept: async (reviewId: string, accepted: boolean) => {
    const response = await api.post(`/reviews/${reviewId}/accept`, {
      accepted,
    })
    return response.data
  },
}

export default api
