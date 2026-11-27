import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingFields } from "@/components/workspace/loading-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { PatientRegistration } from "@/components/reception/patient-registration";

export const metadata: Metadata = { title: "Walk-in Registration" };
export const instant = false;

export default function PatientRegistrationPage() {
  return (
    <>
      <PageTitle
        eyebrow="Front desk"
        title="Walk-in Registration"
        description="Register a walk-in patient or find an existing record."
      />
      <Suspense
        fallback={
          <LoadingFields
            label="Loading patient registration…"
            className="sm:grid-cols-2"
          />
        }
      >
        <PatientRegistration />
      </Suspense>
    </>
  );
}
