import { useState, type FormEvent } from 'react'
import type { BudgetTier, CreateTripPayload } from '../types'

interface CreateTripFormProps {
  isSubmitting: boolean
  onCreateTrip: (payload: CreateTripPayload) => Promise<void>
}

const interestOptions = [
  'Food',
  'Nature',
  'Museums',
  'Adventure',
  'Shopping',
  'Beaches',
  'Nightlife',
  'History',
]

export function CreateTripForm({ isSubmitting, onCreateTrip }: CreateTripFormProps) {
  const [destination, setDestination] = useState('')
  const [durationDays, setDurationDays] = useState(3)
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('Medium')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Food',
    'Nature',
    'History',
  ])

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await onCreateTrip({
      destination: destination.trim(),
      durationDays,
      budgetTier,
      interests: selectedInterests,
    })

    setDestination('')
  }

  return (
    <form className="trip-form" onSubmit={handleSubmit}>
      <div className="form-title">
        <div>
          <p className="eyebrow">New trip</p>
          <h2>Generate itinerary</h2>
        </div>
        {isSubmitting ? <span className="mini-loader" aria-label="Generating trip" /> : null}
      </div>

      <div className="form-row">
        <label htmlFor="destination">Destination</label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="Tokyo, Lisbon, Bali..."
          required
        />
      </div>

      <div className="form-grid">
        <div className="form-row">
          <label htmlFor="duration">Days</label>
          <input
            id="duration"
            type="number"
            min={1}
            max={21}
            value={durationDays}
            onChange={(event) => setDurationDays(Number(event.target.value))}
          />
        </div>

        <div className="form-row">
          <label htmlFor="budget">Budget</label>
          <select
            id="budget"
            value={budgetTier}
            onChange={(event) => setBudgetTier(event.target.value as BudgetTier)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>

      <fieldset>
        <legend>Interests</legend>
        <div className="chip-grid">
          {interestOptions.map((interest) => (
            <label
              className={`chip ${selectedInterests.includes(interest) ? 'selected' : ''}`}
              key={interest}
            >
              <input
                type="checkbox"
                checked={selectedInterests.includes(interest)}
                onChange={() => toggleInterest(interest)}
              />
              {interest}
            </label>
          ))}
        </div>
      </fieldset>

      <button className="primary-button" disabled={isSubmitting || !destination.trim()}>
        {isSubmitting ? (
          <>
            <span className="button-spinner" />
            Generating trip...
          </>
        ) : (
          'Generate trip'
        )}
      </button>
    </form>
  )
}
