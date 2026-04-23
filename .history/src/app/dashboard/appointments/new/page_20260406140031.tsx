"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addMinutes, startOfDay, parseISO, isSameDay } from "date-fns";

export default function BookAppointmentPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [formData, setFormData] = useState({
    patient_id: "",
    treatment_type: "Standard Session",
    scheduled_at: "",
    ended_at: "",
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  // 1. Fetch Patients and existing Appointments for the selected day
  useEffect(() => {
    async function fetchData() {
      // Fetch Patients
      const { data: pData } = await supabase
        .from("patients")
        .select("id, first_name, last_name");
      setPatients(pData || []);

      // Fetch day's appointments (exclude cancelled)
      const { data: aData } = await supabase
        .from("appointments")
        .select("id, scheduled_at, ended_at, status, patients(first_name)")
        .neq("status", "cancelled")
        .gte("scheduled_at", `${selectedDate}T00:00:00`)
        .lte("scheduled_at", `${selectedDate}T23:59:59`);

      setDayAppointments(aData || []);
    }
    fetchData();
  }, [selectedDate, supabase]);

  // 2. Validation Logic: Prevent Overlaps and End-before-Start errors
  useEffect(() => {
    if (!formData.scheduled_at || !formData.ended_at) {
      setSlotError(null);
      return;
    }

    const newStart = new Date(formData.scheduled_at).getTime();
    const newEnd = new Date(formData.ended_at).getTime();

    if (newEnd <= newStart) {
      setSlotError("End time must be after start time.");
      return;
    }

    const conflict = dayAppointments.find((apt) => {
      const existingStart = new Date(apt.scheduled_at).getTime();
      const existingEnd = new Date(apt.ended_at).getTime();
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflict) {
      setSlotError(`Overlap: Slot held by ${conflict.patients?.first_name || "another patient"}.`);
    } else {
      setSlotError(null);
    }
  }, [formData.scheduled_at, formData.ended_at, dayAppointments]);

  // 3. Timeline Logic: Generate 30min slots and check occupancy
  const timeSlots = useMemo(() => {
    const slots = [];
    // Anchor to the START of the user-selected date
    const anchorDate = parseISO(selectedDate);
    let current = addMinutes(startOfDay(anchorDate), 9 * 60); // Start 9 AM
    const dayEnd = addMinutes(startOfDay(anchorDate), 19 * 60); // End 7 PM

    while (current <= dayEnd) {
      const timeStr = format(current, "HH:mm");
      const fullIso = format(current, "yyyy-MM-dd'T'HH:mm");
      const checkStart = current.getTime();
      const checkEnd = checkStart + 30 * 60000; // 30 min window

      const occupant = dayAppointments.find((apt) => {
        const start = new Date(apt.scheduled_at).getTime();
        const end = new Date(apt.ended_at).getTime();
        return checkStart < end && checkEnd > start;
      });

      slots.push({
        time: timeStr,
        fullDateTime: fullIso,
        occupant: occupant || null,
      });
      current = addMinutes(current, 30);
    }
    return slots;
  }, [dayAppointments, selectedDate]);

  const handleSlotClick = (dateTime: string) => {
    setFormData({
      ...formData,
      scheduled_at: dateTime,
      ended_at: format(addMinutes(parseISO(dateTime), 60), "yyyy-MM-dd'T'HH:mm"),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slotError || !formData.patient_id) return;
    setLoading(true);

    const { error } = await supabase.from("appointments").insert([formData]);
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard/appointments");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBFB] p-6 md:p-12 text-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- FORM SECTION --- */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <Link href="/dashboard/appointments" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to list
            </Link>
            <h1 className="text-4xl font-light mt-2">
              Book <span className="font-serif italic text-rose-500 underline decoration-rose-200 underline-offset-4">Session</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-rose-100/50 border border-rose-50 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] ml-1">Appointment Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] ml-1">Select Patient</label>
              <select
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent focus:border-rose-200 focus:bg-white outline-none transition-all appearance-none"
              >
                <option value="">Choose from list...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 text-xs border border-transparent focus:border-rose-200 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.ended_at}
                  onChange={(e) => setFormData({ ...formData, ended_at: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 text-xs border border-transparent focus:border-rose-200 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] ml-1">Internal Notes</label>
              <textarea
                rows={3}
                placeholder="Details about treatment or requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent focus:border-rose-200 focus:bg-white outline-none resize-none transition-all"
              />
            </div>

            {slotError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-pulse">
                <p className="text-[11px] text-red-600 font-bold uppercase tracking-tight text-center">⚠️ {slotError}</p>
              </div>
            )}

            <button
              disabled={loading || !!slotError || !formData.patient_id}
              className={`w-full py-5 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all duration-300 ${
                slotError || !formData.patient_id
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-200 active:scale-[0.98]"
              }`}
            >
              {loading ? "Processing..." : slotError ? "Slot Unavailable" : "Confirm Appointment"}
            </button>
          </form>
        </div>

        {/* --- TIMELINE SECTION --- */}
        <div className="lg:col-span-7">
          <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] p-10 border border-white h-full shadow-xl shadow-rose-100/20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-light">Daily <span className="italic font-serif text-rose-500">Timeline</span></h2>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                {format(parseISO(selectedDate), "MMMM do, yyyy")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[650px] pr-4 custom-scrollbar">
              {timeSlots.map((slot, i) => {
                const isOccupied = !!slot.occupant;
                const isSelected = formData.scheduled_at === slot.fullDateTime;

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => handleSlotClick(slot.fullDateTime)}
                    className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isOccupied
                        ? "bg-red-50 border-red-100 cursor-not-allowed opacity-80"
                        : isSelected
                        ? "bg-rose-50 border-rose-400 shadow-inner"
                        : "bg-white border-slate-50 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50"
                    }`}
                  >
                    <span className={`text-[11px] font-black w-12 ${isOccupied ? "text-red-300" : isSelected ? "text-rose-500" : "text-slate-400"}`}>
                      {slot.time}
                    </span>

                    <div className="flex-1 px-6 text-left">
                      {isOccupied ? (
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase text-red-500 tracking-wider">
                            Booked: {slot.occupant.patients?.first_name}
                          </span>
                        </div>
                      ) : isSelected ? (
                        <span className="text-[10px] font-bold uppercase text-rose-500 tracking-wider">Currently Selecting</span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Available for Session
                        </span>
                      )}
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isOccupied ? "bg-red-100 text-red-400" : isSelected ? "bg-rose-500 text-white" : "bg-emerald-50 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                    }`}>
                      {isOccupied ? "✕" : isSelected ? "●" : "＋"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}