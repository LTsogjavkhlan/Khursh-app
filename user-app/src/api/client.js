export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken')
  } catch {
    return null
  }
}

// Clears the stored session and sends the user back to login.
// Called whenever the backend reports the token is missing/expired (401),
// so a stale JWT never leaves the app in a broken authenticated state.
const handleUnauthorized = () => {
  try {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
  } catch {
    // ignore storage errors
  }
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

export async function apiRequest(path, options = {}) {
  // For FormData (file uploads) the browser must set the multipart
  // Content-Type itself, including the boundary — so don't override it.
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }

  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // ignore JSON parse errors for empty responses
  }

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized()
    }
    const message = data?.message || data?.error || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
