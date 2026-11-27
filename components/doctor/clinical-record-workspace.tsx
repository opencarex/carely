"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingFields, LoadingRows } from "@/components/workspace/loading-skeleton";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import type { DoctorConsultationQueueResponse } from "@/lib/schemas/consultation";
import type { ClinicalNotesResponse } from "@/lib/schemas/clinical-note";
import { PrescriptionForm } from "./prescription-form";

export function ClinicalRecordWorkspace() {
  const {
    data,
    loading: queueLoading,
    error: queueError,
    refresh,
  } = useVisiblePolling<DoctorConsultationQueueResponse>("/api/doctor/queue");
  const active = data?.entries.filter((entry) => entry.status === "with_doctor") ?? [];
  const [encounterId, setEncounterId] = useState("");
  const [content, setContent] = useState("");
  const [notesResult, setNotesResult] = useState<{
    encounterId: string;
    notes: ClinicalNotesResponse["notes"];
    error?: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [notesRequest, setNotesRequest] = useState(0);

  const selectedEncounterId = encounterId
    ? (active.find((entry) => entry.encounterId === encounterId)?.encounterId ?? "")
    : (active[0]?.encounterId ?? "");
  const selectedNotes =
    notesResult?.encounterId === selectedEncounterId ? notesResult : null;
  const notesLoading = Boolean(selectedEncounterId && !selectedNotes);
  useEffect(() => {
    if (!selectedEncounterId) return;
    const controller = new AbortController();
    void fetch(`/api/encounters/${encodeURIComponent(selectedEncounterId)}/notes`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as ClinicalNotesResponse & {
          error?: string;
        };
        if (!response.ok) throw new Error(result.error);
        if (!controller.signal.aborted)
          setNotesResult({ encounterId: selectedEncounterId, notes: result.notes });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setNotesResult({
            encounterId: selectedEncounterId,
            notes: [],
            error: error instanceof Error ? error.message : "Unable to load notes.",
          });
      });
    return () => controller.abort();
  }, [notesRequest, selectedEncounterId]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEncounterId || notesLoading || pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/encounters/${encodeURIComponent(selectedEncounterId)}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save note.");
      if (selectedNotes?.error) {
        setNotesResult(null);
        setNotesRequest((current) => current + 1);
      } else {
        setNotesResult((previous) =>
          previous?.encounterId === selectedEncounterId
            ? { ...previous, notes: [...previous.notes, result.note] }
            : previous
        );
      }
      setContent("");
      setMessage("Clinical note saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save note.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-5">
        {queueLoading ? (
          <LoadingFields label="Loading active consultations…" count={1} />
        ) : (
          <>
            <label className="mb-2 block text-sm font-medium" htmlFor="encounter">
              Active consultation
            </label>
            <select
              id="encounter"
              className="w-full rounded-md border p-3"
              value={selectedEncounterId}
              disabled={pending}
              onChange={(event) => {
                const nextId = event.target.value;
                if (nextId === selectedEncounterId) return;
                setEncounterId(nextId);
                setNotesResult(null);
              }}
            >
              <option value="" disabled>
                Select an active consultation
              </option>
              {active.map((entry) => (
                <option key={entry.encounterId} value={entry.encounterId}>
                  #{entry.appointmentNo} · {entry.patient.fullName}
                </option>
              ))}
            </select>
            {queueError && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p role="alert" className="text-destructive text-sm">
                  Unable to load the latest consultations.
                </p>
                <Button variant="outline" size="sm" onClick={() => void refresh()}>
                  Retry
                </Button>
              </div>
            )}
            {!queueError && !active.length && (
              <p className="text-muted-foreground mt-3 text-sm">
                Open a consultation from your queue before recording notes.
              </p>
            )}
          </>
        )}
      </section>
      <form onSubmit={save} className="rounded-xl border p-5">
        <label className="mb-2 block text-sm font-medium" htmlFor="note-content">
          Clinical note
        </label>
        <textarea
          id="note-content"
          required
          maxLength={5000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="w-full rounded-md border p-3"
          rows={7}
        />
        <div className="mt-4 flex items-center gap-3">
          <Button
            type="submit"
            disabled={!selectedEncounterId || notesLoading || pending}
          >
            {pending ? "Saving…" : "Save clinical note"}
          </Button>
          {message && (
            <span role="status" className="text-sm">
              {message}
            </span>
          )}
        </div>
      </form>
      <section className="rounded-xl border p-5">
        <h2 className="mb-4 font-semibold">Saved notes</h2>
        {notesLoading ? (
          <LoadingRows
            label="Loading clinical notes…"
            count={2}
            rowClassName="bg-muted border-0"
          />
        ) : selectedNotes?.error ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-destructive text-sm">
              {selectedNotes.error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotesResult(null);
                setNotesRequest((current) => current + 1);
              }}
            >
              Retry
            </Button>
          </div>
        ) : selectedNotes?.notes.length ? (
          <div className="space-y-3">
            {selectedNotes.notes.map((note) => (
              <article key={note.id} className="bg-muted rounded-md p-3">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        ) : selectedNotes ? (
          <p className="text-muted-foreground text-sm">
            No notes recorded for this consultation.
          </p>
        ) : null}
      </section>
      {active.some((entry) => entry.encounterId === selectedEncounterId) && (
        <PrescriptionForm key={selectedEncounterId} encounterId={selectedEncounterId} />
      )}
    </div>
  );
}
