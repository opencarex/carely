"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VisitRecord } from "@/components/nurse/nurse-workspace-provider";
const measurements = [
  {
    name: "bloodPressure",
    label: "Blood pressure",
    value: "128 / 82",
    unit: "mmHg",
    pattern: "\\d{2,3}\\s*/\\s*\\d{2,3}",
    title: "Enter systolic / diastolic, for example 128 / 82",
    max: undefined,
  },
  { name: "pulse", label: "Pulse", value: "82", unit: "bpm" },
  { name: "temperature", label: "Temperature", value: "36.9", unit: "°C" },
  { name: "spo2", label: "SpO₂", value: "97", unit: "%", max: 100 },
  { name: "respiratoryRate", label: "Respiratory rate", value: "18", unit: "/ min" },
  { name: "weight", label: "Weight", value: "68", unit: "kg" },
];

export function VitalsForm({
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
    onSave({
      vitals: Object.fromEntries(
        measurements.map((field) => [field.name, String(data.get(field.name)).trim()])
      ),
      vitalsSaved: timestamp,
    });

    setMessage(`Vitals saved for ${visitId} in this demo session.`);
  }

  return (
    <form onSubmit={saveRecord}>
      <div className="grid gap-4 sm:grid-cols-2">
        {measurements.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-2 block text-xs font-semibold">
              {field.label}
            </label>
            <Input
              id={field.name}
              name={field.name}
              label={field.label}
              defaultValue={
                record.vitals?.[field.name] ?? (visitId === "APT-1050" ? field.value : "")
              }
              type={field.name === "bloodPressure" ? "text" : "number"}
              inputMode={field.name === "bloodPressure" ? "text" : "decimal"}
              pattern={field.pattern}
              title={field.title}
              min={field.name === "bloodPressure" ? undefined : 0.1}
              max={field.max}
              step="any"
              required
              endAdornment={
                <span className="text-muted-foreground text-sm">{field.unit}</span>
              }
            />
          </div>
        ))}
      </div>
      <Button type="submit" className="mt-5 w-full sm:w-auto">
        Save Vitals
      </Button>
      {message && (
        <p role="status" className="text-primary mt-3 text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
