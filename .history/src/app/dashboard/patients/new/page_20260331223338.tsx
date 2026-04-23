// src/app/dashboard/patients/new/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("patients") // This matches the table name we made in SQL
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
        },
      ]);

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      alert("Patient registered successfully!");
      router.push("/dashboard/patients");
    }
  };

  return (
    <div className="p-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Register New Patient
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-8 rounded-xl shadow-sm border"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          {loading ? "Saving..." : "Save Patient Record"}
        </button>
      </form>
    </div>
  );
}
