import { apiRequest } from './client'

const TYPE_MAP = {
  'Гомдол': 'complaint',
  'Шинэ санаа': 'suggestion',
  'Эвдрэл гэмтэл': 'maintenance',
}

// `images` is an optional array of File objects (max 3, already resized).
// With photos the request is multipart; without, plain JSON as before.
export function submitFeedback({ title, description, type, images = [] }) {
  const mappedType = TYPE_MAP[type] || 'other'

  if (images.length === 0) {
    return apiRequest('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ title, description, type: mappedType }),
    })
  }

  const form = new FormData()
  form.append('title', title)
  form.append('description', description)
  form.append('type', mappedType)
  images.forEach(file => form.append('images', file, file.name))
  return apiRequest('/api/feedback', { method: 'POST', body: form })
}

export function fetchMyFeedback() {
  return apiRequest('/api/feedback/my', {
    method: 'GET',
  })
}
