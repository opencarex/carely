"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/workspace/workspace-ui";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
import type {
  DoctorConsultationEntry,
  DoctorConsultationQueueResponse,
} from "@/lib/schemas/consultation";

const labels = {
  waiting: "Awaiting nurse intake",
  intake_done: "Ready for consultation",
  with_doctor: "In consultation",
  completed: "Completed",
};

export function ConsultationQueue() {
  const { data, error, loading, refresh } =
    useVisiblePolling<DoctorConsultationQueueResponse>("/api/doctor/queue");
  const [pending, setPending] = useState<string | null>(null);
  const busy = useRef(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(
    null
  );

  async function act(entry: DoctorConsultationEntry, action: "open" | "complete") {
    if (busy.current) return;
    busy.current = true;
    setPending(entry.queueEntryId);
    setFeedback(null);
    try {
      const url =
        action === "open"
          ? `/api/doctor/queue/${encodeURIComponent(entry.queueEntryId)}/open`
          : `/api/encounters/${encodeURIComponent(entry.encounterId)}/complete`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update this visit.");
      setFeedback({
        error: false,
        message: action === "open" ? "Consultation opened." : "Consultation completed.",
      });
    } catch (cause) {
      setFeedback({
        error: true,
        message: cause instanceof Error ? cause.message : "Unable to update this visit.",
      });
    } finally {
      await refresh();
      setPending(null);
      busy.current = false;
    }
  }

  return (
    <Panel
      title="Today’s consultation queue"
      action={
        <Button
          variant="outline"
          onClick={() => void refresh()}
          disabled={pending !== null}
        >
          Refresh
        </Button>
      }
    >
      {feedback && (
        <p
          role={feedback.error ? "alert" : "status"}
          className={`mb-4 text-sm ${feedback.error ? "text-destructive" : "text-primary"}`}
        >
          {feedback.message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive mb-4 text-sm">
          Unable to refresh your queue. Refresh before taking an action.
        </p>
      )}
      {loading && <LoadingRows label="Loading your queue…" />}
      {!loading && !error && !data?.entries.length && (
        <p className="text-muted-foreground">
          No checked-in patients assigned to you today.
        </p>
      )}
      <div className="space-y-4">
        {data?.entries.map((entry) => (
          <article
            key={entry.queueEntryId}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
          >
            <div>
              <p className="font-semibold">
                #{entry.appointmentNo} · {entry.patient.fullName}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {entry.patient.patientNo}
              </p>
              <Badge className="mt-2">{labels[entry.status]}</Badge>
              {entry.status === "with_doctor" && !entry.hasClinicalNote && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Record a clinical note before completing this visit.
                </p>
              )}
            </div>
            {entry.status === "intake_done" && (
              <Button
                disabled={pending !== null || !!error}
                onClick={() => void act(entry, "open")}
              >
                {pending === entry.queueEntryId ? "Opening…" : "Open consultation"}
              </Button>
            )}
            {entry.status === "with_doctor" && (
              <Button
                disabled={pending !== null || !!error || !entry.hasClinicalNote}
                onClick={() => void act(entry, "complete")}
              >
                {pending === entry.queueEntryId ? "Completing…" : "Complete consultation"}
              </Button>
            )}
          </article>
        ))}
      </div>
    </Panel>
  );
}
