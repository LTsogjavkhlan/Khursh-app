import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiRequest } from '../api/client'

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

  const [hasApartmentAccess, setHasApartmentAccess] = useState(() => {
    try {
      return localStorage.getItem('hasApartmentAccess') === 'true'
    } catch {
      return false
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

  useEffect(() => {
    try {
      localStorage.setItem('hasApartmentAccess', hasApartmentAccess ? 'true' : 'false')
    } catch {
      // ignore storage errors
    }
  }, [hasApartmentAccess])

  // Pull the latest user + a freshly-signed token from the server. This keeps
  // HOA-scoped content and apartment access in sync after membership changes
  // (e.g. a user just added as a tenant) without requiring a re-login.
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest('/api/auth/me')
      if (data?.token) setToken(data.token)
      if (data?.user) setUser(data.user)
      setHasApartmentAccess(!!data?.hasApartmentAccess)
      return data
    } catch {
      // ignore; interceptor handles 401s
      return null
    }
  }, [])

  const isAuthenticated = !!token

  // Refresh once on mount (existing session) and again whenever the user logs
  // in. Depending on the boolean `isAuthenticated` (not the token string) avoids
  // a re-run loop when refreshUser stores a newly-signed token.
  useEffect(() => {
    if (isAuthenticated) refreshUser()
  }, [isAuthenticated, refreshUser])

  const completeLogin = (tokenValue, userValue) => {
    setToken(tokenValue)
    setUser(userValue || null)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setHasApartmentAccess(false)
    try {
      localStorage.removeItem('hasApartmentAccess')
    } catch {
      // ignore storage errors
    }
  }

  const value = {
    token,
    user,
    hasApartmentAccess,
    isAuthenticated,
    completeLogin,
    logout,
    refreshUser,
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
