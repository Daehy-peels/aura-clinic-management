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
  const [patientName, setPatientName] = useState('');
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
        .select(`
          *,
          patients (first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (data) {
        // "Wall Clock" Logic: Slice the ISO string to prevent timezone shifts in the input
        const cleanDate = data.scheduled_at ? data.scheduled_at.slice(0, 16) : '';
        
        setPatientName(`${data.patients?.first_name} ${data.patients?.last_name}`);
        setFormData({
          treatment_type: data.treatment_type,
          scheduled_at: cleanDate,
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
        // Save back with a neutral offset to maintain wall-clock consistency
        scheduled_at: `${formData.scheduled_at}:00+00` 
      })
      .eq('id', id);

    if (error) {
      alert("Update failed: " + error.message);
      setSaving(false);
    } else {
      router.push('/dashboard/appointments');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF5F5] flex flex-col items-center justify-center space-y-4">
       <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
       <p className="font-serif italic text-rose-400 text-xl">Retrieving clinical records...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="mb-12 text-center md:text-left">
          <Link href="/dashboard/appointments" className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-rose-300 hover:text-rose-500 transition-all">
            <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span> Back to Schedule
          </Link>
          <h1 className="text-5xl font-light mt-6 tracking-tight">
            Edit <span className="font-serif italic text-rose-500">Session</span>
          </h1>
          <p className="text-gray-400 mt-2 font-light italic">
            Updating treatment for <span className="font-bold text-rose-400 not-italic uppercase tracking-widest text-[11px] ml-1">{patientName}</span>
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          
          {/* Main Form Card */}
          <div className="bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-sm border border-white space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Treatment Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Treatment Type</label>
                <input 
                  type="text" 
                  value={formData.treatment_type}
                  required
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 transition-all text-sm"
                  onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                />
              </div>

              {/* Status Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Session Status</label>
                <select 
                  value={formData.status}
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 transition-all text-sm cursor-pointer appearance-none"
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Reschedule Date & Time</label>
              <input 
                type="datetime-local" 
                value={formData.scheduled_at}
                required
                className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 transition-all text-sm"
                onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
              />
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Clinical Notes</label>
              <textarea 
                rows={4}
                value={formData.notes}
                placeholder="Update observations or aftercare instructions..."
                className="w-full p-6 bg-rose-50/30 border border-rose-50 rounded-[2rem] focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm resize-none"
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full md:w-auto px-16 py-5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Synchronizing...' : 'Save Changes'}
            </button>
            <Link 
              href="/dashboard/appointments" 
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-400 transition-colors"
            >
              Discard Edits
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}