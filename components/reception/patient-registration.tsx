"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Panel } from "@/components/workspace/workspace-ui";
import { useReceptionDemo } from "@/components/reception/reception-demo-provider";
import type { ReceptionPatient } from "@/lib/mock/reception";

export function PatientRegistration() {
  const router = useRouter();
  const { patients, selectPatient, registerPatient } = useReceptionDemo();
  const [query, setQuery] = useState("");
  const [foundId, setFoundId] = useState<string | null>(patients[0].id);
  const [searchError, setSearchError] = useState("");
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState<ReceptionPatient | null>(null);
  const patient = patients.find((item) => item.id === foundId);
  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    const found = patients.find(
      (item) =>
        item.id.toLowerCase() === term ||
        (digits.length >= 7 && item.phone.replace(/\D/g, "") === digits)
    );
    setFoundId(found?.id ?? null);
    setSearchError(
      found
        ? ""
        : "No matching patient. Check the ID or phone number, or register a new patient."
    );
  }
  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = {
      name: String(data.get("name")).trim(),
      dob: String(data.get("dob")),
      phone: String(data.get("phone")).trim(),
      address: String(data.get("address")).trim(),
    };
    if (!values.name || !values.address) {
      setError("Complete the patient's name and address.");
      return;
    }
    const digits = values.phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      setError("Enter a valid phone number with 9 to 15 digits.");
      return;
    }
    if (
      patients.some(
        (item) =>
          item.phone.replace(/\D/g, "") === digits &&
          item.name.toLowerCase() === values.name.toLowerCase()
      )
    ) {
      setError(
        "This patient already has a record. Use patient search to avoid a duplicate."
      );
      return;
    }
    const created = registerPatient(values);
    setRegistered(created);
    setFoundId(created.id);
    setError("");
    event.currentTarget.reset();
  }
  function continueWith(id: string) {
    selectPatient(id);
    router.push("/reception/channeling");
  }
  return (
    <>
      <form
        onSubmit={find}
        className="bg-card mb-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <Input
            id="registration-search"
            label="Find patient"
            showLabel
            placeholder="Search by phone number or patient ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            controlSize="compact"
            required
          />
        </div>
        <Button type="submit">Find patient</Button>
      </form>
      {searchError && (
        <p role="status" className="text-muted-foreground mb-4 text-sm">
          {searchError}
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Panel title="Existing patient">
          {patient ? (
            <>
              <Card className="bg-secondary flex items-start gap-3 border-0 p-4">
                <Avatar
                  alt={patient.name}
                  fallback={patient.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                />
                <div className="min-w-0">
                  <p className="font-semibold">{patient.name}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{patient.id}</p>
                  <p className="text-muted-foreground mt-2 text-sm">{patient.phone}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Last visit: {patient.lastVisit}
                  </p>
                </div>
              </Card>
              <Button fullWidth className="mt-4" onClick={() => continueWith(patient.id)}>
                Use existing patient
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground py-6 text-sm">
              Find a patient to continue with an existing record.
            </p>
          )}
          <h3 className="mt-6 mb-3 text-sm font-semibold">Today at front desk</h3>
          <div className="space-y-3">
            {[
              ["09:40", "Walk-in registration", "Completed"],
              ["10:02", "OPD channeling", "Cardiology"],
            ].map(([time, activity, status]) => (
              <div
                key={time}
                className="bg-carely-surface flex flex-wrap items-center gap-3 rounded-lg p-3 text-sm"
              >
                <time className="text-muted-foreground text-xs">{time}</time>
                <span className="flex-1">{activity}</span>
                <Badge>{status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="New patient">
          <form onSubmit={register} className="space-y-4">
            <Input
              id="registration-name"
              name="name"
              label="Full name"
              showLabel
              placeholder="Enter legal name"
              maxLength={120}
              autoComplete="name"
              required
            />
            <Input
              id="registration-dob"
              name="dob"
              label="Date of birth"
              showLabel
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              required
            />
            <Input
              id="registration-phone"
              name="phone"
              label="Phone number"
              showLabel
              type="tel"
              placeholder="+94"
              autoComplete="tel"
              maxLength={24}
              required
            />
            <Input
              id="registration-address"
              name="address"
              label="Address"
              showLabel
              placeholder="Street, city"
              autoComplete="street-address"
              maxLength={240}
              required
            />
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full sm:w-auto">
              Register walk-in
            </Button>
          </form>
        </Panel>
      </div>
      <Dialog
        open={!!registered}
        onOpenChange={(open) => {
          if (!open) setRegistered(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient registered</DialogTitle>
            <DialogDescription>
              A patient record has been created in this demo session.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{registered?.name}</p>
            <p className="text-muted-foreground mt-1 text-sm">{registered?.id}</p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            <Button
              onClick={() => {
                if (registered) {
                  const id = registered.id;
                  setRegistered(null);
                  continueWith(id);
                }
              }}
            >
              Continue to channeling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
