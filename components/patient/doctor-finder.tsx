"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InitialAvatar, StatusBadge } from "@/components/patient/patient-shared";
import {
  patientDoctors,
  patientVisitReasons,
  formatPatientDate,
  type PatientDoctor,
} from "@/lib/mock/patient";
import { cn } from "@/lib/utils";

export function DoctorFinder({
  mode,
  onModeChange,
  selectedId,
  onSelect,
}: {
  mode: "guided" | "browse";
  onModeChange: (mode: "guided" | "browse") => void;
  selectedId?: string;
  onSelect: (doctor: PatientDoctor) => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const specialties = [
    { value: "all", label: "All specialties" },
    ...Array.from(new Set(patientDoctors.map((doctor) => doctor.specialty))).map(
      (value) => ({ value, label: value })
    ),
  ];
  const doctors = patientDoctors.filter((doctor) =>
    mode === "guided"
      ? !!reason && doctor.reasonIds.includes(reason)
      : (specialty === "all" || doctor.specialty === specialty) &&
        (doctor.name + " " + doctor.specialty)
          .toLowerCase()
          .includes(query.trim().toLowerCase())
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" aria-label="Doctor finder mode">
        <Button
          variant={mode === "guided" ? "default" : "outline"}
          aria-pressed={mode === "guided"}
          onClick={() => onModeChange("guided")}
        >
          Guided doctor finder
        </Button>
        <Button
          variant={mode === "browse" ? "default" : "outline"}
          aria-pressed={mode === "browse"}
          onClick={() => onModeChange("browse")}
        >
          Browse all doctors
        </Button>
      </div>
      {mode === "guided" ? (
        <>
          <div className="bg-carely-surface rounded-xl border p-4 sm:p-5">
            <p className="text-primary text-xs font-semibold">Carely</p>
            <h2 className="mt-2 text-lg font-semibold">
              What would you like to see a doctor about?
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {patientVisitReasons.map((item) => (
                <Button
                  key={item.id}
                  variant={reason === item.id ? "default" : "outline"}
                  aria-pressed={reason === item.id}
                  onClick={() => setReason(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          {reason && (
            <div className="flex justify-end">
              <p className="bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm">
                {patientVisitReasons.find((item) => item.id === reason)?.label}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="doctor-search"
            label="Search doctor or specialty"
            showLabel
            placeholder="Search doctor or specialty..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="min-w-0 space-y-1.5">
            <label htmlFor="doctor-specialty" className="text-xs font-semibold">
              Specialty
            </label>
            <Select
              items={specialties}
              value={specialty}
              onValueChange={(value) => value && setSpecialty(value)}
            >
              <SelectTrigger id="doctor-specialty" className="min-w-0">
                <SelectValue className="truncate" />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)]">
                {specialties.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {(mode === "browse" || reason) && (
        <section aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              {mode === "guided" ? "Matching doctors" : "Available doctors"}
            </h2>
            <span className="text-muted-foreground text-sm">
              {doctors.length} results
            </span>
          </div>
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className={cn(
                  "flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center",
                  selectedId === doctor.id && "border-primary bg-carely-surface"
                )}
              >
                <InitialAvatar large>{doctor.initials}</InitialAvatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{doctor.name}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{doctor.specialty}</p>
                  <div className="mt-2">
                    <StatusBadge tone="green">
                      Next: {formatPatientDate(doctor.dates[0])}
                    </StatusBadge>
                  </div>
                </div>
                <Button
                  variant={selectedId === doctor.id ? "default" : "outline"}
                  onClick={() => onSelect(doctor)}
                  aria-label={"Choose " + doctor.name}
                >
                  {selectedId === doctor.id ? "Selected" : "Choose doctor"}
                </Button>
              </div>
            ))}
          </div>
          {!doctors.length && (
            <p className="text-muted-foreground rounded-xl border p-5 text-sm">
              No matching doctors are available. Choose another reason or browse all
              doctors.
            </p>
          )}
          {mode === "guided" && (
            <Button variant="outline" className="mt-4" onClick={() => setReason(null)}>
              Choose another reason
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
