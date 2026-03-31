import axios from 'axios'

const api = axios.create({
  baseURL: 'https://wastezero-deploy.onrender.com/api'
})

console.log("ENV API:", import.meta.env.VITE_API_URL)

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Message API endpoints
export const messageApi = {
  sendMessage: (data) => api.post('/messages/send', data),
  getConversation: (userId, limit = 50, skip = 0) => 
    api.get(`/messages/conversation/${userId}`, { params: { limit, skip } }),
  getConversations: () => api.get('/messages/conversations'),
  getPickupMessages: (pickupId) => api.get(`/messages/pickup/${pickupId}`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  searchMessages: (query) => api.get(`/messages/search/${query}`)
}

export default api
