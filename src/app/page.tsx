"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F8] text-gray-900 font-sans selection:bg-rose-100 overflow-x-hidden perspective-1000">
      {/* 3D Floating Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-rose-100/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-rose-200/20 rounded-full blur-[100px] animate-float-slow" />
        <div className="absolute top-[40%] left-[20%] w-[100px] h-[100px] bg-rose-300/10 rounded-full blur-[40px] animate-float" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-10 md:px-16 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
        <div className="text-2xl font-light tracking-tighter text-gray-900 group cursor-default">
          <Link href="/" className="hover:text-rose-500 transition-colors">
            Aura{" "}
            <span className="font-serif italic text-rose-500 inline-block group-hover:rotate-6 transition-transform duration-500">
              Clinic
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-rose-300 hover:text-rose-500 transition-all hover:translate-y-[-1px]"
          >
            Staff Portal
          </Link>
          <Link
            href="/portal"
            className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-[#534344] hover:text-[#8f4953] transition-all hover:translate-y-[-1px]"
          >
            Client Portal
          </Link>
          <Link
            href="/book"
            className="bg-gray-900 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-rose-200/50 hover:bg-rose-600 hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
          >
            Book Experience
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 max-w-6xl mx-auto">
        {/* Floating Badge with 3D shadow */}
        <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/60 backdrop-blur-xl border border-white/80 rounded-full mb-12 shadow-[0_10px_30px_rgba(255,192,203,0.2)] animate-in fade-in slide-in-from-top-8 duration-1000">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-rose-500">
            The New Era of Beauty
          </span>
        </div>

        {/* 3D Text Effect */}
        <h1 className="text-6xl md:text-[130px] font-light text-gray-900 tracking-tighter leading-[0.8] mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          Wellness, <br />
          <span className="font-serif italic text-rose-500 drop-shadow-sm">
            Redefined.
          </span>
        </h1>

        <p className="max-w-xl text-gray-400 text-base md:text-lg leading-relaxed font-light mb-16 animate-in fade-in duration-1000 delay-300">
          Experience bespoke aesthetic journeys in a sanctuary designed for
          transformation and clinical excellence.
        </p>

        {/* Buttons with Perspective */}
        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <Link
            href="/book"
            className="group relative px-16 py-7 bg-rose-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-rose-300/40 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10">Start Your Journey</span>
          </Link>
          <Link
            href="/book"
            className="px-16 py-7 bg-white/40 backdrop-blur-md border border-white text-gray-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-105 transition-all shadow-sm"
          >
            Our Philosophy
          </Link>
        </div>
      </main>

      {/* 3D Trust Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mb-32 group">
        <div className="bg-white/30 backdrop-blur-3xl border border-white/50 rounded-[4rem] p-12 md:p-24 shadow-[0_40px_100px_rgba(0,0,0,0.02)] transform-gpu hover:rotate-x-1 hover:rotate-y-1 transition-transform duration-700">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12">
            {[
              { label: "Patient Care", val: "5.0", sub: "Google Rating" },
              { label: "Treatments", val: "25k+", sub: "Successful" },
              { label: "Specialists", val: "12", sub: "Board Certified" },
              { label: "Standard", val: "A+", sub: "Clinical Grade" },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center group/item cursor-default"
              >
                <div className="mb-4 relative">
                  <p className="text-4xl md:text-5xl font-serif italic text-rose-500 mb-2 group-hover/item:-translate-y-2 transition-transform duration-500">
                    {stat.val}
                  </p>
                  <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-rose-100 scale-x-0 group-hover/item:scale-x-100 transition-transform duration-500" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 mb-1">
                  {stat.label}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-rose-300">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
