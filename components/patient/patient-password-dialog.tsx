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
import { authClient } from "@/lib/auth-client";
import { newPasswordSchema } from "@/lib/schemas/auth";

export function PatientPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setSaved(false);
    const parsed = newPasswordSchema.safeParse({
      password: next,
      confirmPassword: confirmation,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setPending(true);
    try {
      const result = await authClient.changePassword({
        currentPassword: current,
        newPassword: parsed.data.password,
        revokeOtherSessions: true,
      });
      if (result.error)
        throw new Error(result.error.message ?? "Unable to update your password.");
      setSaved(true);
      setCurrent("");
      setNext("");
      setConfirmation("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update your password."
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (pending) return;
        setOpen(value);
        setCurrent("");
        setNext("");
        setConfirmation("");
        setError("");
        setSaved(false);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" className="mt-4" />}>
        Change password
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one. Other devices will be signed
            out.
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
          {saved && (
            <p role="status" className="text-carely-success text-sm">
              Your password has been updated.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Updating..." : "Update password"}
            </Button>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={pending} />}
            >
              {saved ? "Close" : "Cancel"}
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
