"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { format, parseISO } from "date-fns";

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

    if (!error) {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, status: newStatus } : apt,
        ),
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently remove this appointment from the ledger?"))
      return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (!error) fetchAppointments();
  };

  const filteredAppointments = appointments.filter((apt) =>
    activeFilter === "all" ? true : apt.status === activeFilter,
  );

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-6 md:p-12 text-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div className="space-y-4 animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-7xl font-light tracking-tighter text-slate-900 leading-none">
              Clinical <span className="font-serif italic text-rose-500">Schedule</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
                Live Agenda • {format(new Date(), "MMMM dd, yyyy")}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/appointments/new"
            className="group flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-full transition-all hover:bg-rose-500 hover:shadow-2xl hover:shadow-rose-100 active:scale-95"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">
              Request Session
            </span>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>
        </div>

        {/* REFINED FILTERS */}
        <div className="flex items-center gap-10 mb-12 border-b border-slate-100 pb-1">
          {["all", "scheduled", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`pb-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${
                activeFilter === status
                  ? "text-rose-500"
                  : "text-slate-300 hover:text-slate-500"
              }`}
            >
              {status}
              {activeFilter === status && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-rose-500 rounded-full animate-in fade-in slide-in-from-bottom-1" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-32 text-center animate-pulse text-rose-500 font-serif italic text-2xl">
            Synchronizing clinical data...
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  apt={apt}
                  onStatusUpdate={updateStatus}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="py-24 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-100">
                <p className="font-serif italic text-slate-400 text-xl">
                  No sessions found in the current ledger.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ apt, onStatusUpdate, onDelete }: any) {
  const isComp = apt.status === "completed";
  const isCan = apt.status === "cancelled";

  // THE FIX: Slice the string to remove any "Z" or "+00" offset 
  // This treats "16:00" as "16:00" everywhere.
  const naiveIso = apt.scheduled_at.slice(0, 16); 
  const dateObj = parseISO(naiveIso);
  const displayTime = format(dateObj, "hh:mm");
  const amPm = format(dateObj, "aa");
  const displayDate = format(dateObj, "MMM dd");

  return (
    <div
      className={`
      group relative bg-white rounded-[3rem] p-8 md:p-10 border-2 transition-all duration-500 flex flex-col md:flex-row items-center gap-10
      ${isComp ? "border-emerald-50 bg-emerald-50/5" : "border-slate-50 hover:border-rose-100 hover:shadow-[0_30px_70px_rgba(244,63,94,0.06)]"}
      ${isCan ? "opacity-40 grayscale" : ""}
    `}
    >
      {/* TIME BLOCK - FIXED 10:30PM BUG */}
      <div className="flex flex-col items-center justify-center min-w-[140px] md:border-r-2 border-slate-50 md:pr-12">
        <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-2">
          {displayDate}
        </span>
        <div className="flex flex-col items-center">
            <span className="text-4xl font-light tracking-tighter text-slate-900 leading-none">
            {displayTime}
            </span>
            <span className="text-[10px] font-black text-rose-500 uppercase mt-1">
            {amPm}
            </span>
        </div>
        <span
          className={`mt-4 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isComp ? "bg-emerald-100 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
        >
          {apt.status}
        </span>
      </div>

      {/* PATIENT INFO */}
      <div className="flex-1 text-center md:text-left space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Patient Profile
        </p>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          {apt.patients?.first_name} {apt.patients?.last_name}
        </h3>
        <p className="text-3xl font-serif italic text-rose-500 leading-tight">
          {apt.treatment_type}
        </p>
        
        {apt.notes && (
          <div className="mt-6 flex items-start gap-3 text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 max-w-md">
            <span className="text-xs">📝</span>
            <p className="text-[11px] italic font-medium leading-relaxed">
              {apt.notes}
            </p>
          </div>
        )}
      </div>

      {/* ACTION CLUSTER - SHARPER COLORS */}
      <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-[2rem] shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
        <button
          onClick={() => onStatusUpdate(apt.id, isComp ? "scheduled" : "completed")}
          className={`p-4 rounded-full transition-all ${isComp ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`}
          title="Toggle Complete"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <Link
          href={`/dashboard/appointments/edit/${apt.id}`}
          className="p-4 text-slate-400 hover:text-rose-400 transition-all"
          title="Modify Session"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </Link>

        <button
          onClick={() => onDelete(apt.id)}
          className="p-4 text-slate-400 hover:text-red-500 transition-all"
          title="Delete Permanent"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}