// src/app/dashboard/layout.tsx
"use client";

import Link from "next/link"; // Corrected import
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#FFF5F5]">
      {/* Sidebar */}
      <aside className="w-80 bg-white/70 backdrop-blur-xl border-r border-rose-100 hidden md:flex flex-col sticky top-0 h-screen z-50 shadow-[4px_0_24px_rgba(255,192,203,0.05)]">
        {/* Branding Area */}
        <div className="p-12">
          <Link href="/dashboard" className="group">
            <h2 className="text-3xl font-light text-gray-800 tracking-tighter transition-all group-hover:tracking-normal">
              Aura{" "}
              <span className="font-serif italic text-rose-500">Clinic</span>
            </h2>
            <div className="h-0.5 w-8 bg-rose-200 mt-2 rounded-full group-hover:w-16 transition-all duration-500"></div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-8 space-y-4">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300 mb-6 ml-4">
            Main Menu
          </div>

          <NavLink
            href="/dashboard"
            label="Overview"
            active={isActive("/dashboard")}
            icon={<DashboardIcon />}
          />
          <NavLink
            href="/dashboard/patients"
            label="Patient Directory"
            active={isActive("/dashboard/patients")}
            icon={<PatientsIcon />}
          />
          <NavLink
            href="/dashboard/appointments"
            label="Clinical Schedule"
            active={isActive("/dashboard/appointments")}
            icon={<CalendarIcon />}
          />
        </nav>

        {/* Footer Section / User Profile Preview */}
        <div className="p-8 border-t border-rose-50 space-y-4">
          <div className="px-4 py-3 bg-rose-50/50 rounded-[1.5rem] border border-rose-100/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold">
              ST
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-tight leading-none">
                Staff Member
              </p>
              <p className="text-[9px] text-rose-400 font-medium">
                Clinician Access
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-2xl transition-all group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

// NavLink Sub-component
function NavLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 ${
        active
          ? "bg-rose-500 text-white shadow-xl shadow-rose-200 translate-x-2"
          : "text-gray-400 hover:text-rose-500 hover:bg-white hover:shadow-sm"
      }`}
    >
      <span
        className={`${active ? "text-white" : "text-rose-300 group-hover:text-rose-500"} transition-colors`}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

// --- ICONS ---
function DashboardIcon() {
  return (
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
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function PatientsIcon() {
  return (
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
