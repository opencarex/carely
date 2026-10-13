import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EmptyAppointments } from "@/components/patient/empty-appointments";
import { PageTitle } from "@/components/workspace/workspace-ui";
export const metadata: Metadata = { title: "No Appointments" };
// Standalone design preview. The appointment list uses the same empty state naturally.
export default function EmptyAppointmentsPage() {
  return (
    <>
      <PageTitle
        eyebrow="My care"
        title="Appointments"
        description="Your bookings will appear here."
      />
      <Card className="p-5 sm:p-8">
        <EmptyAppointments />
      </Card>
    </>
  );
}
