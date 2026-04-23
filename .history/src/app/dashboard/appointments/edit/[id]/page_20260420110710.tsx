// src/app/dashboard/appointments/edit/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, addMinutes, isBefore, isAfter, parseISO, isEqual } from 'date-fns';

// Clinical Duration Map
const TREATMENTS: Record<string, number> = {
  "Aura Signature Facial": 60,
  "Aura Signature Facials": 60,
  "Hydra-Cleanse": 30,
  "Deep Tissue Massage": 90,
  "Consultation": 30,
  "Yo Mama": 60 
};

export default function EditAppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Now storing FULL objects to allow for hover info
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

  // 1. Fetch Current Appointment
  useEffect(() => {
    async function fetchInitialData() {
      const { data } = await supabase
        .from('appointments')
        .select(`*, patients (first_name, last_name)`)
        .eq('id', id)
        .single();

      if (data) {
        const datePart = data.scheduled_at.slice(0, 10);
        setPatientName(`${data.patients?.first_name} ${data.patients?.last_name}`);
        setSelectedDate(datePart);
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

  // 2. Fetch all appointments for the selected day to check overlaps
  useEffect(() => {
    if (!selectedDate) return;
    async function fetchDaySchedule() {
      const { data } = await supabase
        .from('appointments')
        .select(`
          id, 
          scheduled_at, 
          treatment_type, 
          patients (first_name, last_name)
        `)
        .filter('scheduled_at', 'gte', `${selectedDate}T00:00:00`)
        .filter('scheduled_at', 'lte', `${selectedDate}T23:59:59`)
        .neq('id', id); // Important: Don't block yourself!

      setDayAppointments(data || []);
    }
    fetchDaySchedule();
  }, [selectedDate, id, supabase]);

  // 3. LOGIC: Is this specific 30-min slot inside ANY existing booking?
  const getOccupantInfo = (timeStr: string) => {
    const slotTime = new Date(`${selectedDate}T${timeStr}`);
    
    for (const apt of dayAppointments) {
      const start = new Date(apt.scheduled_at.slice(0, 19));
      const duration = TREATMENTS[apt.treatment_type] || 30;
      const end = addMinutes(start, duration);

      // If the slot is between start and end (exclusive of end time)
      if (slotTime >= start && slotTime < end) {
        return `${apt.patients?.first_name} ${apt.patients?.last_name} (${apt.treatment_type})`;
      }
    }
    return null;
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

  if (loading) return <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center font-serif text-rose-400">Syncing Clinical Data...</div>;

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12 text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <Link href="/dashboard/appointments" className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors">← Schedule</Link>
          <h1 className="text-5xl font-light mt-4 tracking-tight">Edit <span className="font-serif italic text-rose-500">Record</span></h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Patient: {patientName}</p>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INFO & NOTES (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Treatment Type</label>
                <input 
                  type="text" 
                  value={formData.treatment_type}
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-200 text-sm border-none"
                  onChange={(e) => setFormData({...formData, treatment_type: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Status</label>
                <select 
                  value={formData.status}
                  className="w-full p-4 rounded-xl bg-rose-50/50 outline-none text-sm appearance-none cursor-pointer"
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Clinical Notes</label>
                <textarea 
                  rows={6}
                  value={formData.notes}
                  placeholder="Enter session details or aftercare..."
                  className="w-full p-5 rounded-2xl bg-rose-50/30 border border-rose-50 outline-none focus:bg-white transition-all text-sm resize-none"
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full py-5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-rose-100 hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Update Appointment'}
            </button>
          </div>

          {/* RIGHT: TIMELINE (8 Cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Availability Timeline</h3>
                  <p className="text-[9px] text-gray-400 italic mt-1">Hover over "Taken" slots to see details</p>
                </div>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-rose-50 text-rose-500 text-xs font-bold p-3 rounded-xl outline-none border border-rose-100" 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {timeSlots.map((time) => {
                  const occupant = getOccupantInfo(time);
                  const isOccupied = occupant !== null;
                  const isSelected = formData.scheduled_at === `${selectedDate}T${time}`;

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isOccupied}
                      title={isOccupied ? `Occupied: ${occupant}` : 'Available'}
                      onClick={() => setFormData({ ...formData, scheduled_at: `${selectedDate}T${time}` })}
                      className={`group relative py-6 rounded-[1.8rem] text-[10px] font-black tracking-widest transition-all ${
                        isSelected 
                          ? "bg-rose-500 text-white shadow-lg scale-105 z-10" 
                          : isOccupied 
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed opacity-60" 
                            : "bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white"
                      }`}
                    >
                      {time}
                      {isOccupied && (
                        <span className="block text-[7px] mt-1 uppercase opacity-50">Taken</span>
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