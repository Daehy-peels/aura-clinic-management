"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const TREATMENTS = [
  {
    id: "quartz",
    name: "Aura Quartz Facial",
    price: 245,
    minutes: 90,
    duration: "90 min",
    type: "Signature",
    sub: "Clinical Detox",
  },
  {
    id: "peel",
    name: "Luminary Peel",
    price: 180,
    minutes: 60,
    duration: "60 min",
    type: "Rejuvenation",
    sub: "Advanced Glow",
  },
  {
    id: "silk",
    name: "Silk Draping Therapy",
    price: 320,
    minutes: 120,
    duration: "120 min",
    type: "Body Sculpt",
    sub: "Relaxation",
  },
  {
    id: "bespoke",
    name: "Concierge Bespoke",
    price: 0,
    minutes: 60,
    duration: "Varies",
    type: "Custom",
    sub: "Personalized Journey",
  },
];

const TIME_SLOTS = [
  "09:00 AM",
  "10:30 AM",
  "12:00 PM",
  "01:30 PM",
  "03:00 PM",
  "04:30 PM",
];

type BookedSlot = { starts_at: string; duration_minutes: number };

function todayLocal() {
  return new Date().toLocaleDateString("en-CA");
}

function slotLabelToMinutes(label: string) {
  const [time, meridiem] = label.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  return ((hours % 12) + (meridiem === "PM" ? 12 : 0)) * 60 + minutes;
}

function slotLabelTo24h(label: string) {
  const total = slotLabelToMinutes(label);
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function bookedWindow(slot: BookedSlot) {
  const start = new Date(String(slot.starts_at).replace(" ", "T"));
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  return {
    start: startMinutes,
    end: startMinutes + (slot.duration_minutes || 30),
  };
}

export default function BookingPage() {
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedID, setSelectedID] = useState("quartz");
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booked, setBooked] = useState<{
    treatment: string;
    date: string;
    time: string;
    name: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    date: todayLocal(),
    time: "12:00 PM",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const activeTreatment =
    TREATMENTS.find((t) => t.id === selectedID) || TREATMENTS[0];
  const supabase = createClient();
  const [accountRole, setAccountRole] = useState<"patient" | "staff" | null>(null);
  const [accountReady, setAccountReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkAccountRole() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setAccountReady(true);
        return;
      }
      const { data: staffRow } = await supabase
        .from("staff")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (cancelled) return;
      setAccountRole(staffRow ? "staff" : "patient");
      setAccountReady(true);
    }
    checkAccountRole();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function fetchAvailability() {
      if (!formData.date) return;
      setSlotsLoading(true);
      const { data, error } = await supabase.rpc("get_booked_slots", {
        p_date: formData.date,
      });
      if (cancelled) return;
      if (error) {
        console.warn("Availability unavailable:", error.message);
        setBookedSlots([]);
      } else {
        setBookedSlots((data as BookedSlot[]) || []);
      }
      setSlotsLoading(false);
    }
    fetchAvailability();
    return () => {
      cancelled = true;
    };
  }, [formData.date, supabase]);

  const isSlotBusy = (label: string) => {
    if (!formData.date) return false;
    const slotStart = slotLabelToMinutes(label);
    const slotEnd = slotStart + activeTreatment.minutes;
    return bookedSlots.some((slot) => {
      const window = bookedWindow(slot);
      return slotStart < window.end && slotEnd > window.start;
    });
  };

  const selectionBlocked = isSlotBusy(formData.time);

  const handleBooking = async () => {
    setBookingError(null);

    if (!formData.date) return setBookingError("Please choose a date.");
    if (!formData.name.trim())
      return setBookingError("Please share your full name.");
    if (!formData.email.includes("@"))
      return setBookingError("Please share a valid email address.");
    if (selectionBlocked)
      return setBookingError(
        "That time is already reserved. Please pick another slot.",
      );

    setLoading(true);

    const parts = formData.name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    const startsAt = `${formData.date}T${slotLabelTo24h(formData.time)}:00`;

    const { error } = await supabase.rpc("create_booking", {
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: formData.email.trim(),
      p_phone: formData.phone.trim() || null,
      p_treatment_type: activeTreatment.name,
      p_scheduled_at: startsAt,
      p_duration: activeTreatment.minutes,
      p_notes: formData.notes.trim()
        ? `Online booking: ${formData.notes.trim()}`
        : "Booked online",
    });

    if (error) {
      const message = error.message || "";
      if (message.includes("slot_taken")) {
        setBookingError(
          "That time was just taken. Please choose another slot.",
        );
      } else if (message.includes("create_booking")) {
        setBookingError(
          "Online booking is temporarily unavailable. Please call the clinic.",
        );
        console.error("create_booking RPC missing:", message);
      } else {
        setBookingError(message);
      }
      setLoading(false);
      return;
    }

    setBooked({
      treatment: activeTreatment.name,
      date: formData.date,
      time: formData.time,
      name: formData.name.trim(),
    });
    setLoading(false);
  };

  if (booked) {
    return (
      <div className="min-h-screen bg-[#fff8f7] text-[#211a1a] selection:bg-[#fda4af]/30">
        <PublicNav accountRole={accountRole} accountReady={accountReady} />
        <main className="relative z-10 pt-32 pb-20 max-w-2xl mx-auto px-6">
          <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[3rem] p-10 md:p-16 text-center shadow-2xl shadow-[#8f4953]/10">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#8f4953] text-white flex items-center justify-center text-2xl mb-8">
              ✓
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8f4953] mb-4">
              Reservation Confirmed
            </p>
            <h1 className="text-4xl font-serif text-[#8f4953] mb-6">
              We look forward to seeing you.
            </h1>
            <div className="space-y-2 text-[#534344] font-light mb-10">
              <p className="text-lg font-medium">{booked.name}</p>
              <p>
                {booked.treatment} • {booked.time}
              </p>
              <p>
                {new Date(`${booked.date}T12:00:00`).toLocaleDateString(
                  "en-GB",
                  { weekday: "long", day: "numeric", month: "long", year: "numeric" },
                )}
              </p>
              <p className="text-sm pt-4">
                Your booking is recorded under {formData.email}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="bg-[#8f4953] text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-90 transition-all"
              >
                Return Home
              </Link>
              <button
                onClick={() => {
                  setBooked(null);
                  setFormData({ ...formData, name: "", notes: "" });
                }}
                className="border border-[#8f4953]/30 text-[#8f4953] px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#8f4953]/5 transition-all"
              >
                Book Another
              </button>
            </div>
            <Link
              href="/portal"
              className="inline-block mt-8 text-[10px] font-bold uppercase tracking-[0.25em] text-[#8f4953] underline underline-offset-4 hover:text-[#b90538] transition-colors"
            >
              Manage my bookings &rarr;
            </Link>
            <p className="mt-4 text-[9px] text-[#534344]/50 font-light leading-relaxed">
              Register or sign in at the Client Portal using the same email
              address to view your visit history.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f7] text-[#211a1a] selection:bg-[#fda4af]/30">
      {/* Organic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#ffd9dc]/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] bg-[#eddfe0]/40 blur-[80px] rounded-[60%_40%_30%_70%/60%_30%_70%_40%]" />
      </div>

      <PublicNav accountRole={accountRole} accountReady={accountReady} />

      <main className="relative z-10 pt-32 pb-20 max-w-7xl mx-auto px-6 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <h1 className="text-6xl font-serif text-[#8f4953] leading-tight mb-4">
            Concierge Booking
          </h1>
          <p className="text-[#534344] font-light text-lg">
            Reserve your sanctuary. Our clinical specialists will tailor every
            aspect of your visit to Aura&apos;s serene standards.
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Form Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Step 1: Treatments */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-[1px] bg-[#8f4953]" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#8f4953]">
                  Select Treatment
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {TREATMENTS.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedID(t.id)}
                    className={`group relative cursor-pointer p-8 rounded-3xl border transition-all duration-500 ${
                      selectedID === t.id
                        ? "border-[#8f4953] bg-[#8f4953]/5 shadow-[0_20px_40px_rgba(143,73,83,0.05)]"
                        : "border-[#d8c1c3]/30 bg-white/30 hover:bg-white/60"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8f4953]">
                        {t.type}
                      </span>
                      {selectedID === t.id && (
                        <div className="w-2 h-2 rounded-full bg-[#8f4953] animate-pulse" />
                      )}
                    </div>
                    <h3 className="text-2xl font-serif mb-1">{t.name}</h3>
                    <p className="text-sm text-[#534344]/70 font-light">
                      {t.duration} • {t.sub}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Step 2: Schedule */}
            <section className="bg-white/30 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/40">
              <div className="flex items-center gap-3 mb-10">
                <span className="w-8 h-[1px] bg-[#8f4953]" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#8f4953]">
                  Preferred Schedule
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-16">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#534344] mb-6">
                    Select Date
                  </p>
                  <input
                    type="date"
                    value={formData.date}
                    min={todayLocal()}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-transparent border-b border-[#d8c1c3] py-4 focus:border-[#8f4953] outline-none transition-all font-light"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#534344] mb-6">
                    Select Time
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map((time) => {
                      const busy = isSlotBusy(time);
                      const selected = formData.time === time;
                      return (
                        <button
                          key={time}
                          disabled={busy || slotsLoading}
                          onClick={() =>
                            setFormData({ ...formData, time })
                          }
                          className={`py-3 rounded-xl border text-[11px] font-bold tracking-widest transition-all ${
                            busy
                              ? "border-[#d8c1c3]/30 text-[#534344]/30 line-through cursor-not-allowed"
                              : selected
                                ? "bg-[#8f4953] text-white border-[#8f4953] shadow-lg shadow-[#8f4953]/20"
                                : "border-[#d8c1c3]/30 hover:border-[#8f4953]"
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
                      : "Struck-through times are already reserved."}
                  </p>
                </div>
              </div>
            </section>

            {/* Step 3: Contact & Notes */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-[1px] bg-[#8f4953]" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#8f4953]">
                  Personal Concierge Note
                </h2>
              </div>
              <div className="relative space-y-4">
                <textarea
                  rows={4}
                  value={formData.notes}
                  placeholder="Describe your skin concerns, allergies, or special preferences..."
                  className="w-full bg-transparent border-b-2 border-[#d8c1c3]/30 focus:border-[#8f4953] outline-none py-6 transition-all resize-none font-light text-lg placeholder:text-[#534344]/30"
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
                <input
                  type="text"
                  value={formData.name}
                  placeholder="Your Full Name"
                  className="w-full bg-transparent border-b border-[#d8c1c3]/30 focus:border-[#8f4953] outline-none py-4 font-light"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <input
                  type="email"
                  value={formData.email}
                  placeholder="Email Address"
                  className="w-full bg-transparent border-b border-[#d8c1c3]/30 focus:border-[#8f4953] outline-none py-4 font-light"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <input
                  type="tel"
                  value={formData.phone}
                  placeholder="Phone Number (optional)"
                  className="w-full bg-transparent border-b border-[#d8c1c3]/30 focus:border-[#8f4953] outline-none py-4 font-light"
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </section>
          </div>

          {/* Sidebar Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
            <div className="bg-[#f9ebeb] rounded-[3rem] p-10 border border-white relative overflow-hidden shadow-2xl shadow-[#8f4953]/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8f4953]/5 rounded-bl-[100px] -z-0" />

              <h3 className="text-xl font-serif text-[#8f4953] mb-8 relative z-10">
                Reservation Summary
              </h3>

              <div className="space-y-8 relative z-10">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#8f4953] shadow-sm">
                    <span className="material-symbols-outlined">spa</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#534344]/50">
                      Treatment
                    </p>
                    <h4 className="font-bold text-sm uppercase">
                      {activeTreatment.name}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-[#d8c1c3]/30">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#534344]/50 mb-1">
                      Date
                    </p>
                    <p className="text-sm font-medium">
                      {formData.date || "Not Set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#534344]/50 mb-1">
                      Time
                    </p>
                    <p className="text-sm font-medium">{formData.time}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end pb-8">
                  <span className="font-serif text-lg">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-serif text-[#8f4953]">
                      {activeTreatment.price > 0
                        ? `£${activeTreatment.price}.00`
                        : "On request"}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-tighter text-[#534344]/40">
                      Included Surcharge
                    </p>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-4 rounded-2xl bg-white/70 border border-[#8f4953]/20 text-[11px] font-medium text-[#b90538] leading-relaxed">
                    {bookingError}
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={loading || selectionBlocked}
                  className="w-full bg-[#8f4953] text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl shadow-[#8f4953]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? "Securing Slot..." : "Confirm Appointment"}
                </button>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4 px-6 text-[#534344]/60">
              <span className="material-symbols-outlined text-sm">
                verified_user
              </span>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] leading-relaxed">
                Medical data encrypted via Clinical Standard ISO 27001
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PublicNav({
  accountRole,
  accountReady,
}: {
  accountRole: "patient" | "staff" | null;
  accountReady: boolean;
}) {
  const accountLink = accountReady
    ? accountRole === "staff"
      ? { href: "/dashboard", label: "Staff Dashboard" }
      : accountRole === "patient"
        ? { href: "/account", label: "My Account" }
        : { href: "/portal", label: "Client Portal" }
    : { href: "/portal", label: "Client Portal" };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-2xl border-b border-[#d8c1c3]/20 px-8 py-5">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-serif tracking-[0.3em] text-[#8f4953]"
        >
          AURA
        </Link>
        <div className="flex items-center gap-8">
          <Link
            href={accountLink.href}
            className="text-[10px] font-bold uppercase tracking-widest text-[#534344] hover:text-[#8f4953] transition-colors"
          >
            {accountLink.label}
          </Link>
          <Link
            href="/book"
            className="bg-[#8f4953] text-white px-7 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
          >
            Book Concierge
          </Link>
        </div>
      </div>
    </nav>
  );
}
