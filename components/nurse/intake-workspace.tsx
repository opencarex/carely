"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/workspace/workspace-ui";
import { PatientVisitPicker } from "./patient-visit-picker";
import { PatientContext } from "./patient-context";
import { VitalsForm } from "./vitals-form";
import { PreliminaryForm } from "./preliminary-form";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { useWorkspaceNavigation } from "@/components/workspace/workspace-navigation";
import { intakeValidationMessages, parseIntakeForm } from "@/lib/intake-form";
import type {
  NurseIntakeReceipt,
  NurseQueueEntry,
  NurseQueueResponse,
  RecordIntakeResponse,
} from "@/lib/schemas/intake";

export function IntakeWorkspace({
  initialEntries,
  selectedId,
  receipt,
  initialError,
}: {
  initialEntries: NurseQueueEntry[];
  selectedId: string;
  receipt: NurseIntakeReceipt | null;
  initialError: string | null;
}) {
  const router = useRouter();
  const poll = useVisiblePolling<NurseQueueResponse>("/api/nurse/queue");
  const entries = poll.data?.entries ?? initialEntries;
  const entry = entries.find((item) => item.encounterId === selectedId);
  const [pending, setPending] = useState(false);
  const { navigate, isPending: navigating } = useWorkspaceNavigation();
  const busy = useRef(false);
  const dirty = useRef(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<NurseIntakeReceipt | null>(receipt);
  const queueUnavailable = !!poll.error || (!poll.data && !!initialError);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      if (
        !dirty.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.origin !== window.location.origin ||
        (anchor.pathname === window.location.pathname &&
          anchor.search === window.location.search)
      )
        return;
      if (!window.confirm("Discard the unsaved intake changes for this visit?")) {
        event.preventDefault();
        event.stopPropagation();
      } else dirty.current = false;
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", navigate, true);
    };
  }, []);

  function select(id: string) {
    if (
      dirty.current &&
      !window.confirm("Discard the unsaved intake changes for this visit?")
    )
      return;
    dirty.current = false;
    navigate(
      id ? `/nurse/vitals?encounterId=${encodeURIComponent(id)}` : "/nurse/vitals"
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entry || busy.current || navigating || queueUnavailable) return;
    setErrors([]);
    try {
      const parsed = parseIntakeForm(new FormData(event.currentTarget));
      if (!parsed.success) {
        setErrors(intakeValidationMessages(parsed.error));
        return;
      }
      busy.current = true;
      setPending(true);
      const response = await fetch(
        `/api/encounters/${encodeURIComponent(entry.encounterId)}/intake`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save this intake.");
      const { intake } = result as RecordIntakeResponse;
      dirty.current = false;
      setSaved({ encounterId: intake.encounterId, recordedAt: intake.recordedAt });
      router.replace(`/nurse/vitals?receipt=${encodeURIComponent(intake.encounterId)}`);
    } catch (cause) {
      setErrors([
        cause instanceof Error
          ? cause.message
          : "Unable to confirm the save. Refresh before retrying.",
      ]);
    } finally {
      busy.current = false;
      setPending(false);
      await poll.refresh();
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="Care workspace"
        title="Nurse Intake"
        description="Record vitals and preliminary notes, then hand the visit to the doctor."
        action={
          <Button
            variant="outline"
            disabled={pending || navigating}
            onClick={() => {
              void poll.refresh();
              if (initialError) router.refresh();
            }}
          >
            Refresh queue
          </Button>
        }
      />
      {(initialError || poll.error) && (
        <p role="alert" className="text-destructive mb-4">
          {initialError || "Unable to refresh the intake queue. Refresh before saving."}
        </p>
      )}
      {saved && (
        <Panel title="Intake saved">
          <p role="status">
            Intake was recorded at{" "}
            {new Date(saved.recordedAt).toLocaleString("en-GB", {
              timeZone: "Asia/Colombo",
            })}{" "}
            and handed to the doctor.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Choose another waiting visit to continue.
          </p>
        </Panel>
      )}
      <div className="mt-5">
        <PatientVisitPicker
          entries={entries}
          selectedId={saved ? "" : selectedId}
          onSelect={select}
          disabled={pending || navigating}
        />
      </div>
      {!saved && selectedId && !entry && (
        <Panel title="Visit unavailable">
          <p>This visit is no longer in your waiting queue.</p>
          <Link
            href={`/nurse/vitals?receipt=${encodeURIComponent(selectedId)}`}
            className="text-primary mt-3 inline-block underline"
          >
            Check your saved confirmation
          </Link>
        </Panel>
      )}
      {!saved && entry && (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <Panel title="Record intake" className="lg:col-span-2">
            <form
              onSubmit={submit}
              onChange={() => {
                dirty.current = true;
              }}
            >
              <fieldset disabled={pending || navigating}>
                <VitalsForm />
                <PreliminaryForm />
                {!!errors.length && (
                  <div role="alert" className="text-destructive mt-5 text-sm">
                    <ul className="list-disc space-y-1 pl-5">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-muted-foreground my-4 text-sm">
                  Saving records both sections and finishes nurse intake. Check the
                  selected patient before submitting.
                </p>
                <Button type="submit" disabled={pending || queueUnavailable}>
                  {pending ? "Saving intake…" : "Save intake and hand to doctor"}
                </Button>
              </fieldset>
            </form>
          </Panel>
          <PatientContext entry={entry} />
        </div>
      )}
    </>
  );
}
