// src/app/dashboard/patients/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PatientDetailsPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPatient() {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setPatient(data);
      }
      setLoading(false);
    }
    fetchPatient();
  }, [id, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif italic text-rose-400">
      Consulting records...
    </div>
  );
  
  if (!patient) return (
    <div className="p-10 text-center text-rose-500 font-bold uppercase tracking-widest">
      Patient Record Not Found
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/patients" className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400 hover:text-rose-600 transition-colors">
              ← Back to Directory
            </Link>
            <div className="flex items-center gap-6 mt-4">
              <div className="w-20 h-20 rounded-full bg-white shadow-xl shadow-rose-100 flex items-center justify-center text-2xl font-serif italic text-rose-500 border border-rose-50">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <h1 className="text-4xl font-light text-gray-800 tracking-tight">
                  {patient.first_name} <span className="font-serif italic text-rose-500">{patient.last_name}</span>
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  File Reference: #{patient.id.slice(0, 8)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-white border border-rose-100 rounded-full hover:bg-rose-50 transition-all">
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Contact & Vital Info */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-rose-100">
              <h2 className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em] mb-6">Patient Essentials</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Email Address</label>
                  <p className="text-sm text-gray-700 font-medium mt-1">{patient.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Primary Phone</label>
                  <p className="text-sm text-gray-700 font-medium mt-1">{patient.phone || '—'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Date of Birth</label>
                  <p className="text-sm text-gray-700 font-medium mt-1">
                    {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not Provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clinical History & Notes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-rose-100 min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em]">Clinical History & Notes</h2>
                <span className="h-px flex-1 bg-rose-50 ml-6"></span>
              </div>
              
              <div className="prose prose-rose max-w-none">
                <p className="text-gray-600 leading-relaxed font-light italic bg-rose-50/30 p-6 rounded-3xl border border-rose-50">
                  {patient.medical_history || "No medical history recorded for this patient yet. Use the edit profile button to add clinical documentation."}
                </p>
              </div>

              {/* Placeholder for Appointments - Preparing for Phase 3 */}
              <div className="mt-12">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Upcoming Treatments</h2>
                <div className="border border-dashed border-rose-200 rounded-3xl p-8 text-center">
                  <p className="text-xs text-rose-300 italic font-serif">No appointments scheduled.</p>
                  <Link href="/dashboard/appointments" className="inline-block mt-4 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:underline">
                    Schedule Treatment →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}