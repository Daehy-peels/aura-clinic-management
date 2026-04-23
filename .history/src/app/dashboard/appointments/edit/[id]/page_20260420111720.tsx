// src/app/dashboard/appointments/edit/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, addMinutes } from 'date-fns';

const TREATMENTS: Record<string, number> = {
  "Aura Signature Facial": 60,
  "Aura Signature Facials": 60,
  "Hydra-Cleanse": 30,
  "Deep Tissue Massage": 90,
  "Consultation": 30
};

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
        .select(`id, scheduled_at, treatment_type, patients (first_name, last_name)`)
        .filter('scheduled_at', 'gte', `${selectedDate}T00:00:00`)
        .filter('scheduled_at', 'lte', `${selectedDate}T23:59:59`)
        .neq('id', id);
      setDayAppointments(data || []);
    }
    fetchDaySchedule();
  }, [selectedDate, id, supabase]);

  // LOGIC: Check if a slot is inside ANY other booking
  const getOccupant = (timeStr: string) => {
    const slotTime = new Date(`${selectedDate}T${timeStr}`);
    for (const apt of dayAppointments) {
      const start = new Date(apt.scheduled_at.slice(0, 19));
      const end = addMinutes(start, TREATMENTS[apt.treatment_type] || 30);
      if (slotTime >= start && slotTime < end) return apt;
    }
    return null;
  };

  // LOGIC: Check if a slot is part of the CURRENTLY SELECTED range for preview
  const isPartOfSelectedRange = (timeStr: string) => {
    if (!formData.scheduled_at) return false;
    const start = new Date(formData.scheduled_at);
    const duration = TREATMENTS[formData.treatment_type] || 30;
    const end = addMinutes(start, duration);
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
        status: formData.status,
        notes: formData.notes,
        scheduled_at: `${formData.scheduled_at}:00+00`
      })
      .eq('id', id);

    if (!error) router.push('/dashboard/appointments');
    else { alert(error.message); setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
        <p className="font-serif italic text-rose-400">Refining records...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-6 md:p-12 text-gray-800">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP NAVIGATION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link href="/dashboard/appointments" className="group text-[10px] font-black uppercase tracking-[0.3em] text-rose-300 hover:text-rose-600 transition-all flex items-center">
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
            </Link>
            <h1 className="text-5xl font-light mt-4 tracking-tighter text-slate-800">
              Edit <span className="font-serif italic text-rose-500">Appointment</span>
            </h1>
          </div>
          
          {/* PATIENT MINI CARD */}
          <div className="bg-white border border-rose-100 p-4 px-8 rounded-[2rem] shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-xs">
              {patientName.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Client</p>
              <p className="text-sm font-bold text-slate-700">{patientName}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: TREATMENT DATA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-8">
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Type</label>
                <input 
                  type="text" 
                  value={formData.treatment_type}
                  placeholder="e.g. Aura Signature Facial"
                  className="w-full p-4 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-rose-200 text-sm transition-all border-none"
                  onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['scheduled', 'completed', 'cancelled'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({...formData, status: s})}
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        formData.status === s 
                        ? "bg-slate-800 text-white" 
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Notes</label>
                <textarea 
                  rows={5}
                  value={formData.notes}
                  placeholder="Clinical observations..."
                  className="w-full p-5 rounded-[2rem] bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-rose-100 transition-all text-sm resize-none border-none shadow-inner"
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full py-6 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-rose-100 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50">
              {saving ? 'Synchronizing...' : 'Save Changes'}
            </button>
          </div>

          {/* RIGHT COLUMN: TIMELINE */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
              
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-light text-slate-800">Select <span className="italic font-serif text-rose-500">Availability</span></h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Duration: {TREATMENTS[formData.treatment_type] || 30} Minutes
                  </p>
                </div>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-rose-50 text-rose-500 text-xs font-black p-3 px-5 rounded-2xl outline-none border border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors" 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timeSlots.map((time) => {
                  const occupant = getOccupant(time);
                  const isOccupied = occupant !== null;
                  const isSelected = isPartOfSelectedRange(time);
                  const isStart = formData.scheduled_at === `${selectedDate}T${time}`;

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setFormData({ ...formData, scheduled_at: `${selectedDate}T${time}` })}
                      className={`relative py-6 rounded-[2rem] text-[10px] font-black tracking-widest transition-all overflow-hidden ${
                        isSelected 
                          ? "bg-rose-500 text-white shadow-lg z-10 scale-[1.02]" 
                          : isOccupied 
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed" 
                            : "bg-rose-50/50 text-rose-400 hover:bg-rose-500 hover:text-white"
                      }`}
                    >
                      <span className={isStart ? "underline decoration-white underline-offset-4" : ""}>
                        {time}
                      </span>
                      {isOccupied && (
                        <span className="block text-[7px] mt-1 uppercase opacity-60 truncate px-2">
                          {occupant.patients?.first_name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* LEGEND / FOOTER */}
              <div className="mt-10 pt-10 border-t border-slate-50 flex flex-wrap gap-6 justify-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" /> Selected Block
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-100" /> Occupied
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-50" /> Available
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}