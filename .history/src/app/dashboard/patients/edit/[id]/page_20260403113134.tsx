// src/app/dashboard/patients/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditPatientPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    medical_history: "",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchPatient() {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          medical_history: data.medical_history || "",
        });
      }
      setLoading(false);
    }
    fetchPatient();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("patients")
      .update(formData)
      .eq("id", id);

    if (error) {
      alert(error.message);
      setSaving(false);
    } else {
      router.push(`/dashboard/patients/${id}`);
      router.refresh();
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif italic text-rose-400">
        Opening file...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            href={`/dashboard/patients/${id}`}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400 hover:text-rose-600 transition-colors"
          >
            ← Cancel and Return
          </Link>
          <h1 className="text-4xl font-light text-gray-800 mt-4 tracking-tight">
            Update{" "}
            <span className="font-serif italic text-rose-500">
              Patient File
            </span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Personal Details */}
          <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(255,192,203,0.08)] border border-white">
            <h2 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-10">
              Demographics & Contact
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <InputGroup
                label="First Name"
                value={formData.first_name}
                onChange={(val) =>
                  setFormData({ ...formData, first_name: val })
                }
              />

              <InputGroup
                label="Last Name"
                value={formData.last_name}
                onChange={(val) => setFormData({ ...formData, last_name: val })}
              />

              <InputGroup
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(val) => setFormData({ ...formData, email: val })}
              />

              <InputGroup
                label="Phone Number"
                value={formData.phone}
                onChange={(val) => setFormData({ ...formData, phone: val })}
              />

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  className="w-full mt-2 bg-transparent border-b border-rose-100 focus:border-rose-400 outline-none py-2 text-gray-700"
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Card 2: Clinical Notes */}
          <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(255,192,203,0.05)] border border-white">
            <h2 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-6">
              Medical History & Allergies
            </h2>
            <textarea
              rows={6}
              value={formData.medical_history}
              placeholder="Record any skin conditions, allergies, or previous aesthetic treatments..."
              className="w-full p-8 bg-rose-50/30 border border-rose-50 rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-rose-200 outline-none transition-all text-gray-700 resize-none font-light leading-relaxed"
              onChange={(e) =>
                setFormData({ ...formData, medical_history: e.target.value })
              }
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-center gap-8">
            <button
              type="submit"
              disabled={saving}
              className="px-16 py-4 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Syncing Records..." : "Save Patient File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reusable Input Component
function InputGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="group">
      <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        className="w-full mt-2 bg-transparent border-b border-rose-100 focus:border-rose-400 outline-none py-2 text-gray-700 transition-all"
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
