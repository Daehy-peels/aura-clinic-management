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
  const [activeTab, setActiveTab] = useState("overview");
  const supabase = createClient();

  useEffect(() => {
    async function fetchPatientData() {
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();
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
      <div className="min-h-screen bg-[#FFFDFD] flex items-center justify-center font-serif italic text-rose-400 animate-pulse p-6 text-center">
        Retrieving clinical dossier...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-4 md:p-12 pb-32 text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP ACTION BAR - Stacks on mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 md:mb-12">
          <Link
            href="/dashboard/patients"
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-500 transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Return to Registry
          </Link>
          <div className="flex w-full sm:w-auto gap-3">
            <Link
              href={`/dashboard/patients/edit/${patient.id}`}
              className="flex-1 sm:flex-none text-center px-6 py-3 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
            >
              Edit Profile
            </Link>
            <Link
              href="/dashboard/appointments/new"
              className="flex-1 sm:flex-none text-center px-6 py-3 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all"
            >
              Book Session
            </Link>
          </div>
        </div>

        {/* PROFILE HEADER CARD - Column on mobile, Row on desktop */}
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] mb-8 md:mb-10 flex flex-col md:flex-row gap-6 md:gap-10 items-center">
          <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-[1.8rem] md:rounded-[2.5rem] bg-rose-50 flex items-center justify-center text-3xl md:text-4xl font-serif italic text-rose-500 border border-rose-100 shadow-inner">
            {patient.first_name[0]}{patient.last_name[0]}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-5xl font-light tracking-tighter">
                {patient.first_name}{" "}
                <span className="font-serif italic text-rose-500">
                  {patient.last_name}
                </span>
              </h1>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] rounded-full">
                Validated Patient
              </span>
            </div>
            <p className="text-slate-400 text-xs md:text-sm tracking-wide">
              ID: <span className="font-mono">{patient.id.split("-")[0]}</span>{" "}
              • Member since {format(new Date(patient.created_at), "yyyy")}
            </p>
          </div>

          {/* QUICK STATS - Visible on tablet and up */}
          <div className="hidden sm:flex gap-8 border-t md:border-t-0 md:border-l border-slate-50 pt-6 md:pt-0 md:pl-10 w-full md:w-auto justify-center">
            <StatBlock label="Total Visits" value={appointments.length} />
            <StatBlock label="Completed" value={appointments.filter((a) => a.status === "completed").length} />
          </div>
        </div>

        {/* TAB NAVIGATION - Scrollable on mobile */}
        <div className="flex gap-6 md:gap-10 mb-8 border-b border-slate-50 px-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          {["Overview", "Medical History", "Activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${
                activeTab === tab.toLowerCase()
                  ? "text-rose-500"
                  : "text-slate-300 hover:text-slate-500"
              }`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-rose-500" />
              )}
            </button>
          ))}
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          <div className="lg:col-span-8">
            {activeTab === "overview" && (
              <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-[9px] md:text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-8">
                  Contact & Demographics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
                  <InfoItem label="Email Address" value={patient.email} icon={<IconEmail />} />
                  <InfoItem label="Primary Phone" value={patient.phone || "Not provided"} icon={<IconPhone />} />
                  <InfoItem label="Date of Birth" 
                            value={patient.date_of_birth ? format(new Date(patient.date_of_birth), "MMMM dd, yyyy") : "Unset"} 
                            icon={<IconCake />} />
                  <InfoItem label="Registration" value={format(new Date(patient.created_at), "PPP")} icon={<IconCalendar />} />
                </div>
              </div>
            )}

            {activeTab === "medical history" && (
              <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-[9px] md:text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-6">
                  Clinical Background
                </h3>
                <div className="bg-rose-50/30 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-rose-100/50">
                  <p className="text-slate-600 leading-relaxed font-serif italic text-base md:text-lg">
                    "{patient.medical_history || "The patient's clinical history is currently clear."}"
                  </p>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                {appointments.length === 0 ? (
                  <EmptyState />
                ) : (
                  appointments.map((apt) => <ActivityCard key={apt.id} apt={apt} />)
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR - Moves below main content on mobile */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
              <h4 className="text-[8px] md:text-[9px] font-black text-rose-400 uppercase tracking-[0.4em] mb-4 md:mb-6 relative z-10">Care Notes</h4>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed relative z-10">
                Last seen for <span className="text-white font-bold">{appointments[0]?.treatment_type || "Initial Consultation"}</span>.
              </p>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-[2rem] p-8 md:p-10">
              <h4 className="text-[8px] md:text-[9px] font-black text-rose-400 uppercase tracking-[0.4em] mb-4">Patient Integrity</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-bold text-slate-700 uppercase">HIPAA Compliant</p>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">Data encrypted per medical standards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SUB-COMPONENTS FOR CLEANER CODE
function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-xl md:text-2xl font-light text-slate-800">{value}</p>
      <p className="text-[8px] md:text-[9px] font-black text-rose-300 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function ActivityCard({ apt }: { apt: any }) {
  return (
    <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-rose-200 transition-all">
      <div className="flex gap-4 md:gap-8 items-center">
        <div className="text-center min-w-[50px]">
          <p className="text-lg md:text-xl font-light text-slate-800">{format(parseISO(apt.scheduled_at), "dd")}</p>
          <p className="text-[8px] md:text-[9px] font-black text-rose-400 uppercase">{format(parseISO(apt.scheduled_at), "MMM")}</p>
        </div>
        <div className="h-8 w-[1px] bg-slate-100" />
        <div>
          <p className="text-xs md:text-sm font-bold text-slate-700">{apt.treatment_type}</p>
          <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest">
            {format(parseISO(apt.scheduled_at), "hh:mm aa")}
          </p>
        </div>
      </div>
      <span className={`text-[7px] md:text-[8px] font-black uppercase px-2 md:px-3 py-1 rounded-full ${apt.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
        {apt.status}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 md:py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
      <p className="font-serif italic text-slate-400 text-base md:text-lg">No treatment history on file.</p>
    </div>
  );
}

// ... Icons (IconEmail, IconPhone, etc.) remain the same as your provided code

// ICONS (Inline for simplicity)
const IconEmail = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const IconPhone = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const IconCalendar = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const IconCake = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z"
    />
  </svg>
);
const IconEdit = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
