import { redirect } from "next/navigation";

// Client registration is handled by the combined /portal screen.
export default function RegisterPage() {
  redirect("/portal");
}
