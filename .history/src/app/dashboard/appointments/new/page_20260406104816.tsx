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
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  // Load patients for the dropdown
  useEffect(() => {
    async function fetchPatients() {
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name");
      setPatients(data || []);
    }
    fetchPatients();
  }, [supabase]);

  // --- NEW: AVAILABILITY CHECKER ---
  useEffect(() => {
    async function checkAvailability() {
      if (!formData.scheduled_at) return;

      setCheckingSlot(true);
      setSlotError(null);

      // We check for any appointment at this time that IS NOT cancelled
      const { data, error } = await supabase
        .from("appointments")
        .select("id")
        .eq("scheduled_at", formData.scheduled_at)
        .not("status", "eq", "cancelled")
        .single();

      if (data) {
        setSlotError("This time slot is already reserved for another patient.");
      }
      
      setCheckingSlot(false);
    }

    checkAvailability();
  }, [formData.scheduled_at, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final safety check
    if (slotError) return;

    setLoading(true);

    const { error } = await supabase
      .from("appointments")
      .insert([{
        ...formData,
        status: "scheduled" // Ensure default status
      }]);

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard/appointments");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link
            href="/dashboard/appointments"
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-300 hover:text-rose-500 transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Schedule
          </Link>
          <h1 className="text-5xl font-light mt-6 tracking-tight">
            Schedule <span className="font-serif italic text-rose-500">Treatment</span>
          </h1>
          <p className="text-gray-400 mt-2 font-light italic text-sm">
            Curate a new experience for your patient.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-2xl p-12 rounded-[3.5rem] shadow-[0_30px_70px_rgba(255,192,203,0.15)] border border-white space-y-10"
        >
          {/* Select Patient */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] ml-1">
              Patient Identity
            </label>
            <select
              required
              className="w-full bg-rose-50/30 border-b border-rose-100 focus:border-rose-400 outline-none p-4 rounded-2xl text-gray-700 transition-all appearance-none cursor-pointer"
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              value={formData.patient_id}
            >
              <option value="">Choose a patient from registry...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Treatment Type */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] ml-1">
              Service Selected
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aura Signature Botox"
              className="w-full bg-rose-50/30 border-b border-rose-100 focus:border-rose-400 outline-none p-4 rounded-2xl text-gray-700 placeholder:text-gray-300 transition-all"
              onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
               <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">
                 Appointment Slot
               </label>
               {checkingSlot && <span className="text-[9px] text-rose-300 animate-pulse uppercase font-bold">Checking Diary...</span>}
            </div>
            <input
              type="datetime-local"
              required
              className={`w-full p-4 rounded-2xl bg-rose-50/30 border-b transition-all outline-none text-gray-700 ${
                slotError ? "border-rose-500 bg-rose-50 shadow-inner" : "border-rose-100 focus:border-rose-400"
              }`}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
            />
            {slotError && (
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mt-2 ml-2 animate-bounce">
                ⚠️ {slotError}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] ml-1">
              Clinical Context
            </label>
            <textarea
              rows={3}
              placeholder="Special requirements, allergies, or facial areas..."
              className="w-full p-6 bg-rose-50/30 border border-rose-50 rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-rose-200 outline-none transition-all text-gray-700 resize-none placeholder:text-gray-300"
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!slotError || checkingSlot}
            className={`w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
              slotError 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
                : "bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600"
            }`}
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Finalizing Record...
              </>
            ) : slotError ? (
              "Slot Unavailable"
            ) : (
              "Confirm Treatment"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}