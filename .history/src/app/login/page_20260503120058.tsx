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

  // Helper to quickly fill dummy data for visitors
  const handleFillDemo = () => {
    setEmail("admin@aura.com");
    setPassword("Auraadmin123");
  };

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
    <div className="flex items-center justify-center min-h-screen bg-[#FFF5F5] font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[5%] -left-[10%] w-[60%] md:w-[40%] h-[40%] bg-rose-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-[5%] -right-[10%] w-[60%] md:w-[40%] h-[40%] bg-rose-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-4 sm:px-6 py-12">
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-[0_20px_50px_rgba(255,192,203,0.2)] border border-white">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-light text-gray-800 tracking-tighter">
              Aura{" "}
              <span className="font-serif italic text-rose-500">Clinic</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mt-3">
              Staff Portal Access
            </p>
          </div>

          <div className="mb-8 p-4 bg-rose-50/80 rounded-2xl border border-rose-100 text-center">
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2">
              Guest Access
            </p>
            <p className="text-xs text-gray-600 font-medium">
              Email: admin@aura.com
            </p>
            <p className="text-xs text-gray-600 font-medium">
              PW: Auraadmin123
            </p>
            <button
              onClick={handleFillDemo}
              type="button"
              className="mt-3 text-[10px] font-bold text-rose-500 underline underline-offset-4 hover:text-rose-700 transition-colors"
            >
              Auto-fill Demo Details
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // UPDATED: Added text-gray-900 and placeholder-gray-400 for better contrast
                className="w-full px-5 py-3.5 bg-rose-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm sm:text-base"
                placeholder="staff@auraclinic.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">
                Security Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-rose-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm sm:text-base"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Enter Workspace"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-rose-50 pt-6">
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
  );
}
