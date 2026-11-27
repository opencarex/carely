import Image from "next/image";

import Link from "next/link";
import { Suspense } from "react";
import { LoadingDashboard } from "@/components/workspace/loading-skeleton";
import { formatPatientDate } from "@/lib/patient-appointments";
import { requireRole } from "@/lib/auth-guard";
import { getPatientAppointments } from "@/lib/services/patient-booking";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FactCard, StatusBadge } from "@/components/patient/patient-shared";
import { DataList, PageTitle, Panel } from "@/components/workspace/workspace-ui";
import { appContent } from "@/lib/config/content";
import { getPatientPrescriptionSummary } from "@/lib/services/prescription";
import { cn } from "@/lib/utils";

const prescriptionDate = new Intl.DateTimeFormat("en-LK", {
  dateStyle: "medium",
  timeZone: "Asia/Colombo",
});

async function PatientDashboard() {
  const session = await requireRole("patient");
  const [appointments, { latest, pendingCount }] = await Promise.all([
    getPatientAppointments(session.user.id),
    getPatientPrescriptionSummary({ userId: session.user.id, role: session.user.role }),
  ]);
  const upcoming = appointments.filter((item) => item.isUpcoming);
  const next = upcoming[0];
  return (
    <>
      <PageTitle
        eyebrow="Overview"
        title={`Welcome, ${session.user.name.split(" ")[0]}`}
        description="Manage your appointments, queue status, and prescriptions from one place."
        action={
          <Image
            src="/images/dashboard-health.svg"
            alt={`${appContent.brand.name} health assistant`}
            width={74}
            height={94}
            priority
          />
        }
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5 sm:p-6">
          {next ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <p className="text-primary text-xs font-semibold tracking-wider uppercase">
                  Next appointment
                </p>
                <StatusBadge tone="green">Confirmed</StatusBadge>
              </div>
              <h2 className="mt-3 text-xl font-bold">{next.doctorName}</h2>
              <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm">
                {next.specialtyName ?? "General clinic"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <FactCard label="Date" value={formatPatientDate(next.date)} />
                <FactCard label="Appointment number" value={`#${next.appointmentNo}`} />
                <FactCard label="Reference" value={next.id} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  className={buttonVariants({ size: "sm" })}
                  href="/patient/appointments"
                >
                  View appointment
                </Link>
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href="/patient/book"
                >
                  Find another doctor
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">No upcoming appointments</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Find a doctor and book an available clinic date.
              </p>
              <Link
                className={cn(buttonVariants({ size: "sm" }), "mt-4")}
                href="/patient/book"
              >
                Find a doctor
              </Link>
            </>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            Live queue
          </p>
          <h2 className="mt-3 text-xl font-bold">Check in at reception</h2>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed sm:text-sm">
            Keep your appointment number for your visit. Reception can help with check-in
            and queue updates.
          </p>
          <div className="mt-4">
            <StatusBadge tone="blue">Reception check-in</StatusBadge>
          </div>
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
            href="/patient/queue"
          >
            Open live queue
          </Link>
        </Card>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-3">
        {[
          {
            label: "Upcoming appointments",
            val: String(upcoming.length),
            status: next ? formatPatientDate(next.date) : "Book a visit",
          },
          {
            label: "Awaiting pharmacy dispensing",
            val: String(pendingCount),
            status: pendingCount ? "Issued" : "None",
          },
          {
            label: "Email status",
            val: session.user.emailVerified ? "Verified" : "Unverified",
            status: "Patient account",
          },
        ].map((item, index) => (
          <Card key={item.label} className="min-h-28 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {item.label}
              </p>
              <StatusBadge tone={index ? "green" : "blue"}>{item.status}</StatusBadge>
            </div>
            <p className="mt-2 text-2xl font-bold">{item.val}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <Panel title="Quick actions" className="p-5 sm:p-6">
          <DataList
            variant="action"
            items={[
              {
                title: "Find a doctor",
                subtitle: "Choose by specialty and availability",
                meta: "FD",
                status: "Start",
                href: "/patient/book",
              },
              {
                title: "My appointments",
                subtitle: "Review confirmed bookings",
                meta: "AP",
                status: "Open",
                href: "/patient/appointments",
              },
              {
                title: "Live queue",
                subtitle: "Check your current position",
                meta: "LQ",
                status: "Open",
                href: "/patient/queue",
              },
            ]}
          />
        </Panel>

        <Panel
          title="Latest prescription"
          action={
            latest && (
              <StatusBadge tone={latest.status === "dispensed" ? "green" : "blue"}>
                {latest.status === "dispensed" ? "Dispensed" : "Issued"}
              </StatusBadge>
            )
          }
          className="p-5 sm:p-6"
        >
          {latest ? (
            <>
              <p className="text-muted-foreground mb-4 text-sm">
                Issued by {latest.doctorName} ·{" "}
                {prescriptionDate.format(new Date(latest.createdAt))}
              </p>
              <DataList
                variant="action"
                items={latest.items.slice(0, 2).map((item) => ({
                  title: [item.name, item.strength].filter(Boolean).join(" "),
                  subtitle: `${item.dosage} · ${item.frequency}`,
                  meta: "RX",
                }))}
              />
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No prescriptions have been issued yet.
            </p>
          )}
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "sm", fullWidth: true }),
              "mt-5"
            )}
            href="/patient/prescriptions"
          >
            View full prescription
          </Link>
        </Panel>
      </div>
    </>
  );
}

export default function PatientPage() {
  return (
    <Suspense fallback={<LoadingDashboard label="Loading your dashboard…" />}>
      <PatientDashboard />
    </Suspense>
  );
}
