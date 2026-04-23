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
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      const today = new Date().toISOString().split("T")[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      // 1. Fetch Patient Stats
      const { count: patientCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      const { count: newCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gt("created_at", lastWeek.toISOString());

      // 2. Fetch Today's Appointments Count
      const { count: aptCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("scheduled_at", `${today}T00:00:00Z`)
        .lte("scheduled_at", `${today}T23:59:59Z`);

      // 3. Fetch Next 3 Appointments for the "Agenda" preview
      const { data: upcomingData } = await supabase
        .from("appointments")
        .select(
          `
          id,
          treatment_type,
          scheduled_at,
          patients (first_name, last_name)
        `,
        )
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3);

      setStats({
        patients: patientCount || 0,
        todayAppointments: aptCount || 0,
        weeklyGrowth: newCount || 0,
      });
      setUpcoming(upcomingData || []);
      setLoading(false);
    }
    fetchDashboardData();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-light text-gray-800 tracking-tight">
              Aura{" "}
              <span className="font-serif italic text-rose-500">Overview</span>
            </h1>
            <p className="text-gray-400 mt-2 font-light italic">
              Welcome back. Here is the clinical pulse for today.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold text-rose-300 uppercase tracking-[0.3em]">
              Current Session
            </p>
            <p className="text-sm font-medium text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard
            title="Total Patients"
            value={stats.patients}
            subtitle="Active medical records"
          />
          <StatCard
            title="Today's Schedule"
            value={stats.todayAppointments}
            subtitle="Confirmed treatments"
          />
          <StatCard
            title="New Clients"
            value={`+${stats.weeklyGrowth}`}
            subtitle="Growth this week"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agenda Preview (Takes 2 columns) */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 border border-white shadow-[0_20px_50px_rgba(255,192,203,0.05)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em]">
                Next in Treatment
              </h2>
              <Link
                href="/dashboard/appointments"
                className="text-[10px] font-bold text-gray-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-rose-50/50 animate-pulse rounded-3xl"
                  />
                ))
              ) : upcoming.length > 0 ? (
                upcoming.map((apt) => (
                  <div
                    key={apt.id}
                    className="group flex items-center justify-between p-6 bg-rose-50/20 border border-rose-50/50 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-rose-100 transition-all cursor-default"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-light text-gray-800">
                          {new Date(apt.scheduled_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                              timeZone: "UTC",
                            },
                          )}
                        </p>
                      </div>
                      <div className="h-8 w-[1px] bg-rose-100"></div>
                      <div>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                          {apt.patients?.first_name} {apt.patients?.last_name}
                        </p>
                        <p className="text-sm font-serif italic text-rose-500">
                          {apt.treatment_type}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/appointments/edit/${apt.id}`}
                      className="opacity-0 group-hover:opacity-100 p-2 text-rose-300 hover:text-rose-500 transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center border border-dashed border-rose-100 rounded-[2rem]">
                  <p className="text-xs text-rose-300 italic font-serif">
                    No further treatments scheduled for today.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions (Takes 1 column) */}
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 border border-white shadow-[0_20px_50px_rgba(255,192,203,0.05)]">
              <h2 className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em] mb-8">
                Shortcuts
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <QuickActionLink
                  href="/dashboard/patients/new"
                  label="Register Patient"
                />
                <QuickActionLink
                  href="/dashboard/appointments/new"
                  label="Schedule Session"
                />
                <QuickActionLink href="/dashboard/patients" label="Directory" />
              </div>
            </div>

            {/* Aesthetic Branding Card */}
            <div className="bg-rose-500 rounded-[3rem] p-10 text-white shadow-xl shadow-rose-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mb-6">
                Staff Note
              </h2>
              <p className="text-xl font-light leading-relaxed relative z-10">
                Always ensure{" "}
                <span className="italic font-serif">consultation forms</span>{" "}
                are signed before Botox procedures.
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-10">
                Protocol v2.4
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-[0_15px_35px_rgba(255,192,203,0.05)] hover:shadow-rose-100 transition-all">
      <h3 className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em] mb-3">
        {title}
      </h3>
      <p className="text-5xl font-light text-gray-800 tracking-tighter">
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-widest">
        {subtitle}
      </p>
    </div>
  );
}

function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="w-full py-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-200 transition-all"
    >
      {label}
    </Link>
  );
}
