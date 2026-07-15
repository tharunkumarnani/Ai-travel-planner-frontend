import { useState, type FormEvent } from 'react'
import type { Activity, ItineraryDay } from '../types'

interface ItineraryCardProps {
  day: ItineraryDay
  isBusy: boolean
  onAddActivity: (dayNumber: number, activity: Activity) => Promise<void>
  onRemoveActivity: (dayNumber: number, activityId: string) => Promise<void>
  onRegenerateDay: (dayNumber: number) => Promise<void>
}

export function ItineraryCard({
  day,
  isBusy,
  onAddActivity,
  onRemoveActivity,
  onRegenerateDay,
}: ItineraryCardProps) {
  const [title, setTitle] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('Afternoon')
  const [estimatedCostUSD, setEstimatedCostUSD] = useState(20)

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await onAddActivity(day.dayNumber, {
      title: title.trim(),
      timeOfDay,
      estimatedCostUSD,
      description: 'Added from the trip planner dashboard.',
    })

    setTitle('')
  }

  return (
    <article className="itinerary-card">
      <div className="day-header">
        <div>
          <p className="eyebrow">Day {day.dayNumber}</p>
          <h3>{day.activities.length} planned stops</h3>
        </div>
        <button
          className="ghost-button"
          disabled={isBusy}
          onClick={() => onRegenerateDay(day.dayNumber)}
          type="button"
        >
          Regenerate
        </button>
      </div>

      <div className="activity-list">
        {day.activities.length === 0 ? (
          <p className="empty-copy">No activities yet.</p>
        ) : (
          day.activities.map((activity, index) => (
            <div className="activity-item" key={activity._id ?? `${activity.title}-${index}`}>
              <div>
                <span>{activity.timeOfDay ?? 'Anytime'}</span>
                <h4>{activity.title}</h4>
                {activity.description ? <p>{activity.description}</p> : null}
              </div>
              <div className="activity-actions">
                <strong>${activity.estimatedCostUSD ?? 0}</strong>
                {activity._id ? (
                  <button
                    aria-label={`Remove ${activity.title}`}
                    className="icon-button danger"
                    disabled={isBusy}
                    onClick={() => onRemoveActivity(day.dayNumber, activity._id as string)}
                    type="button"
                  >
                    x
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <form className="add-activity" onSubmit={handleAdd}>
        <input
          aria-label={`Activity for day ${day.dayNumber}`}
          placeholder="Add a custom stop"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <select
          aria-label="Time of day"
          value={timeOfDay}
          onChange={(event) => setTimeOfDay(event.target.value)}
        >
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Evening</option>
        </select>
        <input
          aria-label="Estimated cost"
          min={0}
          type="number"
          value={estimatedCostUSD}
          onChange={(event) => setEstimatedCostUSD(Number(event.target.value))}
        />
        <button className="secondary-button" disabled={isBusy || !title.trim()}>
          Add
        </button>
      </form>
    </article>
  )
}
