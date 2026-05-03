"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  async function fetchPatients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setPatients(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPatients();
  }, [supabase]);

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const email = p.email?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    name: string,
  ) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Permanently remove ${name} from clinical records?`,
    );
    if (!confirmed) return;

    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (!error) {
      setPatients(patients.filter((p) => p.id !== id));
    } else {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-4 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* HEADER SECTION - Fluid spacing and stackable layout */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 md:mb-12 gap-8">
          <div className="space-y-2 md:space-y-3">
            <h1 className="text-4xl md:text-6xl font-light text-slate-900 tracking-tighter leading-tight">
              Patient <br className="md:hidden" />
              <span className="font-serif italic text-rose-500">Directory</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em]">
                Clinical Database • {patients.length} active records
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/patients/new"
            className="group flex items-center justify-center gap-4 px-8 py-5 bg-slate-900 text-white rounded-full transition-all hover:bg-rose-500 hover:shadow-2xl active:scale-95"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Register New Profile</span>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>
        </div>

        {/* SEARCH & QUICK STATS - Dynamic Grid */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-16 pl-14 pr-6 bg-white border-2 border-slate-50 rounded-3xl focus:border-rose-100 outline-none transition-all text-sm shadow-sm placeholder:text-slate-300"
            />
            <svg className="h-5 w-5 absolute left-6 top-1/2 -translate-y-1/2 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 lg:w-40 bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 text-center">
               <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Recent</p>
               <p className="text-xl font-bold text-emerald-700">
                {patients.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
               </p>
            </div>
            <div className="flex-1 lg:w-40 bg-white p-4 rounded-3xl border border-slate-100 text-center shadow-sm">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
               <p className="text-xl font-bold text-slate-900">{patients.length}</p>
            </div>
          </div>
        </div>

        {/* DIRECTORY CONTENT */}
        {loading ? (
          <div className="py-24 text-center">
            <p className="font-serif italic text-rose-400 text-xl animate-pulse">Consulting records...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop-only Header */}
            <div className="hidden md:grid grid-cols-12 px-10 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
              <div className="col-span-5">Identity</div>
              <div className="col-span-4">Access Details</div>
              <div className="col-span-3 text-right">Registry Management</div>
            </div>

            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                className="group relative bg-white border-2 border-slate-50 rounded-[2.5rem] p-6 md:p-8 transition-all hover:border-rose-100 hover:shadow-[0_20px_50px_rgba(244,63,94,0.05)] cursor-pointer"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
                  {/* Avatar & Identity */}
                  <div className="md:col-span-5 flex items-center gap-5">
                    <div className="w-16 h-16 shrink-0 rounded-[1.5rem] bg-rose-50 flex items-center justify-center text-rose-500 font-serif italic text-2xl">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 truncate">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mt-1">
                        REF#{patient.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info - Center on mobile */}
                  <div className="md:col-span-4 flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase md:hidden tracking-widest">Contact Information</p>
                    <p className="text-sm text-slate-600 font-medium truncate">
                      {patient.email || "No contact record"}
                    </p>
                    <p className="text-[10px] text-slate-300 font-medium">
                      Joined {new Date(patient.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>

                  {/* Actions - Bottom on mobile, persistent on mobile */}
                  <div className="md:col-span-3 flex justify-end items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, patient.id, `${patient.first_name} ${patient.last_name}`)}
                      className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all md:opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}