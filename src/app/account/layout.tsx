"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/account", label: "Dashboard" },
    { href: "/book", label: "Book Appointment" },
  ];

  const initials = (() => {
    if (!userEmail) return "P";
    const match = userEmail.match(/^([a-zA-Z])/);
    return match ? match[1].toUpperCase() : "P";
  })();

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        router.replace("/portal");
        return;
      }

      setUserEmail(data.user.email || "");

      const { data: staffRow, error: staffError } = await supabase
        .from("staff")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!staffError && staffRow) {
        router.replace("/dashboard");
        return;
      }

      setReady(true);
    }

    guard();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/portal");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/account") return pathname === "/account";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#fff8f7] text-[#211a1a]">
      <header className="sticky top-0 z-50 bg-white border-b border-[#d8c1c3]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
          >
            <span className="text-xl sm:text-2xl font-serif tracking-[0.3em] text-[#8f4953]">
              AURA
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  isActive(item.href)
                    ? "bg-[#8f4953] text-white shadow-sm shadow-[#8f4953]/20"
                    : "text-[#534344]/70 hover:text-[#8f4953] hover:bg-[#f9ebeb]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#8f4953] underline underline-offset-4 hover:text-[#b90538] transition-colors"
            >
              Sign Out
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="sm:hidden p-2 rounded-lg text-[#8f4953] hover:bg-[#f9ebeb] transition-colors"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#8f4953] flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-[#d8c1c3]/20 px-4 py-3">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  isActive(item.href)
                    ? "bg-[#8f4953] text-white shadow-sm shadow-[#8f4953]/20"
                    : "text-[#534344]/70 hover:text-[#8f4953] hover:bg-[#f9ebeb]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#8f4953] hover:text-[#b90538] transition-colors"
            >
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {ready ? (
        children
      ) : (
        <div className="min-h-[60vh] flex items-center justify-center px-6 text-center font-serif italic text-[#8f4953]/60 animate-pulse">
          Accessing your sanctuary…
        </div>
      )}
    </div>
  );
}
