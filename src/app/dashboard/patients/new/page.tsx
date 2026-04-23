"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPatientPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    medical_history: "",
  });
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("patients").insert([formData]);

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard/patients");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-6 md:p-12 lg:p-20 text-slate-800">
      <div className="max-w-4xl mx-auto">
        {/* TOP NAVIGATION & HEADER */}
        <div className="mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link
            href="/dashboard/patients"
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>{" "}
            Return to Directory
          </Link>

          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl font-light text-slate-900 tracking-tighter">
                New{" "}
                <span className="font-serif italic text-rose-500">
                  Clinical Profile
                </span>
              </h1>
              <p className="text-slate-400 mt-3 font-medium text-xs uppercase tracking-widest">
                Onboarding Portal • Step 1 of 1
              </p>
            </div>
            <div className="hidden md:block h-px flex-1 bg-slate-100 mx-10 mb-4" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* SECTION 1: IDENTITY */}
          <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group">
            {/* Decorative soft glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50/40 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-rose-100/40" />

            <h2 className="relative z-10 text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
              01. Personal Identity
              <div className="h-px w-8 bg-rose-200" />
            </h2>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <InputWrapper label="Legal First Name">
                <input
                  name="first_name"
                  type="text"
                  onChange={handleChange}
                  required
                  placeholder="e.g. Harry"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-rose-200 focus:bg-white transition-all placeholder:text-slate-300"
                />
              </InputWrapper>

              <InputWrapper label="Legal Last Name">
                <input
                  name="last_name"
                  type="text"
                  onChange={handleChange}
                  required
                  placeholder="e.g. DuBois"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-rose-200 focus:bg-white transition-all placeholder:text-slate-300"
                />
              </InputWrapper>

              <InputWrapper label="Email Address">
                <input
                  name="email"
                  type="email"
                  onChange={handleChange}
                  required
                  placeholder="harry.d@aura.com"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-rose-200 focus:bg-white transition-all placeholder:text-slate-300"
                />
              </InputWrapper>

              <InputWrapper label="Mobile Number">
                <input
                  name="phone"
                  type="tel"
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-rose-200 focus:bg-white transition-all placeholder:text-slate-300"
                />
              </InputWrapper>

              <InputWrapper label="Date of Birth" className="md:col-span-2">
                <input
                  name="date_of_birth"
                  type="date"
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-rose-200 focus:bg-white transition-all text-slate-600"
                />
              </InputWrapper>
            </div>
          </div>

          {/* SECTION 2: CLINICAL CONTEXT */}
          <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
            <h2 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
              02. Clinical Background
              <div className="h-px w-8 bg-rose-200" />
            </h2>

            <p className="text-[11px] text-slate-400 mb-6 italic">
              Please note any allergies, current medications, or previous
              aesthetic treatments.
            </p>

            <textarea
              name="medical_history"
              rows={5}
              onChange={handleChange}
              placeholder="Start typing medical observations..."
              className="w-full p-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] focus:bg-white focus:border-rose-200 outline-none transition-all text-slate-700 resize-none font-serif italic text-lg leading-relaxed shadow-inner"
            />
          </div>

          {/* FORM ACTIONS */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-10">
            <Link
              href="/dashboard/patients"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-slate-500 transition-colors"
            >
              Cancel Registration
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="group relative px-16 py-5 bg-rose-500 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-rose-200 hover:bg-rose-600 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Finalize Profile"}
              <div className="absolute inset-0 rounded-full border border-white/20 scale-105 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Internal Helper for Input Styling
function InputWrapper({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}
