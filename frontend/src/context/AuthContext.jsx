import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { connectSocket, disconnectSocket, getSocket, forceDisconnectSocket } from '../utils/socket'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)

  // Initialize Socket.IO
  useEffect(() => {
    if (!user?._id || !token) {
      setSocket(null)
      return
    }

    const sharedSocket = connectSocket(user._id)
    sharedSocket.emit('join-room', user._id || user.id)
    setSocket(sharedSocket)

    return () => {
      disconnectSocket(user._id)
    }
  }, [user?._id, user?.id, token])

  // Set axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = () => {
    const userId = user?._id || user?.id
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    forceDisconnectSocket(userId)
    setSocket(null)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    token,
    loading,
    socket,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
