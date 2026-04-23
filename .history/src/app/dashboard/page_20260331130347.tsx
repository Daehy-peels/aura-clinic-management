// src/app/dashboard/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clinic Overview</h1>
          <p className="text-gray-600 mt-2">Welcome back, Staff member.</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition border border-red-200"
        >
          Sign Out
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-wider">
            Today's Appointments
          </h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
