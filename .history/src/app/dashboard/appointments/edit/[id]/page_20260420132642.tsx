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
    duration: 30,
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
          treatment_type: data.treatment_type || '',
          duration: data.duration || 30, // Fallback if column was just added
          scheduled_at: data.scheduled_at.slice(0, 16),
          status: data.status || 'scheduled',
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

  const getOccupant = (timeStr: string) => {
    const slotTime = new Date(`${selectedDate}T${timeStr}`);
    for (const apt of dayAppointments) {
      const start = new Date(apt.scheduled_at.slice(0, 19));
      const end = addMinutes(start, apt.duration || 30);
      if (slotTime >= start && slotTime < end) return apt;
    }
    return null;
  };

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
        duration: formData.duration,
        status: formData.status,
        notes: formData.notes,
        scheduled_at: `${formData.scheduled_at}:00+00`
      })
      .eq('id', id);

    if (!error) router.push('/dashboard/appointments');
    else { alert(error.message); setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#FFFDFD] flex items-center justify-center font-serif text-rose-500 italic">Syncing clinical files...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-6 md:p-12 text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-10">
          <Link href="/dashboard/appointments" className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 hover:text-rose-600 transition-all">
            ← Return to Schedule
          </Link>
          <div className="flex justify-between items-end mt-4">
            <h1 className="text-6xl font-light tracking-tighter">Edit <span className="font-serif italic text-rose-500">Session</span></h1>
            <div className="bg-white border border-rose-100 p-4 px-8 rounded-2xl shadow-sm hidden md:block">
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Editing Patient</p>
              <p className="text-sm font-bold text-slate-700">{patientName}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* INPUT FIELDS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Treatment Type</label>
                <input 
                  type="text" 
                  value={formData.treatment_type}
                  className="w-full p-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none text-sm transition-all text-slate-800 font-medium placeholder:text-slate-400"
                  onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duration (Mins)</label>
                <input 
                  type="number" 
                  step="30"
                  value={formData.duration}
                  className="w-full p-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none text-sm transition-all text-slate-800 font-medium"
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 30})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Session Notes</label>
                <textarea 
                  rows={5}
                  value={formData.notes}
                  className="w-full p-5 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none text-sm resize-none transition-all text-slate-700 placeholder:text-slate-400"
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full py-6 bg-rose-500 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all active:scale-95">
              {saving ? 'Processing...' : 'Update Appointment'}
            </button>
          </div>

          {/* TIMELINE SECTION */}
          <div className="lg:col-span-8">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-light text-slate-800">Clinic <span className="italic font-serif text-rose-500">Timeline</span></h3>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-rose-50 text-rose-500 text-[10px] font-black p-3 px-5 rounded-xl outline-none border border-rose-100" 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      className={`relative py-7 rounded-[2rem] text-[10px] font-black tracking-widest transition-all ${
                        isSelected 
                          ? "bg-rose-500 text-white shadow-lg z-10 scale-[1.03]" 
                          : isOccupied 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-90 shadow-inner" 
                            : "bg-rose-50/50 text-rose-400 hover:bg-rose-500 hover:text-white"
                      }`}
                    >
                      <span className="relative z-10">{time}</span>
                      {isOccupied && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 rounded-[2rem]">
                          <span className="text-[9px] text-slate-400">{time}</span>
                          <span className="text-[7px] text-slate-500 font-bold uppercase mt-1 truncate px-2 w-full">
                            {occupant.patients?.first_name}
                          </span>
                        </div>
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