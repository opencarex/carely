"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { NurseQueueEntry } from "@/lib/schemas/intake";

export function PatientVisitPicker({
  entries,
  selectedId,
  onSelect,
  disabled,
  unavailable,
}: {
  entries: NurseQueueEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
  unavailable: boolean;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const matches = entries.filter((entry) =>
    `${entry.patient.fullName} ${entry.patient.patientNo} ${entry.appointmentNo}`
      .toLowerCase()
      .includes(term)
  );
  const selected = entries.find((entry) => entry.encounterId === selectedId);
  const options =
    selected && !matches.includes(selected) ? [selected, ...matches] : matches;
  return (
    <Card className="mb-5 space-y-4 p-4 sm:p-5">
      <Input
        id="nurse-search"
        label="Find a waiting patient"
        showLabel
        placeholder="Name, patient number or appointment number"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={disabled}
      />
      <div>
        <label htmlFor="nurse-visit" className="mb-2 block text-sm font-semibold">
          Visit awaiting intake
        </label>
        <select
          id="nurse-visit"
          value={selectedId}
          disabled={disabled}
          onChange={(event) => onSelect(event.target.value)}
          className="bg-card min-h-11 w-full rounded-lg border px-3 text-sm"
        >
          <option value="">Choose a patient</option>
          {options.map((entry) => (
            <option key={entry.encounterId} value={entry.encounterId}>
              #{entry.appointmentNo} · {entry.patient.fullName} ·{" "}
              {entry.patient.patientNo} · {entry.doctorName}
            </option>
          ))}
        </select>
      </div>
      {!unavailable && !matches.length && (
        <p className="text-muted-foreground text-sm">
          {entries.length
            ? "No waiting visits match your search."
            : "No patients are waiting for intake."}
        </p>
      )}
    </Card>
  );
}
