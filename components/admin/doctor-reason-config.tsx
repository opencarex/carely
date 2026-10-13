"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/workspace/workspace-ui";
import { finderDoctors, visitReasons, type VisitReason } from "@/lib/mock/admin";
import { cn } from "@/lib/utils";

export function DoctorReasonConfig() {
  const [doctors, setDoctors] = useState(finderDoctors);
  const [reasons, setReasons] = useState(visitReasons);
  const [selectedId, setSelectedId] = useState(finderDoctors[0].id);
  const [query, setQuery] = useState("");
  const [newReason, setNewReason] = useState("");
  const [editing, setEditing] = useState<VisitReason | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const doctor = doctors.find((item) => item.id === selectedId)!;
  const filtered = doctors.filter((item) =>
    `${item.name} ${item.specialty}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  function addReason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = newReason.trim();
    if (!label) {
      setError("Enter a reason for visiting.");
      return;
    }
    if (reasons.some((reason) => reason.label.toLowerCase() === label.toLowerCase())) {
      setError("This reason already exists.");
      return;
    }
    setReasons((previous) => [
      ...previous,
      { id: crypto.randomUUID(), label, active: true },
    ]);
    setNewReason("");
    setError("");
    setMessage("");
  }
  function editReason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const label = editing.label.trim();
    if (!label) {
      setError("Enter a reason name.");
      return;
    }
    if (
      reasons.some(
        (reason) =>
          reason.id !== editing.id && reason.label.toLowerCase() === label.toLowerCase()
      )
    ) {
      setError("This reason already exists.");
      return;
    }
    setReasons((previous) =>
      previous.map((reason) =>
        reason.id === editing.id ? { ...editing, label } : reason
      )
    );
    setEditing(null);
    setError("");
    setMessage("");
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <Panel title="Doctors" className="min-w-0">
        <Input
          id="finder-doctor-search"
          label="Search doctor"
          placeholder="Search doctor or specialty..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          controlSize="compact"
        />
        <div className="mt-4 space-y-3" aria-label="Doctors">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selectedId === item.id}
              onClick={() => {
                setSelectedId(item.id);
                setMessage("");
              }}
              className={cn(
                "focus-visible:ring-ring/40 w-full rounded-xl p-4 text-left outline-none focus-visible:ring-2",
                selectedId === item.id
                  ? "bg-secondary"
                  : "bg-carely-surface hover:bg-secondary/60"
              )}
            >
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="text-muted-foreground mt-1 block text-sm">
                {item.specialty} &middot;{" "}
                {
                  item.reasonIds.filter((id) =>
                    reasons.some((reason) => reason.id === id && reason.active)
                  ).length
                }{" "}
                reasons
              </span>
            </button>
          ))}
          {!filtered.length && (
            <p role="status" className="text-muted-foreground py-6 text-center text-sm">
              No matching doctors.
            </p>
          )}
        </div>
      </Panel>
      <Panel title={doctor.name} className="min-w-0 lg:col-span-2">
        <p className="text-muted-foreground mb-5 text-sm">
          {doctor.specialty} &middot; {doctor.active ? "Active" : "Inactive"}
        </p>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-semibold">Reasons for visiting</legend>
          {reasons.map((reason) => (
            <div
              key={reason.id}
              className="bg-carely-surface flex flex-wrap items-center gap-3 rounded-xl p-3 sm:p-4"
            >
              <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={doctor.reasonIds.includes(reason.id)}
                  disabled={!reason.active}
                  onCheckedChange={(checked) => {
                    setDoctors((previous) =>
                      previous.map((item) =>
                        item.id === selectedId
                          ? {
                              ...item,
                              reasonIds: checked
                                ? [...item.reasonIds, reason.id]
                                : item.reasonIds.filter((id) => id !== reason.id),
                            }
                          : item
                      )
                    );
                    setMessage("");
                  }}
                />
                <span
                  className={cn(
                    "wrap-break-word",
                    doctor.reasonIds.includes(reason.id) && "font-semibold"
                  )}
                >
                  {reason.label}
                </span>
              </label>
              <Badge
                className={
                  reason.active
                    ? "text-muted-foreground bg-transparent"
                    : "bg-muted text-muted-foreground"
                }
              >
                {reason.active ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="link"
                size="sm"
                aria-label={`Edit ${reason.label}`}
                onClick={() => {
                  setEditing({ ...reason });
                  setError("");
                }}
              >
                Edit
              </Button>
            </div>
          ))}
        </fieldset>
        {editing && (
          <form
            onSubmit={editReason}
            className="mt-5 space-y-4 rounded-xl border p-4"
            aria-label="Edit visit reason"
          >
            <Input
              id="edit-visit-reason"
              label="Reason name"
              showLabel
              required
              maxLength={120}
              value={editing.label}
              onChange={(event) => setEditing({ ...editing, label: event.target.value })}
            />
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <Checkbox
                checked={editing.active}
                onCheckedChange={(active) => setEditing({ ...editing, active })}
              />
              Active reason
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit">Update reason</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
        <form onSubmit={addReason} className="mt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Input
                id="new-visit-reason"
                label="Add a reason"
                showLabel
                placeholder="Enter reason for visiting"
                maxLength={120}
                required
                value={newReason}
                onChange={(event) => setNewReason(event.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" className="sm:min-h-14">
              Add reason
            </Button>
          </div>
        </form>
        {error && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            className="w-full sm:w-auto"
            onClick={() =>
              setMessage(
                `Doctor Finder changes saved in this demo session for ${doctor.name}.`
              )
            }
          >
            Save changes
          </Button>
          <span className="text-muted-foreground text-sm">
            {
              doctor.reasonIds.filter((id) =>
                reasons.some((reason) => reason.id === id && reason.active)
              ).length
            }{" "}
            active reasons selected
          </span>
        </div>
        {message && (
          <p role="status" className="text-primary mt-3 text-sm">
            {message}
          </p>
        )}
      </Panel>
    </div>
  );
}
