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
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

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

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      const { data: pData } = await supabase
        .from("patients")
        .select("id, first_name, last_name");

      setPatients(pData || []);

      const { data: aData } = await supabase
        .from("appointments")
        .select("id, scheduled_at, ended_at, status, patients(first_name)")
        .neq("status", "cancelled")
        .gte("scheduled_at", `${selectedDate}T00:00:00`)
        .lte("scheduled_at", `${selectedDate}T23:59:59`);

      setDayAppointments(aData || []);
    }

    fetchData();
  }, [selectedDate]);

  // Conflict detection
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
      const start = new Date(apt.scheduled_at).getTime();
      const end = new Date(apt.ended_at).getTime();
      return newStart < end && newEnd > start;
    });

    if (conflict) {
      const name = conflict.patients?.first_name || "another patient";
      setSlotError(`Already booked by ${name}`);
    } else {
      setSlotError(null);
    }
  }, [formData, dayAppointments]);

  // Time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    let current = addMinutes(startOfDay(new Date()), 9 * 60);
    const end = addMinutes(startOfDay(new Date()), 19 * 60);

    while (current <= end) {
      const timeStr = format(current, "HH:mm");
      const full = `${selectedDate}T${timeStr}`;

      const occupant = dayAppointments.find((apt) => {
        const s = new Date(apt.scheduled_at).getTime();
        const e = new Date(apt.ended_at).getTime();
        const cs = new Date(full).getTime();
        const ce = cs + 30 * 60000;
        return cs < e && ce > s;
      });

      slots.push({ time: timeStr, full, occupant });
      current = addMinutes(current, 30);
    }

    return slots;
  }, [dayAppointments, selectedDate]);

  const handleSlotClick = (dateTime: string) => {
    setSelectedSlot(dateTime);

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

    const { data: conflict } = await supabase
      .from("appointments")
      .select("id")
      .neq("status", "cancelled")
      .lt("scheduled_at", formData.ended_at)
      .gt("ended_at", formData.scheduled_at)
      .maybeSingle();

    if (conflict) {
      alert("Slot just got booked.");
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-white p-4 md:p-10">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-5 space-y-6 lg:sticky top-6 h-fit">
          <div>
            <Link
              href="/dashboard/appointments"
              className="text-xs text-gray-400 hover:text-rose-500"
            >
              ← Back
            </Link>
            <h1 className="text-3xl font-light mt-2">
              Book <span className="text-rose-500 italic">Session</span>
            </h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg space-y-4 border"
          >
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />

            <select
              required
              value={formData.patient_id}
              onChange={(e) =>
                setFormData({ ...formData, patient_id: e.target.value })
              }
              className="input"
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Treatment"
              value={formData.treatment_type}
              onChange={(e) =>
                setFormData({ ...formData, treatment_type: e.target.value })
              }
              className="input"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_at: e.target.value })
                }
                className="input text-xs"
              />
              <input
                type="datetime-local"
                value={formData.ended_at}
                onChange={(e) =>
                  setFormData({ ...formData, ended_at: e.target.value })
                }
                className="input text-xs"
              />
            </div>

            {slotError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                ⚠ {slotError}
              </div>
            )}

            <button
              disabled={loading || !!slotError}
              className="w-full py-4 rounded-full bg-rose-500 text-white text-xs tracking-widest hover:scale-[1.02] transition disabled:bg-gray-300"
            >
              {loading ? "Processing..." : "Confirm Booking"}
            </button>
          </form>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-inner border">
          <h2 className="text-xl mb-4">
            Timeline –{" "}
            <span className="text-rose-500">
              {format(new Date(selectedDate), "MMM dd")}
            </span>
          </h2>

          <div className="grid gap-2 max-h-[600px] overflow-y-auto pr-2">
            {timeSlots.map((slot, i) => {
              const occupied = !!slot.occupant;
              const selected = selectedSlot === slot.full;

              return (
                <button
                  key={i}
                  disabled={occupied}
                  onClick={() => handleSlotClick(slot.full)}
                  className={`
                    flex justify-between items-center p-4 rounded-xl border transition
                    ${
                      occupied
                        ? "bg-red-50 text-red-400 cursor-not-allowed"
                        : selected
                          ? "bg-rose-500 text-white scale-[1.02]"
                          : "hover:bg-rose-50 hover:scale-[1.01]"
                    }
                  `}
                >
                  <span className="text-sm font-semibold">{slot.time}</span>

                  {occupied ? (
                    <span className="text-xs">Booked</span>
                  ) : selected ? (
                    <span className="text-xs">Selected ✓</span>
                  ) : (
                    <span className="text-xs opacity-50">Available</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tailwind helper */}
      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          background: #fff5f5;
          outline: none;
        }
      `}</style>
    </div>
  );
}
