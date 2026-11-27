import { Suspense } from "react";
import Image from "next/image";
import { requireRole } from "@/lib/auth-guard";
import { getOwnPatientProfile } from "@/lib/services/patient";
import { PatientProfileSettings } from "@/components/patient/patient-profile-settings";
import { Card } from "@/components/ui/card";
import { LoadingFields } from "@/components/workspace/loading-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";

export const instant = false;

async function PatientProfile() {
  const session = await requireRole("patient");
  const profile = await getOwnPatientProfile({
    userId: session.user.id,
    role: session.user.role,
  });
  return <PatientProfileSettings initialProfile={profile} />;
}

export default function PatientProfilePage() {
  return (
    <>
      <PageTitle
        eyebrow="Account"
        title="Profile & settings"
        description="Keep your contact details accurate and manage your hospital account security."
        action={
          <Image
            src="/images/profile.svg"
            alt="Carely profile assistant"
            width={82}
            height={94}
            priority
          />
        }
      />
      <Suspense
        fallback={
          <Card className="p-5 sm:p-6">
            <LoadingFields label="Loading your profile…" className="sm:grid-cols-2" />
          </Card>
        }
      >
        <PatientProfile />
      </Suspense>
    </>
  );
}
