import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton, SkeletonRows } from "@/components/workspace/loading-skeleton";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { requireRole } from "@/lib/auth-guard";
import { getPatientPrescriptions } from "@/lib/services/prescription";

const issuedAt = new Intl.DateTimeFormat("en-LK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Colombo",
});

const prescriptionCardClassName = "rounded-xl border p-5";

function PrescriptionsSkeleton() {
  return (
    <LoadingSkeleton label="Loading prescriptions…">
      <div className="space-y-5">
        {[0, 1].map((card) => (
          <div key={card} className={`${prescriptionCardClassName} space-y-2`}>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-52 max-w-full" />
            <Skeleton className="h-4 w-36" />
            <SkeletonRows
              count={1}
              className="bg-carely-surface mt-3 rounded-md border-0 p-3"
            />
          </div>
        ))}
      </div>
    </LoadingSkeleton>
  );
}

async function PatientPrescriptions() {
  const { user } = await requireRole("patient");
  const items = await getPatientPrescriptions({ userId: user.id, role: user.role });
  if (!items.length) return <p>No prescriptions have been issued yet.</p>;

  return (
    <div className="space-y-5">
      {items.map((p) => (
        <section key={p.id} className={prescriptionCardClassName}>
          <h2 className="font-semibold">Prescription</h2>
          <p className="text-muted-foreground text-sm break-all">
            Prescription ID {p.id}
          </p>
          <p className="text-muted-foreground text-sm">
            Issued {issuedAt.format(new Date(p.createdAt))}
          </p>
          {p.items.map((i) => (
            <article key={i.id} className="bg-muted mt-3 rounded-md p-3">
              <p className="font-medium">
                {i.name}
                {i.strength && ` ${i.strength}`}
              </p>
              {i.medicineId === null && (
                <p className="text-muted-foreground text-sm">
                  Outside catalogue · Buy outside the hospital pharmacy
                </p>
              )}
              <p className="text-sm">
                {i.dosage} · {i.frequency} · {i.durationDays} days · Qty {i.quantity}
              </p>
              {i.instructions && <p className="text-sm">{i.instructions}</p>}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

export default function PatientPrescriptionsPage() {
  return (
    <>
      <PageTitle
        eyebrow="My medication"
        title="Prescriptions"
        description="Review prescriptions issued for your visits."
      />
      <Suspense fallback={<PrescriptionsSkeleton />}>
        <PatientPrescriptions />
      </Suspense>
    </>
  );
}
