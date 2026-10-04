import { apiRequest } from './client'

export function fetchMessages(before) {
  const params = new URLSearchParams({ limit: '50' })
  if (before) params.set('before', before)
  return apiRequest(`/api/chat/messages?${params.toString()}`)
}

export function sendMessage(content) {
  return apiRequest('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
