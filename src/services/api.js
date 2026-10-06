const API_URL = (import.meta.env.VITE_API_URL || 'https://ai-travel-planner-backend-tk8r.onrender.com/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const { token, headers, ...init } = options
  const response = await fetch(API_URL + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers },
  })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = { message: text } }
  if (!response.ok) throw new Error(data?.message || 'Something went wrong. Please try again.')
  return data
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: (token) => request('/auth/me', { token }),
  getTrips: (token) => request('/trips', { token }),
  createTrip: (token, payload) => request('/trips', { method: 'POST', token, body: JSON.stringify(payload) }),
  deleteTrip: (token, id) => request('/trips/' + id, { method: 'DELETE', token }),
  addActivity: (token, id, payload) => request('/trips/' + id + '/activity', { method: 'POST', token, body: JSON.stringify(payload) }),
  removeActivity: (token, id, payload) => request('/trips/' + id + '/activity', { method: 'DELETE', token, body: JSON.stringify(payload) }),
  regenerateDay: (token, id, dayNumber) => request('/trips/' + id + '/regenerate-day', { method: 'POST', token, body: JSON.stringify({ dayNumber }) }),
}
