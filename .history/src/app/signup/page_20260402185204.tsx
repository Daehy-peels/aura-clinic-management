// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      alert(
        "Registration request sent! Please check your email for confirmation.",
      );
      router.push("/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFF5F5] font-sans">
      {/* Background Decor (Matching Login) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[5%] -right-[5%] w-[45%] h-[45%] bg-rose-100/40 rounded-full blur-3xl" />
        <div className="absolute top-[20%] left-[5%] w-[30%] h-[30%] bg-rose-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-xl p-10 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(255,192,203,0.15)] border border-white">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-light text-gray-800 tracking-tighter">
              Staff{" "}
              <span className="font-serif italic text-rose-500">
                Onboarding
              </span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mt-3">
              Join the Aura Clinic Team
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">
                Corporate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-rose-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-gray-700 placeholder:text-gray-300"
                placeholder="name@auraclinic.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-rose-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-gray-700 placeholder:text-gray-300"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-rose-200 hover:bg-rose-600 hover:shadow-rose-300 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Confirm Registration"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <div className="pt-6 border-t border-rose-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Already have credentials?
              </p>
              <Link
                href="/login"
                className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
