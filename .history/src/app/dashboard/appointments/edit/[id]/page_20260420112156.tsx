// src/app/dashboard/appointments/edit/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, addMinutes } from 'date-fns';

export default function EditAppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    treatment_type: '',
    duration: 30, // Default to 30 mins
    scheduled_at: '', 
    status: '',
    notes: ''
  });

  const timeSlots = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const totalMinutes = 9 * 60 + i * 30;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });
  }, []);

  useEffect(() => {
    async function fetchInitialData() {
      const { data } = await supabase
        .from('appointments')
        .select(`*, patients (first_name, last_name)`)
        .eq('id', id).single();

      if (data) {
        setPatientName(`${data.patients?.first_name} ${data.patients?.last_name}`);
        setSelectedDate(data.scheduled_at.slice(0, 10));
        setFormData({
          treatment_type: data.treatment_type,
          duration: data.duration || 30, // Use DB duration or fallback
          scheduled_at: data.scheduled_at.slice(0, 16),
          status: data.status,
          notes: data.notes || ''
        });
      }
      setLoading(false);
    }
    fetchInitialData();
  }, [id, supabase]);

  useEffect(() => {
    if (!selectedDate) return;
    async function fetchDaySchedule() {
      const { data } = await supabase
        .from('appointments')
        .select(`id, scheduled_at, duration, treatment_type, patients (first_name, last_name)`)
        .filter('scheduled_at', 'gte', `${selectedDate}T00:00:00`)
        .filter('scheduled_at', 'lte', `${selectedDate}T23:59:59`)
        .neq('id', id);
      setDayAppointments(data || []);
    }
    fetchDaySchedule();
  }, [selectedDate, id, supabase]);

  // LOGIC: Check if a slot is inside OTHER patient's booking
  const getOccupant = (timeStr: string) => {
    const slotTime = new Date(`${selectedDate}T${timeStr}`);
    for (const apt of dayAppointments) {
      const start = new Date(apt.scheduled_at.slice(0, 19));
      // Use the duration stored in the DB for that specific appointment
      const end = addMinutes(start, apt.duration || 30);
      if (slotTime >= start && slotTime < end) return apt;
    }
    return null;
  };

  // LOGIC: Highlight the range for the CURRENT appointment being edited
  const isPartOfSelectedRange = (timeStr: string) => {
    if (!formData.scheduled_at) return false;
    const start = new Date(formData.scheduled_at);
    const end = addMinutes(start, formData.duration);
    const current = new Date(`${selectedDate}T${timeStr}`);
    return current >= start && current < end;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('appointments')
      .update({
        treatment_type: formData.treatment_type,
        duration: formData.duration, // Saving the custom duration
        status: formData.status,
        notes: formData.notes,
        scheduled_at: `${formData.scheduled_at}:00+00`
      })
      .eq('id', id);

    if (!error) router.push('/dashboard/appointments');
    else { alert(error.message); setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif text-rose-400 italic">Accessing Clinical Records...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Link href="/dashboard/appointments" className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300 hover:text-rose-500 transition-all">← Back to Schedule</Link>
            <h1 className="text-5xl font-light mt-4 tracking-tighter">Edit <span className="font-serif italic text-rose-500">Session</span></h1>
          </div>
          <div className="bg-white border border-rose-100 p-4 px-8 rounded-full shadow-sm flex items-center gap-4">
             <div className="text-right">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Currently Editing</p>
                <p className="text-sm font-bold text-slate-700">{patientName}</p>
             </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: TREATMENT & NOTES */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Treatment Type</label>
                <input 
                  type="text" 
                  value={formData.treatment_type}
                  className="w-full p-4 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-rose-200 text-sm border-none"
                  onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Minutes)</label>
                <input 
                  type="number" 
                  step="30"
                  min="30"
                  value={formData.duration}
                  className="w-full p-4 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-rose-200 text-sm border-none"
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 30})}
                />
                <p className="text-[9px] text-slate-400 italic ml-1">*Blocks will update on the timeline below</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                <textarea 
                  rows={5}
                  value={formData.notes}
                  className="w-full p-5 rounded-[2rem] bg-slate-50 outline-none focus:bg-white transition-all text-sm resize-none border-none shadow-inner"
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full py-6 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all active:scale-95">
              {saving ? 'Saving...' : 'Update Appointment'}
            </button>
          </div>

          {/* RIGHT: TIMELINE */}
          <div className="lg:col-span-8">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-light">Daily <span className="italic font-serif text-rose-500">Timeline</span></h3>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-rose-50 text-rose-500 text-xs font-black p-3 px-5 rounded-2xl outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timeSlots.map((time) => {
                  const occupant = getOccupant(time);
                  const isOccupied = occupant !== null;
                  const isSelected = isPartOfSelectedRange(time);

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setFormData({ ...formData, scheduled_at: `${selectedDate}T${time}` })}
                      className={`py-6 rounded-[2rem] text-[10px] font-black tracking-widest transition-all ${
                        isSelected 
                          ? "bg-rose-500 text-white shadow-lg z-10 scale-[1.02]" 
                          : isOccupied 
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed" 
                            : "bg-rose-50/50 text-rose-400 hover:bg-rose-500 hover:text-white"
                      }`}
                    >
                      {time}
                      {isOccupied && (
                        <span className="block text-[7px] mt-1 uppercase opacity-60 truncate px-2 font-bold">
                          {occupant.patients?.first_name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}