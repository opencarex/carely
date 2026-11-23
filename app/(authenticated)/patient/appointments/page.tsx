import { AppointmentsList } from "@/components/patient/appointments-list";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { requireRole } from "@/lib/auth-guard";
import { getPatientAppointments } from "@/lib/services/patient-booking";
import { getHospitalContact } from "@/lib/services/settings";

export default async function PatientAppointmentsPage() {
  const session = await requireRole("patient");
  const [appointments, hospital] = await Promise.all([
    getPatientAppointments(session.user.id),
    getHospitalContact(),
  ]);
  return (
    <>
      <PageTitle
        eyebrow="My care"
        title="Appointments"
        description="Review your bookings, appointment numbers, and history."
      />
      <AppointmentsList appointments={appointments} hospitalPhone={hospital.phone} />
    </>
  );
}
