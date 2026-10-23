"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, HeartPulse } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import type { PatientOnboardingInput } from "@/lib/schemas/auth";
import { patientOnboardingSchema } from "@/lib/schemas/auth";

export default function PatientOnboardingPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [completedPatientNo, setCompletedPatientNo] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientOnboardingInput>({
    resolver: zodResolver(patientOnboardingSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      dateOfBirth: "",
      gender: "male",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  useEffect(() => {
    if (session?.user?.name) {
      setValue("fullName", session.user.name);
    }
  }, [session, setValue]);

  const onSubmit = async (values: PatientOnboardingInput) => {
    setServerError(null);
    try {
      const res = await fetch("/api/patient/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to complete onboarding.");
        return;
      }

      setCompletedPatientNo(data.patient?.patientNo || data.patientNo);
      setTimeout(() => {
        router.push("/patient");
      }, 2000);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  if (completedPatientNo) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center p-4">
        <Card className="w-full space-y-5 p-8 text-center shadow-lg">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-foreground text-xl font-bold">Registration Complete</h2>
            <p className="text-muted-foreground text-sm">
              Your patient record has been created in the hospital system.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground text-xs tracking-wider uppercase">
              Medical Record Number (MRN)
            </p>
            <p className="text-primary mt-1 font-mono text-2xl font-bold">
              {completedPatientNo}
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            Redirecting to your patient portal dashboard…
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 space-y-2 text-center sm:text-left">
        <div className="text-primary flex items-center justify-center gap-2.5 sm:justify-start">
          <HeartPulse className="size-6" />
          <span className="text-xs font-bold tracking-wider uppercase">
            Patient Identity Verification
          </span>
        </div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          Complete Your Patient Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Please confirm your clinical details. This information ensures your medical
          records and appointments are correctly linked.
        </p>
      </div>

      <Card className="p-6 shadow-sm sm:p-8">
        {serverError ? (
          <div className="bg-destructive/10 text-destructive mb-6 rounded-md p-3 text-sm">
            {serverError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="space-y-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Primary Details
            </h3>

            <Input
              id="fullName"
              label="Full Legal Name"
              placeholder="e.g. Johnathan Alexander Doe"
              error={errors.fullName?.message}
              {...register("fullName")}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="phone"
                label="Primary Phone Number"
                placeholder="e.g. +1 555 123 4567"
                type="tel"
                error={errors.phone?.message}
                {...register("phone")}
              />

              <Input
                id="dateOfBirth"
                label="Date of Birth"
                type="date"
                error={errors.dateOfBirth?.message}
                {...register("dateOfBirth")}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="gender"
                className="text-foreground text-xs font-semibold tracking-wider uppercase"
              >
                Gender
              </label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender?.message ? (
                <p className="text-destructive text-xs">{errors.gender.message}</p>
              ) : null}
            </div>

            <Input
              id="address"
              label="Residential Address (Optional)"
              placeholder="Street address, City, Postal code"
              error={errors.address?.message}
              {...register("address")}
            />
          </div>

          <div className="space-y-4 border-t pt-5">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Emergency Contact (Optional)
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="emergencyContactName"
                label="Contact Name"
                placeholder="e.g. Jane Doe (Spouse)"
                error={errors.emergencyContactName?.message}
                {...register("emergencyContactName")}
              />

              <Input
                id="emergencyContactPhone"
                label="Contact Telephone"
                placeholder="e.g. +1 555 987 6543"
                type="tel"
                error={errors.emergencyContactPhone?.message}
                {...register("emergencyContactPhone")}
              />
            </div>
          </div>

          <Button fullWidth type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? "Creating Patient Record…" : "Confirm and Access Portal"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
