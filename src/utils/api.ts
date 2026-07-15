import type {
  AuthResponse,
  CreateActivityPayload,
  CreateTripPayload,
  ItineraryDay,
  RemoveActivityPayload,
  Trip,
  User,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

interface RequestOptions extends RequestInit {
  token?: string | null
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...init } = options
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.message ?? 'Something went wrong. Please try again.')
  }

  return data as T
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register(email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  me(token: string) {
    return request<User>('/auth/me', { token })
  },

  getTrips(token: string) {
    return request<Trip[]>('/trips', { token })
  },

  createTrip(token: string, payload: CreateTripPayload) {
    return request<Trip>('/trips', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },

  deleteTrip(token: string, tripId: string) {
    return request<{ message: string }>(`/trips/${tripId}`, {
      method: 'DELETE',
      token,
    })
  },

  addActivity(token: string, tripId: string, payload: CreateActivityPayload) {
    return request<Trip>(`/trips/${tripId}/activity`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },

  removeActivity(token: string, tripId: string, payload: RemoveActivityPayload) {
    return request<Trip>(`/trips/${tripId}/activity`, {
      method: 'DELETE',
      token,
      body: JSON.stringify(payload),
    })
  },

  regenerateDay(token: string, tripId: string, dayNumber: number) {
    return request<ItineraryDay>(`/trips/${tripId}/regenerate-day`, {
      method: 'POST',
      token,
      body: JSON.stringify({ dayNumber }),
    })
  },
}
