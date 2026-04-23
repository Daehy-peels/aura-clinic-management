"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addMinutes, startOfDay, parseISO } from "date-fns";

export default function BookAppointmentPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [formData, setFormData] = useState({
    patient_id: "",
    treatment_type: "General Consultation",
    scheduled_at: "",
    ended_at: "",
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  // 1. Fetch data for the selected day
  useEffect(() => {
    async function fetchData() {
      // Fetch Patients for the dropdown
      const { data: pData } = await supabase.from("patients").select("id, first_name, last_name");
      setPatients(pData || []);

      // Fetch all appointments for the selected day to prevent double booking
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

  // 2. Real-time Collision Detection (Prevents manual double-booking)
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

    // Check if the new time range overlaps with ANY existing appointment
    const conflict = dayAppointments.find((apt) => {
      const existingStart = new Date(apt.scheduled_at).getTime();
      const existingEnd = new Date(apt.ended_at).getTime();
      // Overlap logic: (StartA < EndB) AND (EndA > StartB)
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflict) {
      setSlotError(`Time conflict: Already booked by ${conflict.patients?.first_name || "another patient"}.`);
    } else {
      setSlotError(null);
    }
  }, [formData.scheduled_at, formData.ended_at, dayAppointments]);

  // 3. Timeline Generator (The Logic that colors the slots)
  const timeSlots = useMemo(() => {
    const slots = [];
    const anchorDate = parseISO(selectedDate);
    let current = addMinutes(startOfDay(anchorDate), 9 * 60); // 9:00 AM
    const dayEnd = addMinutes(startOfDay(anchorDate), 19 * 60); // 7:00 PM

    while (current <= dayEnd) {
      const timeStr = format(current, "HH:mm");
      const fullIso = format(current, "yyyy-MM-dd'T'HH:mm");
      const slotStart = current.getTime();
      const slotEnd = slotStart + 30 * 60000; // 30-minute block

      // Is this specific 30-min block inside an existing appointment?
      const occupant = dayAppointments.find((apt) => {
        const aptStart = new Date(apt.scheduled_at).getTime();
        const aptEnd = new Date(apt.ended_at).getTime();
        return slotStart < aptEnd && slotEnd > aptStart;
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
      // Default to a 1-hour session
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
    <div className="min-h-screen bg-[#FDFCFB] p-4 md:p-10 text-slate-900">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT: BOOKING FORM */}
        <div className="lg:col-span-5">
          <div className="mb-6">
            <Link href="/dashboard/appointments" className="text-xs font-bold text-rose-400 hover:text-rose-600 uppercase tracking-widest">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-semibold mt-2 text-slate-800">New Appointment</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-slate-100 p-8 rounded-3xl shadow-xl shadow-slate-200/50 space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Patient Name</label>
              <select
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-rose-100 transition-all"
              >
                <option value="">Select a patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.ended_at}
                  onChange={(e) => setFormData({ ...formData, ended_at: e.target.value })}
                  className="w-full bg-slate-50 p-3 rounded-xl text-sm outline-none"
                />
              </div>
            </div>

            {slotError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs text-red-600 font-bold text-center">🚫 {slotError}</p>
              </div>
            )}

            <button
              disabled={loading || !!slotError || !formData.patient_id}
              className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                slotError || !formData.patient_id
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200"
              }`}
            >
              {loading ? "Saving..." : "Create Appointment"}
            </button>
          </form>
        </div>

        {/* RIGHT: LIVE TIMELINE */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-700 tracking-tight">Daily Schedule</h2>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold bg-slate-100 p-2 rounded-lg outline-none"
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 scrollbar-hide">
              {timeSlots.map((slot, i) => {
                const isOccupied = !!slot.occupant;
                const isSelected = formData.scheduled_at === slot.fullDateTime;

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => handleSlotClick(slot.fullDateTime)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      isOccupied
                        ? "bg-red-50 border-red-100 cursor-not-allowed" // RED FOR BLOCKED
                        : isSelected
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-md" // GREEN FOR SELECTED
                        : "bg-white border-slate-50 hover:border-emerald-200 hover:bg-emerald-50/30" // NEUTRAL FOR AVAILABLE
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black ${isOccupied ? "text-red-300" : isSelected ? "text-white" : "text-slate-400"}`}>
                        {slot.time}
                      </span>
                      <div className="text-left">
                        {isOccupied ? (
                          <span className="text-[10px] font-bold text-red-500 uppercase">Booked: {slot.occupant.patients?.first_name}</span>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-white" : "text-emerald-500/60"}`}>
                            {isSelected ? "Selected Start" : "Available"}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`text-[10px] ${isOccupied ? "text-red-400" : isSelected ? "text-white" : "text-emerald-400"}`}>
                      {isOccupied ? "✕" : "✓"}
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