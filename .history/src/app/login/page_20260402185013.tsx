// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFF5F5] font-sans">
      {/* Soft Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-rose-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-rose-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-xl p-10 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(255,192,203,0.2)] border border-white">
          {/* Brand Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-light text-gray-800 tracking-tighter">
              Aura{" "}
              <span className="font-serif italic text-rose-500">Clinic</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mt-3">
              Staff Portal Access
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-rose-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-gray-700 placeholder:text-gray-300"
                placeholder="staff@auraclinic.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">
                Security Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-rose-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-gray-700 placeholder:text-gray-300"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-rose-200 hover:bg-rose-600 hover:shadow-rose-300 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Enter Workspace"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-10 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Private system. Restricted access.
            </p>
            <div className="mt-4 pt-6 border-t border-rose-50">
              <Link
                href="/signup"
                className="text-[10px] font-bold text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
              >
                Register New Staff Member
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
