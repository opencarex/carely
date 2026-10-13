"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/workspace/workspace-ui";
import { hospitalDetails } from "@/lib/mock/admin";

export function HospitalDetailsForm() {
  const [message, setMessage] = useState("");
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!String(data.get("hospitalName")).trim()) {
      setMessage("Enter a hospital name before saving.");
      return;
    }
    setMessage(
      "Hospital details saved in this demo. Database persistence is not connected yet."
    );
  }
  return (
    <Panel title="Hospital Details" className="min-w-0">
      <form onSubmit={save} onChange={() => setMessage("")} className="space-y-5">
        <Input
          id="hospital-name"
          name="hospitalName"
          label="Hospital name *"
          showLabel
          required
          defaultValue={hospitalDetails.name}
          autoComplete="organization"
        />
        <Input
          id="hospital-address"
          name="address"
          label="Address"
          showLabel
          defaultValue={hospitalDetails.address}
          autoComplete="street-address"
        />
        <Input
          id="hospital-phone"
          name="phone"
          label="Contact number"
          showLabel
          type="tel"
          defaultValue={hospitalDetails.phone}
          autoComplete="tel"
        />
        <Input
          id="hospital-email"
          name="email"
          label="Contact email"
          showLabel
          type="email"
          defaultValue={hospitalDetails.email}
          autoComplete="email"
        />
        <Button type="submit" className="w-full sm:w-auto">
          Save Hospital Details
        </Button>
        {message && (
          <p role="status" className="text-primary text-sm">
            {message}
          </p>
        )}
      </form>
    </Panel>
  );
}
