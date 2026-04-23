// src/app/dashboard/appointments/new/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addMinutes, startOfDay } from "date-fns";

export default function BookAppointmentPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

  // 1. Fetch Patients and Today's Schedule
  useEffect(() => {
    async function fetchData() {
      const { data: pData } = await supabase
        .from("patients")
        .select("id, first_name, last_name");
      setPatients(pData || []);

      // Fetch appointments for the selected date to show in timeline
      const { data: aData } = await supabase
        .from("appointments")
        .select("id, scheduled_at, ended_at, status, patients(first_name)")
        .gte("scheduled_at", `${selectedDate}T00:00:00`)
        .lte("scheduled_at", `${selectedDate}T23:59:59`);

      setDayAppointments(aData || []);
    }
    fetchData();
  }, [selectedDate, supabase]);

  // 2. Generate Timeline Slots (9:00 AM to 7:00 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    let current = addMinutes(startOfDay(new Date()), 9 * 60); // Start 9 AM
    const end = addMinutes(startOfDay(new Date()), 19 * 60); // End 7 PM

    while (current <= end) {
      const timeStr = format(current, "HH:mm");
      const fullDateTime = `${selectedDate}T${timeStr}`;

      // Check if this specific minute is occupied
      const occupant = dayAppointments.find((apt) => {
        if (apt.status === "cancelled") return false;
        const start = new Date(apt.scheduled_at);
        const stop = new Date(apt.ended_at);
        const check = new Date(fullDateTime);
        return check >= start && check < stop;
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
        addMinutes(new Date(dateTime), 60),
        "yyyy-MM-dd'T'HH:mm",
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("appointments").insert([formData]);
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard/appointments");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-6 md:p-12 text-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT: BOOKING FORM */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <Link
              href="/dashboard/appointments"
              className="text-[10px] font-black uppercase tracking-widest text-rose-300"
            >
              ← Back
            </Link>
            <h1 className="text-4xl font-light mt-2 tracking-tight">
              New{" "}
              <span className="font-serif italic text-rose-500">Session</span>
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white space-y-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 rounded-xl bg-rose-50/50 border-none outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Patient
              </label>
              <select
                required
                className="w-full p-4 rounded-xl bg-rose-50/50 border-none outline-none"
                onChange={(e) =>
                  setFormData({ ...formData, patient_id: e.target.value })
                }
              >
                <option value="">Search patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  Start
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_at}
                  className="w-full p-3 rounded-xl bg-rose-50/50 text-xs outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_at: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  End
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.ended_at}
                  className="w-full p-3 rounded-xl bg-rose-50/50 text-xs outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, ended_at: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                Service
              </label>
              <input
                type="text"
                required
                placeholder="Treatment Name"
                className="w-full p-4 rounded-xl bg-rose-50/50 border-none outline-none"
                onChange={(e) =>
                  setFormData({ ...formData, treatment_type: e.target.value })
                }
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all"
            >
              {loading ? "Registering..." : "Confirm Appointment"}
            </button>
          </form>
        </div>

        {/* RIGHT: THE VISUAL TIMELINE */}
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
              <div className="flex gap-4 text-[9px] font-bold uppercase tracking-tighter">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>{" "}
                  Available
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>{" "}
                  Booked
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
              {timeSlots.map((slot, i) => {
                const isOccupied = !!slot.occupant;
                const isCompleted = slot.occupant?.status === "completed";

                return (
                  <button
                    key={i}
                    disabled={isOccupied}
                    onClick={() => handleSlotClick(slot.fullDateTime)}
                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isOccupied
                        ? isCompleted
                          ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                          : "bg-rose-50 border-rose-100 cursor-not-allowed"
                        : "bg-white border-emerald-50 hover:border-emerald-400 hover:shadow-md cursor-pointer"
                    }`}
                  >
                    <span
                      className={`text-xs font-black ${isOccupied ? "text-gray-400" : "text-emerald-500"}`}
                    >
                      {slot.time}
                    </span>

                    <div className="flex-1 px-6">
                      {isOccupied ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-1 h-4 rounded-full ${isCompleted ? "bg-gray-400" : "bg-rose-400"}`}
                          ></div>
                          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">
                            {isCompleted
                              ? "Completed Session"
                              : `Reserved: ${slot.occupant.patients?.first_name}`}
                          </span>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-[0.2em]">
                            Click to Reserve Slot
                          </span>
                        </div>
                      )}
                    </div>

                    {!isOccupied && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></div>
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
