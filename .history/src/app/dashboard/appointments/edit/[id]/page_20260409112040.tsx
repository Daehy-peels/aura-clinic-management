// src/app/dashboard/appointments/edit/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, addMinutes, isBefore, isAfter, parseISO } from 'date-fns';

// 1. TREATMENT CONFIGURATION
// Add your clinical services and their durations (in minutes) here
const TREATMENTS: Record<string, number> = {
  "Aura Signature Facial": 60,
  "Aura Signature Facials": 60, // Handling plural variant from your DB
  "Hydra-Cleanse": 30,
  "Deep Tissue Massage": 90,
  "Consultation": 30,
  "Yo Mama": 60 // Based on your test data
};

export default function EditAppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    treatment_type: '',
    scheduled_at: '', 
    status: '',
    notes: ''
  });

  // Generate 30-min slots from 9 AM to 6 PM
  const timeSlots = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const totalMinutes = 9 * 60 + i * 30;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });
  }, []);

  // 2. FETCH INITIAL DATA
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

  // 3. FETCH OCCUPIED SLOTS
  useEffect(() => {
    async function checkAvailability() {
      const { data } = await supabase
        .from('appointments')
        .select('scheduled_at')
        .filter('scheduled_at', 'gte', `${selectedDate}T00:00:00`)
        .filter('scheduled_at', 'lte', `${selectedDate}T23:59:59`)
        .neq('id', id); 

      if (data) {
        setOccupiedSlots(data.map(apt => apt.scheduled_at.slice(11, 16)));
      }
    }
    checkAvailability();
  }, [selectedDate, id, supabase]);

  // 4. LOGIC: CALCULATE BLOCKS NEEDED
  const getDuration = (type: string) => TREATMENTS[type] || 30;
  
  const isTimeInSelectedRange = (time: string) => {
    if (!formData.scheduled_at.includes('T')) return false;
    
    const startTimeStr = formData.scheduled_at.split('T')[1];
    const duration = getDuration(formData.treatment_type);
    
    // Create temporary date objects to compare times
    const start = new Date(`2000-01-01T${startTimeStr}`);
    const end = addMinutes(start, duration);
    const current = new Date(`2000-01-01T${time}`);

    return (current >= start && current < end);
  };

  const isTimeConflict = (startTime: string) => {
    const duration = getDuration(formData.treatment_type);
    const numBlocks = duration / 30;
    const startIndex = timeSlots.indexOf(startTime);

    for (let i = 0; i < numBlocks; i++) {
      if (occupiedSlots.includes(timeSlots[startIndex + i])) return true;
    }
    return false;
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

  if (loading) return <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif text-rose-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex justify-between items-end">
          <div>
            <Link href="/dashboard/appointments" className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500">← Schedule</Link>
            <h1 className="text-4xl font-light mt-2">Adjust <span className="font-serif italic text-rose-500">Duration</span></h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1">{patientName} • {getDuration(formData.treatment_type)} Mins</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Treatment Type</label>
                <select 
                  value={formData.treatment_type}
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 text-sm"
                  onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                >
                  {Object.keys(TREATMENTS).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Status</label>
                <select 
                  value={formData.status}
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none text-sm"
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Update Record</button>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Availability Timeline</h3>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-rose-50 text-rose-500 text-xs font-bold p-2 rounded-lg" />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map((time) => {
                  const isSelected = isTimeInSelectedRange(time);
                  const isOccupied = occupiedSlots.includes(time);
                  const hasConflict = isTimeConflict(time);

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setFormData({ ...formData, scheduled_at: `${selectedDate}T${time}` })}
                      className={`relative py-5 rounded-2xl text-[10px] font-black tracking-widest transition-all ${
                        isSelected 
                          ? "bg-rose-500 text-white shadow-lg scale-105 z-10" 
                          : isOccupied 
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed" 
                            : hasConflict
                              ? "bg-orange-50 text-orange-300 border border-orange-100" // Warning: Next blocks are taken
                              : "bg-rose-50 text-rose-400 hover:bg-rose-100"
                      }`}
                    >
                      {time}
                      {isOccupied && <span className="block text-[7px] opacity-40">Occupied</span>}
                      {(!isOccupied && hasConflict) && <span className="block text-[7px] text-orange-400">Overlap</span>}
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