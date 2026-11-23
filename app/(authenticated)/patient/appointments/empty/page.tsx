import { redirect } from "next/navigation";

export default function EmptyAppointmentsPage() {
  redirect("/patient/appointments");
}
