"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/patient/patient-shared";
import { demoPeople } from "@/lib/mock/content";

import { defaultPatientProfile, type PatientProfileData } from "@/lib/mock/patient";

const fields = [
  { key: "fullName", label: "Full name", type: "text", required: true },
  { key: "dateOfBirth", label: "Date of birth", type: "date", required: true },
  { key: "email", label: "Email address", type: "email", required: true },
  { key: "phone", label: "Phone number", type: "tel", required: true },
  { key: "emergencyContact", label: "Emergency contact", type: "text", required: false },
  { key: "address", label: "Residential address", type: "text", required: true },
] as const;
const genders = ["Female", "Male", "Other", "Prefer not to say"].map((value) => ({
  value,
  label: value,
}));

export function PatientProfileForm({
  profile,
  onSave,
}: {
  profile: PatientProfileData;
  onSave: (profile: PatientProfileData) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    onSave(draft);
    setSaved(true);
  }
  return (
    <>
      <div className="bg-carely-surface flex items-center gap-4 rounded-xl border p-4">
        <span className="bg-primary grid size-12 shrink-0 place-items-center rounded-full font-bold text-white">
          {demoPeople.portalPatient.initials}
        </span>
        <div className="min-w-0">
          <p className="font-bold wrap-break-word">{profile.fullName}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Patient ID PT-20481 &middot; Hospital OPD
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge
              tone={profile.email === defaultPatientProfile.email ? "green" : "amber"}
            >
              {profile.email === defaultPatientProfile.email
                ? "Email verified"
                : "Verification pending"}
            </StatusBadge>
            <StatusBadge>Active record</StatusBadge>
          </div>
        </div>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="border-b pb-3">
          <h2 className="font-semibold">Personal &amp; contact details</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Keep your contact details up to date for your hospital visits.
          </p>
        </div>
        {saved && (
          <p
            role="status"
            className="bg-carely-success-soft text-carely-success rounded-lg p-3 text-sm"
          >
            Profile saved for this demo visit.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <Input
              key={field.key}
              id={field.key}
              label={field.label}
              showLabel
              type={field.type}
              required={field.required}
              value={draft[field.key]}
              onChange={(event) => {
                setDraft({ ...draft, [field.key]: event.target.value });
                setSaved(false);
              }}
            />
          ))}
          <div className="min-w-0 space-y-1.5">
            <label htmlFor="gender" className="text-xs font-semibold">
              Gender
            </label>
            <Select
              items={genders}
              value={draft.gender}
              onValueChange={(value) => {
                if (value) {
                  setDraft({ ...draft, gender: value });
                  setSaved(false);
                }
              }}
            >
              <SelectTrigger id="gender" className="min-w-0">
                <SelectValue className="truncate" />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)]">
                {genders.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Save changes</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(profile);
              setSaved(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
