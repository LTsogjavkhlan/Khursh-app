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

  // Which optional features the user's HOA has (gate button, plate
  // registration, guest passes). null = unknown / not in an HOA.
  const [hoaFeatures, setHoaFeatures] = useState(() => {
    try {
      const stored = localStorage.getItem('hoaFeatures')
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

  useEffect(() => {
    try {
      localStorage.setItem('hasApartmentAccess', hasApartmentAccess ? 'true' : 'false')
    } catch {
      // ignore storage errors
    }
  }, [hasApartmentAccess])

  useEffect(() => {
    try {
      if (hoaFeatures) localStorage.setItem('hoaFeatures', JSON.stringify(hoaFeatures))
      else localStorage.removeItem('hoaFeatures')
    } catch {
      // ignore storage errors
    }
  }, [hoaFeatures])

  // Pull the latest user + a freshly-signed token from the server. This keeps
  // HOA-scoped content and apartment access in sync after membership changes
  // (e.g. a user just added as a tenant) without requiring a re-login.
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest('/api/auth/me')
      if (data?.token) setToken(data.token)
      if (data?.user) setUser(data.user)
      setHasApartmentAccess(!!data?.hasApartmentAccess)
      setHoaFeatures(data?.hoaFeatures ?? null)
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
    setHoaFeatures(null)
    try {
      localStorage.removeItem('hasApartmentAccess')
    } catch {
      // ignore storage errors
    }
  }

  // A feature counts as available unless the HOA has explicitly switched it
  // off, so nothing greys out while features are still loading.
  const hasFeature = useCallback((key) => hoaFeatures?.[key] !== false, [hoaFeatures])

  const value = {
    token,
    user,
    hasApartmentAccess,
    hoaFeatures,
    hasFeature,
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
