"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AvailabilitySkeleton } from "@/components/doctor/availability-skeleton";
import {
  saveAvailabilitySchema,
  type AvailabilityResponse,
  type SaveAvailabilityInput,
} from "@/lib/schemas/availability";

const weekdays = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

function weeklyFormValues(
  availability: AvailabilityResponse["availability"]
): SaveAvailabilityInput {
  return {
    sessions: weekdays.map(({ value }) => {
      const saved = availability.find((session) => session.dayOfWeek === value);
      return {
        dayOfWeek: value,
        startTime: saved?.startTime.slice(0, 5) ?? "09:00",
        endTime: saved?.endTime.slice(0, 5) ?? "12:00",
        maxPatients: saved?.maxPatients ?? 10,
        isActive: saved?.isActive ?? false,
      };
    }),
  };
}

export function DoctorAvailabilityForm({
  initialAvailability,
  initialError = "",
}: {
  initialAvailability: AvailabilityResponse["availability"];
  initialError?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(initialError);
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SaveAvailabilityInput>({
    resolver: zodResolver(saveAvailabilitySchema),
    defaultValues: weeklyFormValues(initialAvailability),
  });

  async function loadAvailability() {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/doctor/availability", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load your weekly schedule.");
      }
      reset(weeklyFormValues((data as AvailabilityResponse).availability));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load your weekly schedule."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function saveAvailability(values: SaveAvailabilityInput) {
    setSaveError("");
    setMessage("");
    try {
      const response = await fetch("/api/doctor/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to save your weekly schedule.");
      }
      reset(weeklyFormValues((data as AvailabilityResponse).availability));
      setMessage("Weekly availability saved.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save your weekly schedule."
      );
    }
  }

  if (isLoading) {
    return <AvailabilitySkeleton />;
  }

  if (loadError) {
    return (
      <Card className="space-y-4 p-6">
        <p role="alert" className="text-destructive text-sm">
          {loadError}
        </p>
        <Button type="button" variant="outline" onClick={() => void loadAvailability()}>
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-lg font-semibold">Weekly clinic schedule</h2>
        <p className="text-muted-foreground text-sm">
          Enable the days you hold a clinic. Each enabled day repeats every week with one
          clinic session. All times are in Sri Lanka time (Asia/Colombo).
        </p>
      </div>
      <form onSubmit={handleSubmit(saveAvailability)} className="space-y-4" noValidate>
        <fieldset disabled={isSubmitting} className="space-y-4">
          <legend className="sr-only">Recurring weekly clinic sessions</legend>
          {weekdays.map((day, index) => {
            const sessionErrors = errors.sessions?.[index];
            return (
              <fieldset key={day.value} className="rounded-lg border p-4">
                <legend className="px-1 text-sm font-semibold">{day.label}</legend>
                <input
                  type="hidden"
                  {...register(`sessions.${index}.dayOfWeek`, { valueAsNumber: true })}
                />
                <Controller
                  name={`sessions.${index}.isActive`}
                  control={control}
                  render={({ field }) => (
                    <label className="mb-4 flex w-fit cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        ref={field.ref}
                        checked={field.value}
                        disabled={isSubmitting}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                      Clinic enabled
                    </label>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    id={`clinic-${day.value}-start`}
                    label="Start time"
                    showLabel
                    type="time"
                    step={60}
                    controlSize="compact"
                    error={sessionErrors?.startTime?.message}
                    {...register(`sessions.${index}.startTime`)}
                  />
                  <Input
                    id={`clinic-${day.value}-end`}
                    label="End time"
                    showLabel
                    type="time"
                    step={60}
                    controlSize="compact"
                    error={sessionErrors?.endTime?.message}
                    {...register(`sessions.${index}.endTime`)}
                  />
                  <Input
                    id={`clinic-${day.value}-capacity`}
                    label="Maximum patients"
                    showLabel
                    type="number"
                    min={1}
                    max={32767}
                    step={1}
                    controlSize="compact"
                    error={sessionErrors?.maxPatients?.message}
                    {...register(`sessions.${index}.maxPatients`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </fieldset>
            );
          })}
        </fieldset>
        {saveError && (
          <p role="alert" className="text-destructive text-sm">
            {saveError}
          </p>
        )}
        {message && !isDirty && (
          <p role="status" className="text-carely-success text-sm">
            {message}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isSubmitting ? "Saving..." : "Save weekly availability"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || !isDirty}
            onClick={() => {
              reset();
              setSaveError("");
              setMessage("");
            }}
          >
            Discard changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
