"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
export function PatientPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setChecked(false);
    if (next.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (next !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setChecked(true);
    setCurrent("");
    setNext("");
    setConfirmation("");
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setCurrent("");
        setNext("");
        setConfirmation("");
        setError("");
        setChecked(false);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" className="mt-4" />}>
        Change password
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Check your new password details. Password changes are not connected in this
            demo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Input
            id="currentPassword"
            label="Current password"
            showLabel
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
          <Input
            id="newPassword"
            label="New password"
            showLabel
            type="password"
            autoComplete="new-password"
            required
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
          <Input
            id="confirmPassword"
            label="Confirm new password"
            showLabel
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          {checked && (
            <p role="status" className="text-carely-success text-sm">
              Password form checked. Your account password has not changed.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Update password</Button>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
