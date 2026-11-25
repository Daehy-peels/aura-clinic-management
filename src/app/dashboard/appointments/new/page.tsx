"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addMinutes } from "date-fns";

type PatientOption = {
  id: string;
  first_name: string;
  last_name: string;
};

type DayAppointment = {
  id: string;
  scheduled_at: string;
  duration: number | null;
  status: string;
  treatment_type: string;
  patients: { first_name: string } | null;
};

export default function BookAppointmentPage() {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [dayAppointments, setDayAppointments] = useState<DayAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  const [formData, setFormData] = useState({
    patient_id: "",
    treatment_type: "",
    scheduled_at: "",
    duration: 60,
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: pData } = await supabase
        .from("patients")
        .select("id, first_name, last_name");
      setPatients((pData as PatientOption[]) || []);

      const { data: aData, error } = await supabase
        .from("appointments")
        .select(
          "id, scheduled_at, duration, status, treatment_type, patients(first_name)",
        )
        .neq("status", "cancelled")
        .gte("scheduled_at", `${selectedDate}T00:00:00Z`)
        .lte("scheduled_at", `${selectedDate}T23:59:59Z`);

      if (error) console.error("Supabase Error:", error);
      setDayAppointments((aData as unknown as DayAppointment[]) || []);
    }
    fetchData();
  }, [selectedDate, supabase]);

  const slotError = useMemo(() => {
    if (!formData.scheduled_at) {
      return null;
    }

    const newStart = new Date(formData.scheduled_at);
    const newStartMs = newStart.getTime();
    const newEndMs = addMinutes(newStart, formData.duration).getTime();

    const conflict = dayAppointments.find((apt) => {
      const existingStart = new Date(
        String(apt.scheduled_at).replace("Z", "").split("+")[0],
      );
      const existingEnd = addMinutes(
        existingStart,
        apt.duration || 30,
      ).getTime();
      return newStartMs < existingEnd && newEndMs > existingStart.getTime();
    });

    if (conflict) {
      const name = conflict.patients?.first_name || "another patient";
      return `This time is already booked by ${name}.`;
    }
    return null;
  }, [formData.scheduled_at, formData.duration, dayAppointments]);

  const timeSlots = useMemo(() => {
    const slots = [];
    const [year, month, day] = selectedDate.split("-").map(Number);
    let current = new Date(year, month - 1, day, 9, 0, 0);
    const end = new Date(year, month - 1, day, 19, 0, 0);

    while (current <= end) {
      const timeStr = format(current, "HH:mm");
      const occupant = dayAppointments.find((apt) => {
        const dbStart = new Date(
          String(apt.scheduled_at).replace("Z", "").split("+")[0],
        );
        const dbEnd = addMinutes(dbStart, apt.duration || 30);
        const slotStart = current;
        const slotEnd = addMinutes(current, 30);
        return slotStart < dbEnd && slotEnd > dbStart;
      });

      slots.push({
        time: timeStr,
        fullDateTime: format(current, "yyyy-MM-dd'T'HH:mm"),
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
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slotError || !formData.patient_id || !formData.scheduled_at) return;
    setLoading(true);

    // Re-check against fresh data in case another staff member just booked.
    const day = formData.scheduled_at.slice(0, 10);
    const { data: fresh } = await supabase
      .from("appointments")
      .select("id, scheduled_at, duration")
      .neq("status", "cancelled")
      .gte("scheduled_at", `${day}T00:00:00`)
      .lte("scheduled_at", `${day}T23:59:59`);

    const start = new Date(formData.scheduled_at);
    const end = addMinutes(start, formData.duration);
    const finalConflict = (fresh || []).some((apt: { scheduled_at: string; duration: number | null }) => {
      const existingStart = new Date(
        String(apt.scheduled_at).replace("Z", "").split("+")[0],
      );
      const existingEnd = addMinutes(existingStart, apt.duration || 30);
      return start < existingEnd && end > existingStart;
    });

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
    <div className="min-h-screen bg-[#FFF5F5] p-4 sm:p-6 md:p-12 text-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* LEFT: FORM SIDE */}
        <div className="lg:col-span-5 space-y-6 md:space-y-8">
          <div>
            <Link
              href="/dashboard/appointments"
              className="inline-block text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors"
            >
              ← Back to List
            </Link>
            <h1 className="text-3xl md:text-4xl font-light mt-2 tracking-tight">
              New{" "}
              <span className="font-serif italic text-rose-500">Session</span>
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/90 backdrop-blur-xl p-5 sm:p-8 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-white space-y-5"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Appointment Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 transition-all cursor-pointer text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Patient
              </label>
              <select
                required
                value={formData.patient_id}
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none appearance-none text-sm"
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
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none text-sm placeholder:text-gray-300"
                onChange={(e) =>
                  setFormData({ ...formData, treatment_type: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Duration
                </label>
                <select
                  value={formData.duration}
                  className="w-full p-3 rounded-xl bg-rose-50/50 text-xs cursor-pointer"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value, 10),
                    })
                  }
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Clinical Notes
              </label>
              <textarea
                placeholder="Add specific instructions..."
                value={formData.notes}
                rows={3}
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 transition-all resize-none text-sm placeholder:text-gray-300"
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            {slotError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 animate-pulse">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-600">
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
              className={`w-full py-5 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all duration-300 ${
                slotError || !formData.patient_id
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-rose-500 shadow-lg shadow-rose-200 hover:bg-rose-600 hover:-translate-y-0.5 active:scale-95"
              }`}
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
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 border border-white shadow-inner h-full">
            <div className="mb-6 md:mb-8 text-center sm:text-left">
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

            <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[500px] md:max-h-[600px] pr-2 md:pr-4 custom-scrollbar">
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
                    className={`group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl md:rounded-[2.5rem] border transition-all duration-300 ${
                      isOccupied
                        ? "bg-rose-50 border-rose-200 cursor-not-allowed"
                        : "bg-white border-emerald-50 hover:border-emerald-400 hover:shadow-lg active:scale-[0.98] cursor-pointer"
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

                    <div className="flex-1 px-4 sm:px-8 text-left">
                      {isOccupied ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">
                            Reserved
                          </span>
                          <span className="text-[11px] font-serif italic text-rose-400 truncate max-w-[120px] sm:max-w-none">
                            {patientName} — {treatment}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                          Available Slot +
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                        isOccupied
                          ? "bg-rose-100 text-rose-500 group-hover:bg-rose-500 group-hover:text-white"
                          : "bg-emerald-50 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                      }`}
                    >
                      {isOccupied ? (
                        <svg
                          className="h-3 w-3 sm:h-4 sm:w-4"
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
                          className="h-3 w-3 sm:h-4 sm:w-4"
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
