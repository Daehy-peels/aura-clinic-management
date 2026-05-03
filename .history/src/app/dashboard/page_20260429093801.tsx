"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    patients: 0,
    todayAppointments: 0,
    weeklyGrowth: 0,
  });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    async function fetchDashboardData() {
      // Use "Naive" date strings to match our wall-clock logic
      const todayDate = new Date().toISOString().split("T")[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekIso = lastWeek.toISOString();

      const [patientStats, weeklyStats, todayApts, agenda] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase
          .from("patients")
          .select("*", { count: "exact", head: true })
          .gt("created_at", lastWeekIso),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("scheduled_at", `${todayDate}T00:00:00`)
          .lte("scheduled_at", `${todayDate}T23:59:59`),
        supabase
          .from("appointments")
          .select(`id, treatment_type, scheduled_at, patients (first_name, last_name)`)
          // Fetch from "now" onwards (Naive comparison)
          .gte("scheduled_at", new Date().toISOString().slice(0, 16))
          .order("scheduled_at", { ascending: true })
          .limit(3),
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

  const greeting =
    currentTime.getHours() < 12
      ? "Good Morning"
      : currentTime.getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-4 md:p-12 text-slate-800 selection:bg-rose-100 overflow-x-hidden">
      {/* Decorative Blur - Hidden on tiny screens to save CPU */}
      <div className="fixed top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-rose-50/40 rounded-full blur-[80px] md:blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-6">
          <div className="animate-in fade-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] md:tracking-[0.4em]">
                Systems Operational
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tighter text-slate-900 leading-tight">
              {greeting}, <br className="md:hidden" />
              <span className="font-serif italic text-rose-500">Clinician</span>
            </h1>
            <p className="text-slate-500 font-bold mt-4 text-xs md:text-sm tracking-wide">
              {mounted ? format(currentTime, "EEEE, MMMM do") : "---"} —{" "}
              {mounted ? format(currentTime, "yyyy") : "---"}
            </p>
          </div>

          <div className="bg-white border border-rose-100/50 px-6 md:px-10 py-4 md:py-6 rounded-3xl md:rounded-[2.5rem] shadow-sm md:shadow-[0_15px_40px_rgba(255,192,203,0.1)] text-left md:text-right w-fit">
            <p className="text-[8px] md:text-[9px] font-black text-rose-300 uppercase tracking-[0.3em] mb-1">
              Live Clinic Time
            </p>
            <p className="text-2xl md:text-4xl font-light text-slate-700 tracking-tight">
              {mounted ? (
                <>
                  {format(currentTime, "hh:mm:ss")}{" "}
                  <span className="text-sm md:text-lg font-black text-rose-400 uppercase">
                    {format(currentTime, "aa")}
                  </span>
                </>
              ) : (
                "00:00:00"
              )}
            </p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-20">
          <StatCard title="Total Registry" value={stats.patients} subtitle="Active Patient Files" icon={<IconFolder />} />
          <StatCard title="Today's Flow" value={stats.todayAppointments} subtitle="Sessions Booked" icon={<IconSparkle />} color="text-rose-500" />
          <div className="sm:col-span-2 lg:col-span-1">
             <StatCard title="Weekly Growth" value={`+${stats.weeklyGrowth}`} subtitle="New Registrations" icon={<IconChart />} />
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* UPCOMING APPOINTMENTS */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
                Next In Treatment
              </h2>
              <Link href="/dashboard/appointments" className="text-[10px] font-black text-rose-500 hover:text-rose-700 transition-colors uppercase tracking-widest border-b border-rose-200 pb-1">
                View All
              </Link>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] md:rounded-[4rem] p-2 md:p-4 shadow-sm">
              {loading ? (
                <div className="p-20 text-center animate-pulse text-rose-300 font-serif italic">Accessing schedule...</div>
              ) : upcoming.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {upcoming.map((apt) => (
                    <div key={apt.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 md:p-10 hover:bg-rose-50/30 rounded-[2rem] md:rounded-[3rem] transition-all duration-500">
                      <div className="flex items-center gap-6 md:gap-12 w-full sm:w-auto">
                        <div className="text-center min-w-[70px]">
                          <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">
                             {format(parseISO(apt.scheduled_at.slice(0, 16)), "MMM dd")}
                          </p>
                          <p className="text-xl md:text-2xl font-light text-slate-900 tracking-tighter">
                            {format(parseISO(apt.scheduled_at.slice(0, 16)), "HH:mm")}
                          </p>
                        </div>
                        <div className="hidden sm:block h-10 w-[1px] bg-slate-100 group-hover:bg-rose-200 transition-colors" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                          <p className="text-lg font-bold text-slate-900">{apt.patients?.first_name} {apt.patients?.last_name}</p>
                          <p className="text-sm md:text-lg font-serif italic text-rose-500">{apt.treatment_type}</p>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 ml-auto sm:ml-0 flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-50 group-hover:bg-rose-500 group-hover:text-white transition-all">
                        <IconArrowRight size="18" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center text-slate-400 italic font-serif">The afternoon is clear.</div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS SIDEBAR */}
          <div className="lg:col-span-4 space-y-6 md:space-y-10">
            <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/20 rounded-full blur-2xl" />
              <h2 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-8 md:mb-10">Administrative</h2>
              <div className="space-y-3 md:space-y-4">
                <QuickActionLink href="/dashboard/patients/new" label="Add New Patient" />
                <QuickActionLink href="/dashboard/appointments/new" label="Schedule Session" />
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12">
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.3em] mb-6">Clinical Vision</p>
              <p className="text-xl md:text-2xl font-light text-slate-700 leading-tight italic font-serif">
                "Precision is the <span className="text-rose-500">signature</span> of excellence."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- UI COMPONENTS --- */

function StatCard({ title, value, subtitle, icon, color = "text-slate-900" }: any) {
  return (
    <div className="group bg-white border border-slate-100 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-sm hover:shadow-xl hover:shadow-rose-100/20 hover:-translate-y-1 transition-all duration-500">
      <div className="flex justify-between items-start mb-6 md:mb-8">
        <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em]">{title}</h3>
        <div className="text-rose-400 group-hover:rotate-12 transition-transform">{icon}</div>
      </div>
      <p className={`text-5xl md:text-7xl font-light tracking-tighter ${color}`}>{value}</p>
      <p className="text-[9px] text-slate-500 mt-4 md:mt-6 font-bold uppercase tracking-widest">{subtitle}</p>
    </div>
  );
}

function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between w-full p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest hover:bg-rose-500 hover:border-rose-500 transition-all">
      {label}
      <IconArrowRight size="14" />
    </Link>
  );
}

/* --- ICONS --- */
const IconFolder = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" /></svg>;
const IconSparkle = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>;
const IconChart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
const IconArrowRight = ({ size = "20" }: { size?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;