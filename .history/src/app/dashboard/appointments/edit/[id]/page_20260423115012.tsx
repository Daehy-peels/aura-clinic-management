"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format, addMinutes, parseISO, isWithinInterval } from "date-fns";

export default function EditAppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    treatment_type: "",
    duration: 30,
    scheduled_at: "",
    notes: "",
    status: "scheduled",
  });

  // 1. GENERATE STATIC TIME SLOTS (09:00 - 17:30)
  const timeSlots = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const totalMinutes = 9 * 60 + i * 30;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    });
  }, []);

  useEffect(() => {
    async function fetchInitialData() {
      const { data, error } = await supabase
        .from("appointments")
        .select(`*, patients (first_name, last_name)`)
        .eq("id", id)
        .single();

      if (data) {
        setPatientName(
          `${data.patients?.first_name} ${data.patients?.last_name}`,
        );
        const isoDate = data.scheduled_at;
        setSelectedDate(isoDate.split("T")[0]);
        setFormData({
          treatment_type: data.treatment_type || "",
          duration: data.duration || 30,
          scheduled_at: isoDate.slice(0, 16),
          notes: data.notes || "",
          status: data.status || "scheduled",
        });
      }
      setLoading(false);
    }
    fetchInitialData();
  }, [id, supabase]);

  useEffect(() => {
    if (!selectedDate) return;
    async function fetchDaySchedule() {
      const dayStart = `${selectedDate}T00:00:00Z`;
      const dayEnd = `${selectedDate}T23:59:59Z`;
      const { data } = await supabase
        .from("appointments")
        .select(`id, scheduled_at, duration, patients (first_name)`)
        .filter("scheduled_at", "gte", dayStart)
        .filter("scheduled_at", "lte", dayEnd)
        .neq("id", id);
      setDayAppointments(data || []);
    }
    fetchDaySchedule();
  }, [selectedDate, id, supabase]);

  // LOGIC: Check if a slot is occupied by ANOTHER patient
  const getOccupant = (timeStr: string) => {
    const slotTime = parseISO(`${selectedDate}T${timeStr}:00Z`);
    for (const apt of dayAppointments) {
      const start = parseISO(apt.scheduled_at);
      const end = addMinutes(start, apt.duration || 30);
      if (slotTime >= start && slotTime < end) {
        return apt.patients?.first_name || "Occupied";
      }
    }
    return null;
  };

  // LOGIC: Check if a slot is part of the CURRENTLY SELECTED range
  const isSlotSelected = (timeStr: string) => {
    if (!formData.scheduled_at) return false;
    const slotTime = parseISO(`${selectedDate}T${timeStr}:00Z`);
    const startTime = parseISO(`${formData.scheduled_at}:00Z`);
    const endTime = addMinutes(startTime, formData.duration);
    return slotTime >= startTime && slotTime < endTime;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("appointments")
      .update({
        treatment_type: formData.treatment_type,
        duration: formData.duration,
        notes: formData.notes,
        status: formData.status,
        scheduled_at: new Date(formData.scheduled_at + ":00Z").toISOString(),
      })
      .eq("id", id);

    if (!error) router.push("/dashboard/appointments");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-serif italic text-rose-500 animate-pulse">
        Retrieving Clinical Records...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-6 md:p-12 text-slate-800">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <Link
              href="/dashboard/appointments"
              className="group text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-all"
            >
              ← Return to Schedule
            </Link>
            <h1 className="text-6xl font-light tracking-tighter mt-4">
              Edit{" "}
              <span className="font-serif italic text-rose-500">Session</span>
            </h1>
          </div>
          <div className="bg-white border border-slate-100 p-6 px-10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)]">
            <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">
              Patient Dossier
            </p>
            <p className="text-xl font-bold text-slate-700">{patientName}</p>
          </div>
        </header>

        <form
          onSubmit={handleUpdate}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          {/* LEFT COLUMN: SETTINGS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              {/* STATUS SELECTOR */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">
                  Current Status
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl">
                  {["scheduled", "completed", "cancelled"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`py-2 text-[8px] font-black uppercase tracking-tighter rounded-xl transition-all ${
                        formData.status === s
                          ? "bg-white text-rose-500 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                  Treatment Type
                </label>
                <input
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none text-slate-700 focus:ring-2 focus:ring-rose-100 transition-all"
                  value={formData.treatment_type}
                  onChange={(e) =>
                    setFormData({ ...formData, treatment_type: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                  Duration (Minutes)
                </label>
                <select
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none text-slate-700 focus:ring-2 focus:ring-rose-100"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                >
                  {[30, 60, 90, 120].map((mins) => (
                    <option key={mins} value={mins}>
                      {mins} Minutes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                  Clinical Notes
                </label>
                <textarea
                  rows={4}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none text-slate-700 focus:ring-2 focus:ring-rose-100 font-serif italic text-sm"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Record observations..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-6 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-full shadow-xl hover:bg-rose-500 transition-all hover:-translate-y-1 active:scale-95"
            >
              Confirm Amendments
            </button>
          </div>

          {/* RIGHT COLUMN: TIMELINE */}
          <div className="lg:col-span-8 bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
              <h3 className="text-2xl font-light text-slate-800">
                Clinic{" "}
                <span className="italic font-serif text-rose-500">
                  Availability
                </span>
              </h3>
              <input
                type="date"
                className="bg-rose-50/50 text-rose-500 text-[10px] font-black p-3 px-6 rounded-full border-none ring-1 ring-rose-100"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {timeSlots.map((time) => {
                const occupant = getOccupant(time);
                const isSelected = isSlotSelected(time);

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={!!occupant}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        scheduled_at: `${selectedDate}T${time}`,
                      })
                    }
                    className={`relative p-8 rounded-[2.5rem] text-[11px] font-black transition-all flex flex-col items-center justify-center border-2 group
                      ${
                        isSelected
                          ? "bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-200 scale-105 z-10"
                          : occupant
                            ? "bg-slate-50 text-slate-300 border-slate-50 cursor-not-allowed"
                            : "bg-white text-slate-400 border-slate-50 hover:border-rose-100 hover:text-rose-400"
                      }`}
                  >
                    <span className="tracking-widest">{time}</span>
                    {occupant && (
                      <span className="absolute bottom-4 text-[7px] uppercase tracking-tighter opacity-60">
                        {occupant}
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-300 tracking-widest">
                <div className="w-3 h-3 bg-rose-500 rounded-full" /> Selected
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-300 tracking-widest">
                <div className="w-3 h-3 bg-slate-100 rounded-full" /> Occupied
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
