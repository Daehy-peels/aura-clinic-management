// src/app/dashboard/appointments/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditAppointmentPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    treatment_type: "",
    scheduled_at: "",
    status: "",
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchAppointment() {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        // Format the date for the input field (YYYY-MM-DDThh:mm)
        const date = new Date(data.scheduled_at);
        const formattedDate = date.toISOString().slice(0, 16);

        setFormData({
          treatment_type: data.treatment_type,
          scheduled_at: formattedDate,
          status: data.status,
          notes: data.notes || "",
        });
      }
      setLoading(false);
    }
    fetchAppointment();
  }, [id, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("appointments")
      .update({
        ...formData,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
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
      <div className="p-20 text-center font-serif italic text-rose-300">
        Loading details...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link
            href="/dashboard/appointments"
            className="text-[10px] font-bold uppercase tracking-widest text-rose-400"
          >
            ← Cancel Edit
          </Link>
          <h1 className="text-4xl font-light text-gray-800 mt-4 tracking-tight">
            Modify{" "}
            <span className="font-serif italic text-rose-500">Appointment</span>
          </h1>
        </div>

        <form
          onSubmit={handleUpdate}
          className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-xl border border-white space-y-8"
        >
          <div className="group">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
              Treatment
            </label>
            <input
              type="text"
              value={formData.treatment_type}
              className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-2"
              onChange={(e) =>
                setFormData({ ...formData, treatment_type: e.target.value })
              }
            />
          </div>

          <div className="group">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
              Status
            </label>
            <select
              value={formData.status}
              className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-2"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="group">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-2"
              onChange={(e) =>
                setFormData({ ...formData, scheduled_at: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full active:scale-95 transition-all"
          >
            {saving ? "Updating Record..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
