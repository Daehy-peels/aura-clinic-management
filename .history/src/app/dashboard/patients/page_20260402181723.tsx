// src/app/dashboard/patients/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPatients() {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error:', error.message);
      } else {
        setPatients(data || []);
      }
      setLoading(false);
    }
    fetchPatients();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-light text-gray-800 tracking-tight">
              Patient <span className="font-serif italic text-rose-500">Directory</span>
            </h1>
            <p className="text-gray-400 mt-2 font-light">Manage and review your clinic's patient records.</p>
          </div>
          
          <Link 
            href="/dashboard/patients/new" 
            className="px-8 py-3 bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95 text-center"
          >
            + Register New Patient
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-rose-300 font-serif italic text-xl">Loading records...</div>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border border-rose-100 rounded-[3rem] p-20 text-center">
            <p className="text-gray-400 font-light text-lg">Your directory is currently empty.</p>
            <Link href="/dashboard/patients/new" className="text-rose-500 font-bold text-sm uppercase tracking-widest mt-4 block hover:underline">
              Add your first patient
            </Link>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rose-50">
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-rose-400">Patient Details</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-rose-400">Contact Info</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-rose-400">Registered</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-rose-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50">
                {patients.map((patient) => (
                  <tr key={patient.id} className="group hover:bg-rose-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {/* Initial Circle Avatar */}
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-xs shadow-inner">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 leading-none">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-tighter mt-1 font-bold">
                            #{patient.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">{patient.email}</p>
                        <p className="text-xs text-gray-400 font-light">{patient.phone || 'No phone recorded'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm text-gray-500 font-light">
                        {new Date(patient.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="inline-block px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200 rounded-full group-hover:border-rose-300 group-hover:text-rose-500 transition-all hover:bg-white"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}