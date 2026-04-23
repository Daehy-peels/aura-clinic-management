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
    <div className="min-h-screen bg-[#FFF5F5] p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 text-center md:text-left">
          <Link href="/dashboard/patients" className="text-xs font-bold uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors">
            ← Back to Directory
          </Link>
          <h1 className="text-4xl font-light text-gray-800 mt-4 tracking-tight">
            Patient <span className="font-serif italic text-rose-500">Registration</span>
          </h1>
          <p className="text-gray-400 mt-2 font-light">Enter details below to create a new clinical profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section: Personal Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100">
            <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-widest mb-8">Basic Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="group">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">First Name</label>
                <input name="first_name" type="text" onChange={handleChange} required 
                  className="w-full mt-2 px-0 py-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none transition-all placeholder:text-gray-300 text-gray-700" 
                  placeholder="Jane" />
              </div>

              <div className="group">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Last Name</label>
                <input name="last_name" type="text" onChange={handleChange} required 
                  className="w-full mt-2 px-0 py-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none transition-all placeholder:text-gray-300 text-gray-700" 
                  placeholder="Doe" />
              </div>

              <div className="group">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                <input name="email" type="email" onChange={handleChange} required 
                  className="w-full mt-2 px-0 py-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none transition-all placeholder:text-gray-300 text-gray-700" 
                  placeholder="jane@aura.com" />
              </div>

              <div className="group">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone Number</label>
                <input name="phone" type="tel" onChange={handleChange} 
                  className="w-full mt-2 px-0 py-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none transition-all placeholder:text-gray-300 text-gray-700" 
                  placeholder="+1 (555) 000-0000" />
              </div>

              <div className="group">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                <input name="date_of_birth" type="date" onChange={handleChange} required
                  className="w-full mt-2 px-0 py-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none transition-all text-gray-600" />
              </div>
            </div>
          </div>

          {/* Section: Medical History */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100">
            <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-widest mb-6">Clinical History</h2>
            <textarea 
              name="medical_history" 
              rows={4} 
              onChange={handleChange}
              placeholder="Allergies, past procedures, or skin concerns..."
              className="w-full mt-2 p-4 bg-rose-50/30 border border-rose-50 rounded-2xl focus:bg-white focus:ring-1 focus:ring-rose-200 focus:border-rose-300 outline-none transition-all placeholder:text-gray-300 text-gray-700 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-10 pt-4">
            <Link href="/dashboard/patients" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-12 py-4 bg-rose-500 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-rose-600 hover:shadow-xl hover:shadow-rose-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}