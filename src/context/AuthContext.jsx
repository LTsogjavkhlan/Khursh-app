import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('authToken')
    } catch {
      return null
    }
  })

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('authUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('authToken', token)
      } else {
        localStorage.removeItem('authToken')
      }
    } catch {
      // ignore storage errors
    }
  }, [token])

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('authUser', JSON.stringify(user))
      } else {
        localStorage.removeItem('authUser')
      }
    } catch {
      // ignore storage errors
    }
  }, [user])

  const completeLogin = (tokenValue, userValue) => {
    setToken(tokenValue)
    setUser(userValue || null)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    completeLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

