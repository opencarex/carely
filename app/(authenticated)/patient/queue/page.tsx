import Image from "next/image";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { QueueStatus } from "@/components/patient/queue-status";
import { StepGuide } from "@/components/patient/patient-shared";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
import { getHospitalContact } from "@/lib/services/settings";
import { requireRole } from "@/lib/auth-guard";
import { getPatientAppointments } from "@/lib/services/patient-booking";
export const metadata: Metadata = { title: "Live Queue" };
async function PatientQueueContent() {
  const session = await requireRole("patient");
  const [appointments, hospital] = await Promise.all([
    getPatientAppointments(session.user.id),
    getHospitalContact(),
  ]);
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
      <Card className="min-w-0 p-5 sm:p-6">
        <QueueStatus appointment={appointments.find((item) => item.isUpcoming)} />
      </Card>
      <Card className="min-w-0 p-5 sm:p-6">
        <h2 className="font-semibold">What to do now</h2>
        <div className="mt-5 space-y-6">
          <StepGuide
            number="01"
            title="Go to reception"
            copy="Show your appointment reference or hospital patient ID to check in."
          />
          <StepGuide
            number="02"
            title="Check your status"
            copy="This view refreshes every 30 seconds. Use Refresh now to check again."
          />
          <StepGuide
            number="03"
            title="After check-in"
            copy="Stay nearby, watch your token, and follow reception instructions when called."
          />
        </div>
        <div className="bg-carely-surface mt-6 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Need assistance?</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Contact reception if you miss your turn or need help checking in.
          </p>
          {hospital.phone && (
            <a
              className="text-primary mt-3 inline-block text-sm font-semibold"
              href={"tel:" + hospital.phone.replace(/[^+0-9]/g, "")}
            >
              {hospital.phone}
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function PatientQueuePage() {
  return (
    <>
      <PageTitle
        eyebrow="Live status"
        title="Live queue"
        description="Review your next appointment and check in with reception when you arrive."
        action={
          <Image
            src="/images/live-queue.svg"
            alt="Carely queue assistant"
            width={74}
            height={100}
            priority
          />
        }
      />
      <Suspense fallback={<LoadingRows label="Loading your visit…" count={2} />}>
        <PatientQueueContent />
      </Suspense>
    </>
  );
}
