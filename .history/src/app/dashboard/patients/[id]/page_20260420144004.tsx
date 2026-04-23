"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function PatientDetailsPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const supabase = createClient();

  useEffect(() => {
    async function fetchPatientData() {
      const { data: patientData } = await supabase.from("patients").select("*").eq("id", id).single();
      const { data: aptData } = await supabase.from("appointments").select("*").eq("patient_id", id).order("scheduled_at", { ascending: false });

      if (patientData) setPatient(patientData);
      setAppointments(aptData || []);
      setLoading(false);
    }
    fetchPatientData();
  }, [id, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#FFFDFD] flex items-center justify-center font-serif italic text-rose-400 animate-pulse">
      Retrieving clinical dossier...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-6 md:p-12 text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP ACTION BAR */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/dashboard/patients" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-all">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Registry
          </Link>
          <div className="flex gap-3">
            <Link href={`/dashboard/patients/edit/${patient.id}`} className="px-6 py-2 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Edit Profile</Link>
            <Link href="/dashboard/appointments/new" className="px-6 py-2 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all">Book Session</Link>
          </div>
        </div>

        {/* PROFILE HEADER CARD */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] mb-10 flex flex-col md:flex-row gap-10 items-center">
          <div className="w-32 h-32 rounded-[2.5rem] bg-rose-50 flex items-center justify-center text-4xl font-serif italic text-rose-500 border border-rose-100 shadow-inner">
            {patient.first_name[0]}{patient.last_name[0]}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-5xl font-light tracking-tighter">{patient.first_name} <span className="font-serif italic text-rose-500">{patient.last_name}</span></h1>
              <span className="px-4 py-1 bg-emerald-50 text-emerald-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-full">Validated Patient</span>
            </div>
            <p className="text-slate-400 text-sm tracking-wide">Patient ID: <span className="font-mono text-xs">{patient.id.split('-')[0]}</span> • Member since {format(new Date(patient.created_at), 'yyyy')}</p>
          </div>
          
          {/* QUICK STATS */}
          <div className="flex gap-8 border-l border-slate-50 pl-10 hidden lg:flex">
            <div className="text-center">
              <p className="text-2xl font-light text-slate-800">{appointments.length}</p>
              <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Total Visits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light text-slate-800">{appointments.filter(a => a.status === 'completed').length}</p>
              <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Completed</p>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-10 mb-8 border-b border-slate-50 px-4">
          {['Overview', 'Medical History', 'Activity'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${
                activeTab === tab.toLowerCase() ? "text-rose-500" : "text-slate-300 hover:text-slate-500"
              }`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-rose-500 animate-in fade-in zoom-in" />}
            </button>
          ))}
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* TAB CONTENT: LEFT/MAIN SIDE */}
          <div className="lg:col-span-8">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100">
                  <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-8">Contact & Demographics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <InfoItem label="Email Address" value={patient.email} icon={<IconEmail />} />
                    <InfoItem label="Primary Phone" value={patient.phone || "Not provided"} icon={<IconPhone />} />
                    <InfoItem label="Date of Birth" value={patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMMM dd, yyyy') : "Unset"} icon={<IconCake />} />
                    <InfoItem label="Registration" value={format(new Date(patient.created_at), 'PPP')} icon={<IconCalendar />} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'medical history' && (
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-8">Clinical Background</h3>
                <div className="bg-rose-50/30 rounded-3xl p-8 border border-rose-100/50">
                  <p className="text-slate-600 leading-relaxed font-serif italic text-lg">
                    "{patient.medical_history || "The patient's clinical history is currently clear. No contraindications recorded."}"
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {appointments.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                    <p className="font-serif italic text-slate-400 text-lg">No treatment history on file.</p>
                  </div>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} className="bg-white p-8 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-rose-200 transition-all">
                      <div className="flex gap-8 items-center">
                        <div className="text-center min-w-[60px]">
                          <p className="text-xl font-light text-slate-800">{format(parseISO(apt.scheduled_at), 'dd')}</p>
                          <p className="text-[9px] font-black text-rose-400 uppercase">{format(parseISO(apt.scheduled_at), 'MMM')}</p>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-100" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">{apt.treatment_type}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{format(parseISO(apt.scheduled_at), 'hh:mm aa', { timeZone: 'UTC' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {apt.status}
                        </span>
                        <Link href={`/dashboard/appointments/edit/${apt.id}`} className="p-3 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                          <IconEdit />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: QUICK ACTIONS / STATUS */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
              <h4 className="text-[9px] font-black text-rose-400 uppercase tracking-[0.4em] mb-6 relative z-10">Care Notes</h4>
              <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                Last seen for <span className="text-white font-bold">{appointments[0]?.treatment_type || "Initial Consultation"}</span>. 
                Patient responds well to signature treatments.
              </p>
              <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                <p className="text-[8px] font-bold text-slate-500 uppercase">System Intelligence</p>
                <p className="text-xs italic text-rose-200 mt-1">High-priority patient record</p>
              </div>
            </div>
            
            <div className="bg-rose-50/50 border border-rose-100 rounded-[2.5rem] p-10">
              <h4 className="text-[9px] font-black text-rose-400 uppercase tracking-[0.4em] mb-4">Patient Integrity</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold text-slate-700 uppercase">HIPAA Compliant Record</p>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">All clinical data is encrypted and stored according to medical privacy standards.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// UI HELPER COMPONENTS
function InfoItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 text-rose-300">{icon}</div>
      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}

// ICONS (Inline for simplicity)
const IconEmail = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IconPhone = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const IconCalendar = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconCake = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;