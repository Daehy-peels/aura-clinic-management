// src/app/dashboard/patients/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function PatientDetailsPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPatientData() {
      // 1. Fetch Patient Info
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      // 2. Fetch linked Appointments
      const { data: aptData } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", id)
        .order("scheduled_at", { ascending: false });

      if (patientData) setPatient(patientData);
      setAppointments(aptData || []);
      setLoading(false);
    }
    fetchPatientData();
  }, [id, supabase]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif italic text-rose-400">
        Reviewing clinical dossier...
      </div>
    );

  if (!patient)
    return (
      <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center p-10 text-center text-rose-500 font-bold uppercase tracking-widest">
        Record Not Found
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation & Header Section */}
        <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl shadow-rose-100 flex items-center justify-center text-3xl font-serif italic text-rose-500 border border-rose-50 transform group-hover:rotate-3 transition-transform">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-2 rounded-xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div>
              <Link href="/dashboard/patients" className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-400 hover:text-rose-600 transition-colors block mb-2">
                ← Return to Directory
              </Link>
              <h1 className="text-5xl font-light text-gray-800 tracking-tight leading-none">
                {patient.first_name} <span className="font-serif italic text-rose-500">{patient.last_name}</span>
              </h1>
              <div className="flex items-center gap-4 mt-4">
                 <span className="px-3 py-1 bg-white border border-rose-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  ID: {patient.id.slice(0, 8)}
                 </span>
                 <span className="px-3 py-1 bg-rose-50 text-[10px] font-bold text-rose-500 rounded-full uppercase tracking-widest">
                  Active Patient
                 </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="px-8 py-3 bg-white border border-rose-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-rose-50 transition-all shadow-sm">
              Edit Profile
            </button>
            <Link href="/dashboard/appointments/new" className="px-8 py-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 transition-all shadow-sm">
              Book Session
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Demographics */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-rose-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
               
               <h3 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-8 relative">Patient Identity</h3>
               
               <div className="space-y-8 relative">
                  <InfoItem label="Email Contact" value={patient.email} />
                  <InfoItem label="Phone Line" value={patient.phone || "No record"} />
                  <InfoItem 
                    label="Birth Date" 
                    value={patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Unset"} 
                  />
                  <InfoItem 
                    label="Member Since" 
                    value={new Date(patient.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })} 
                  />
               </div>
            </div>
          </div>

          {/* Column 2: Clinical Data & Activity */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Medical History Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-rose-100">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Medical History</h3>
                <div className="h-px flex-1 bg-rose-50"></div>
              </div>
              <div className="p-8 bg-rose-50/20 rounded-[2rem] border border-rose-50/50 min-h-[150px]">
                <p className="text-gray-600 leading-relaxed font-light italic">
                  {patient.medical_history || "No prior clinical notes recorded. Documentation is advised for new treatments."}
                </p>
              </div>
            </div>

            {/* Treatment Timeline Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-rose-100">
              <h3 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-8">Treatment Activity</h3>
              
              {appointments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-rose-100 rounded-[2rem]">
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No treatment history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-6 bg-white border border-rose-50 rounded-2xl group hover:shadow-md transition-all">
                      <div>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{apt.treatment_type}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(apt.scheduled_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: 'UTC' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-400'}`}>
                          {apt.status}
                        </span>
                        <Link href={`/dashboard/appointments/edit/${apt.id}`} className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Small Component for Info Rows
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
      <p className="text-sm text-gray-700 font-medium">{value}</p>
    </div>
  );
}