"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

import type { VisitRecord } from "@/components/nurse/nurse-workspace-provider";

export function PreliminaryForm({
  visitId,
  record,
  onSave,
}: {
  visitId: string;
  record: VisitRecord;
  onSave: (record: VisitRecord) => void;
}) {
  const [message, setMessage] = useState("");
  function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const timestamp = `N. Fernando · Today, ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
    const complaint = String(data.get("complaint")).trim();
    const observations = String(data.get("observations")).trim();
    if (!complaint || !observations) {
      setMessage("Complete the complaint and nursing observations before saving.");
      return;
    }
    onSave({
      complaint,
      observations,
      notesSaved: timestamp,
    });

    setMessage(`Preliminary records saved for ${visitId} in this demo session.`);
  }

  return (
    <form onSubmit={saveRecord}>
      <div className="space-y-4">
        <div>
          <label htmlFor="complaint" className="mb-2 block text-xs font-semibold">
            Initial complaint
          </label>
          <textarea
            id="complaint"
            name="complaint"
            required
            maxLength={2000}
            defaultValue={
              record.complaint ??
              (visitId === "APT-1050" ? "Headache since yesterday." : "")
            }
            className="bg-carely-surface focus-visible:ring-primary/40 min-h-24 w-full resize-y rounded-lg border p-3 text-base outline-none focus-visible:ring-2"
          />
        </div>
        <div>
          <label htmlFor="observations" className="mb-2 block text-xs font-semibold">
            Nursing observations
          </label>
          <textarea
            id="observations"
            name="observations"
            required
            maxLength={5000}
            defaultValue={
              record.observations ??
              (visitId === "APT-1050" ? "Patient is alert and reports no vomiting." : "")
            }
            className="bg-carely-surface focus-visible:ring-primary/40 min-h-32 w-full resize-y rounded-lg border p-3 text-base outline-none focus-visible:ring-2"
          />
        </div>
      </div>
      <Button type="submit" className="mt-5 w-full sm:w-auto">
        Save Preliminary Records
      </Button>
      {message && (
        <p role="status" className="text-primary mt-3 text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
