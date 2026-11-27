import { Suspense } from "react";
import { BookingBrowser } from "@/components/patient/booking-browser";
import { LoadingFields } from "@/components/workspace/loading-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { requireRole } from "@/lib/auth-guard";
import { listPatientVisitReasons } from "@/lib/services/visit-reason";

async function BookingContent() {
  await requireRole("patient");
  const reasons = await listPatientVisitReasons();
  return <BookingBrowser reasons={reasons} />;
}

export default function PatientBookPage() {
  return (
    <>
      <PageTitle
        eyebrow="Appointments"
        title="Find a doctor"
        description="Choose why you need care, then select a matched doctor and clinic date."
      />
      <Suspense
        fallback={
          <LoadingFields
            label="Loading booking options…"
            count={2}
            className="xl:grid-cols-2"
          />
        }
      >
        <BookingContent />
      </Suspense>
    </>
  );
}
