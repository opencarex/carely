import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorAvailabilityForm } from "@/components/doctor/availability-form";
import { AvailabilitySkeleton } from "@/components/doctor/availability-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { requireRole } from "@/lib/auth-guard";
import type { DoctorAvailability } from "@/lib/db/schema/doctor-availability";
import {
  AvailabilityServiceError,
  getDoctorAvailability,
} from "@/lib/services/availability";

export const metadata: Metadata = { title: "Doctor Availability" };
export const instant = false;

async function DoctorAvailability() {
  const session = await requireRole("doctor");
  let availability: DoctorAvailability[] = [];
  let loadError = "";

  try {
    availability = await getDoctorAvailability(session.user.id);
  } catch (error) {
    if (error instanceof AvailabilityServiceError) {
      loadError = error.message;
    } else {
      console.error("Unable to load doctor availability:", error);
      loadError = "Unable to load your weekly schedule. Please try again.";
    }
  }

  return (
    <DoctorAvailabilityForm initialAvailability={availability} initialError={loadError} />
  );
}

export default function DoctorAvailabilityPage() {
  return (
    <>
      <PageTitle
        eyebrow="Clinical workspace"
        title="Availability"
        description="Manage your recurring clinic hours and patient capacity."
      />
      <Suspense fallback={<AvailabilitySkeleton />}>
        <DoctorAvailability />
      </Suspense>
    </>
  );
}
