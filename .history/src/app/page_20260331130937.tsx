// src/app/page.tsx
import { redirect } from "next/navigation";

/**
 * The root page of Aura Aesthetic Clinic.
 * We redirect users immediately to the login flow.
 */
export default function Home() {
  redirect("/login");
}
