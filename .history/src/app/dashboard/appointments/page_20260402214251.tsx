// src/app/dashboard/appointments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAppointments() {
      // We fetch appointments and "join" the patients table to get names
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          scheduled_at,
          treatment_type,
          status,
          patients (
            first_name,
            last_name
          )
        `,
        )
        .order("scheduled_at", { ascending: true });

      if (error) {
        console.error("Error:", error.message);
      } else {
        setAppointments(data || []);
      }
      setLoading(false);
    }
    fetchAppointments();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-light text-gray-800 tracking-tight">
              Clinical{" "}
              <span className="font-serif italic text-rose-500">Schedule</span>
            </h1>
            <p className="text-gray-400 mt-2 font-light italic">
              Managing today's aesthetic transformations.
            </p>
          </div>

          <Link
            href="/dashboard/appointments/new"
            className="px-8 py-3 bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95 text-center"
          >
            + Book Treatment
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-rose-300 font-serif italic text-xl">
              Reviewing the calendar...
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border border-rose-100 rounded-[3rem] p-20 text-center">
            <p className="text-gray-400 font-light text-lg">
              No treatments scheduled for today.
            </p>
            <Link
              href="/dashboard/appointments/new"
              className="text-rose-500 font-bold text-sm uppercase tracking-widest mt-4 block hover:underline"
            >
              Schedule your first appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
              const appointmentDate = new Date(apt.scheduled_at);
              return (
                <div
                  key={apt.id}
                  className="group bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 border border-rose-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-rose-100 transition-all"
                >
                  {/* Time Slot */}
                  <div className="flex flex-col items-center justify-center border-r border-rose-50 pr-8 min-w-[120px]">
                    <p className="text-2xl font-light text-gray-800">
                      {appointmentDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">
                      {appointmentDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Patient & Treatment */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                      {apt.patients?.first_name} {apt.patients?.last_name}
                    </h3>
                    <p className="text-lg font-serif italic text-rose-500 mt-1">
                      {apt.treatment_type}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-6">
                    <span className="px-4 py-1.5 bg-rose-50 text-[10px] font-bold uppercase tracking-widest text-rose-400 rounded-full border border-rose-100">
                      {apt.status}
                    </span>
                    <button className="text-gray-300 hover:text-rose-500 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
