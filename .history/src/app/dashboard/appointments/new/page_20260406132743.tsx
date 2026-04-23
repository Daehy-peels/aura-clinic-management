// src/app/dashboard/appointments/new/page.tsx
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
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  const [formData, setFormData] = useState({
    patient_id: "",
    treatment_type: "",
    scheduled_at: "",
    ended_at: "",
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  // 1. Fetch Patients and existing appointments for the selected day
  useEffect(() => {
    async function fetchData() {
      // Get Patients
      const { data: pData } = await supabase
        .from("patients")
        .select("id, first_name, last_name");
      setPatients(pData || []);

      // Get Day's Appointments (Excluding cancelled)
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

  // 2. REAL-TIME OVERLAP VALIDATION
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

  // Find the conflicting appointment
  const conflict = dayAppointments.find((apt) => {
    const existingStart = new Date(apt.scheduled_at).getTime();
    const existingEnd = new Date(apt.ended_at).getTime();
    return newStart < existingEnd && newEnd > existingStart;
  });

  if (conflict) {
    // Dynamically show WHO is blocking the slot
    const patientName = conflict.patients?.first_name || "another patient";
    setSlotError(`This time is already booked by ${patientName}.`);
  } else {
    setSlotError(null);
  }
}, [formData.scheduled_at, formData.ended_at, dayAppointments]);

  // 3. Timeline Generation (9:00 AM to 7:00 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    let current = addMinutes(startOfDay(new Date()), 9 * 60);
    const end = addMinutes(startOfDay(new Date()), 19 * 60);

    while (current <= end) {
      const timeStr = format(current, "HH:mm");
      const fullDateTime = `${selectedDate}T${timeStr}`;

      const occupant = dayAppointments.find((apt) => {
        const start = new Date(apt.scheduled_at).getTime();
        const stop = new Date(apt.ended_at).getTime();
        const checkStart = new Date(fullDateTime).getTime();
        const checkEnd = checkStart + 30 * 60000; // 30 min block
        return checkStart < stop && checkEnd > start;
      });

      slots.push({
        time: timeStr,
        fullDateTime,
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
      ended_at: format(
        addMinutes(parseISO(dateTime), 60),
        "yyyy-MM-dd'T'HH:mm",
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slotError || !formData.patient_id) return;
    setLoading(true);

    // --- FINAL SERVER-SIDE CHECK (Prevents Double Booking) ---
    const { data: finalConflict } = await supabase
      .from("appointments")
      .select("id")
      .neq("status", "cancelled")
      .lt("scheduled_at", formData.ended_at)
      .gt("ended_at", formData.scheduled_at)
      .maybeSingle();

    if (finalConflict) {
      alert("Conflict detected! Someone just booked this slot. Refreshing...");
      window.location.reload();
      return;
    }

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
            <Link
              href="/dashboard/appointments"
              className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors"
            >
              ← Back to List
            </Link>
            <h1 className="text-4xl font-light mt-2 tracking-tight">
              New{" "}
              <span className="font-serif italic text-rose-500">Session</span>
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white space-y-5"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Appointment Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Patient
              </label>
              <select
                required
                value={formData.patient_id}
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none appearance-none"
                onChange={(e) =>
                  setFormData({ ...formData, patient_id: e.target.value })
                }
              >
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Treatment Type
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Initial Consultation"
                value={formData.treatment_type}
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none"
                onChange={(e) =>
                  setFormData({ ...formData, treatment_type: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_at}
                  className="w-full p-3 rounded-xl bg-rose-50/50 text-xs"
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_at: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.ended_at}
                  className="w-full p-3 rounded-xl bg-rose-50/50 text-xs"
                  onChange={(e) =>
                    setFormData({ ...formData, ended_at: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none resize-none"
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            {slotError && (
              <div className="p-3 bg-rose-100 border border-rose-200 rounded-xl text-rose-600 text-[10px] font-bold uppercase animate-pulse">
                ⚠️ {slotError}
              </div>
            )}

            <button
              disabled={loading || !!slotError || !formData.patient_id}
              className={`w-full py-5 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all ${slotError || !formData.patient_id ? "bg-gray-300 cursor-not-allowed" : "bg-rose-500 shadow-lg shadow-rose-200 hover:bg-rose-600"}`}
            >
              {loading
                ? "Registering..."
                : slotError
                  ? "Slot Unavailable"
                  : "Confirm Appointment"}
            </button>
          </form>
        </div>

        {/* RIGHT: TIMELINE */}
        <div className="lg:col-span-7">
          <div className="bg-white/60 backdrop-blur-md rounded-[3rem] p-10 border border-white shadow-inner h-full">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-light tracking-tight">
                  Daily{" "}
                  <span className="italic font-serif text-rose-500">
                    Timeline
                  </span>
                </h2>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                  {format(new Date(selectedDate), "EEEE, MMMM do")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
              {timeSlots.map((slot, i) => {
                const isOccupied = !!slot.occupant;
                const isCompleted = slot.occupant?.status === "completed";

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => handleSlotClick(slot.fullDateTime)}
                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isOccupied
                        ? isCompleted
                          ? "bg-gray-100 opacity-50"
                          : "bg-rose-50 border-rose-100"
                        : "bg-white border-emerald-50 hover:border-emerald-400 hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`text-xs font-black ${isOccupied ? "text-gray-400" : "text-emerald-500"}`}
                    >
                      {slot.time}
                    </span>
                    <div className="flex-1 px-6 text-left">
                      {isOccupied ? (
                        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">
                          {isCompleted
                            ? "Completed"
                            : `Booked: ${slot.occupant.patients?.first_name}`}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Select Slot
                        </span>
                      )}
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
