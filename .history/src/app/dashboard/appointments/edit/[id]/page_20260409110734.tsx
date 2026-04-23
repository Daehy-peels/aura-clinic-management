// src/app/dashboard/appointments/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format, addMinutes, startOfDay, parseISO } from "date-fns";

export default function EditAppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientName, setPatientName] = useState("");

  // State for form and availability
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    treatment_type: "",
    scheduled_at: "", // Stores the full "YYYY-MM-DDTHH:mm"
    status: "",
    notes: "",
  });

  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const totalMinutes = 9 * 60 + i * 30; // Start at 9:00 AM
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  });

  // 1. Initial Fetch: Get Appointment Data
  useEffect(() => {
    async function fetchInitialData() {
      const { data, error } = await supabase
        .from("appointments")
        .select(`*, patients (first_name, last_name)`)
        .eq("id", id)
        .single();

      if (data) {
        const wallClockPart = data.scheduled_at.slice(0, 16); // "YYYY-MM-DDTHH:mm"
        const dayPart = data.scheduled_at.slice(0, 10); // "YYYY-MM-DD"

        setPatientName(
          `${data.patients?.first_name} ${data.patients?.last_name}`,
        );
        setSelectedDate(dayPart);
        setFormData({
          treatment_type: data.treatment_type,
          scheduled_at: wallClockPart,
          status: data.status,
          notes: data.notes || "",
        });
      }
      setLoading(false);
    }
    fetchInitialData();
  }, [id, supabase]);

  // 2. Availability Fetch: Get occupied slots for the selected date
  useEffect(() => {
    async function checkAvailability() {
      const { data } = await supabase
        .from("appointments")
        .select("scheduled_at")
        .filter("scheduled_at", "gte", `${selectedDate}T00:00:00`)
        .filter("scheduled_at", "lte", `${selectedDate}T23:59:59`)
        .neq("id", id); // Exclude CURRENT appointment so its own slot shows as available

      if (data) {
        const slots = data.map((apt) => apt.scheduled_at.slice(11, 16));
        setOccupiedSlots(slots);
      }
    }
    checkAvailability();
  }, [selectedDate, id, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("appointments")
      .update({
        treatment_type: formData.treatment_type,
        status: formData.status,
        notes: formData.notes,
        scheduled_at: `${formData.scheduled_at}:00+00`,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      setSaving(false);
    } else {
      router.push("/dashboard/appointments");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif italic text-rose-400">
        Loading records...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/dashboard/appointments"
            className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500"
          >
            ← Return to Schedule
          </Link>
          <h1 className="text-4xl font-light mt-4">
            Reschedule{" "}
            <span className="font-serif italic text-rose-500">Treatment</span>
          </h1>
          <p className="text-gray-400 text-xs italic mt-1 uppercase tracking-widest">
            Patient: {patientName}
          </p>
        </div>

        <form
          onSubmit={handleUpdate}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* LEFT: FORM FIELDS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                  Treatment
                </label>
                <input
                  type="text"
                  value={formData.treatment_type}
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 transition-all text-sm"
                  onChange={(e) =>
                    setFormData({ ...formData, treatment_type: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 transition-all text-sm"
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  className="w-full p-4 rounded-2xl bg-rose-50/30 border border-rose-50 outline-none text-sm resize-none"
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-rose-100 active:scale-95 disabled:opacity-50"
            >
              {saving ? "Syncing..." : "Update Session"}
            </button>
          </div>

          {/* RIGHT: TIMELINE SELECTOR */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  Select Availability
                </h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-rose-50 text-rose-500 text-xs font-bold p-2 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map((time) => {
                  const isSelected =
                    formData.scheduled_at === `${selectedDate}T${time}`;
                  const isOccupied = occupiedSlots.includes(time);

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isOccupied}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          scheduled_at: `${selectedDate}T${time}`,
                        })
                      }
                      className={`py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all ${
                        isSelected
                          ? "bg-rose-500 text-white shadow-lg scale-105"
                          : isOccupied
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed opacity-50"
                            : "bg-rose-50 text-rose-400 hover:bg-rose-100"
                      }`}
                    >
                      {time}
                      {isOccupied && (
                        <span className="block text-[8px] opacity-60">
                          Taken
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-8 text-center text-[10px] text-gray-400 italic">
                Currently selected:{" "}
                <span className="text-rose-500 font-bold not-italic">
                  {formData.scheduled_at.replace("T", " at ")}
                </span>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
