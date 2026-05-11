// src/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFF5F5] font-sans selection:bg-rose-100 overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[70%] h-[70%] bg-rose-100/30 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-rose-200/20 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-8 md:px-12 max-w-7xl mx-auto">
        <div className="text-2xl font-light tracking-tighter text-gray-800">
          Aura <span className="font-serif italic text-rose-500">Clinic</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-10 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          <Link
            href="#services"
            className="hover:text-rose-500 transition-colors"
          >
            Treatments
          </Link>
          <Link href="#about" className="hover:text-rose-500 transition-colors">
            Philosophy
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-white/50 rounded-full border border-rose-100 hover:bg-rose-50 transition-all text-rose-400"
          >
            Staff Portal
          </Link>
        </div>

        <Link
          href="/book"
          className="bg-rose-500 text-white px-7 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          Book Now
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-40 max-w-4xl mx-auto">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400 mb-6 block animate-fade-in">
          Premium Aesthetic Care
        </span>

        <h1 className="text-5xl md:text-8xl font-light text-gray-900 tracking-tighter leading-[0.9] mb-8">
          Wellness, <br />
          <span className="font-serif italic text-rose-500">Redefined.</span>
        </h1>

        <p className="max-w-xl text-gray-500 text-sm md:text-base leading-relaxed font-light mb-12">
          Experience a new standard of medical beauty. At Aura Clinic, we blend
          clinical excellence with a sanctuary of tranquility tailored just for
          you.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <Link
            href="/book"
            className="px-12 py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.25em] shadow-2xl shadow-gray-200 hover:bg-black transition-all"
          >
            Schedule Consultation
          </Link>
          <button className="px-12 py-5 bg-white border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-rose-50 transition-all">
            Explore Services
          </button>
        </div>
      </main>

      {/* Trust Bar */}
      <section className="relative z-10 border-t border-rose-100/50 bg-white/30 backdrop-blur-md py-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-2xl font-serif italic text-rose-500 mb-1">5.0</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
              Google Rating
            </p>
          </div>
          <div>
            <p className="text-2xl font-serif italic text-rose-500 mb-1">
              12k+
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
              Happy Patients
            </p>
          </div>
          <div>
            <p className="text-2xl font-serif italic text-rose-500 mb-1">
              Modern
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
              Technology
            </p>
          </div>
          <div>
            <p className="text-2xl font-serif italic text-rose-500 mb-1">
              Global
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
              Certifications
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
