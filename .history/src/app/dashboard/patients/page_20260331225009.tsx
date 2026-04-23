// src/app/dashboard/patients/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch patients from Supabase on load
  useEffect(() => {
    async function fetchPatients() {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patients:", error.message);
      } else {
        setPatients(data || []);
      }
      setLoading(false);
    }

    fetchPatients();
  }, [supabase]);

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Patient Directory</h1>
        <Link
          href="/dashboard/patients/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Register New Patient
        </Link>
      </div>

      {loading ? (
        <p>Loading patient records...</p>
      ) : patients.length === 0 ? (
        <div className="text-center p-20 bg-white border-2 border-dashed rounded-xl">
          <p className="text-gray-500">No patients registered yet.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Email</th>
                <th className="p-4 font-semibold text-gray-600">Phone</th>
                <th className="p-4 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    {patient.first_name} {patient.last_name}
                  </td>
                  <td className="p-4 text-gray-500">{patient.email}</td>
                  <td className="p-4 text-gray-500">{patient.phone}</td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:underline text-sm">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
