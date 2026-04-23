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
    treatment_type: "Consultation", // Added
    status: "confirmed",            // Added
    scheduled_at: "",
    ended_at: "",
    notes: "",                      // Added
  });

  const supabase = createClient();
  const router = useRouter();

  // 1. Fetch Data
  useEffect(() => {
    async function fetchData() {
      // Patients list
      const { data: pData } = await supabase.from("patients").select("id, first_name, last_name");
      setPatients(pData || []);

      // Fetch appointments for the selected day
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

  // 2. Conflict Validation
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
      setSlotError(`Slot occupied by ${conflict.patients?.first_name || "another patient"}.`);
    } else {
      setSlotError(null);
    }
  }, [formData.scheduled_at, formData.ended_at, dayAppointments]);

  // 3. Timeline Logic (The "Red" Fix)
  const timeSlots = useMemo(() => {
    const slots = [];
    const anchorDate = parseISO(selectedDate);
    let current = addMinutes(startOfDay(anchorDate), 8 * 60); // Start 8 AM
    const dayEnd = addMinutes(startOfDay(anchorDate), 20 * 60); // End 8 PM

    while (current <= dayEnd) {
      const timeStr = format(current, "HH:mm");
      const fullIso = format(current, "yyyy-MM-dd'T'HH:mm");
      
      const checkStart = current.getTime();
      const checkEnd = checkStart + 30 * 60000; // 30-min window

      // Robust check for occupancy
      const occupant = dayAppointments.find((apt) => {
        const aptStart = new Date(apt.scheduled_at).getTime();
        const aptEnd = new Date(apt.ended_at).getTime();
        return checkStart < aptEnd && checkEnd > aptStart;
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: EXPANDED FORM */}
        <div className="lg:col-span-5">
          <div className="mb-6">
            <Link href="/dashboard/appointments" className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mt-2 text-slate-800">New Appointment</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-5">
            {/* Patient Select */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Patient Name</label>
              <select
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 ring-rose-100 border-none"
              >
                <option value="">Select a patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>

            {/* Treatment & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Treatment Type</label>
                <select
                  value={formData.treatment_type}
                  onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
                  className="w-full bg-slate-50 p-3 rounded-xl text-sm border-none outline-none"
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 p-3 rounded-xl text-sm border-none outline-none"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full bg-slate-50 p-3 rounded-xl text-xs border-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.ended_at}
                  onChange={(e) => setFormData({ ...formData, ended_at: e.target.value })}
                  className="w-full bg-slate-50 p-3 rounded-xl text-xs border-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Notes</label>
              <textarea
                rows={3}
                placeholder="Add session details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-50 p-4 rounded-2xl outline-none text-sm resize-none border-none"
              />
            </div>

            {slotError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">🚫 {slotError}</p>
              </div>
            )}

            <button
              disabled={loading || !!slotError || !formData.patient_id}
              className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                slotError || !formData.patient_id
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-[#FF2D55] text-white hover:bg-[#E6284D] shadow-lg shadow-rose-200"
              }`}
            >
              {loading ? "Saving..." : "Create Appointment"}
            </button>
          </form>
        </div>

        {/* RIGHT: TIMELINE */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-700">Daily Schedule</h2>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold bg-slate-100 p-2 px-4 rounded-lg outline-none"
              />
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {timeSlots.map((slot, i) => {
                const isOccupied = !!slot.occupant;
                const isSelected = formData.scheduled_at === slot.fullDateTime;

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => handleSlotClick(slot.fullDateTime)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 ${
                      isOccupied
                        ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-60" 
                        : isSelected
                        ? "bg-[#00C389] border-[#00C389] text-white shadow-md scale-[1.01]" 
                        : "bg-white border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/20"
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <span className={`text-[11px] font-black w-10 ${isOccupied ? "text-slate-300" : isSelected ? "text-white" : "text-slate-400"}`}>
                        {slot.time}
                      </span>
                      <div className="text-left">
                        {isOccupied ? (
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                             Booked: {slot.occupant.patients?.first_name}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? "text-white" : "text-[#00C389]"}`}>
                            {isSelected ? "Selected Time" : "Available"}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`text-[12px] ${isOccupied ? "text-slate-300" : isSelected ? "text-white" : "text-emerald-300"}`}>
                      {isOccupied ? "✕" : isSelected ? "●" : "✓"}
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