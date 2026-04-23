// src/app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-gray-800">Clinic Overview</h1>
      <p className="text-gray-600 mt-2">Welcome back, Staff member.</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-500">Today's Appointments</h3>
          <p className="text-2xl font-bold text-blue-600">0</p>
        </div>
      </div>
    </div>
  );
}