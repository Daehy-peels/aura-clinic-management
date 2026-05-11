"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const SERVICES = [
  {
    id: "cons",
    name: "Skin Consultation",
    price: "$50",
    duration: "30 min",
    mins: 30,
  },
  {
    id: "fac",
    name: "Aura Signature Facial",
    price: "$120",
    duration: "60 min",
    mins: 60,
  },
  {
    id: "las",
    name: "Laser Rejuvenation",
    price: "$250",
    duration: "45 min",
    mins: 45,
  },
];

const TIME_SLOTS = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service: "",
    duration: 60,
    date: "",
    time: "",
    name: "",
    email: "",
  });

  const router = useRouter();
  const supabase = createClient();

  const handleComplete = async () => {
    setLoading(true);

    try {
      // 1. Convert 12h time to 24h for ISO string
      const [time, modifier] = formData.time.split(" ");
      let [hours, minutes] = time.split(":");
      if (modifier === "PM" && hours !== "12")
        hours = String(Number(hours) + 12);
      if (modifier === "AM" && hours === "12") hours = "00";

      const scheduledAt = new Date(
        `${formData.date}T${hours}:${minutes}:00`,
      ).toISOString();

      // 2. Insert into Supabase
      const { error } = await supabase.from("appointments").insert([
        {
          treatment_type: formData.service,
          scheduled_at: scheduledAt,
          status: "scheduled", // MUST match one of: scheduled, confirmed, completed, cancelled
          duration: formData.duration,
          notes: `Patient: ${formData.name} | Email: ${formData.email}`,
        },
      ]);

      if (error) throw error;

      alert(`Thank you, ${formData.name}! Your request has been sent.`);
      router.push("/");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] font-sans py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            href="/"
            className="text-xl font-light tracking-tighter text-gray-800"
          >
            Aura <span className="font-serif italic text-rose-500">Clinic</span>
          </Link>
          <h2 className="mt-6 text-3xl font-light text-gray-900 tracking-tight">
            Book your experience
          </h2>
          <div className="mt-6 flex justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? "bg-rose-500" : "bg-rose-100"}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(255,192,203,0.15)] border border-white">
          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                Select Treatment
              </h3>
              <div className="grid gap-4">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        service: s.name,
                        duration: s.mins,
                      });
                      setStep(2);
                    }}
                    className="flex items-center justify-between p-6 rounded-2xl border border-rose-50 bg-white hover:border-rose-200 hover:bg-rose-50/30 transition-all text-left group active:scale-[0.98]"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {s.duration} duration
                      </p>
                    </div>
                    <p className="text-rose-500 font-serif italic text-lg">
                      {s.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Select Date & Time */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                Choose Availability
              </h3>
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Select Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full p-4 bg-rose-50/50 border border-transparent rounded-xl focus:bg-white focus:border-rose-200 outline-none text-gray-900 transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Select Time
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      disabled={!formData.date}
                      onClick={() => {
                        setFormData({ ...formData, time: t });
                        setStep(3);
                      }}
                      className="py-3 rounded-xl border border-rose-50 bg-white hover:bg-rose-500 hover:text-white transition-all text-sm text-gray-600 disabled:opacity-30 active:scale-95"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold hover:text-rose-500 transition-colors"
              >
                ← Back to treatments
              </button>
            </div>
          )}

          {/* STEP 3: Personal Details */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                Finalize Booking
              </h3>

              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 mb-6">
                <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-1">
                  Summary
                </p>
                <p className="text-sm text-gray-700 font-medium">
                  {formData.service} on {formData.date} at {formData.time}
                </p>
              </div>

              <div className="space-y-4">
                <input
                  placeholder="Full Name"
                  className="w-full p-4 bg-rose-50/50 border border-transparent rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-rose-200 outline-none transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full p-4 bg-rose-50/50 border border-transparent rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-rose-200 outline-none transition-all"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <button
                onClick={handleComplete}
                disabled={loading || !formData.name || !formData.email}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Securing Appointment..." : "Confirm Appointment"}
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full text-[10px] uppercase tracking-widest text-gray-400 font-bold hover:text-rose-500 transition-colors"
              >
                ← Back to time selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
