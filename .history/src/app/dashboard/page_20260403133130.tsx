// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    patients: 0,
    todayAppointments: 0,
    weeklyGrowth: 0,
  });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const supabase = createClient();

  useEffect(() => {
    // Live Clock Update
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    async function fetchDashboardData() {
      const today = new Date().toISOString().split("T")[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const [patientStats, weeklyStats, todayApts, agenda] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("patients").select("*", { count: "exact", head: true }).gt("created_at", lastWeek.toISOString()),
        supabase.from("appointments").select("*", { count: "exact", head: true })
          .gte("scheduled_at", `${today}T00:00:00Z`).lte("scheduled_at", `${today}T23:59:59Z`),
        supabase.from("appointments").select(`id, treatment_type, scheduled_at, patients (first_name, last_name)`)
          .gte("scheduled_at", new Date().toISOString()).order("scheduled_at", { ascending: true }).limit(3)
      ]);

      setStats({
        patients: patientStats.count || 0,
        todayAppointments: todayApts.count || 0,
        weeklyGrowth: weeklyStats.count || 0,
      });
      setUpcoming(agenda.data || []);
      setLoading(false);
    }

    fetchDashboardData();
    return () => clearInterval(timer);
  }, [supabase]);

  // Dynamic Greeting based on time of day
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
               <span className="px-3 py-1 bg-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Systems Active</span>
            </div>
            <h1 className="text-6xl font-light tracking-tight">
              {greeting}, <span className="font-serif italic text-rose-500">Clinician</span>
            </h1>
            <p className="text-gray-400 font-light italic">The clinical pulse for {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.</p>
          </div>
          
          <div className="bg-white/40 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-white shadow-sm text-right min-w-[200px]">
            <p className="text-[10px] font-black text-rose-300 uppercase tracking-[0.3em]">Live Clinic Time</p>
            <p className="text-2xl font-light text-gray-700 mt-1">
              {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
            </p>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <StatCard title="Total Registry" value={stats.patients} subtitle="Medical Records" icon="📂" />
          <StatCard title="Today's Flow" value={stats.todayAppointments} subtitle="Sessions Booked" icon="✨" color="text-rose-500" />
          <StatCard title="New Onboarded" value={`+${stats.weeklyGrowth}`} subtitle="7-Day Growth" icon="📈" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Agenda Preview */}
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between px-4">
                <h2 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">Next in Treatment</h2>
                <Link href="/dashboard/appointments" className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors uppercase tracking-widest">Full Schedule →</Link>
             </div>
             
             <div className="bg-white/60 backdrop-blur-xl rounded-[3.5rem] p-4 border border-white shadow-[0_30px_60px_rgba(255,192,203,0.08)]">
                {loading ? (
                  <div className="p-12 text-center animate-pulse text-rose-200 font-serif italic">Loading agenda...</div>
                ) : upcoming.length > 0 ? (
                  <div className="space-y-2">
                    {upcoming.map((apt) => (
                      <div key={apt.id} className="group flex items-center justify-between p-8 bg-transparent hover:bg-white rounded-[2.5rem] transition-all duration-500 cursor-pointer">
                        <div className="flex items-center gap-8">
                          <div className="w-20 text-center">
                            <p className="text-xl font-light text-gray-800">{new Date(apt.scheduled_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" })}</p>
                          </div>
                          <div className="h-10 w-[1px] bg-rose-100"></div>
                          <div>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">{apt.patients?.first_name} {apt.patients?.last_name}</p>
                            <p className="text-xl font-serif italic text-rose-500 opacity-80 group-hover:opacity-100">{apt.treatment_type}</p>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-full border border-rose-100 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-[-10px] transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center text-gray-400 italic font-serif">The afternoon is clear.</div>
                )}
             </div>
          </div>

          {/* Quick Actions & Notes */}
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 border border-white shadow-xl shadow-rose-100/20">
              <h2 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-8">Navigation</h2>
              <div className="space-y-3">
                <QuickActionLink href="/dashboard/patients/new" label="New Patient" />
                <QuickActionLink href="/dashboard/appointments/new" label="Book Session" />
              </div>
            </div>

            <div className="bg-rose-500 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-rose-200 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-8">Clinical Note</p>
              <p className="text-2xl font-light leading-snug">
                "Precision is the <span className="italic font-serif">signature</span> of excellence."
              </p>
              <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Aura Protocol v2.4</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color = "text-gray-800" }: any) {
  return (
    <div className="group bg-white/70 backdrop-blur-xl rounded-[3rem] p-10 border border-white shadow-[0_20px_40px_rgba(255,192,203,0.04)] hover:shadow-rose-100 hover:-translate-y-1 transition-all duration-500">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-[10px] font-black text-rose-300 uppercase tracking-[0.3em]">{title}</h3>
        <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <p className={`text-6xl font-light tracking-tighter ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-[0.2em]">{subtitle}</p>
    </div>
  );
}

function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between w-full px-8 py-5 bg-rose-50/50 border border-rose-100 rounded-2xl text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all group">
      {label}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </Link>
  );
}