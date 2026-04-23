// src/app/dashboard/patients/page.tsx
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

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Permanently remove ${name} from clinical records?`);
    if (!confirmed) return;

    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (!error) {
      setPatients(patients.filter((p) => p.id !== id));
    } else {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-light text-gray-800 tracking-tight">
              Patient <span className="font-serif italic text-rose-500">Directory</span>
            </h1>
            <p className="text-gray-400 font-medium text-[10px] uppercase tracking-[0.2em] ml-1">
              Clinical Database & Record Management
            </p>
          </div>
          
          <Link
            href="/dashboard/patients/new"
            className="group flex items-center gap-3 px-8 py-4 bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-rose-600 shadow-xl shadow-rose-200 transition-all active:scale-95"
          >
            <span>Register New Patient</span>
            <span className="bg-white/20 rounded-full p-1 group-hover:rotate-90 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
            </span>
          </Link>
        </div>

        {/* Quick Stats & Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                <div className="bg-white/60 backdrop-blur-md p-5 rounded-[2rem] border border-white shadow-sm">
                    <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">Total Records</p>
                    <p className="text-3xl font-light text-gray-700">{patients.length}</p>
                </div>
                <div className="bg-emerald-50/50 backdrop-blur-md p-5 rounded-[2rem] border border-emerald-100 shadow-sm">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">New This Month</p>
                    <p className="text-3xl font-light text-emerald-600">
                        {patients.filter(p => new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </p>
                </div>
            </div>

            {/* Search Input */}
            <div className="lg:col-span-8 relative flex items-center">
                <input
                    type="text"
                    placeholder="Search by name, email, or reference ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-rose-100 rounded-[2rem] focus:ring-4 focus:ring-rose-50 outline-none transition-all text-sm text-gray-600 shadow-sm placeholder:text-rose-200"
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 absolute left-5 text-rose-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>

        {/* Directory Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="text-rose-300 font-serif italic text-xl animate-pulse">Synchronizing directory...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-sm border border-dashed border-rose-200 rounded-[3rem] p-24 text-center">
            <p className="text-gray-400 font-serif italic text-2xl">
              No matching clinical records found
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-rose-300 font-bold mt-2">"{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm("")}
              className="text-rose-500 font-black text-[10px] uppercase tracking-widest mt-8 px-6 py-2 border border-rose-200 rounded-full hover:bg-rose-500 hover:text-white transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header (Desktop Only) */}
            <div className="hidden md:grid grid-cols-12 px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
                <div className="col-span-5">Patient Identity</div>
                <div className="col-span-3">Contact Access</div>
                <div className="col-span-2">Registration</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Patient Cards */}
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                className="group grid grid-cols-1 md:grid-cols-12 items-center px-6 md:px-10 py-6 bg-white/70 hover:bg-white backdrop-blur-xl rounded-[2.5rem] border border-white hover:border-rose-100 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-rose-100/20 active:scale-[0.99]"
              >
                {/* Identity */}
                <div className="col-span-5 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center text-rose-500 font-serif italic text-xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800 tracking-tight flex items-center gap-2">
                        {patient.first_name} {patient.last_name}
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                    </h3>
                    <p className="text-[10px] text-rose-300 uppercase tracking-widest font-black mt-0.5">
                      REF#{patient.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div className="col-span-3 mt-4 md:mt-0">
                  <p className="text-xs text-gray-500 font-medium truncate group-hover:text-gray-800 transition-colors">
                    {patient.email || "No email on record"}
                  </p>
                </div>

                {/* Date */}
                <div className="col-span-2 mt-2 md:mt-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50/50 rounded-full border border-rose-100/20">
                    <span className="text-[10px] text-rose-400 font-bold">
                        {new Date(patient.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="col-span-2 text-right mt-4 md:mt-0 flex justify-end gap-2">
                  <button
                    onClick={(e) => handleDelete(e, patient.id, `${patient.first_name} ${patient.last_name}`)}
                    className="p-3 text-rose-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    title="Archive Record"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="p-3 text-rose-200 group-hover:text-rose-500 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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