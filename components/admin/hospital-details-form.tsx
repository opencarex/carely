"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/workspace/workspace-ui";

type Settings = { hospitalName: string; address: string | null; phone: string | null; email: string | null };

export function HospitalDetailsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void fetch("/api/admin/settings", { cache: "no-store" }).then(async (response) => { const data: { settings?: Settings; error?: string } = await response.json(); if (!response.ok || !data.settings) throw new Error(data.error ?? "Unable to load hospital details."); setSettings(data.settings); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load hospital details.")); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!settings) return; setError(""); setMessage("");
    const { hospitalName, address, phone, email } = settings;
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalName, address, phone, email }),
    });
    const data: { settings?: Settings; error?: string } = await response.json();
    if (!response.ok || !data.settings) { setError(data.error ?? "Unable to save hospital details."); return; }
    setSettings(data.settings); setMessage("Hospital details saved.");
    router.refresh();
  }
  return <Panel title="Hospital Details" className="min-w-0">
    {!settings ? <p className="text-muted-foreground text-sm">Loading hospital details...</p> : <form onSubmit={save} className="space-y-5">
      <Input id="hospital-name" label="Hospital name *" showLabel required value={settings.hospitalName} onChange={(event) => setSettings({ ...settings, hospitalName: event.target.value })} autoComplete="organization" />
      <Input id="hospital-address" label="Address" showLabel value={settings.address ?? ""} onChange={(event) => setSettings({ ...settings, address: event.target.value || null })} autoComplete="street-address" />
      <Input id="hospital-phone" label="Contact number" showLabel type="tel" value={settings.phone ?? ""} onChange={(event) => setSettings({ ...settings, phone: event.target.value || null })} autoComplete="tel" />
      <Input id="hospital-email" label="Contact email" showLabel type="email" value={settings.email ?? ""} onChange={(event) => setSettings({ ...settings, email: event.target.value || null })} autoComplete="email" />
      <Button type="submit" className="w-full sm:w-auto">Save Hospital Details</Button>
    </form>}
    {error && <p role="alert" className="text-destructive mt-3 text-sm">{error}</p>}
    {message && <p role="status" className="text-primary mt-3 text-sm">{message}</p>}
  </Panel>;
}
