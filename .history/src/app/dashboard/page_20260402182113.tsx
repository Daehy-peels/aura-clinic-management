// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ patients: 0, appointments: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function getStats() {
      // Get total patient count
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });
      
      setStats({
        patients: patientCount || 0,
        appointments: 0 // We will update this in Phase 3
      });
    }
    getStats();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-800 tracking-tight">
            Clinic <span className="font-serif italic text-rose-500">Overview</span>
          </h1>
          <p className="text-gray-400 mt-2 font-light italic">"Aura Aesthetic Clinic — Where beauty meets clinical excellence."</p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard 
            title="Total Patients" 
            value={stats.patients} 
            subtitle="Registered in system" 
          />
          <StatCard 
            title="Today's Appointments" 
            value={stats.appointments} 
            subtitle="Scheduled for today" 
          />
          <StatCard 
            title="New This Week" 
            value="+0" 
            subtitle="Patient growth" 
          />
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 border border-rose-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h2 className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em] mb-8 text-center md:text-left">
              Quick Management
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionLink href="/dashboard/patients/new" label="New Patient" />
              <QuickActionLink href="/dashboard/appointments" label="Book Treatment" />
              <QuickActionLink href="/dashboard/patients" label="View Directory" />
              <div className="p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
                More Coming Soon
              </div>
            </div>
          </div>

          <div className="bg-rose-500 rounded-[2.5rem] p-10 text-white shadow-xl shadow-rose-200 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Clinic Notice</h2>
              <p className="mt-6 text-xl font-light leading-relaxed">
                Remember to confirm all <span className="italic font-serif">Aura Signature Facials</span> 24 hours in advance.
              </p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-8">
              Update: April 2026
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Small helper component for Stat Cards
function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 border border-rose-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-rose-100 transition-all">
      <h3 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-4xl font-light text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400 mt-2 font-medium">{subtitle}</p>
    </div>
  );
}

// Small helper for Quick Action Buttons
function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link 
      href={href} 
      className="p-4 bg-white border border-rose-50 rounded-2xl flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-100 transition-all text-center"
    >
      {label}
    </Link>
  );
}