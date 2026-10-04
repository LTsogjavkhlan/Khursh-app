import { apiRequest } from './client'

const TYPE_MAP = {
  'Гомдол': 'complaint',
  'Шинэ санаа': 'suggestion',
  'Эвдрэл гэмтэл': 'maintenance',
}

export function submitFeedback({ title, description, type }) {
  return apiRequest('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ title, description, type: TYPE_MAP[type] || 'other' }),
  })
}

export function fetchMyFeedback() {
  return apiRequest('/api/feedback/my', {
    method: 'GET',
  })
}

