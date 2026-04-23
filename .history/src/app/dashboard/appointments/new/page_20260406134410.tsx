// src/app/dashboard/appointments/new/page.tsx
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
    treatment_type: "",
    scheduled_at: "",
    ended_at: "",
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  // 1. Fetch Data
  useEffect(() => {
    async function fetchData() {
      const { data: pData } = await supabase
        .from("patients")
        .select("id, first_name, last_name");
      setPatients(pData || []);

      // Crucial: We fetch appointments for the whole day to compare
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

  // 2. Validation Logic
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
      setSlotError(`This time is already booked by ${conflict.patients?.first_name || 'another patient'}.`);
    } else {
      setSlotError(null);
    }
  }, [formData.scheduled_at, formData.ended_at, dayAppointments]);

  // 3. Timeline Logic (The "Red" fix is here)
  const timeSlots = useMemo(() => {
    const slots = [];
    let current = addMinutes(startOfDay(new Date()), 9 * 60); // Start 9 AM
    const dayEnd = addMinutes(startOfDay(new Date()), 19 * 60); // End 7 PM

    while (current <= dayEnd) {
      const timeStr = format(current, "HH:mm");
      // Use selectedDate to ensure we are checking the right day
      const fullDateTimeString = `${selectedDate}T${timeStr}:00`;
      const checkStart = new Date(fullDateTimeString).getTime();
      const checkEnd = checkStart + 30 * 60000;

      const occupant = dayAppointments.find((apt) => {
        const start = new Date(apt.scheduled_at).getTime();
        const end = new Date(apt.ended_at).getTime();
        return checkStart < end && checkEnd > start;
      });

      slots.push({
        time: timeStr,
        fullDateTime: fullDateTimeString,
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
    <div className="min-h-screen bg-[#FFF5F5] p-6 md:p-12 text-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* FORM SIDE */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <Link href="/dashboard/appointments" className="text-[10px] font-black uppercase tracking-widest text-rose-300">← Back</Link>
            <h1 className="text-4xl font-light mt-2 tracking-tight">New <span className="font-serif italic text-rose-500">Session</span></h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-4 rounded-xl bg-rose-50/50 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Patient</label>
              <select required value={formData.patient_id} className="w-full p-4 rounded-xl bg-rose-50/50 outline-none" onChange={(e) => setFormData({...formData, patient_id: e.target.value})}>
                <option value="">Select patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Start</label>
                <input type="datetime-local" required value={formData.scheduled_at} className="w-full p-3 rounded-xl bg-rose-50/50 text-xs" onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">End</label>
                <input type="datetime-local" required value={formData.ended_at} className="w-full p-3 rounded-xl bg-rose-50/50 text-xs" onChange={(e) => setFormData({...formData, ended_at: e.target.value})} />
              </div>
            </div>

            {/* RESTORED NOTES FIELD */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Notes</label>
              <textarea 
                rows={3}
                placeholder="Add session details..."
                value={formData.notes}
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none resize-none" 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            {slotError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3">
                <p className="text-xs text-red-500 font-medium">{slotError}</p>
              </div>
            )}

            <button disabled={loading || !!slotError} className={`w-full py-5 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all ${slotError ? 'bg-gray-200 text-gray-400' : 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200'}`}>
              {loading ? "Booking..." : slotError ? "Slot Blocked" : "Confirm Appointment"}
            </button>
          </form>
        </div>

        {/* TIMELINE SIDE */}
        <div className="lg:col-span-7">
          <div className="bg-white/60 backdrop-blur-md rounded-[3rem] p-10 border border-white h-full shadow-inner">
            <h2 className="text-2xl font-light mb-8">Daily <span className="italic font-serif text-rose-500">Timeline</span></h2>
            
            <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[600px] pr-2">
              {timeSlots.map((slot, i) => {
                const isOccupied = !!slot.occupant;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => handleSlotClick(slot.fullDateTime)}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      isOccupied 
                        ? "bg-red-50 border-red-200" 
                        : "bg-white border-emerald-50 hover:border-emerald-400"
                    }`}
                  >
                    <span className={`text-xs font-black ${isOccupied ? "text-red-400" : "text-emerald-500"}`}>{slot.time}</span>
                    <div className="flex-1 px-8 text-left">
                      {isOccupied ? (
                        <span className="text-[10px] font-bold uppercase text-red-600 tracking-widest italic font-serif">
                          Booked by {slot.occupant.patients?.first_name}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-emerald-400 opacity-0 group-hover:opacity-100">Select Slot</span>
                      )}
                    </div>
                    <div className={`p-2 rounded-full ${isOccupied ? 'bg-red-100 text-red-500' : 'bg-emerald-50 text-emerald-400'}`}>
                      {isOccupied ? '✕' : '✓'}
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