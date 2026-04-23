// src/app/dashboard/page.tsx
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
  const supabase = createClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    async function fetchDashboardData() {
      const today = new Date().toISOString().split("T")[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const [patientStats, weeklyStats, todayApts, agenda] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase
          .from("patients")
          .select("*", { count: "exact", head: true })
          .gt("created_at", lastWeek.toISOString()),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("scheduled_at", `${today}T00:00:00Z`)
          .lte("scheduled_at", `${today}T23:59:59Z`),
        supabase
          .from("appointments")
          .select(
            `id, treatment_type, scheduled_at, patients (first_name, last_name)`,
          )
          .gte("scheduled_at", new Date().toISOString())
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
    <div className="min-h-screen bg-[#FFFDFD] p-8 md:p-12 text-slate-800 selection:bg-rose-100">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-50/30 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="animate-in fade-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">
                Systems Operational
              </span>
            </div>
            <h1 className="text-7xl font-light tracking-tighter text-slate-900">
              {greeting},{" "}
              <span className="font-serif italic text-rose-500">Clinician</span>
            </h1>
            <p className="text-slate-400 font-medium mt-4 tracking-wide">
              {format(currentTime, "EEEE, MMMM do")} —{" "}
              {format(currentTime, "yyyy")}
            </p>
          </div>

          <div className="bg-white border border-rose-100/50 px-10 py-6 rounded-[2.5rem] shadow-[0_15px_40px_rgba(255,192,203,0.1)] text-right">
            <p className="text-[9px] font-black text-rose-300 uppercase tracking-[0.4em] mb-2">
              Live Clinic Time
            </p>
            <p className="text-4xl font-light text-slate-700 tracking-tight">
              {format(currentTime, "hh:mm:ss")}{" "}
              <span className="text-lg font-bold text-rose-400">
                {format(currentTime, "aa")}
              </span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <StatCard
            title="Total Registry"
            value={stats.patients}
            subtitle="Active Patient Files"
            icon={<IconFolder />}
          />
          <StatCard
            title="Today's Flow"
            value={stats.todayAppointments}
            subtitle="Sessions Booked"
            icon={<IconSparkle />}
            color="text-rose-500"
          />
          <StatCard
            title="Weekly Growth"
            value={`+${stats.weeklyGrowth}`}
            subtitle="New Registrations"
            icon={<IconChart />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Agenda Preview */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                Next In Treatment
              </h2>
              <Link
                href="/dashboard/appointments"
                className="text-[10px] font-black text-rose-400 hover:text-rose-600 transition-colors uppercase tracking-widest border-b border-rose-100 pb-1"
              >
                Full Schedule
              </Link>
            </div>

            <div className="bg-white border border-slate-100 rounded-[4rem] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
              {loading ? (
                <div className="p-20 text-center animate-pulse text-rose-200 font-serif italic text-xl">
                  Accessing schedule...
                </div>
              ) : upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((apt) => (
                    <div
                      key={apt.id}
                      className="group flex items-center justify-between p-10 hover:bg-rose-50/30 rounded-[3rem] transition-all duration-500 cursor-pointer"
                    >
                      <div className="flex items-center gap-12">
                        <div className="text-center">
                          <p className="text-2xl font-light text-slate-800 tracking-tighter">
                            {format(parseISO(apt.scheduled_at), "hh:mm")}
                          </p>
                          <p className="text-[9px] font-black text-rose-400 uppercase">
                            {format(parseISO(apt.scheduled_at), "aa")}
                          </p>
                        </div>
                        <div className="h-12 w-[1px] bg-slate-100 group-hover:bg-rose-200 transition-colors" />
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                            Patient Profile
                          </p>
                          <p className="text-xl font-bold text-slate-800 mb-1">
                            {apt.patients?.first_name} {apt.patients?.last_name}
                          </p>
                          <p className="text-lg font-serif italic text-rose-500 opacity-80 group-hover:opacity-100">
                            {apt.treatment_type}
                          </p>
                        </div>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all border border-rose-50">
                        <IconArrowRight />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-24 text-center text-slate-300 italic font-serif text-xl">
                  The afternoon is clear.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl" />
              <h2 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-10">
                Administrative
              </h2>
              <div className="space-y-4 relative z-10">
                <QuickActionLink
                  href="/dashboard/patients/new"
                  label="Add New Patient"
                />
                <QuickActionLink
                  href="/dashboard/appointments/new"
                  label="Schedule Session"
                />
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-[3.5rem] p-12 relative overflow-hidden">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-8">
                Clinical Vision
              </p>
              <p className="text-2xl font-light text-slate-700 leading-tight italic font-serif">
                "Precision is the{" "}
                <span className="text-rose-500">signature</span> of clinical
                excellence."
              </p>
              <div className="mt-10 pt-8 border-t border-rose-200/40">
                <p className="text-[9px] font-bold text-rose-300 uppercase tracking-widest">
                  Protocol V.2026.04
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- UI COMPONENTS --- */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "text-slate-800",
}: any) {
  return (
    <div className="group bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-rose-100 hover:-translate-y-1 transition-all duration-500">
      <div className="flex justify-between items-start mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
          {title}
        </h3>
        <div className="text-rose-400 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
      </div>
      <p className={`text-7xl font-light tracking-tighter ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-400 mt-6 font-black uppercase tracking-[0.2em]">
        {subtitle}
      </p>
    </div>
  );
}

function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-rose-500 hover:border-rose-500 transition-all group"
    >
      {label}
      <IconArrowRight size="16" />
    </Link>
  );
}

/* --- ICONS --- */

const IconFolder = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" />
  </svg>
);
const IconSparkle = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);
const IconChart = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const IconArrowRight = ({ size = "20" }: { size?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
