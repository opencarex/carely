import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { QueueStatus } from "@/components/patient/queue-status";
import { StepGuide } from "@/components/patient/patient-shared";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { appContent } from "@/lib/mock/content";
export const metadata: Metadata = { title: "Live Queue" };
export default function PatientQueuePage() {
  return (
    <>
      <PageTitle
        eyebrow="Live status"
        title="Live queue"
        description="Check your appointment and queue status. This view refreshes every 30 seconds while open."
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
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <Card className="min-w-0 p-5 sm:p-6">
          <Suspense
            fallback={
              <p className="text-muted-foreground text-sm">Loading queue status...</p>
            }
          >
            <QueueStatus />
          </Suspense>
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
            <a
              className="text-primary mt-3 inline-block text-sm font-semibold"
              href={"tel:" + appContent.hospital.phone.replace(/[^+0-9]/g, "")}
            >
              {appContent.hospital.phone}
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}
