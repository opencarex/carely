"use client";
import { useState } from "react";
import { Shield, Lock, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PatientProfileForm } from "@/components/patient/patient-profile";
import type { PatientProfile } from "@/lib/schemas/patient-update";
import { PatientPasswordDialog } from "@/components/patient/patient-password-dialog";
import { StatusBadge } from "@/components/patient/patient-shared";
export function PatientProfileSettings({
  initialProfile,
}: {
  initialProfile: PatientProfile;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const verified = profile.emailVerified;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
      <Card className="min-w-0 p-5 sm:p-6">
        <PatientProfileForm
          profile={profile}
          onSave={async (changes) => {
            const response = await fetch("/api/patient/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(changes),
            });
            const data: {
              patient?: Omit<PatientProfile, "email" | "emailVerified">;
              error?: string;
            } | null = await response.json().catch(() => null);
            if (!response.ok || !data?.patient)
              throw new Error(data?.error ?? "Unable to save your profile.");
            const updated = { ...profile, ...data.patient };
            setProfile(updated);
            return updated;
          }}
        />
      </Card>
      <div className="min-w-0 space-y-4">
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Shield className="text-primary size-4" />
            Account security
          </h2>
          <div className="bg-carely-surface mt-4 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase">Primary email</h3>
              <StatusBadge tone={verified ? "green" : "amber"}>
                {verified ? "Verified" : "Verification pending"}
              </StatusBadge>
            </div>
            <p className="mt-3 text-sm font-semibold break-all">{profile.email}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Used for your patient account and prescription access.
            </p>
          </div>
          <div className="mt-4 rounded-xl border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4" />
              Account password
            </h3>

            <PatientPasswordDialog />
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="text-primary size-4" />
            Privacy &amp; health data access
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Your patient account is for viewing your own appointments, queue status, and
            doctor-issued prescriptions.
          </p>
        </Card>
      </div>
    </div>
  );
}
