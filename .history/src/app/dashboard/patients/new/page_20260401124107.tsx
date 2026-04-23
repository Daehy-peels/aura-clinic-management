// src/app/dashboard/patients/new/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewPatientPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    medical_history: ''
  });
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('patients')
      .insert([formData]);

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard/patients');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/patients" className="text-sm text-blue-600 hover:underline font-medium">
          ← Back to Directory
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">New Patient Intake</h1>
        <p className="text-gray-500">Enter the clinical and contact details for the new patient.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Personal Information */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input name="first_name" type="text" onChange={handleChange} required 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input name="last_name" type="text" onChange={handleChange} required 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input name="email" type="email" onChange={handleChange} required 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input name="phone" type="tel" onChange={handleChange} 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input name="date_of_birth" type="date" onChange={handleChange} required
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical History */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">Clinical History</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical History & Allergies</label>
            <textarea 
              name="medical_history" 
              rows={5} 
              onChange={handleChange}
              placeholder="List any known allergies, chronic conditions, or past aesthetic procedures..."
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/patients" className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}