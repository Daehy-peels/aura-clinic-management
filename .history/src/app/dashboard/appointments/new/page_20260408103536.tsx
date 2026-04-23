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
      const { data: pData } = await supabase
        .from("patients")
        .select("id, first_name, last_name");
      setPatients(pData || []);

      // Create a Date object for the start and end of the selected local day
      const dayStart = new Date(`${selectedDate}T00:00:00`);
      const dayEnd = new Date(`${selectedDate}T23:59:59`);

      const { data: aData, error } = await supabase
        .from("appointments")
        .select(
          "id, scheduled_at, ended_at, status, treatment_type, patients(first_name)",
        )
        .neq("status", "cancelled")
        // .toISOString() ensures Supabase understands the exact point in time
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString());

      if (error) console.error("Supabase Error:", error);

      console.log("Appointments fetched from DB:", aData); // Check this in your BROWSER console
      setDayAppointments(aData || []);
    }
    fetchData();
  }, [selectedDate, supabase]);

  // 2. REAL-TIME OVERLAP VALIDATION & CONFLICT MESSAGING
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
      // Overlap formula: (StartA < EndB) AND (EndA > StartB)
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflict) {
      const name = conflict.patients?.first_name || "another patient";
      setSlotError(`This time is already booked by ${name}.`);
    } else {
      setSlotError(null);
    }
  }, [formData.scheduled_at, formData.ended_at, dayAppointments]);

  // 3. Timeline Generation (9:00 AM to 7:00 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    // Use the selectedDate to anchor the timeline to the correct day
    let current = new Date(`${selectedDate}T09:00:00`);
    const end = new Date(`${selectedDate}T19:00:00`);

    while (current <= end) {
      const timeStr = format(current, "HH:mm");
      const fullDateTime = format(current, "yyyy-MM-dd'T'HH:mm:ss");

      const occupant = dayAppointments.find((apt) => {
        // Convert both to timestamps for a clean comparison
        const start = new Date(apt.scheduled_at).getTime();
        const stop = new Date(apt.ended_at).getTime();

        const checkStart = new Date(current).getTime();
        const checkEnd = checkStart + 30 * 60000; // 30 minutes later

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

    // Final Race-Condition Check
    const { data: finalConflict } = await supabase
      .from("appointments")
      .select("id")
      .neq("status", "cancelled")
      .lt("scheduled_at", formData.ended_at)
      .gt("ended_at", formData.scheduled_at)
      .maybeSingle();

    if (finalConflict) {
      alert("Conflict detected! Someone just booked this slot.");
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
        {/* LEFT: FORM SIDE */}
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

            {/* ERROR ALERT BOX */}
            {slotError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 animate-pulse">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                    Conflict Detected
                  </p>
                  <p className="text-xs text-red-500 font-medium">
                    {slotError}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!slotError || !formData.patient_id}
              className={`w-full py-5 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all duration-300 ${slotError ? "bg-gray-300 cursor-not-allowed" : "bg-rose-500 shadow-lg shadow-rose-200 hover:bg-rose-600 hover:-translate-y-0.5"}`}
            >
              {loading
                ? "Processing..."
                : slotError
                  ? "Slot Unavailable"
                  : "Confirm Appointment"}
            </button>
          </form>
        </div>

        {/* RIGHT: UPDATED TIMELINE SIDE */}
        <div className="lg:col-span-7">
          <div className="bg-white/60 backdrop-blur-md rounded-[3rem] p-10 border border-white shadow-inner h-full">
            <div className="mb-8">
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

            <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
              {timeSlots.map((slot, i) => {
                const isOccupied = !!slot.occupant;
                const patientName =
                  slot.occupant?.patients?.first_name || "Patient";
                const treatment = slot.occupant?.treatment_type || "Session";

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => handleSlotClick(slot.fullDateTime)}
                    // The title attribute provides a native browser tooltip on hover
                    title={
                      isOccupied
                        ? `Already booked by ${patientName} for ${treatment}`
                        : "Click to select"
                    }
                    className={`group relative flex items-center justify-between p-5 rounded-[2.5rem] border transition-all duration-300 ${
                      isOccupied
                        ? "bg-rose-50 border-rose-200 cursor-not-allowed" // Red/Rose theme for occupied
                        : "bg-white border-emerald-50 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span
                        className={`text-xs font-black ${
                          isOccupied ? "text-rose-400" : "text-emerald-500"
                        }`}
                      >
                        {slot.time}
                      </span>
                    </div>

                    <div className="flex-1 px-8 text-left">
                      {isOccupied ? (
                        <div className="flex flex-col">
                          {/* Show "Reserved" by default, but we can change text on hover using group-hover */}
                          <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                            Reserved
                          </span>
                          <span className="text-xs font-serif italic text-rose-400">
                            {patientName} — {treatment}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                          Available Slot +
                        </span>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div
                      className={`p-2 rounded-full transition-colors ${
                        isOccupied
                          ? "bg-rose-100 text-rose-500 group-hover:bg-rose-500 group-hover:text-white"
                          : "bg-emerald-50 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                      }`}
                    >
                      {isOccupied ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Custom Hover "Tooltip" Overlay (Optional) */}
                    {isOccupied && (
                      <div className="absolute inset-0 bg-rose-500 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <p className="text-white text-[10px] font-black uppercase tracking-tighter">
                          Already booked by {patientName}
                        </p>
                      </div>
                    )}
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
