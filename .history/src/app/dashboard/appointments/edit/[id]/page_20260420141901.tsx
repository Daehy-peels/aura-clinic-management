// src/app/dashboard/appointments/edit/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, addMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';

export default function EditAppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    treatment_type: '',
    duration: 30,
    scheduled_at: '', 
    notes: ''
  });

  // 1. GENERATE STATIC TIME SLOTS (09:00 - 17:30)
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
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, patients (first_name, last_name)`)
        .eq('id', id)
        .single();

      if (data) {
        setPatientName(`${data.patients?.first_name} ${data.patients?.last_name}`);
        // Ensure we handle the date string safely for the input
        const isoDate = data.scheduled_at; 
        setSelectedDate(isoDate.split('T')[0]);
        setFormData({
          treatment_type: data.treatment_type || '',
          duration: data.duration || 30,
          scheduled_at: isoDate.slice(0, 16), // Format for datetime-local input
          notes: data.notes || ''
        });
      }
      setLoading(false);
    }
    fetchInitialData();
  }, [id, supabase]);

  // 2. FETCH ALL APPOINTMENTS FOR THE SELECTED DAY TO MARK OCCUPIED SLOTS
  useEffect(() => {
    if (!selectedDate) return;
    
    async function fetchDaySchedule() {
      const dayStart = `${selectedDate}T00:00:00Z`;
      const dayEnd = `${selectedDate}T23:59:59Z`;

      const { data } = await supabase
        .from('appointments')
        .select(`id, scheduled_at, duration, patients (first_name)`)
        .filter('scheduled_at', 'gte', dayStart)
        .filter('scheduled_at', 'lte', dayEnd)
        .neq('id', id); // Exclude the current appointment being edited
      
      setDayAppointments(data || []);
    }
    fetchDaySchedule();
  }, [selectedDate, id, supabase]);

  // 3. LOGIC TO DETERMINE IF A SLOT IS OCCUPIED
  const getOccupant = (timeStr: string) => {
    const slotTime = parseISO(`${selectedDate}T${timeStr}:00Z`);
    
    for (const apt of dayAppointments) {
      const start = parseISO(apt.scheduled_at);
      const end = addMinutes(start, apt.duration || 30);
      
      if (slotTime >= start && slotTime < end) {
        return apt.patients?.first_name || 'Occupied';
      }
    }
    return null;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('appointments')
      .update({
        treatment_type: formData.treatment_type,
        duration: formData.duration,
        notes: formData.notes,
        scheduled_at: new Date(formData.scheduled_at).toISOString()
      })
      .eq('id', id);

    if (!error) router.push('/dashboard/appointments');
  };

  if (loading) return <div className="p-20 text-center font-serif italic text-rose-500">Loading Clinical Data...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFD] p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <Link href="/dashboard/appointments" className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500">← Back</Link>
            <h1 className="text-6xl font-light tracking-tighter mt-2 text-slate-800">Edit <span className="font-serif italic text-rose-500">Session</span></h1>
          </div>
          <div className="bg-white border border-rose-100 p-4 px-8 rounded-2xl shadow-sm">
             <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Editing Session for</p>
             <p className="text-lg font-bold text-slate-700">{patientName}</p>
          </div>
        </header>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Inputs */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Treatment</label>
                <input 
                  className="w-full p-4 rounded-xl bg-slate-50 border-none text-slate-700 focus:ring-1 focus:ring-rose-200"
                  value={formData.treatment_type}
                  onChange={e => setFormData({...formData, treatment_type: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Duration (Min)</label>
                <input 
                  type="number" step="30"
                  className="w-full p-4 rounded-xl bg-slate-50 border-none text-slate-700"
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <button className="w-full py-6 bg-rose-500 text-white font-black uppercase tracking-widest rounded-full shadow-lg hover:bg-rose-600 transition-all">Update Session</button>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-2xl font-light text-slate-800">Clinic <span className="italic font-serif text-rose-500">Timeline</span></h3>
               <input 
                type="date" 
                className="bg-rose-50 text-rose-500 text-xs font-bold p-3 px-5 rounded-xl border-none"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
               />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {timeSlots.map(time => {
                const occupant = getOccupant(time);
                const isSelected = formData.scheduled_at.includes(time);

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={!!occupant}
                    onClick={() => setFormData({...formData, scheduled_at: `${selectedDate}T${time}`})}
                    className={`p-6 rounded-[2rem] text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                      isSelected 
                        ? "bg-rose-500 text-white border-rose-500 shadow-md" 
                        : occupant 
                          ? "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed opacity-60" 
                          : "bg-rose-50/30 text-rose-400 border-rose-100 hover:bg-rose-100"
                    }`}
                  >
                    <span>{time}</span>
                    {occupant && <span className="text-[8px] uppercase tracking-tighter mt-1">{occupant}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}