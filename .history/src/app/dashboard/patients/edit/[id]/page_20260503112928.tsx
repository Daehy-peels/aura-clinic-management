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
      <div className="min-h-screen bg-[#FFFDFD] flex items-center justify-center font-serif italic text-rose-400 animate-pulse p-6 text-center">
        Accessing patient archive...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-4 md:p-12 text-slate-800">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER SECTION - Now stacks on mobile */}
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <Link
              href={`/dashboard/patients/${id}`}
              className="group flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-all"
            >
              <span className="group-hover:-translate-x-1 transition-transform">
                ←
              </span>{" "}
              Back to Dossier
            </Link>
            <h1 className="text-3xl md:text-5xl font-light text-slate-900 mt-4 tracking-tighter leading-tight">
              Refine{" "}
              <span className="font-serif italic text-rose-500">
                Patient File
              </span>
            </h1>
          </div>
          
          <div className="flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
            <div>
              <p className="text-[8px] md:text-[9px] font-black text-rose-300 uppercase tracking-widest">
                Database Sync
              </p>
              <p className="text-[10px] md:text-xs text-slate-400 italic">
                ID: {String(id).slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
          
          {/* PERSONAL INFORMATION CARD */}
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-rose-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-100/50 transition-colors duration-700" />

            <div className="flex items-center gap-4 mb-8 md:mb-12">
              <h2 className="text-[9px] md:text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">
                Primary Identity
              </h2>
              <div className="h-px flex-1 bg-rose-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 md:gap-y-10 relative z-10">
              <InputGroup
                label="First Name"
                placeholder="e.g. Harry"
                value={formData.first_name}
                onChange={(val: string) =>
                  setFormData({ ...formData, first_name: val })
                }
              />

              <InputGroup
                label="Last Name"
                placeholder="e.g. DuBois"
                value={formData.last_name}
                onChange={(val: string) =>
                  setFormData({ ...formData, last_name: val })
                }
              />

              <InputGroup
                label="Email Contact"
                type="email"
                placeholder="harry.d@aura.com"
                value={formData.email}
                onChange={(val: string) =>
                  setFormData({ ...formData, email: val })
                }
              />

              <InputGroup
                label="Phone Line"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(val: string) =>
                  setFormData({ ...formData, phone: val })
                }
              />

              <div className="md:col-span-2">
                <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 md:mb-3 block">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 text-sm md:text-base text-slate-700 outline-none focus:border-rose-200 focus:bg-white transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* MEDICAL HISTORY CARD */}
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <h2 className="text-[9px] md:text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">
                Clinical Notes
              </h2>
              <div className="h-px flex-1 bg-rose-50" />
            </div>

            <p className="text-[9px] md:text-[10px] text-slate-400 mb-6 italic leading-relaxed">
              Record any known allergies, current medications, or skin
              sensitivities below.
            </p>

            <textarea
              rows={6}
              value={formData.medical_history}
              placeholder="Start typing clinical observation..."
              className="w-full p-6 md:p-8 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] md:rounded-[2.5rem] focus:bg-white focus:border-rose-200 outline-none transition-all text-slate-700 resize-none font-serif italic text-base md:text-lg leading-relaxed shadow-inner"
              onChange={(e) =>
                setFormData({ ...formData, medical_history: e.target.value })
              }
            />
          </div>

          {/* FORM ACTIONS */}
          <div className="flex flex-col items-center gap-6 py-6 md:py-8">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto group relative px-12 md:px-20 py-4 md:py-5 bg-rose-500 text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-rose-200 hover:bg-rose-600 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            >
              {saving ? "Updating Archive..." : "Finalize Changes"}
              <div className="absolute inset-0 rounded-full border border-white/20 scale-105 group-hover:scale-110 transition-transform" />
            </button>
            <Link
              href={`/dashboard/patients/${id}`}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
            >
              Discard Edits
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reusable Enhanced Input Component
function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: any) {
  return (
    <div className="relative">
      <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 md:mb-3 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 text-sm md:text-base text-slate-700 outline-none focus:border-rose-200 focus:bg-white transition-all placeholder:text-slate-300"
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}