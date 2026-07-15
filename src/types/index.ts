export type BudgetTier = 'Low' | 'Medium' | 'High'

export interface User {
  id?: string
  _id?: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Activity {
  _id?: string
  title: string
  description?: string
  estimatedCostUSD?: number
  timeOfDay?: string
}

export interface ItineraryDay {
  _id?: string
  dayNumber: number
  activities: Activity[]
}

export interface Hotel {
  _id?: string
  name: string
  tier?: string
  estimatedCostNightUSD?: number
  rating?: string
}

export interface EstimatedBudget {
  transport?: number
  accommodation?: number
  food?: number
  activities?: number
  total?: number
}

export interface PackingItem {
  _id?: string
  item: string
  category?: string
  isPacked?: boolean
}

export interface Trip {
  _id: string
  destination: string
  durationDays: number
  budgetTier: BudgetTier
  interests: string[]
  itinerary: ItineraryDay[]
  hotels: Hotel[]
  estimatedBudget?: EstimatedBudget
  packingList: PackingItem[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateTripPayload {
  destination: string
  durationDays: number
  budgetTier: BudgetTier
  interests: string[]
}

export interface CreateActivityPayload {
  dayNumber: number
  activity: Activity
}

export interface RemoveActivityPayload {
  dayNumber: number
  activityId: string
}
