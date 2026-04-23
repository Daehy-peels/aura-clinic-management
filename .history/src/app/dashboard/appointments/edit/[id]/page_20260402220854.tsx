// src/app/dashboard/appointments/edit/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditAppointmentPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    treatment_type: '',
    scheduled_at: '',
    status: '',
    notes: ''
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchAppointment() {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        // Convert the UTC string to a format compatible with datetime-local input
        const date = new Date(data.scheduled_at);
        const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        
        setFormData({
          treatment_type: data.treatment_type,
          scheduled_at: formattedDate,
          status: data.status,
          notes: data.notes || ''
        });
      }
      setLoading(false);
    }
    fetchAppointment();
  }, [id, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('appointments')
      .update({
        treatment_type: formData.treatment_type,
        status: formData.status,
        notes: formData.notes,
        // Convert back to ISO for Supabase storage
        scheduled_at: new Date(formData.scheduled_at).toISOString()
      })
      .eq('id', id);

    if (error) {
      alert(error.message);
      setSaving(false);
    } else {
      router.push('/dashboard/appointments');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif italic text-rose-400">
      Retrieving appointment details...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10">
          <Link href="/dashboard/appointments" className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400 hover:text-rose-600 transition-colors">
            ← Return to Schedule
          </Link>
          <h1 className="text-4xl font-light text-gray-800 mt-4 tracking-tight">
            Edit <span className="font-serif italic text-rose-500">Treatment Details</span>
          </h1>
          <p className="text-gray-400 mt-2 font-light italic">Update the status or timing for this session.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          
          {/* Main Configuration Card */}
          <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(255,192,203,0.1)] border border-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Treatment Type */}
              <div className="group">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Treatment Type</label>
                <input 
                  type="text" 
                  value={formData.treatment_type}
                  required
                  className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-3 text-gray-700 transition-all"
                  onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                />
              </div>

              {/* Status Picker */}
              <div className="group">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Current Status</label>
                <select 
                  value={formData.status}
                  className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-3 text-gray-700 cursor-pointer"
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date & Time */}
              <div className="group md:col-span-2">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Reschedule Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={formData.scheduled_at}
                  required
                  className="w-full mt-2 bg-transparent border-b border-gray-200 focus:border-rose-400 outline-none py-3 text-gray-700"
                  onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(255,192,203,0.05)] border border-white">
            <h2 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1 mb-4">Post-Treatment / Clinical Notes</h2>
            <textarea 
              rows={4}
              value={formData.notes}
              placeholder="Add any observations or aftercare instructions..."
              className="w-full p-6 bg-rose-50/30 border border-rose-50 rounded-[2rem] focus:bg-white focus:ring-1 focus:ring-rose-200 outline-none transition-all text-gray-700 resize-none"
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-8 pt-4">
            <Link href="/dashboard/appointments" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
              Discard Changes
            </Link>
            <button 
              type="submit" 
              disabled={saving}
              className="px-12 py-4 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving Records...' : 'Update Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}