// src/app/dashboard/appointments/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BookAppointmentPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    treatment_type: "",
    scheduled_at: "",
    ended_at: "", // New Field
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchPatients() {
      const { data } = await supabase.from("patients").select("id, first_name, last_name");
      setPatients(data || []);
    }
    fetchPatients();
  }, [supabase]);

  // --- IMPROVED OVERLAP CHECKER ---
  useEffect(() => {
    async function checkOverlap() {
      const { scheduled_at, ended_at } = formData;
      if (!scheduled_at || !ended_at) return;

      if (new Date(ended_at) <= new Date(scheduled_at)) {
        setSlotError("End time must be after the start time.");
        return;
      }

      setCheckingSlot(true);
      setSlotError(null);

      // Query: Find any appointment where 
      // (existing_start < new_end) AND (existing_end > new_start)
      const { data, error } = await supabase
        .from("appointments")
        .select("id, patients(first_name, last_name)")
        .eq("status", "scheduled")
        .lt("scheduled_at", ended_at) 
        .gt("ended_at", scheduled_at)
        .maybeSingle();

      if (data) {
        setSlotError(`Overlap detected with ${data.patients?.first_name}'s appointment.`);
      }
      
      setCheckingSlot(false);
    }

    checkOverlap();
  }, [formData.scheduled_at, formData.ended_at, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slotError || checkingSlot) return;

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
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Link href="/dashboard/appointments" className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-all">
            ← View Schedule
          </Link>
          <h1 className="text-5xl font-light mt-4 tracking-tight">
            Curate <span className="font-serif italic text-rose-500">Session</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-12 rounded-[3.5rem] shadow-2xl shadow-rose-100/50 border border-white space-y-10">
          
          {/* Patient & Treatment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Patient</label>
              <select 
                required 
                className="w-full p-4 rounded-2xl bg-rose-50/30 border-b border-rose-100 outline-none"
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              >
                <option value="">Select Registry...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Treatment</label>
              <input 
                type="text" 
                required 
                placeholder="Signature Glow"
                className="w-full p-4 rounded-2xl bg-rose-50/30 border-b border-rose-100 outline-none"
                onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
              />
            </div>
          </div>

          {/* Time Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-rose-50/20 rounded-[2.5rem] border border-rose-100/50">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Start Time</label>
              <input 
                type="datetime-local" 
                required 
                className="w-full p-4 rounded-2xl bg-white border-b border-rose-100 outline-none"
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest">End Time</label>
              <input 
                type="datetime-local" 
                required 
                className="w-full p-4 rounded-2xl bg-white border-b border-rose-100 outline-none"
                onChange={(e) => setFormData({ ...formData, ended_at: e.target.value })}
              />
            </div>
            
            {slotError && (
              <div className="md:col-span-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 animate-pulse">
                <span className="text-lg">⚠️</span>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{slotError}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Clinical Notes</label>
            <textarea 
              rows={3} 
              className="w-full p-6 bg-rose-50/30 border border-rose-50 rounded-[2rem] outline-none resize-none"
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!slotError || checkingSlot}
            className={`w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all ${
              slotError ? "bg-gray-200 text-gray-400" : "bg-rose-500 text-white shadow-xl shadow-rose-200 hover:bg-rose-600"
            }`}
          >
            {loading ? "Finalizing..." : checkingSlot ? "Analyzing Schedule..." : "Confirm Reservation"}
          </button>
        </form>
      </div>
    </div>
  );
}