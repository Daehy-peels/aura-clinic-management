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
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs & Header */}
        <div className="mb-8">
          <Link href="/dashboard/patients" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
            ← Back to Directory
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-3 tracking-tight">New Patient Intake</h1>
          <p className="text-gray-500 mt-1">Create a comprehensive clinical record for a new visitor.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">Personal Information</h2>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">First Name</label>
                <input name="first_name" type="text" onChange={handleChange} required placeholder="e.g. Jane"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                <input name="last_name" type="text" onChange={handleChange} required placeholder="e.g. Doe"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input name="email" type="email" onChange={handleChange} required placeholder="jane.doe@example.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                <input name="phone" type="tel" onChange={handleChange} placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400" />
              </div>

              <div className="space-y-1 md:col-span-1">
                <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
                <input name="date_of_birth" type="date" onChange={handleChange} required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* Section 2: Medical History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">Clinical Background</h2>
            </div>
            <div className="p-8">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Medical History & Allergies</label>
                <textarea 
                  name="medical_history" 
                  rows={4} 
                  onChange={handleChange}
                  placeholder="Describe any chronic conditions, allergies, or previous treatments..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-6 pt-4">
            <Link href="/dashboard/patients" className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">
              Discard Changes
            </Link>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-10 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}