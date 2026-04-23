// src/app/dashboard/appointments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // State for filtering
  const supabase = createClient();

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        scheduled_at,
        treatment_type,
        status,
        patients (first_name, last_name)
      `)
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

    // Optimistic Update
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)),
    );

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Failed to update status: " + error.message);
      fetchAppointments(); 
    }
  };

  // Logic to filter appointments based on the selected tab
  const filteredAppointments = appointments.filter((apt) => 
    activeFilter === "all" ? true : apt.status === activeFilter
  );

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-light tracking-tight">
              Clinical <span className="font-serif italic text-rose-500">Schedule</span>
            </h1>
            <p className="text-gray-400 font-light italic text-sm">
              Manage today's treatments and patient flow.
            </p>
          </div>
          
          <Link
            href="/dashboard/appointments/new"
            className="px-10 py-4 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-rose-600 shadow-xl shadow-rose-100 transition-all active:scale-95 text-center"
          >
            + Book Treatment
          </Link>
        </div>

        {/* --- FILTER TABS --- */}
        <div className="flex flex-wrap items-center gap-2 mb-10 bg-white/40 backdrop-blur-md p-2 rounded-[2rem] border border-white w-fit shadow-sm">
          {["all", "scheduled", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
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
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="text-rose-300 font-serif italic text-xl">Opening the clinical diary...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border border-dashed border-rose-200 rounded-[3rem] p-24 text-center">
            <p className="text-gray-400 font-light italic text-lg">
              No {activeFilter !== 'all' ? activeFilter : ''} appointments found.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((apt) => {
              const isCompleted = apt.status === "completed";
              const isCancelled = apt.status === "cancelled";

              const cardStyles = isCompleted
                ? "bg-emerald-50/40 border-emerald-100/50 shadow-[0_15px_40px_rgba(16,185,129,0.04)]"
                : isCancelled
                ? "bg-gray-100/40 border-gray-200 opacity-60 grayscale-[0.8]"
                : "bg-white/80 border-white shadow-[0_15px_40px_rgba(255,192,203,0.06)] hover:shadow-rose-100";

              return (
                <div
                  key={apt.id}
                  className={`group transition-all duration-700 rounded-[3rem] p-8 border flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm ${cardStyles}`}
                >
                  {/* Time Section */}
                  <div className="flex flex-col items-center justify-center md:border-r md:border-gray-100 md:pr-12 min-w-[140px]">
                    <p className={`text-3xl font-light tracking-tighter ${isCancelled ? "text-gray-400" : "text-gray-800"}`}>
                      {new Date(apt.scheduled_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: "UTC",
                      })}
                    </p>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${isCompleted ? "text-emerald-400" : "text-rose-300"}`}>
                      {new Date(apt.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </p>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 text-center md:text-left space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <h3 className={`text-sm font-bold uppercase tracking-widest ${isCancelled ? "text-gray-400 line-through" : "text-gray-700"}`}>
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </h3>
                      {isCancelled && (
                        <span className="text-[9px] font-black bg-gray-200 text-gray-500 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                          Voided
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                          Finalized
                        </span>
                      )}
                    </div>
                    <p className={`text-2xl font-serif italic ${isCompleted ? "text-emerald-700/60" : isCancelled ? "text-gray-400" : "text-rose-500"}`}>
                      {apt.treatment_type}
                    </p>
                  </div>

                  {/* Action Group */}
                  <div className="flex items-center gap-4 bg-white/50 p-3 rounded-[2rem] shadow-sm border border-white">
                    {!isCancelled ? (
                      <button
                        onClick={() => toggleStatus(apt.id, apt.status)}
                        className={`p-5 rounded-2xl transition-all active:scale-90 ${
                          isCompleted
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                            : "bg-rose-50 text-rose-300 hover:bg-emerald-500 hover:text-white"
                        }`}
                        title={isCompleted ? "Re-open Appointment" : "Mark as Completed"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ) : (
                      <div className="p-5 rounded-2xl bg-gray-100 text-gray-300 cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}

                    <Link
                      href={`/dashboard/appointments/edit/${apt.id}`}
                      className="p-5 text-gray-300 hover:text-rose-500 hover:bg-white rounded-2xl transition-all group-hover:bg-white"
                    >
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