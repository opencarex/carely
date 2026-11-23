import type { Metadata } from "next";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle, Panel } from "@/components/workspace/workspace-ui";
import { requireRole } from "@/lib/auth-guard";
import {
  doctorPatientHistoryParamsSchema,
  type PatientHistoryEncounter,
} from "@/lib/schemas/record-review";
import { getPatientHistory, listDoctorPatients } from "@/lib/services/record-review";
import { ServiceError } from "@/lib/services/service-error";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Patients" };
export const instant = false;

const visitDate = new Intl.DateTimeFormat("en-LK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Colombo",
});

function PatientVisit({ visit }: { visit: PatientHistoryEncounter }) {
  const recorded = visit.vitals;
  const facts = recorded
    ? [
        {
          label: "Blood pressure",
          value:
            recorded.bpSystolic != null && recorded.bpDiastolic != null
              ? `${recorded.bpSystolic}/${recorded.bpDiastolic} mmHg`
              : null,
        },
        {
          label: "Heart rate",
          value: recorded.heartRate != null ? `${recorded.heartRate} bpm` : null,
        },
        {
          label: "Oxygen saturation",
          value: recorded.spo2 != null ? `${recorded.spo2}%` : null,
        },
        {
          label: "Temperature",
          value: recorded.temperatureC != null ? `${recorded.temperatureC} °C` : null,
        },
      ].filter(({ value }) => value !== null)
    : [];

  return (
    <details className="bg-carely-surface rounded-xl p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        {visitDate.format(new Date(visit.startedAt))}
      </summary>
      <div className="mt-4 space-y-4">
        {recorded && facts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Recorded vitals</h3>
            <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
              {facts.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold">Clinical notes</h3>
          {visit.notes.length === 0 && (
            <p className="text-muted-foreground text-sm">No notes recorded.</p>
          )}
          {visit.notes.map((note) => (
            <div key={note.id} className="mt-2 space-y-1 text-sm">
              <time className="text-muted-foreground" dateTime={note.createdAt}>
                {visitDate.format(new Date(note.createdAt))}
              </time>
              <p className="whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-sm font-semibold">Prescriptions issued on this visit</h3>
          {visit.prescriptions.length === 0 && (
            <p className="text-muted-foreground text-sm">No prescriptions issued.</p>
          )}
          {visit.prescriptions.map((prescription) => (
            <div key={prescription.id} className="mt-2 text-sm">
              <p className="text-muted-foreground">
                {visitDate.format(new Date(prescription.createdAt))} ·{" "}
                {prescription.status}
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {prescription.items.map((item) => (
                  <li key={item.id}>
                    {[item.name, item.strength].filter(Boolean).join(" ")} · {item.dosage}{" "}
                    · {item.frequency}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

export default async function DoctorPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    patient?: string | string[];
  }>;
}) {
  const { user } = await requireRole("doctor");
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const pageNumber = typeof params.page === "string" ? Number(params.page) : 1;
  const page =
    Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= 10_000
      ? pageNumber
      : 1;
  const actor = { userId: user.id, role: user.role };
  const selection = doctorPatientHistoryParamsSchema.safeParse({
    patientId: params.patient,
  });
  const [list, history] = await Promise.all([
    listDoctorPatients({ actor, search, page }),
    selection.success
      ? getPatientHistory({ actor, patientId: selection.data.patientId }).catch(
          (error: unknown) => {
            if (error instanceof ServiceError && error.statusCode === 404) return null;
            throw error;
          }
        )
      : null,
  ]);

  function pageHref(nextPage: number, patientId?: string) {
    const query = new URLSearchParams({ q: search, page: String(nextPage) });
    if (patientId) query.set("patient", patientId);
    return `/doctor/patients?${query}`;
  }

  return (
    <>
      <PageTitle
        eyebrow="Clinical workspace"
        title="Patients"
        description="Review completed visits for patients in your care."
      />
      <form action="/doctor/patients" className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <Input
            id="doctor-patient-search"
            name="q"
            label="Find patient"
            showLabel
            placeholder="Patient name or number"
            defaultValue={search}
            maxLength={120}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Patients in your care" className="min-w-0">
          {list.patients.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No patients match this search.
            </p>
          )}
          <div className="space-y-2">
            {list.patients.map((patient) => (
              <Link
                key={patient.id}
                href={pageHref(page, patient.id)}
                aria-current={history?.patientId === patient.id ? "page" : undefined}
                className={cn(
                  "block rounded-xl p-3 text-sm",
                  history?.patientId === patient.id
                    ? "bg-secondary"
                    : "bg-carely-surface hover:bg-secondary/60"
                )}
              >
                <span className="block font-semibold">{patient.fullName}</span>
                <span className="text-muted-foreground">{patient.patientNo}</span>
              </Link>
            ))}
          </div>
          {(page > 1 || list.hasMore) && (
            <div className="mt-4 flex items-center justify-between gap-2">
              {page > 1 && (
                <Link
                  href={pageHref(page - 1)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Previous
                </Link>
              )}
              <span className="text-muted-foreground text-xs">Page {page}</span>
              {list.hasMore && (
                <Link
                  href={pageHref(page + 1)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </Panel>
        <Panel
          title={history?.patient.fullName ?? "Patient history"}
          className="min-w-0 lg:col-span-2"
        >
          {history ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Patient number {history.patient.patientNo}
              </p>
              {history.encounters.length === 0 && (
                <p className="text-sm">No completed visits recorded.</p>
              )}
              {history.encounters.map((visit) => (
                <PatientVisit key={visit.id} visit={visit} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {params.patient
                ? "This patient record is unavailable."
                : "Select a patient to review their visits."}
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
