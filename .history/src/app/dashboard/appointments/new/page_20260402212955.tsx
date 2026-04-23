// src/app/dashboard/appointments/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BookAppointmentPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    treatment_type: '',
    scheduled_at: '',
    notes: ''
  });

  const supabase = createClient();
  const router = useRouter();

  // Load patients for the dropdown
  useEffect(() => {
    async function fetchPatients() {
      const { data } = await supabase.from('patients').select('id, first_name, last_name');
      setPatients(data || []);
    }
    fetchPatients();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('appointments')
      .insert([formData]);

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard/appointments');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link href="/dashboard/appointments" className="text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors">
            ← Back to Schedule
          </Link>
          <h1 className="text-4xl font-light text-gray-800 mt-4 tracking-tight">
            Schedule <span className="font-serif italic text-rose-500">Treatment</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(255,192,203,0.1)] border border-white space-y-8">
          
          {/* Select Patient */}
          <div className="group">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Select Patient</label>
            <select 
              required
              className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-2 text-gray-700"
              onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
            >
              <option value="">Choose a patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>

          {/* Treatment Type */}
          <div className="group">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Treatment Type</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Aura Signature Facial"
              className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-2 text-gray-700 placeholder:text-gray-300"
              onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
            />
          </div>

          {/* Date & Time */}
          <div className="group">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Appointment Date & Time</label>
            <input 
              type="datetime-local" 
              required
              className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-2 text-gray-700"
              onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
            />
          </div>

          {/* Notes */}
          <div className="group">
            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Clinical Notes (Optional)</label>
            <textarea 
              rows={3}
              placeholder="Any specific prep or concerns..."
              className="w-full mt-4 p-4 bg-rose-50/30 border border-rose-50 rounded-2xl focus:bg-white focus:ring-1 focus:ring-rose-200 outline-none transition-all text-gray-700 resize-none"
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Confirm Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
}