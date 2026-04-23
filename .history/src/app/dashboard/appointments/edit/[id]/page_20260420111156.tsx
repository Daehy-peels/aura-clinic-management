// src/app/dashboard/appointments/edit/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, addMinutes, parseISO, isBefore, isAfter } from 'date-fns';

const TREATMENTS: Record<string, number> = {
  "Aura Signature Facial": 60,
  "Hydra-Cleanse": 30,
  "Deep Tissue Massage": 90,
  "Consultation": 30,
};

export default function EditAppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    treatment_type: '',
    scheduled_at: '', 
    status: '',
    notes: ''
  });

  // Generate 30-min slots from 9 AM to 7 PM
  const timeSlots = useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => {
      const totalMinutes = 9 * 60 + i * 30;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });
  }, []);

  // 1. Fetch current appointment
  useEffect(() => {
    async function fetchInitialData() {
      const { data } = await supabase
        .from('appointments')
        .select(`*, patients (first_name, last_name)`)
        .eq('id', id)
        .single();

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

  // 2. Fetch all appointments for the day to check overlaps
  useEffect(() => {
    async function checkAvailability() {
      const { data } = await supabase
        .from('appointments')
        .select('scheduled_at, ended_at, treatment_type, patients(first_name, last_name)')
        .filter('scheduled_at', 'gte', `${selectedDate}T00:00:00`)
        .filter('scheduled_at', 'lte', `${selectedDate}T23:59:59`)
        .neq('id', id) // Exclude current appointment
        .neq('status', 'cancelled');

      setDayAppointments(data || []);
    }
    checkAvailability();
  }, [selectedDate, id, supabase]);

  // LOGIC: Check if a specific slot is occupied OR if a new booking starting here would overlap
  const getSlotDetails = (time: string) => {
    const checkTime = new Date(`${selectedDate}T${time}`).getTime();
    
    // Find if an existing appointment occupies this specific 30-min window
    return dayAppointments.find(apt => {
      const start = new Date(apt.scheduled_at).getTime();
      const end = new Date(apt.ended_at).getTime();
      return checkTime >= start && checkTime < end;
    });
  };

  const isSlotDisabled = (time: string) => {
    const duration = TREATMENTS[formData.treatment_type] || 30;
    const newStart = new Date(`${selectedDate}T${time}`).getTime();
    const newEnd = newStart + duration * 60000;

    // A slot is disabled if:
    // 1. It is currently occupied by someone else
    // 2. Or if starting here would cause the treatment to overlap another appointment
    return dayAppointments.some(apt => {
      const extStart = new Date(apt.scheduled_at).getTime();
      const extEnd = new Date(apt.ended_at).getTime();
      return newStart < extEnd && newEnd > extStart;
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const duration = TREATMENTS[formData.treatment_type] || 30;
    const ended_at = format(addMinutes(parseISO(formData.scheduled_at), duration), "yyyy-MM-dd'T'HH:mm:ss");

    const { error } = await supabase
      .from('appointments')
      .update({
        treatment_type: formData.treatment_type,
        status: formData.status,
        notes: formData.notes,
        scheduled_at: `${formData.scheduled_at}:00`,
        ended_at: ended_at
      })
      .eq('id', id);

    if (!error) {
        router.push('/dashboard/appointments');
        router.refresh();
    } else { 
        alert(error.message); 
        setSaving(false); 
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif text-rose-400 animate-pulse">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-6 md:p-12 text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <Link href="/dashboard/appointments" className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors">← Back to Schedule</Link>
          <h1 className="text-4xl font-light mt-2 tracking-tight">Modify <span className="font-serif italic text-rose-500">Session</span></h1>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-2 bg-white/50 w-fit px-3 py-1 rounded-full border border-white">Editing: {patientName}</p>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Configuration */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl shadow-rose-100/50 space-y-6">
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Treatment Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(TREATMENTS).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, treatment_type: t})}
                      className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                        formData.treatment_type === t 
                        ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200" 
                        : "bg-rose-50/30 text-rose-400 border-rose-100 hover:bg-rose-50"
                      }`}
                    >
                      {t}
                      <span className="block text-[9px] opacity-70 font-medium">{TREATMENTS[t]} Minutes</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Clinical Notes</label>
                <textarea 
                  value={formData.notes}
                  rows={4}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Enter session notes, progress, or skin concerns..."
                  className="w-full p-4 rounded-2xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 text-sm resize-none border border-rose-100/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Status</label>
                <select 
                  value={formData.status}
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none text-sm font-bold text-gray-600 appearance-none border border-rose-100/50"
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </section>

            <button 
                type="submit" 
                disabled={saving}
                className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Update Appointment"}
            </button>
          </div>

          {/* Right Column: Timeline */}
          <div className="lg:col-span-8">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl shadow-rose-100/50 h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Availability Timeline
                </h3>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="bg-rose-50 text-rose-500 text-xs font-bold px-4 py-2 rounded-full outline-none border border-rose-100" 
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {timeSlots.map((time) => {
                  const occupant = getSlotDetails(time);
                  const isSelected = formData.scheduled_at === `${selectedDate}T${time}`;
                  const disabled = isSlotDisabled(time);
                  
                  // Logic to show if this slot is "part of" the currently selected treatment range
                  const start = new Date(formData.scheduled_at).getTime();
                  const duration = TREATMENTS[formData.treatment_type] || 30;
                  const end = start + duration * 60000;
                  const currentSlotTime = new Date(`${selectedDate}T${time}`).getTime();
                  const isInSelectedRange = currentSlotTime >= start && currentSlotTime < end;

                  return (
                    <div key={time} className="group relative">
                      <button
                        type="button"
                        disabled={disabled && !isInSelectedRange}
                        onClick={() => setFormData({ ...formData, scheduled_at: `${selectedDate}T${time}` })}
                        className={`w-full py-6 rounded-2xl text-[11px] font-black tracking-widest transition-all border ${
                          isInSelectedRange 
                            ? "bg-rose-500 text-white border-rose-500 shadow-lg scale-105 z-10" 
                            : occupant 
                              ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed" 
                              : disabled
                                ? "bg-orange-50 text-orange-200 border-orange-100 cursor-not-allowed"
                                : "bg-white text-emerald-500 border-emerald-50 hover:border-emerald-300 hover:shadow-md"
                        }`}
                      >
                        {time}
                        {occupant && <span className="block text-[7px] mt-1 uppercase opacity-60">Reserved</span>}
                        {(!occupant && disabled && !isInSelectedRange) && <span className="block text-[7px] mt-1 uppercase text-orange-300">Overlap</span>}
                      </button>

                      {/* HOVER TOOLTIP */}
                      {occupant && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-white rounded-xl text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                          <p className="font-black text-rose-400 uppercase tracking-tighter mb-1 border-b border-white/10 pb-1">Occupied By</p>
                          <p className="font-serif italic text-sm">{occupant.patients?.first_name} {occupant.patients?.last_name}</p>
                          <p className="mt-1 text-gray-400 uppercase font-bold tracking-widest">{occupant.treatment_type}</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-top-gray-900" />
                        </div>
                      )}
                    </div>
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