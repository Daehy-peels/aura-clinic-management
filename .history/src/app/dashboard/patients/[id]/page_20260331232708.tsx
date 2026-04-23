// src/app/dashboard/patients/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PatientDetailsPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPatient() {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setPatient(data);
      }
      setLoading(false);
    }
    fetchPatient();
  }, [id, supabase]);

  if (loading) return <div className="p-10 text-gray-500">Loading patient profile...</div>;
  if (!patient) return <div className="p-10 text-red-500">Patient record not found.</div>;

  return (
    <div className="p-10">
      <div className="mb-8">
        <Link href="/dashboard/patients" className="text-blue-600 hover:underline text-sm font-medium">
          ← Back to Directory
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mt-4">
          {patient.first_name} {patient.last_name}
        </h1>
        <p className="text-gray-500 italic">Patient ID: {patient.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Contact Information</h2>
          <div className="space-y-3 text-sm">
            <p><span className="text-gray-500">Email:</span> {patient.email}</p>
            <p><span className="text-gray-500">Phone:</span> {patient.phone || 'N/A'}</p>
            <p><span className="text-gray-500">Date of Birth:</span> {patient.date_of_birth || 'Not recorded'}</p>
          </div>
        </div>

        {/* Medical History Card */}
        <div className="md:col-span-2 p-6 bg-white border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Clinical Notes & History</h2>
          <p className="text-gray-600 bg-gray-50 p-4 rounded-md min-h-[100px]">
            {patient.medical_history || "No medical history recorded for this patient yet."}
          </p>
        </div>
      </div>
    </div>
  );
}