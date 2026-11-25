import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(255,192,203,0.2)] text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 mb-4">
          Link Expired
        </p>
        <h1 className="text-3xl font-light text-gray-800 tracking-tighter mb-4">
          We couldn&apos;t confirm your{" "}
          <span className="font-serif italic text-rose-500">email link</span>
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          The confirmation link is invalid or has expired. Request a new one by
          signing in again, or contact the clinic if this keeps happening.
        </p>
        <Link
          href="/login"
          className="inline-block bg-rose-500 text-white px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-rose-600 transition-all"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
