import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import './App.css'
import { CreateTripForm } from './components/CreateTripForm'
import { ItineraryCard } from './components/ItineraryCard'
import { PackingList } from './components/PackingList'
import type { Activity, AuthResponse, CreateTripPayload, Trip, User } from './types'
import { api } from './utils/api'

const tokenKey = 'trao_token'
const profileImageKey = 'trao_profile_image'

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function makeGeneratedImage(title: string, tone = 'teal') {
  const safeTitle = title.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    }
    return replacements[character]
  })
  const palettes: Record<string, string[]> = {
    amber: ['#fff7df', '#b7791f', '#0f766e', '#f2d08a'],
    coral: ['#fff1e7', '#d95f43', '#0f766e', '#f6c177'],
    teal: ['#e6f5f1', '#0f766e', '#d95f43', '#8dd3c7'],
  }
  const [background, primary, accent, glow] = palettes[tone] ?? palettes.teal
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560">
      <defs>
        <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="${background}" />
          <stop offset="1" stop-color="#ffffff" />
        </linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="18" /></filter>
      </defs>
      <rect width="900" height="560" fill="url(#sky)" />
      <circle cx="720" cy="120" r="92" fill="${glow}" opacity=".72" filter="url(#soft)" />
      <path d="M0 395 C150 335 225 410 355 350 C470 298 560 334 660 292 C760 250 832 268 900 235 L900 560 L0 560 Z" fill="${primary}" opacity=".92" />
      <path d="M0 445 C140 395 260 440 410 390 C560 340 710 385 900 320 L900 560 L0 560 Z" fill="${accent}" opacity=".64" />
      <path d="M122 322 L190 238 L260 322 Z M214 322 L312 198 L420 322 Z M550 318 L640 214 L760 318 Z" fill="#fffaf1" opacity=".9" />
      <path d="M110 380 H795" stroke="#fffaf1" stroke-width="16" stroke-linecap="round" opacity=".75" />
      <text x="58" y="94" fill="#17201c" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="800">${safeTitle}</text>
      <text x="62" y="138" fill="#66706b" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600">AI generated destination preview</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function DestinationImage({
  title,
  tone = 'teal',
  className = '',
}: {
  title: string
  tone?: 'teal' | 'coral' | 'amber'
  className?: string
}) {
  const [readyTitle, setReadyTitle] = useState('')
  const isReady = readyTitle === title

  useEffect(() => {
    const timer = window.setTimeout(() => setReadyTitle(title), 420)
    return () => window.clearTimeout(timer)
  }, [title])

  return (
    <div className={`image-frame ${className} ${isReady ? 'loaded' : 'loading'}`}>
      {!isReady ? (
        <div className="image-placeholder">
          <span />
          <strong>Generating image...</strong>
        </div>
      ) : (
        <img alt={`${title} travel preview`} loading="lazy" src={makeGeneratedImage(title, tone)} />
      )}
    </div>
  )
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey))
  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(token))
  const [isGenerating, setIsGenerating] = useState(false)
  const [busyTripAction, setBusyTripAction] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'trips' | 'profile'>('trips')
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem(profileImageKey) ?? '')

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip._id === selectedTripId) ?? trips[0] ?? null,
    [selectedTripId, trips],
  )

  useEffect(() => {
    if (!token) {
      return
    }

    async function hydrateSession() {
      try {
        setError('')
        const [currentUser, savedTrips] = await Promise.all([
          api.me(token as string),
          api.getTrips(token as string),
        ])
        setUser(currentUser)
        setTrips(savedTrips)
        setSelectedTripId(savedTrips[0]?._id ?? null)
      } catch (sessionError) {
        localStorage.removeItem(tokenKey)
        setToken(null)
        setError(sessionError instanceof Error ? sessionError.message : 'Session expired.')
      } finally {
        setIsLoading(false)
      }
    }

    hydrateSession()
  }, [token])

  const applyAuth = (authResponse: AuthResponse) => {
    localStorage.setItem(tokenKey, authResponse.token)
    setToken(authResponse.token)
    setUser(authResponse.user)
  }

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      setError('')
      const authResponse =
        authMode === 'login'
          ? await api.login(email.trim(), password)
          : await api.register(email.trim(), password)
      applyAuth(authResponse)
      const savedTrips = await api.getTrips(authResponse.token)
      setTrips(savedTrips)
      setSelectedTripId(savedTrips[0]?._id ?? null)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem(tokenKey)
    setToken(null)
    setUser(null)
    setTrips([])
    setSelectedTripId(null)
    setPassword('')
  }

  const handleProfileImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const image = String(reader.result)
      localStorage.setItem(profileImageKey, image)
      setProfileImage(image)
    })
    reader.readAsDataURL(file)
  }

  const handleCreateTrip = async (payload: CreateTripPayload) => {
    if (!token) {
      return
    }

    setIsGenerating(true)
    setActiveTab('trips')
    try {
      setError('')
      const trip = await api.createTrip(token, payload)
      setTrips((currentTrips) => [trip, ...currentTrips])
      setSelectedTripId(trip._id)
    } catch (tripError) {
      setError(tripError instanceof Error ? tripError.message : 'Trip generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  const replaceTrip = (updatedTrip: Trip) => {
    setTrips((currentTrips) =>
      currentTrips.map((trip) => (trip._id === updatedTrip._id ? updatedTrip : trip)),
    )
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!token) {
      return
    }

    setBusyTripAction(true)
    try {
      setError('')
      await api.deleteTrip(token, tripId)
      const remainingTrips = trips.filter((trip) => trip._id !== tripId)
      setTrips(remainingTrips)
      setSelectedTripId(remainingTrips[0]?._id ?? null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete trip.')
    } finally {
      setBusyTripAction(false)
    }
  }

  const handleAddActivity = async (dayNumber: number, activity: Activity) => {
    if (!token || !selectedTrip) {
      return
    }

    setBusyTripAction(true)
    try {
      setError('')
      const updatedTrip = await api.addActivity(token, selectedTrip._id, {
        dayNumber,
        activity,
      })
      replaceTrip(updatedTrip)
    } catch (activityError) {
      setError(activityError instanceof Error ? activityError.message : 'Could not add activity.')
    } finally {
      setBusyTripAction(false)
    }
  }

  const handleRemoveActivity = async (dayNumber: number, activityId: string) => {
    if (!token || !selectedTrip) {
      return
    }

    setBusyTripAction(true)
    try {
      setError('')
      const updatedTrip = await api.removeActivity(token, selectedTrip._id, {
        dayNumber,
        activityId,
      })
      replaceTrip(updatedTrip)
    } catch (activityError) {
      setError(activityError instanceof Error ? activityError.message : 'Could not remove activity.')
    } finally {
      setBusyTripAction(false)
    }
  }

  const handleRegenerateDay = async (dayNumber: number) => {
    if (!token || !selectedTrip) {
      return
    }

    setBusyTripAction(true)
    try {
      setError('')
      const day = await api.regenerateDay(token, selectedTrip._id, dayNumber)
      replaceTrip({
        ...selectedTrip,
        itinerary: selectedTrip.itinerary.map((currentDay) =>
          currentDay.dayNumber === dayNumber ? day : currentDay,
        ),
      })
    } catch (regenerateError) {
      setError(
        regenerateError instanceof Error ? regenerateError.message : 'Could not regenerate day.',
      )
    } finally {
      setBusyTripAction(false)
    }
  }

  if (token && !user && isLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-panel loading-panel">
          <DestinationImage title="Travel workspace" tone="coral" className="auth-visual" />
          <div>
            <p className="eyebrow">Trao</p>
            <h1>Restoring your travel workspace.</h1>
            <p className="lede">Loading saved trips and account details...</p>
          </div>
        </section>
      </main>
    )
  }

  if (!token || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div>
            <DestinationImage title="Trao travel planner" tone="teal" className="auth-visual" />
            <p className="eyebrow">AI travel planner</p>
            <h1>Plan the trip, then tune every day.</h1>
            <p className="lede">
              Sign in to generate itineraries, compare budgets, keep packing lists, and adjust the
              plan as your route changes.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            <div className="mode-toggle" aria-label="Authentication mode">
              <button
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => setAuthMode('login')}
                type="button"
              >
                Login
              </button>
              <button
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => setAuthMode('register')}
                type="button"
              >
                Register
              </button>
            </div>

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="error-message">{error}</p> : null}

            <button className="primary-button" disabled={isLoading || !email || !password}>
              {isLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="profile-card">
          <div className="profile-avatar">
            {profileImage ? (
              <img alt="User profile" src={profileImage} />
            ) : (
              <span>{getInitials(user.email)}</span>
            )}
          </div>
          <div>
            <p className="eyebrow">Trao</p>
            <h1>Travel workspace</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <nav className="tab-switcher" aria-label="Workspace sections">
          <button
            className={activeTab === 'trips' ? 'active' : ''}
            onClick={() => setActiveTab('trips')}
            type="button"
          >
            Trips
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
            type="button"
          >
            Profile
          </button>
        </nav>

        {activeTab === 'trips' ? (
          <>
            <CreateTripForm isSubmitting={isGenerating} onCreateTrip={handleCreateTrip} />

            {isGenerating ? (
              <div className="generation-card">
                <DestinationImage title="New destination" tone="coral" />
                <div>
                  <strong>Building your trip</strong>
                  <p>Generating route, budget, packing list, and preview images.</p>
                </div>
                <div className="progress-bar" />
              </div>
            ) : null}

            <div className="trip-list">
              <div className="section-heading">
                <h2>Saved trips</h2>
                <span>{trips.length}</span>
              </div>
              {trips.length === 0 ? (
                <p className="empty-copy">Generate your first trip to start building an itinerary.</p>
              ) : (
                trips.map((trip, index) => (
                  <button
                    className={`trip-list-item ${selectedTrip?._id === trip._id ? 'active' : ''}`}
                    key={trip._id}
                    onClick={() => setSelectedTripId(trip._id)}
                    type="button"
                  >
                    <DestinationImage
                      className="trip-thumb"
                      title={trip.destination}
                      tone={index % 2 === 0 ? 'teal' : 'amber'}
                    />
                    <span>
                      <strong>{trip.destination}</strong>
                      <small>
                        {trip.durationDays} days - {trip.budgetTier}
                      </small>
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <section className="profile-panel">
            <div className="profile-hero">
              <div className="profile-avatar large">
                {profileImage ? (
                  <img alt="User profile" src={profileImage} />
                ) : (
                  <span>{getInitials(user.email)}</span>
                )}
              </div>
              <div>
                <p className="eyebrow">Profile</p>
                <h2>{user.email}</h2>
                <p>{trips.length} saved trips</p>
              </div>
            </div>
            <label className="upload-control">
              <span>Upload profile image</span>
              <input accept="image/*" type="file" onChange={handleProfileImage} />
            </label>
            {profileImage ? (
              <button
                className="ghost-button danger-text"
                onClick={() => {
                  localStorage.removeItem(profileImageKey)
                  setProfileImage('')
                }}
                type="button"
              >
                Remove image
              </button>
            ) : null}
            <div className="profile-stats">
              <div>
                <span>Total days</span>
                <strong>{trips.reduce((total, trip) => total + trip.durationDays, 0)}</strong>
              </div>
              <div>
                <span>Destinations</span>
                <strong>{trips.length}</strong>
              </div>
            </div>
          </section>
        )}

        <button className="ghost-button full-width" onClick={handleSignOut} type="button">
          Sign out
        </button>
      </aside>

      <section className="trip-workspace">
        {error ? <p className="error-message sticky">{error}</p> : null}

        {isGenerating ? (
          <section className="workspace-loading">
            <DestinationImage title="Generating your trip" tone="coral" className="workspace-image" />
            <div>
              <p className="eyebrow">Please wait</p>
              <h2>Creating itinerary and images</h2>
              <p>The AI planner is preparing the route, budget, hotels, and packing list.</p>
            </div>
          </section>
        ) : selectedTrip ? (
          <>
            <header className="trip-hero">
              <DestinationImage title={selectedTrip.destination} tone="teal" className="hero-image" />
              <div className="trip-hero-content">
                <div>
                  <p className="eyebrow">{selectedTrip.budgetTier} budget</p>
                  <h2>{selectedTrip.destination}</h2>
                  <p>
                    {selectedTrip.durationDays} days planned around{' '}
                    {selectedTrip.interests.join(', ') || 'your interests'}.
                  </p>
                </div>
                <button
                  className="ghost-button danger-text"
                  disabled={busyTripAction}
                  onClick={() => handleDeleteTrip(selectedTrip._id)}
                  type="button"
                >
                  Delete trip
                </button>
              </div>
            </header>

            <section className="summary-grid">
              {Object.entries(selectedTrip.estimatedBudget ?? {}).map(([label, value]) => (
                <div className="summary-tile" key={label}>
                  <span>{label}</span>
                  <strong>{formatCurrency(value)}</strong>
                </div>
              ))}
            </section>

            <div className="content-grid">
              <section className="main-column">
                <div className="section-heading">
                  <h2>Itinerary</h2>
                  {busyTripAction ? <span>Updating...</span> : null}
                </div>
                {selectedTrip.itinerary.map((day) => (
                  <ItineraryCard
                    day={day}
                    isBusy={busyTripAction}
                    key={day._id ?? day.dayNumber}
                    onAddActivity={handleAddActivity}
                    onRemoveActivity={handleRemoveActivity}
                    onRegenerateDay={handleRegenerateDay}
                  />
                ))}
              </section>

              <aside className="detail-column">
                <section className="panel image-panel">
                  <DestinationImage title={`${selectedTrip.destination} stay`} tone="amber" />
                </section>
                <section className="panel">
                  <div className="section-heading">
                    <h2>Hotels</h2>
                    <span>{selectedTrip.hotels.length}</span>
                  </div>
                  {selectedTrip.hotels.length === 0 ? (
                    <p className="empty-copy">No hotel suggestions yet.</p>
                  ) : (
                    selectedTrip.hotels.map((hotel, index) => (
                      <div className="hotel-row" key={hotel._id ?? `${hotel.name}-${index}`}>
                        <DestinationImage
                          className="hotel-thumb"
                          title={hotel.name}
                          tone={index % 2 === 0 ? 'amber' : 'teal'}
                        />
                        <div>
                          <h3>{hotel.name}</h3>
                          <p>
                            {hotel.tier ?? 'Hotel'} - {hotel.rating ?? 'Unrated'}
                          </p>
                        </div>
                        <strong>{formatCurrency(hotel.estimatedCostNightUSD)}</strong>
                      </div>
                    ))
                  )}
                </section>

                <section className="panel">
                  <div className="section-heading">
                    <h2>Packing</h2>
                    <span>{selectedTrip.packingList.length}</span>
                  </div>
                  <PackingList items={selectedTrip.packingList} />
                </section>
              </aside>
            </div>
          </>
        ) : (
          <section className="empty-state">
            <DestinationImage title="Choose a destination" tone="teal" className="empty-image" />
            <h2>No trip selected</h2>
            <p>Create a trip from the left panel and your itinerary will appear here.</p>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
