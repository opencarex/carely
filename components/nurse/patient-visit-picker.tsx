"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { NursePatient } from "@/lib/mock/nurse";

export function PatientVisitPicker({
  patient,
  patients,
  visitId,
  onSelect,
}: {
  patient: NursePatient;
  patients: NursePatient[];
  visitId: string;
  onSelect: (patientId: string, visitId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  function findPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim().toUpperCase();
    const found = patients.find(
      (item) => item.id === term || item.visits.some((visit) => visit.id === term)
    );
    if (!found) {
      setSearchError(
        "No patient found. Try P-00155, P-00142 or an appointment reference such as APT-1050."
      );
      return;
    }
    onSelect(
      found.id,
      found.visits.find((visit) => visit.id === term)?.id ?? found.visits[0].id
    );
    setSearchError("");
  }
  return (
    <>
      <form onSubmit={findPatient} className="bg-card mb-5 rounded-xl border p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              id="nurse-patient-search"
              label="Search patient ID or appointment reference"
              placeholder="Search patient ID or appointment reference"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              required
              showLabel
              controlSize="compact"
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Find patient
          </Button>
        </div>
        {searchError && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {searchError}
          </p>
        )}
      </form>
      <Card className="mb-5 p-4 sm:p-5">
        <h2 className="text-base font-semibold sm:text-lg">
          {patient.name} · {patient.id}
        </h2>
        <div className="mt-4 space-y-2 text-sm">
          <label htmlFor="nurse-visit" className="block text-xs font-semibold">
            Selected visit
          </label>
          <Select
            value={visitId}
            items={patient.visits.map((visit) => ({
              value: visit.id,
              label: visit.id + " · " + visit.label,
            }))}
            onValueChange={(value) => {
              if (value) onSelect(patient.id, value);
            }}
          >
            <SelectTrigger id="nurse-visit" className="min-w-0 gap-2 text-left">
              <SelectValue className="min-w-0 truncate" placeholder="Select a visit" />
            </SelectTrigger>
            <SelectContent className="max-h-80 w-(--anchor-width) max-w-[calc(100vw-2rem)] overflow-y-auto">
              {patient.visits.map((visit) => (
                <SelectItem key={visit.id} value={visit.id} className="wrap-break-word">
                  {visit.id} · {visit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </>
  );
}
