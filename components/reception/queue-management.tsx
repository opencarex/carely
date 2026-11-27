"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel, StatCards } from "@/components/workspace/workspace-ui";
import { LoadingFields, LoadingRows } from "@/components/workspace/loading-skeleton";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";

type Doctor = { id: string; name: string; specialtyName?: string | null };
type QueueEntry = {
  id: string;
  status: string;
  appointmentNo: number;
  checkedInAt: string;
  patient: { patientNo: string; fullName: string };
};
const colomboDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export function QueueManagement() {
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [doctorError, setDoctorError] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const date = useMemo(() => colomboDate(), []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/reception/doctors", { cache: "no-store", signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : Promise.reject()))
      .then(({ doctors: records }) => {
        if (controller.signal.aborted) return;
        setDoctors(records);
        setDoctorId((current) => current || records[0]?.id || "");
      })
      .catch(() => {
        if (!controller.signal.aborted) setDoctorError(true);
      });
    return () => controller.abort();
  }, []);
  const url = doctorId
    ? `/api/queue?doctorId=${encodeURIComponent(doctorId)}&date=${date}`
    : null;
  const { data, error, loading, refresh } = useVisiblePolling<{ entries: QueueEntry[] }>(
    url
  );
  const entries = data?.entries ?? [];
  return (
    <>
      {data && (
        <StatCards
          metrics={[
            { label: "Checked in", value: String(entries.length), tone: "blue" },
            {
              label: "Waiting",
              value: String(entries.filter((entry) => entry.status === "waiting").length),
              tone: "sky",
            },
          ]}
        />
      )}
      <Panel title="Live queue">
        <div className="mb-5 max-w-md">
          {doctorError ? (
            <p role="alert" className="text-destructive text-sm">
              Unable to load doctors.
            </p>
          ) : doctors === null ? (
            <LoadingFields label="Loading doctors…" count={1} />
          ) : doctors.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active doctors are available.
            </p>
          ) : (
            <>
              <label htmlFor="queue-doctor" className="mb-2 block text-xs font-semibold">
                Doctor
              </label>
              <Select
                value={doctorId}
                items={doctors.map((doctor) => ({
                  value: doctor.id,
                  label: doctor.name,
                }))}
                onValueChange={(value) => value && setDoctorId(value)}
              >
                <SelectTrigger id="queue-doctor">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                      {doctor.specialtyName ? ` · ${doctor.specialtyName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            Unable to load this queue.
          </p>
        )}
        {loading && <LoadingRows label="Loading the queue…" />}
        <div className="space-y-3">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <p className="font-semibold">
                  #{entry.appointmentNo} · {entry.patient.fullName}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {entry.patient.patientNo} · checked in{" "}
                  {new Date(entry.checkedInAt).toLocaleTimeString()}
                </p>
              </div>
              <Badge>{entry.status.replaceAll("_", " ")}</Badge>
            </article>
          ))}
          {data && !error && !entries.length && (
            <p className="text-muted-foreground text-sm">
              No checked-in patients for this doctor today.
            </p>
          )}
        </div>
        {doctorId && (
          <button
            type="button"
            className="text-primary mt-4 text-sm font-semibold"
            onClick={() => void refresh()}
          >
            Refresh now
          </button>
        )}
      </Panel>
    </>
  );
}
