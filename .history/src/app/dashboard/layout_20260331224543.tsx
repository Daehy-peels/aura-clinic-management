// src/app/dashboard/layout.tsx
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue-600 tracking-tight">
            Aura Clinic
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/patients"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
          >
            Patients
          </Link>
          <Link
            href="/dashboard/appointments"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
          >
            Appointments
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
