// src/app/dashboard/patients/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  async function fetchPatients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setPatients(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPatients();
  }, [supabase]);

  // Real-time filtering logic
  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const email = p.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    name: string,
  ) => {
    e.stopPropagation(); // Prevents clicking the row from navigating
    const confirmed = window.confirm(
      `Permanently remove ${name} from clinical records?`,
    );
    if (!confirmed) return;

    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (!error) {
      setPatients(patients.filter((p) => p.id !== id));
    } else {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-light text-gray-800 tracking-tight">
              Patient{" "}
              <span className="font-serif italic text-rose-500">Directory</span>
            </h1>
            <p className="text-gray-400 font-light italic">
              Refining the search for clinical excellence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl focus:ring-4 focus:ring-rose-100 outline-none transition-all text-sm text-gray-600 shadow-sm group-hover:border-rose-300"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-4 top-3 text-rose-300 group-hover:text-rose-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <Link
              href="/dashboard/patients/new"
              className="w-full sm:w-auto px-8 py-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all active:scale-95 text-center"
            >
              + Register New
            </Link>
          </div>
        </div>

        {/* Directory Content */}
        {loading ? (
          <div className="flex justify-center py-20 animate-pulse text-rose-300 font-serif italic text-2xl">
            Consulting records...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border border-dashed border-rose-200 rounded-[3rem] p-24 text-center">
            <p className="text-gray-400 font-light italic text-lg">
              No clinical records found matching "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="text-rose-500 font-bold text-[10px] uppercase tracking-widest mt-4 hover:underline"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(255,192,203,0.05)] border border-white overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rose-50 bg-rose-50/20">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                    Patient Profile
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                    Digital Contact
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                    Enrollment Date
                  </th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() =>
                      router.push(`/dashboard/patients/${patient.id}`)
                    }
                    className="group cursor-pointer hover:bg-rose-50/40 transition-all"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-500 font-serif italic text-lg shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          {patient.first_name[0]}
                          {patient.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700 tracking-tight">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-[9px] text-rose-300 uppercase tracking-widest font-black mt-0.5">
                            REF-{patient.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-sm text-gray-500 font-light group-hover:text-gray-800 transition-colors">
                      {patient.email}
                    </td>
                    <td className="px-10 py-6 text-xs text-gray-400 font-medium">
                      {new Date(patient.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={(e) =>
                          handleDelete(
                            e,
                            patient.id,
                            `${patient.first_name} ${patient.last_name}`,
                          )
                        }
                        className="opacity-0 group-hover:opacity-100 p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
