import { Suspense } from "react";
import { AppointmentsList } from "@/components/patient/appointments-list";
import { AppointmentsSkeleton } from "@/components/patient/appointments-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { requireRole } from "@/lib/auth-guard";
import { getPatientAppointments } from "@/lib/services/patient-booking";
import { getHospitalContact } from "@/lib/services/settings";

async function PatientAppointments() {
  const session = await requireRole("patient");
  const [appointments, hospital] = await Promise.all([
    getPatientAppointments(session.user.id),
    getHospitalContact(),
  ]);
  return <AppointmentsList appointments={appointments} hospitalPhone={hospital.phone} />;
}

export default function PatientAppointmentsPage() {
  return (
    <>
      <PageTitle
        eyebrow="My care"
        title="Appointments"
        description="Review your bookings, appointment numbers, and history."
      />
      <Suspense fallback={<AppointmentsSkeleton />}>
        <PatientAppointments />
      </Suspense>
    </>
  );
}
