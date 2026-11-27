"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingFields } from "@/components/workspace/loading-skeleton";
import { Panel } from "@/components/workspace/workspace-ui";

type Settings = {
  hospitalName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

async function requestSettings(options: RequestInit, fallbackError: string) {
  const response = await fetch("/api/admin/settings", options);
  const data: { settings?: Settings; error?: string } = await response.json();
  if (!response.ok || !data.settings) throw new Error(data.error ?? fallbackError);
  return data.settings;
}

export function HospitalDetailsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [request, setRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fallback = "Unable to load hospital details.";
    void requestSettings({ cache: "no-store", signal: controller.signal }, fallback)
      .then((data) => {
        if (!controller.signal.aborted) setSettings(data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : fallback);
      });
    return () => controller.abort();
  }, [request]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || saving) return;
    setError("");
    setMessage("");
    setSaving(true);
    const fallback = "Unable to save hospital details.";
    try {
      const { hospitalName, address, phone, email } = settings;
      const data = await requestSettings(
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hospitalName, address, phone, email }),
        },
        fallback
      );
      setSettings(data);
      setMessage("Hospital details saved.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Hospital Details" className="min-w-0">
      {!settings && !error && <LoadingFields label="Loading hospital details…" />}
      {settings && (
        <form onSubmit={save}>
          <fieldset disabled={saving} className="space-y-5">
            <Input
              id="hospital-name"
              label="Hospital name *"
              showLabel
              required
              value={settings.hospitalName}
              onChange={(event) =>
                setSettings({ ...settings, hospitalName: event.target.value })
              }
              autoComplete="organization"
            />
            <Input
              id="hospital-address"
              label="Address"
              showLabel
              value={settings.address ?? ""}
              onChange={(event) =>
                setSettings({ ...settings, address: event.target.value || null })
              }
              autoComplete="street-address"
            />
            <Input
              id="hospital-phone"
              label="Contact number"
              showLabel
              type="tel"
              value={settings.phone ?? ""}
              onChange={(event) =>
                setSettings({ ...settings, phone: event.target.value || null })
              }
              autoComplete="tel"
            />
            <Input
              id="hospital-email"
              label="Contact email"
              showLabel
              type="email"
              value={settings.email ?? ""}
              onChange={(event) =>
                setSettings({ ...settings, email: event.target.value || null })
              }
              autoComplete="email"
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              {saving ? "Saving hospital details…" : "Save Hospital Details"}
            </Button>
          </fieldset>
        </form>
      )}
      {error && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          {error}
        </p>
      )}
      {!settings && error && (
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => {
            setError("");
            setRequest((current) => current + 1);
          }}
        >
          Try again
        </Button>
      )}
      {message && (
        <p role="status" className="text-primary mt-3 text-sm">
          {message}
        </p>
      )}
    </Panel>
  );
}
