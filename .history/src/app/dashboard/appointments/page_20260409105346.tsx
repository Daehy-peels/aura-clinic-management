// src/app/dashboard/appointments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { format } from "date-fns";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const supabase = createClient();

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        scheduled_at,
        treatment_type,
        status,
        notes,
        patients (first_name, last_name)
      `)
      .order("scheduled_at", { ascending: true });

    if (!error) setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [supabase]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this record?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (!error) fetchAppointments();
  };

  const filteredAppointments = appointments.filter((apt) =>
    activeFilter === "all" ? true : apt.status === activeFilter
  );

  // Helper to display time without timezone shifts
  const formatWallTime = (isoString: string) => {
    // Splits '2026-04-08T16:00:00+00:00' to just the date and time parts
    const localPart = isoString.split(/[+-Z]/)[0]; 
    const date = new Date(localPart);
    return {
      time: format(date, "h:mm a"),
      day: format(date, "MMM do")
    };
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-light tracking-tight">
              Clinical <span className="font-serif italic text-rose-500">Schedule</span>
            </h1>
            <p className="text-gray-400 font-light italic text-sm">
              Overview of patient flow and treatment status.
            </p>
          </div>
          <Link
            href="/dashboard/appointments/new"
            className="px-10 py-4 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-rose-600 shadow-xl shadow-rose-100 transition-all active:scale-95 text-center"
          >
            + Book Treatment
          </Link>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-2 mb-10 bg-white/40 backdrop-blur-md p-2 rounded-[2rem] border border-white w-fit shadow-sm">
          {["all", "scheduled", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeFilter === status
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                  : "text-gray-400 hover:text-rose-400 hover:bg-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-32 text-center animate-pulse text-rose-300 font-serif italic text-xl">
            Updating the diary...
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAppointments.map((apt) => {
              const { time, day } = formatWallTime(apt.scheduled_at);
              const isComp = apt.status === "completed";
              const isCan = apt.status === "cancelled";

              return (
                <div
                  key={apt.id}
                  className={`relative group bg-white/70 backdrop-blur-sm border-2 rounded-[2.5rem] p-8 transition-all duration-500 flex flex-col md:flex-row items-center gap-8 ${
                    isComp ? "border-emerald-100 bg-emerald-50/30" : 
                    isCan ? "border-gray-100 opacity-60 grayscale" : "border-white hover:border-rose-100"
                  }`}
                >
                  {/* TIME COLUMN */}
                  <div className="text-center md:border-r border-gray-100 md:pr-10 min-w-[120px]">
                    <div className="text-3xl font-light tracking-tighter text-gray-800">{time}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-300 mt-1">{day}</div>
                  </div>

                  {/* INFO COLUMN */}
                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <div className="inline-block px-3 py-1 rounded-full bg-white text-[9px] font-black uppercase tracking-tighter text-gray-400 border border-gray-50 mb-1">
                      {apt.status}
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 uppercase tracking-tight">
                      {apt.patients?.first_name} {apt.patients?.last_name}
                    </h3>
                    <p className="text-2xl font-serif italic text-rose-500/80 leading-tight">
                      {apt.treatment_type}
                    </p>
                    
                    {/* NOTES SNIPPET */}
                    {apt.notes && (
                      <div className="flex items-start gap-2 mt-4 text-gray-400">
                        <span className="text-xs">📋</span>
                        <p className="text-xs italic font-light line-clamp-1">{apt.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-2 bg-white/80 p-2 rounded-[2rem] border border-white shadow-sm">
                    {/* Complete/Reopen */}
                    <button
                      onClick={() => updateStatus(apt.id, isComp ? "scheduled" : "completed")}
                      className={`p-4 rounded-2xl transition-all ${
                        isComp ? "bg-emerald-500 text-white" : "text-gray-300 hover:text-emerald-500"
                      }`}
                      title="Mark Complete"
                    >
                      <CheckIcon />
                    </button>

                    {/* Cancel */}
                    {!isCan && (
                      <button
                        onClick={() => updateStatus(apt.id, "cancelled")}
                        className="p-4 text-gray-300 hover:text-orange-400 transition-all"
                        title="Cancel Appointment"
                      >
                        <CancelIcon />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(apt.id)}
                      className="p-4 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <TrashIcon />
                    </button>
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

// Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CancelIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);