"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { AppointmentStatus } from "@/types";
import { Toast } from "@/components/ui/toast";

type PatientRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  medical_history: string | null;
  created_at: string;
};

type AppointmentRow = {
  id: string;
  scheduled_at: string;
  duration: number | null;
  treatment_type: string;
  status: AppointmentStatus;
  notes: string | null;
};

type BookedSlot = { starts_at: string; duration_minutes: number };

type ProfileForm = {
  phone: string;
  date_of_birth: string;
  medical_history: string;
};

const RESCHEDULE_SLOTS = Array.from({ length: 20 }, (_, index) => {
  const total = 9 * 60 + index * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
});

const statusStyles: Record<AppointmentStatus, { bg: string; text: string }> = {
  scheduled: { bg: "bg-rose-50", text: "text-rose-600" },
  confirmed: { bg: "bg-sky-50", text: "text-sky-600" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-600" },
  cancelled: { bg: "bg-slate-100", text: "text-slate-400" },
};

function parseNaive(value: string) {
  const cleaned = String(value)
    .replace("Z", "")
    .split("+")[0]
    .replace(" ", "T");
  return new Date(cleaned);
}

function todayLocal() {
  return new Date().toLocaleDateString("en-CA");
}

export default function AccountPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [email, setEmail] = useState("");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [nowMs, setNowMs] = useState(0);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    description?: string;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileForm>({
    phone: "",
    date_of_birth: "",
    medical_history: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<AppointmentRow | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<BookedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AppointmentRow | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return;
    }
    setEmail(auth.user.email || "");

    const { error: claimError } = await supabase.rpc(
      "claim_my_patient_record",
    );
    if (claimError) console.warn("claim_my_patient_record:", claimError.message);

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (patientData) {
      const row = patientData as PatientRow;
      setPatient(row);
      setProfile({
        phone: row.phone || "",
        date_of_birth: row.date_of_birth || "",
        medical_history: row.medical_history || "",
      });

      const { data: apts } = await supabase
        .from("appointments")
        .select("id, scheduled_at, duration, treatment_type, status, notes")
        .eq("patient_id", row.id)
        .order("scheduled_at", { ascending: false });

      setAppointments((apts as AppointmentRow[]) || []);
    } else {
      setPatient(null);
      setAppointments([]);
    }

    setNowMs(Date.now());
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  useEffect(() => {
    if (!rescheduleTarget || !rescheduleDate) return;
    let cancelled = false;

    async function fetchSlots() {
      setSlotsLoading(true);
      const { data } = await supabase.rpc("get_booked_slots", {
        p_date: rescheduleDate,
      });
      if (cancelled) return;
      setRescheduleSlots((data as BookedSlot[]) || []);
      setSlotsLoading(false);
    }

    fetchSlots();
    return () => {
      cancelled = true;
    };
  }, [rescheduleTarget, rescheduleDate, supabase]);

  const upcoming = useMemo(() => {
    return appointments
      .filter(
        (apt) =>
          ["scheduled", "confirmed"].includes(apt.status) &&
          parseNaive(apt.scheduled_at).getTime() >= nowMs,
      )
      .sort(
        (a, b) =>
          parseNaive(a.scheduled_at).getTime() -
          parseNaive(b.scheduled_at).getTime(),
      );
  }, [appointments, nowMs]);

  const history = useMemo(() => {
    return appointments
      .filter(
        (apt) =>
          !(
            ["scheduled", "confirmed"].includes(apt.status) &&
            parseNaive(apt.scheduled_at).getTime() >= nowMs
          ),
      )
      .sort(
        (a, b) =>
          parseNaive(b.scheduled_at).getTime() -
          parseNaive(a.scheduled_at).getTime(),
      );
  }, [appointments, nowMs]);

  const nextVisit = upcoming[0];
  const visible = tab === "upcoming" ? upcoming : history;

  const showToast = (type: "success" | "error", title: string, description?: string) => {
    setToast({ type, title, description });
    setTimeout(() => setToast(null), 6000);
  };

  const cancelAppointment = (appointment: AppointmentRow) => {
    setConfirmTarget(appointment);
    setConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!confirmTarget) return;
    setConfirmOpen(false);
    setBusyId(confirmTarget.id);
    const { error } = await supabase.rpc("cancel_my_appointment", {
      p_appointment_id: confirmTarget.id,
    });

    if (error) {
      showToast(
        "error",
        "Cancellation failed",
        error.message.includes("not_cancellable")
          ? "This visit can no longer be cancelled online."
          : "We couldn't cancel that visit. Please call the clinic.",
      );
    } else {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === confirmTarget!.id ? { ...apt, status: "cancelled" } : apt,
        ),
      );
      showToast("success", "Visit cancelled", "Your appointment has been cancelled.");
      if (rescheduleTarget?.id === confirmTarget.id) setRescheduleTarget(null);
    }
    setBusyId(null);
    setConfirmTarget(null);
  };

  const renderConfirmDialog = () => {
    if (!confirmOpen || !confirmTarget) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        onClick={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      >
        <div
          className="bg-white rounded-[2rem] p-8 md:p-10 max-w-md w-full border border-[#d8c1c3]/30 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-serif text-[#211a1a] mb-2">
            Cancel Visit?
          </h3>
          <p className="text-[#534344]/70 font-light text-sm mb-6">
            Cancel {confirmTarget.treatment_type} on
            {format(parseNaive(confirmTarget.scheduled_at), "dd MMM")}. This
            cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setConfirmOpen(false);
                setConfirmTarget(null);
              }}
              className="flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest text-[#534344] border border-[#d8c1c3]/30 hover:bg-[#f9ebeb]/40 transition-colors"
            >
              Keep Visit
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={busyId === confirmTarget.id}
              className="flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest text-white bg-[#b90538] hover:bg-[#a61e3d] transition-colors disabled:opacity-60"
            >
              {busyId === confirmTarget.id ? "Updating..." : "Cancel Visit"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const openReschedule = (appointment: AppointmentRow) => {
    setRescheduleTarget(appointment);
    const day = format(parseNaive(appointment.scheduled_at), "yyyy-MM-dd");
    const today = todayLocal();
    setRescheduleDate(day < today ? today : day);
  };

  const applyReschedule = async (time: string) => {
    if (!rescheduleTarget) return;
    setBusyId(rescheduleTarget.id);
    const { error } = await supabase.rpc("reschedule_my_appointment", {
      p_appointment_id: rescheduleTarget.id,
      p_scheduled_at: `${rescheduleDate}T${time}:00`,
    });

    if (error) {
      showToast(
        "error",
        "Reschedule failed",
        error.message.includes("slot_taken")
          ? "That slot was just taken. Please choose another time."
          : "We couldn't reschedule that visit. Please try again.",
      );
    } else {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === rescheduleTarget.id
            ? { ...apt, scheduled_at: `${rescheduleDate}T${time}:00` }
            : apt,
        ),
      );
      showToast("success", "Visit rescheduled", "Your appointment has been moved.");
      setRescheduleTarget(null);
    }
    setBusyId(null);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSavingProfile(true);

    const { error } = await supabase
      .from("patients")
      .update({
        phone: profile.phone.trim() || null,
        date_of_birth: profile.date_of_birth || null,
        medical_history: profile.medical_history,
      })
      .eq("id", patient.id);

    setSavingProfile(false);
    if (error) {
      showToast("error", "Save failed", "We couldn't save your details. Please try again.");
    } else {
      showToast("success", "Details saved", "Your intake details have been updated.");
    }
  };

  const isRescheduleSlotBusy = (time: string) => {
    if (!rescheduleTarget) return false;
    const [hours, minutes] = time.split(":").map(Number);
    const start = hours * 60 + minutes;
    const end = start + (rescheduleTarget.duration || 30);
    return rescheduleSlots.some((slot) => {
      const slotStart = new Date(String(slot.starts_at).replace(" ", "T"));
      const startMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
      const slotEnd = startMinutes + (slot.duration_minutes || 30);
      return start < slotEnd && end > startMinutes;
    });
  };

  const statusConfig = statusStyles[nextVisit?.status || "scheduled"];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      {toast && (
        <div className="mb-6 mx-auto max-w-2xl">
          <Toast
            isOpen={true}
            type={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f9ebeb]/60 border border-[#d8c1c3]/30 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8f4953]/70 mb-4">
          Client Portal
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-[#211a1a] leading-tight mb-3">
          Welcome back,{patient ? ` ${patient.first_name}` : ""}.
        </h1>
        <p className="text-[#534344]/70 font-light max-w-xl">
          Review your visits, update your intake details, and manage upcoming
          reservations.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center font-serif italic text-[#8f4953]/60 animate-pulse">
          Retrieving your records...
        </div>
      ) : !patient ? (
        <div className="bg-white border border-[#d8c1c3]/30 rounded-[2rem] p-10 md:p-14 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#8f4953]/10 flex items-center justify-center text-2xl font-serif text-[#8f4953] mb-6">
            P
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-[#211a1a] mb-4">
            No clinical file linked yet
          </h2>
          <p className="text-[#534344]/70 font-light leading-relaxed mb-8 max-w-md mx-auto">
            Book a treatment using this same email address ({email}) and your
            patient file will appear here automatically.
          </p>
          <Link
            href="/book"
            className="inline-block bg-[#8f4953] text-white px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#7a3d4e] transition-all"
          >
            Book a Treatment
          </Link>
        </div>
      ) : (
        <div className="space-y-10 md:space-y-14">
          {/* Next Appointment Card */}
          {nextVisit && (
            <section className="relative rounded-[2rem] p-7 md:p-10 overflow-hidden border border-white ${statusConfig.bg} ${statusConfig.text}">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] mb-2">
                    Next Visit
                  </p>
                  <h2 className="text-3xl md:text-4xl font-serif mb-2">
                    {nextVisit.treatment_type}
                  </h2>
                  <p className="text-sm font-light opacity-90">
                    {format(parseNaive(nextVisit.scheduled_at), "EEEE, d MMMM yyyy")}{" "}
                    at {format(parseNaive(nextVisit.scheduled_at), "h:mm a")}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${statusConfig.bg === "bg-emerald-50" ? "border-emerald-200" : statusConfig.bg === "bg-sky-50" ? "border-sky-200" : "border-rose-200"} ${statusConfig.text}`}
                >
                  {nextVisit.status}
                </span>
              </div>
            </section>
          )}

          {/* Appointments List */}
          <section>
            <div className="flex items-center gap-6 border-b border-[#d8c1c3]/30 mb-8">
              {(["upcoming", "history"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`pb-4 text-[10px] font-bold uppercase tracking-[0.25em] transition-all relative ${
                    tab === key
                      ? "text-[#8f4953] border-b-2 border-[#8f4953]"
                      : "text-[#534344]/50 hover:text-[#534344] hover:border-transparent"
                  }`}
                >
                  {key === "upcoming"
                    ? `Upcoming (${upcoming.length})`
                    : `Past (${history.length})`}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {visible.length === 0 ? (
                <div className="bg-white border border-[#d8c1c3]/30 rounded-[2rem] p-10 md:p-14 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#f9ebeb]/40 flex items-center justify-center text-xl font-serif text-[#8f4953] mb-4">
                    {tab === "upcoming" ? "○" : "✓"}
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif text-[#211a1a] mb-2">
                    {tab === "upcoming"
                      ? "Your calendar is clear."
                      : "No past visits on file yet."}
                  </h3>
                  {tab === "upcoming" && (
                    <div className="mt-6">
                      <Link
                        href="/book"
                        className="inline-block border border-[#8f4953]/30 text-[#8f4953] px-8 py-3 rounded-xl text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-[#8f4953]/5 transition-all"
                      >
                        Book a Treatment
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                visible.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    isUpcoming={
                      tab === "upcoming" &&
                      rescheduleTarget?.id !== appointment.id
                    }
                    busy={busyId === appointment.id}
                    onReschedule={() => openReschedule(appointment)}
                    onCancel={() => cancelAppointment(appointment)}
                  />
                ))
              )}
            </div>
          </section>

          {/* Reschedule Interface */}
          {rescheduleTarget && (
            <section className="mt-8 md:mt-10">
              <div className="bg-white border border-[#d8c1c3]/30 rounded-[2rem] p-7 md:p-10">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#8f4953]/60 mb-1">
                      Reschedule
                    </p>
                    <h3 className="text-xl font-serif text-[#8f4953] mb-1">
                      {rescheduleTarget.treatment_type}
                    </h3>
                    <p className="text-sm text-[#534344]/70 font-light">
                      {format(parseNaive(rescheduleTarget.scheduled_at), "d MMMM yyyy")}
                    </p>
                  </div>
                  <button
                    onClick={() => setRescheduleTarget(null)}
                    className="text-[9px] font-bold uppercase tracking-widest text-[#534344]/60 hover:text-[#8f4953] transition-colors"
                  >
                    Close
                  </button>
                </div>

                <label className="text-[9px] font-bold uppercase tracking-widest text-[#534344]/60 block mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  min={todayLocal()}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full sm:w-auto bg-[#f9ebeb]/40 border border-[#d8c1c3]/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#8f4953] transition-all"
                />

                <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {RESCHEDULE_SLOTS.map((time) => {
                    const busy = isRescheduleSlotBusy(time);
                    return (
                      <button
                        key={time}
                        disabled={
                          busy ||
                          slotsLoading ||
                          busyId === rescheduleTarget.id
                        }
                        onClick={() => applyReschedule(time)}
                        className={`py-2.5 rounded-xl border text-[11px] font-bold tracking-widest transition-all ${
                          busy
                            ? "border-transparent bg-white/40 text-[#534344]/25 cursor-not-allowed"
                            : "bg-[#f9ebeb]/40 border-[#d8c1c3]/30 text-[#534344] hover:border-[#8f4953] hover:text-[#8f4953] focus:border-[#8f4953] focus:ring-1 focus:ring-[#8f4953]/20"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#534344]/40 mt-4">
                  {slotsLoading
                    ? "Checking availability..."
                    : "Reserved times are disabled."}
                </p>
              </div>
            </section>
          )}

          {/* Profile Section */}
          <section className="mt-8 md:mt-10">
            <div className="bg-white border border-[#d8c1c3]/30 rounded-[2rem] p-7 md:p-10">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif text-[#8f4953] mb-1">
                    My Profile
                  </h2>
                  <p className="text-[10px] text-[#534344]/60 font-light uppercase tracking-[0.2em]">
                    Intake &amp; Contact Details
                  </p>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#534344]/40">
                  Member since {format(new Date(patient.created_at), "MMMM yyyy")}
                </p>
              </div>

              <form onSubmit={saveProfile} className="space-y-5 md:space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Field label="Phone Number">
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      placeholder="+44 (7xxx) xxx-xxxx"
                      className="w-full bg-[#f9ebeb]/40 border border-[#d8c1c3]/30 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#8f4953] transition-all placeholder:text-[#534344]/30"
                    />
                  </Field>

                  <Field label="Date of Birth">
                    <input
                      type="date"
                      value={profile.date_of_birth}
                      onChange={(e) =>
                        setProfile({ ...profile, date_of_birth: e.target.value })
                      }
                      className="w-full bg-[#f9ebeb]/40 border border-[#d8c1c3]/30 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#8f4953] transition-all"
                    />
                  </Field>
                </div>

                <Field label="Medical Notes">
                  <textarea
                    rows={4}
                    value={profile.medical_history}
                    onChange={(e) =>
                      setProfile({ ...profile, medical_history: e.target.value })
                    }
                    placeholder="Allergies, medications, previous treatments..."
                    className="w-full bg-[#f9ebeb]/40 border border-[#d8c1c3]/30 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#8f4953] transition-all resize-none placeholder:text-[#534344]/30"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className={`w-full sm:w-auto bg-[#8f4953] text-white py-4 rounded-xl text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-[#7a3d4e] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${savingProfile ? "shadow-none" : "shadow-sm shadow-[#8f4953]/20"}`}
                >
                  {savingProfile ? "Saving..." : "Save Details"}
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
      {renderConfirmDialog()}
    </main>
  );
}

function AppointmentCard({
  appointment,
  isUpcoming,
  busy,
  onReschedule,
  onCancel,
}: {
  appointment: AppointmentRow;
  isUpcoming: boolean;
  busy: boolean;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const start = parseNaive(appointment.scheduled_at);
  const config = statusStyles[appointment.status];

  return (
    <div className="bg-white border border-[#d8c1c3]/30 rounded-[2rem] p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8f4953]/60">
            {format(start, "EEE, d MMM yyyy")}
          </p>
          <h3 className="text-xl md:text-2xl font-serif text-[#211a1a] mt-1">
            {appointment.treatment_type}
          </h3>
          <p className="text-sm text-[#534344]/70 font-light mt-1">
            {format(start, "h:mm a")} • {appointment.duration || 30} minutes
          </p>
          {appointment.notes && (
            <p className="mt-3 text-xs text-[#534344]/60 italic max-w-md">
              {appointment.notes}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${config.bg} ${config.text} border-emerald-100 border-sky-100 border-rose-100 border-slate-100`}
        >
          {appointment.status}
        </span>
      </div>

      {isUpcoming && (
        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-[#d8c1c3]/20">
          <button
            onClick={onReschedule}
            disabled={busy}
            className={`px-5 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-[0.25em] transition-all disabled:opacity-60 ${
              busy
                ? "border-transparent bg-white/40 text-[#534344]/25 cursor-not-allowed"
                : "border-[#8f4953]/30 text-[#8f4953] hover:bg-[#8f4953]/5 hover:border-[#8f4953]"
            }`}
          >
            Reschedule
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-[0.25em] transition-all disabled:opacity-60 ${
              busy
                ? "text-[#534344]/25 cursor-not-allowed"
                : "text-[#b90538] hover:bg-[#b90538]/5 hover:text-[#a61e3d]"
            }`}
          >
            {busy ? "Updating..." : "Cancel Visit"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-bold uppercase tracking-widest text-[#534344]/60 block">
        {label}
      </label>
      {children}
    </div>
  );
}
