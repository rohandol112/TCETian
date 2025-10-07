import { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return { ...state, loading: true, error: null }
    
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        loading: false, 
        error: null 
      }
    
    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        loading: false, 
        error: action.payload 
      }
    
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        loading: false, 
        error: null 
      }
    
    case 'LOAD_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        loading: false 
      }
    
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  
  useEffect(() => {
    // Check if user is authenticated on app load
    if (authService.isAuthenticated()) {
      loadUser()
    } else {
      dispatch({ type: 'LOGOUT' })
    }
  }, [])

  // Load user from token
  const loadUser = async () => {
    try {
      const response = await authService.getProfile()
      dispatch({ type: 'LOAD_USER', payload: response.data.user })
    } catch (error) {
      authService.logout()
      dispatch({ type: 'LOGOUT' })
    }
  }

  // Login user
  const login = async (email, password, role = null) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      const loginData = { email, password }
      if (role) {
        loginData.role = role
      }
      
      const response = await authService.login(loginData)
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user })
      return { success: true }
    } catch (error) {
      const message = error.message || 'Login failed'
      dispatch({ type: 'LOGIN_ERROR', payload: message })
      return { success: false, error: message }
    }
  }

  // Register user
  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' })
    
    try {
      const response = await authService.register(userData)
      dispatch({ type: 'REGISTER_SUCCESS', payload: response.data.user })
      return { success: true }
    } catch (error) {
      const message = error.message || 'Registration failed'
      dispatch({ type: 'REGISTER_ERROR', payload: message })
      return { success: false, error: message }
    }
  }

  // Logout user
  const logout = () => {
    authService.logout()
    dispatch({ type: 'LOGOUT' })
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  // Update user data
  const updateUser = (userData) => {
    dispatch({ type: 'LOAD_USER', payload: userData })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    loadUser,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}