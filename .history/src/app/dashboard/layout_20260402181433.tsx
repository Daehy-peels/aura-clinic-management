// src/app/dashboard/layout.tsx
'use client'; // Added to allow logout logic

import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
    router.push('/login');
    router.refresh();
  };

  // Helper for active link styling
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex min-h-screen bg-[#FFF5F5]">
      {/* Sidebar */}
      <aside className="w-72 bg-white/50 backdrop-blur-md border-r border-rose-100 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-10">
          <h2 className="text-2xl font-light text-gray-800 tracking-tighter">
            Aura <span className="font-serif italic text-rose-500">Clinic</span>
          </h2>
        </div>

        <nav className="flex-1 px-6 space-y-3">
          <NavLink 
            href="/dashboard" 
            label="Overview" 
            active={isActive('/dashboard')} 
          />
          <NavLink 
            href="/dashboard/patients" 
            label="Patient Directory" 
            active={pathname.includes('/dashboard/patients')} 
          />
          <NavLink 
            href="/dashboard/appointments" 
            label="Appointments" 
            active={isActive('/dashboard/appointments')} 
          />
        </nav>

        {/* User / Logout Section */}
        <div className="p-6 border-t border-rose-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

// Small helper component for navigation links
function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={`block px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] rounded-2xl transition-all ${
        active 
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
          : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50/50'
      }`}
    >
      {label}
    </a>
  );
}