// src/app/dashboard/appointments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        scheduled_at,
        treatment_type,
        status,
        patients (first_name, last_name)
      `,
      )
      .order("scheduled_at", { ascending: true });

    if (!error) setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [supabase]);

  // --- QUICK TOGGLE FUNCTION ---
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "scheduled" : "completed";

    // Optimistic Update: Update UI immediately for that "snappy" feel
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)),
    );

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Failed to update status: " + error.message);
      fetchAppointments(); // Rollback on error
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-light text-gray-800 tracking-tight">
              Clinical{" "}
              <span className="font-serif italic text-rose-500">Schedule</span>
            </h1>
            <p className="text-gray-400 mt-2 font-light italic text-sm">
              Tap the checkmark to finalize a treatment session.
            </p>
          </div>
          <Link
            href="/dashboard/appointments/new"
            className="px-8 py-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all active:scale-95"
          >
            + Book Treatment
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-rose-300 font-serif italic text-xl animate-pulse">
            Consulting calendar...
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
  const isCompleted = apt.status === 'completed';
  const isCancelled = apt.status === 'cancelled';
  
  // Dynamic Background and Border Styles
  const cardStyles = isCompleted 
    ? 'bg-emerald-50/60 border-emerald-100 shadow-[0_4px_20px_rgba(16,185,129,0.05)]' 
    : isCancelled
    ? 'bg-gray-50/50 border-gray-100 opacity-60 grayscale-[0.5]' 
    : 'bg-white/80 border-rose-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]';

  const accentText = isCompleted 
    ? 'text-emerald-400' 
    : isCancelled 
    ? 'text-gray-400' 
    : 'text-rose-400';

  return (
    <div 
      key={apt.id} 
      className={`group transition-all duration-500 rounded-[2.5rem] p-6 border flex flex-col md:flex-row items-center justify-between gap-6 ${cardStyles}`}
    >
      {/* Time Slot */}
      <div className="flex flex-col items-center justify-center border-r border-gray-100 pr-8 min-w-[120px]">
        <p className={`text-2xl font-light ${isCancelled ? 'text-gray-400' : 'text-gray-800'}`}>
          {new Date(apt.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' })}
        </p>
        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${accentText}`}>
          {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
        </p>
      </div>

      {/* Patient & Treatment */}
      <div className="flex-1 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isCancelled ? 'text-gray-400 line-through' : isCompleted ? 'text-emerald-900/40' : 'text-gray-700'}`}>
            {apt.patients?.first_name} {apt.patients?.last_name}
          </h3>
          {isCancelled && (
            <span className="text-[8px] font-black bg-gray-200 text-gray-500 px-2 py-0.5 rounded uppercase tracking-tighter">Void</span>
          )}
        </div>
        <p className={`text-lg font-serif italic mt-1 ${isCompleted ? 'text-emerald-600' : isCancelled ? 'text-gray-400' : 'text-rose-500'}`}>
          {apt.treatment_type}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* We keep the toggle for Complete/Scheduled, but show a "Cancelled" indicator if applicable */}
        {!isCancelled ? (
          <button 
            onClick={() => toggleStatus(apt.id, apt.status)}
            className={`p-4 rounded-2xl transition-all active:scale-90 ${
              isCompleted 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
              : 'bg-white border border-rose-100 text-rose-300 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-gray-100 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        <Link href={`/dashboard/appointments/edit/${apt.id}`} className="p-4 text-gray-300 hover:text-rose-500 hover:bg-white rounded-2xl transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </Link>
      </div>
    </div>
  );
})}
          </div>
        )}
      </div>
    </div>
  );
}
