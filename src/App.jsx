import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { api } from "./services/api";
import { AuthPage } from "./components/AuthPage";
import { Navbar } from "./components/Navbar";
import { CreateTripForm } from "./components/CreateTripForm";
import { TripCard } from "./components/TripCard";
import { ItineraryCard } from "./components/ItineraryCard";
import { PackingList } from "./components/PackingList";
const TOKEN = "trao_token";
const money = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN)),
    [user, setUser] = useState(null),
    [trips, setTrips] = useState([]),
    [selected, setSelected] = useState(null),
    [view, setView] = useState("trips"),
    [busy, setBusy] = useState(false),
    [generating, setGenerating] = useState(false),
    [error, setError] = useState("");
  const trip = useMemo(
    () => trips.find((x) => x._id === selected) || trips[0] || null,
    [trips, selected],
  );
  useEffect(() => {
    if (!token) return;
    Promise.all([api.me(token), api.getTrips(token)])
      .then(([u, t]) => {
        setUser(u);
        setTrips(t);
        setSelected(t[0]?._id || null);
      })
      .catch((e) => {
        localStorage.removeItem(TOKEN);
        setToken(null);
        setError(e.message);
      });
  }, [token]);
  const auth = async (r) => {
    localStorage.setItem(TOKEN, r.token);
    setToken(r.token);
    setUser(r.user);
    const t = await api.getTrips(r.token);
    setTrips(t);
    setSelected(t[0]?._id || null);
  };
  const update = (t) =>
    setTrips((x) => x.map((i) => (i._id === t._id ? t : i)));
  const create = async (p) => {
    setGenerating(true);
    setError("");
    try {
      const t = await api.createTrip(token, p);
      setTrips((x) => [t, ...x]);
      setSelected(t._id);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };
  const remove = async () => {
    if (!trip || !window.confirm("Delete this trip?")) return;
    setBusy(true);
    try {
      await api.deleteTrip(token, trip._id);
      const x = trips.filter((t) => t._id !== trip._id);
      setTrips(x);
      setSelected(x[0]?._id || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const add = async (dayNumber, activity) => {
    setBusy(true);
    try {
      update(await api.addActivity(token, trip._id, { dayNumber, activity }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const delActivity = async (dayNumber, activityId) => {
    setBusy(true);
    try {
      update(
        await api.removeActivity(token, trip._id, { dayNumber, activityId }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const regen = async (dayNumber) => {
    setBusy(true);
    try {
      const day = await api.regenerateDay(token, trip._id, dayNumber);
      update({
        ...trip,
        itinerary: trip.itinerary.map((d) =>
          d.dayNumber === dayNumber ? day : d,
        ),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const logout = () => {
    localStorage.removeItem(TOKEN);
    setToken(null);
    setUser(null);
    setTrips([]);
  };
  if (!token || !user) return <AuthPage error={error} onAuthenticated={auth} />;
  return (
    <div>
      <Navbar
        user={user}
        activeView={view}
        onChangeView={setView}
        onSignOut={logout}
      />
      <div className="layout">
        <aside>
          <CreateTripForm isSubmitting={generating} onCreateTrip={create} />
          <div className="saved">
            <div className="title">
              <div>
                <small>YOUR PLANS</small>
                <h2>Saved trips</h2>
              </div>
              <b>{trips.length}</b>
            </div>
            {trips.map((t) => (
              <TripCard
                key={t._id}
                trip={t}
                active={trip?._id === t._id}
                onClick={() => setSelected(t._id)}
              />
            ))}
          </div>
        </aside>
        <main>
          {error && (
            <div className="alert">
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}
          {view === "profile" ? (
            <section className="profile">
              <span>ACCOUNT</span>
              <h1>{user.email}</h1>
              <p>{trips.length} saved trips</p>
            </section>
          ) : generating ? (
            <section className="loading">
              <b>✦</b>
              <h2>Building your travel plan...</h2>
              <p>Creating itinerary, hotels, budget and packing list.</p>
            </section>
          ) : trip ? (
            <>
              <header className="trip-head">
                <div>
                  <span>
                    ✦ AI PLANNED · {trip.budgetTier.toUpperCase()} BUDGET
                  </span>
                  <h1>{trip.destination}</h1>
                  <p>
                    {trip.durationDays} days · {trip.interests?.join(" · ")}
                  </p>
                </div>
                <button onClick={remove} disabled={busy}>
                  Delete trip
                </button>
              </header>
              <section className="budgets">
                {Object.entries(trip.estimatedBudget || {}).map(([k, v]) => (
                  <div key={k}>
                    <small>{k}</small>
                    <b>{money(v)}</b>
                  </div>
                ))}
              </section>
              <div className="content">
                <section>
                  <div className="title">
                    <div>
                      <small>DAY BY DAY</small>
                      <h2>Your itinerary</h2>
                    </div>
                    {busy && <span>Updating...</span>}
                  </div>
                  {trip.itinerary?.map((d) => (
                    <ItineraryCard
                      key={d._id || d.dayNumber}
                      day={d}
                      busy={busy}
                      onAddActivity={add}
                      onRemoveActivity={delActivity}
                      onRegenerate={regen}
                    />
                  ))}
                </section>
                <aside className="right">
                  <section className="panel">
                    <div className="title">
                      <h2>Hotel ideas</h2>
                      <b>{trip.hotels?.length || 0}</b>
                    </div>
                    {trip.hotels?.map((h, i) => (
                      <div className="hotel" key={h._id || i}>
                        <span>⌂</span>
                        <div>
                          <strong>{h.name}</strong>
                          <small>
                            {h.tier || "Recommended"} · ★ {h.rating || "N/A"}
                          </small>
                        </div>
                        <b>{money(h.estimatedCostNightUSD)}</b>
                      </div>
                    ))}
                  </section>
                  <section className="panel">
                    <div className="title">
                      <h2>Packing list</h2>
                      <b>{trip.packingList?.length || 0}</b>
                    </div>
                    <PackingList items={trip.packingList || []} />
                  </section>
                </aside>
              </div>
            </>
          ) : (
            <section className="welcome">
              <b>✈</b>
              <span>READY WHEN YOU ARE</span>
              <h1>Where do you want to go?</h1>
              <p>
                Choose a country, Indian state, city, or any custom destination.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
