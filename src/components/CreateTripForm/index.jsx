import { useMemo, useState } from "react";
import "./index.css";
import {
  destinationGroups,
  popularDestinations,
} from "../../data/destinations";
const interests = [
  "Food",
  "Nature",
  "History",
  "Adventure",
  "Shopping",
  "Beaches",
  "Nightlife",
  "Museums",
];
export function CreateTripForm({ isSubmitting, onCreateTrip }) {
  const [destination, setDestination] = useState(""),
    [type, setType] = useState("auto"),
    [context, setContext] = useState(""),
    [days, setDays] = useState(3),
    [budget, setBudget] = useState("Medium"),
    [selected, setSelected] = useState(["Food", "Nature", "History"]);
  const suggestions = useMemo(() => {
    const q = destination.toLowerCase().trim();
    if (!q) return [];
    return destinationGroups
      .flatMap((g) => [
        ...g.states.map((n) => ({
          name: n,
          type: "State",
          context: g.country,
        })),
        ...g.cities.map((n) => ({ name: n, type: "City", context: g.country })),
        { name: g.country, type: "Country", context: "" },
      ])
      .filter((x) => x.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [destination]);
  const choose = (x) => {
    setDestination(x.name);
    setType(x.type.toLowerCase());
    setContext(x.context);
  };
  const toggle = (x) =>
    setSelected((s) => (s.includes(x) ? s.filter((i) => i !== x) : [...s, x]));
  const submit = async (e) => {
    e.preventDefault();
    await onCreateTrip({
      destination: destination.trim(),
      destinationType: type === "auto" ? undefined : type,
      destinationContext: context || undefined,
      durationDays: Number(days),
      budgetTier: budget,
      interests: selected,
    });
    setDestination("");
    setContext("");
    setType("auto");
  };
  return (
    <form className="create-form" onSubmit={submit}>
      <div className="form-title">
        <span>NEW TRIP</span>
        <h2>Where next?</h2>
      </div>
      <label>
        Destination
        <div className="destination-box">
          <input
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setType("auto");
            }}
            placeholder="Country, state or city..."
            required
          />
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((x) => (
                <button
                  type="button"
                  key={x.type + x.name}
                  onClick={() => choose(x)}
                >
                  <b>{x.name}</b>
                  <small>
                    {x.type}
                    {x.context ? " · " + x.context : ""}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      </label>
      {context && (
        <div className="context">
          📍 {destination} · {type} · {context}
        </div>
      )}
      <div className="quick">
        {popularDestinations.map((x) => (
          <button type="button" key={x.label} onClick={() => choose(x)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="two">
        <label>
          Days
          <input
            type="number"
            min="1"
            max="21"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </label>
        <label>
          Budget
          <select value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>
      </div>
      <fieldset>
        <legend>Interests</legend>
        <div className="interest-grid">
          {interests.map((x) => (
            <label className={selected.includes(x) ? "selected" : ""} key={x}>
              <input
                type="checkbox"
                checked={selected.includes(x)}
                onChange={() => toggle(x)}
              />
              {x}
            </label>
          ))}
        </div>
      </fieldset>
      <button className="generate" disabled={isSubmitting}>
        {isSubmitting ? "Creating plan..." : "✦ Generate trip"}
      </button>
    </form>
  );
}
