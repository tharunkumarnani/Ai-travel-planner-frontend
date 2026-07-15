'use client';

import React, { useState, useEffect } from 'react';
import {useRouter}  from "next/navigation";

interface Activity {
  _id?: string;
  title: string;
  description: string;
  estimatedCostUSD: number;
  timeOfDay: string;
}

interface ItineraryDay {
  dayNumber: number;
  activities: Activity[];
}

interface PackingItem {
  _id?: string;
  item: string;
  category: string;
  isPacked: boolean;
}

interface Trip {
  _id: string;
  destination: string;
  durationDays: number;
  budgetTier: string;
  itinerary: ItineraryDay[];
  packingList: PackingItem[];
  estimatedBudget: {
    total: number;
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newActivityName, setNewActivityName] = useState<string>('');
  const [targetDay, setTargetDay] = useState<number>(1);

  // Authenticate user check and retrieve User Isolation Saved Trips
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserTrips();
  }, [router]);

  const fetchUserTrips = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
        if (data.length > 0) setSelectedTrip(data[0]);
      }
    } catch (err) {
      console.error('Failed to query user records', err);
    } finally {
      setLoading(false);
    }
  };

  // Add Dynamic Activity safely and update database
  const handleAddActivity = async (dayNum: number) => {
    if (!newActivityName.trim() || !selectedTrip) return;

    const updatedItinerary = selectedTrip.itinerary.map(day => {
      if (day.dayNumber === dayNum) {
        return {
          ...day,
          activities: [
            ...day.activities,
            { title: newActivityName, description: 'Added by traveler', estimatedCostUSD: 0, timeOfDay: 'Afternoon' }
          ]
        };
      }
      return day;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${selectedTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itinerary: updatedItinerary })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSelectedTrip(updatedData);
        setNewActivityName('');
      }
    } catch (err) {
      console.error('Dynamic update failed', err);
    }
  };

  // Checkbox interactivity to toggle packing items dynamically
  const togglePackingItem = async (itemId: string) => {
    if (!selectedTrip) return;

    const updatedPacking = selectedTrip.packingList.map(item => {
      if (item._id === itemId) {
        return { ...item, isPacked: !item.isPacked };
      }
      return item;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trips/${selectedTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packingList: updatedPacking })
      });

      if (res.ok) {
        const updatedData = await res.json();
        setSelectedTrip(updatedData);
      }
    } catch (err) {
      console.error('Checkbox updates failed', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        <p className="text-xl animate-pulse">Loading secure user vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-5 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            AI Travel Dashboard
          </h1>
          <p className="text-sm text-slate-400">User Data Enclave Connected</p>
        </div>
        <button
          onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
          className="bg-red-500 hover:bg-red-600 transition text-white px-4 py-2 rounded-lg text-sm"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trip Selector & Core Budgets */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Your Active Trips</h2>
            {trips.length === 0 ? (
              <p className="text-slate-500">No itineraries found. Create one to begin!</p>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <button
                    key={trip._id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`w-full text-left p-4 rounded-xl transition ${
                      selectedTrip?._id === trip._id
                        ? 'bg-blue-600 border border-blue-500 text-white'
                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <p className="font-bold">{trip.destination}</p>
                    <p className="text-xs opacity-80">{trip.durationDays} Days • {trip.budgetTier} Budget</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedTrip && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Financial Cost Ledger</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Lodging & Accommodations:</span>
                  <span className="font-semibold">${selectedTrip.estimatedBudget.accommodation}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Culinary & Dining:</span>
                  <span className="font-semibold">${selectedTrip.estimatedBudget.food}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Activities & Sightseeing:</span>
                  <span className="font-semibold">${selectedTrip.estimatedBudget.activities}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-800 pt-3 text-white font-bold">
                  <span>Grand Total Estimated Budget:</span>
                  <span>${selectedTrip.estimatedBudget.total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Itinerary Board & Editor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTrip ? (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 text-white border-b border-slate-800 pb-3">
                  Day-by-Day Timeline: {selectedTrip.destination}
                </h2>

                <div className="space-y-6">
                  {selectedTrip.itinerary.map((day) => (
                    <div key={day.dayNumber} className="border-l-2 border-indigo-500 pl-6 relative">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 bg-indigo-500 rounded-full border-4 border-slate-900" />
                      <h3 className="text-lg font-bold text-slate-200 mb-3">Day {day.dayNumber}</h3>
                      <div className="space-y-3 mb-4">
                        {day.activities.map((act, index) => (
                          <div key={index} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex justify-between">
                              <span className="font-semibold text-white">{act.title}</span>
                              <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full self-center">
                                {act.timeOfDay}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{act.description}</p>
                          </div>
                        ))}
                      </div>

                      {/* Add Activity Inline Form */}
                      <div className="flex items-center gap-2 max-w-sm mt-3">
                        <input
                          type="text"
                          placeholder="Inject new activity item..."
                          value={targetDay === day.dayNumber ? newActivityName : ''}
                          onChange={(e) => {
                            setTargetDay(day.dayNumber);
                            setNewActivityName(e.target.value);
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full"
                        />
                        <button
                          onClick={() => handleAddActivity(day.dayNumber)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Creative Weather-Aware Packing Checklist Component */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-1 text-white">
                  ⛈️ AI Weather-Aware Packing Assistant
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Based on your active planned locations and local forecasted climate, pack these items:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTrip.packingList && selectedTrip.packingList.length > 0 ? (
                    selectedTrip.packingList.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => togglePackingItem(item._id!)}
                        className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-750 transition"
                      >
                        <input
                          type="checkbox"
                          checked={item.isPacked}
                          readOnly
                          className="h-4 w-4 rounded bg-slate-950 border-slate-800 accent-emerald-500 cursor-pointer"
                        />
                        <span className={`text-sm ${item.isPacked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {item.item}
                        </span>
                        <span className="ml-auto text-[10px] uppercase bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">
                          {item.category}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Generating weather checklists...</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-96 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-6xl mb-4">✈️</span>
              <p className="text-slate-400">Select an existing itinerary or create a new trip to begin exploring.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}