import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
import { AppointmentCheckIn } from "@/components/reception/appointment-check-in";

export const metadata: Metadata = { title: "Appointments & Check-in" };
export const instant = false;

export default function AppointmentCheckInPage() {
  return (
    <>
      <PageTitle
        eyebrow="Front desk"
        title="Appointments & Check-in"
        description="Find today's booking and check the patient in."
      />
      <Suspense fallback={<LoadingRows label="Loading appointments…" />}>
        <AppointmentCheckIn />
      </Suspense>
    </>
  );
}
