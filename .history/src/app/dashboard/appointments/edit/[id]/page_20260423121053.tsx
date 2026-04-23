"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format, addMinutes, parseISO } from "date-fns";

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
      const { data } = await supabase
        .from("appointments")
        .select(`*, patients (first_name, last_name)`)
        .eq("id", id)
        .single();

      if (data) {
        setPatientName(
          `${data.patients?.first_name} ${data.patients?.last_name}`,
        );
        const naiveIso = data.scheduled_at.slice(0, 16);
        setSelectedDate(naiveIso.split("T")[0]);
        setFormData({
          treatment_type: data.treatment_type || "",
          duration: data.duration || 30,
          scheduled_at: naiveIso,
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
      const dayStart = `${selectedDate}T00:00:00`;
      const dayEnd = `${selectedDate}T23:59:59`;
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

  const getOccupant = (timeStr: string) => {
    const slotTime = parseISO(`${selectedDate}T${timeStr}:00`);
    for (const apt of dayAppointments) {
      const start = parseISO(apt.scheduled_at.slice(0, 19));
      const end = addMinutes(start, apt.duration || 30);
      if (slotTime >= start && slotTime < end)
        return apt.patients?.first_name || "Occupied";
    }
    return null;
  };

  const isSlotSelected = (timeStr: string) => {
    if (!formData.scheduled_at) return false;
    const slotTime = parseISO(`${selectedDate}T${timeStr}:00`);
    const startTime = parseISO(formData.scheduled_at + ":00");
    const endTime = addMinutes(startTime, formData.duration);
    return slotTime >= startTime && slotTime < endTime;
  };

  const hasCollision = useMemo(() => {
    if (!formData.scheduled_at) return false;
    const startTime = parseISO(formData.scheduled_at + ":00");
    const endTime = addMinutes(startTime, formData.duration);
    return dayAppointments.some((apt) => {
      const otherStart = parseISO(apt.scheduled_at.slice(0, 19));
      const otherEnd = addMinutes(otherStart, apt.duration || 30);
      return startTime < otherEnd && endTime > otherStart;
    });
  }, [formData.scheduled_at, formData.duration, dayAppointments]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCollision) return;
    const finalDateString = `${formData.scheduled_at}:00`;
    const { error } = await supabase
      .from("appointments")
      .update({
        treatment_type: formData.treatment_type,
        duration: formData.duration,
        notes: formData.notes,
        status: formData.status,
        scheduled_at: finalDateString,
      })
      .eq("id", id);
    if (!error) router.push("/dashboard/appointments");
  };

  if (loading)
    return (
      <div className="p-20 text-center font-serif italic text-rose-500">
        Syncing Records...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link
              href="/dashboard/appointments"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500"
            >
              ← Back
            </Link>
            <h1 className="text-6xl font-light tracking-tighter mt-2">
              Edit{" "}
              <span className="font-serif italic text-rose-500">Session</span>
            </h1>
          </div>
          <div className="bg-white border border-slate-100 p-6 px-10 rounded-[2rem] shadow-sm">
            <p className="text-[9px] font-black text-rose-300 uppercase mb-1">
              Patient
            </p>
            <p className="text-xl font-bold text-slate-700">{patientName}</p>
          </div>
        </header>

        <form
          onSubmit={handleUpdate}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              {/* Status Pill Toggle */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">
                  Session Status
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100/50 p-1.5 rounded-2xl">
                  {["scheduled", "completed", "cancelled"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`py-2 text-[9px] font-black uppercase rounded-xl transition-all ${formData.status === s ? "bg-white text-rose-500 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* TREATMENT TYPE (RESTORED & VISIBLE) */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  Treatment Type
                </label>
                <input
                  className="w-full p-4 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-medium focus:ring-2 focus:ring-rose-200 outline-none transition-all placeholder:text-slate-300"
                  value={formData.treatment_type}
                  placeholder="e.g. Aura Signature Facial"
                  onChange={(e) =>
                    setFormData({ ...formData, treatment_type: e.target.value })
                  }
                />
              </div>

              {/* DURATION (FIXED DULLNESS) */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  Duration (Minutes)
                </label>
                <select
                  className="w-full p-4 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold focus:ring-2 focus:ring-rose-200 outline-none appearance-none cursor-pointer"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={30}>30 Mins</option>
                  <option value={60}>60 Mins</option>
                  <option value={90}>90 Mins</option>
                  <option value={120}>120 Mins</option>
                </select>
                <p className="text-[8px] text-slate-400 mt-2 ml-1 italic">
                  *Blocks will update on the timeline
                </p>
              </div>

              {/* CLINICAL NOTES (FIXED DULLNESS) */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                  Clinical Notes
                </label>
                <textarea
                  rows={5}
                  className="w-full p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-slate-900 font-serif italic text-sm focus:ring-2 focus:ring-rose-200 outline-none transition-all placeholder:text-slate-300"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Enter medical or aesthetic notes here..."
                />
              </div>
            </div>

            <button
              disabled={hasCollision}
              className={`w-full py-6 rounded-full font-black uppercase tracking-[0.3em] text-[11px] transition-all ${hasCollision ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-rose-500 shadow-2xl hover:-translate-y-1"}`}
            >
              {hasCollision ? "Schedule Conflict" : "Confirm Amendments"}
            </button>
          </div>

          <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-light text-slate-800">
                Clinic{" "}
                <span className="italic font-serif text-rose-500">
                  Timeline
                </span>
              </h3>
              <input
                type="date"
                className="bg-rose-50/50 text-rose-500 text-[10px] font-black p-3 px-6 rounded-full border-none ring-1 ring-rose-100"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {hasCollision && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[9px] font-black uppercase tracking-[0.2em] text-center animate-pulse">
                ⚠️ Selection Overlaps with an existing patient
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {timeSlots.map((time) => {
                const occupant = getOccupant(time);
                const isSelected = isSlotSelected(time);
                const isCollisionSlot = isSelected && occupant;

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={!!occupant && !isSelected}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        scheduled_at: `${selectedDate}T${time}`,
                      })
                    }
                    className={`relative p-8 rounded-[2.5rem] text-[12px] font-black transition-all flex flex-col items-center justify-center border-2 
                      ${
                        isCollisionSlot
                          ? "bg-red-500 text-white border-red-500 shadow-lg scale-95"
                          : isSelected
                            ? "bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-100 z-10 scale-105"
                            : occupant
                              ? "bg-slate-50 text-slate-300 border-slate-50 opacity-60"
                              : "bg-white text-slate-400 border-slate-50 hover:border-rose-100 hover:text-rose-500 hover:bg-rose-50/30"
                      }
                    `}
                  >
                    <span className="tracking-widest">{time}</span>
                    {occupant && (
                      <span className="absolute bottom-4 text-[7px] uppercase tracking-tighter font-black">
                        {occupant}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
