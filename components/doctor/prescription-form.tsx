"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createPrescriptionSchema,
  type CreatePrescriptionResponse,
  type PrescriptionCatalogueResponse,
} from "@/lib/schemas/prescription";

type DraftItem = { id: number; source: "catalogue" | "outside" };

export function PrescriptionForm({ encounterId }: { encounterId: string }) {
  const [catalogue, setCatalogue] = useState<PrescriptionCatalogueResponse | null>(null);
  const [catalogueError, setCatalogueError] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([{ id: 0, source: "catalogue" }]);
  const nextItemId = useRef(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [issuedId, setIssuedId] = useState("");
  const catalogueLoading = !catalogue && !catalogueError;
  const needsCatalogue = items.some((item) => item.source === "catalogue");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/doctor/medicines", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the catalogue.");
        const result: PrescriptionCatalogueResponse = await response.json();
        setCatalogue(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogueError(true);
      });
    return () => controller.abort();
  }, []);

  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || (catalogueLoading && needsCatalogue)) return;
    setError("");
    setIssuedId("");
    const fields = new FormData(event.currentTarget);
    const payload = {
      items: items.map(({ id, source }) => {
        const field = (name: string) => String(fields.get(`item-${id}-${name}`) ?? "");
        return {
          ...(source === "catalogue"
            ? { medicineId: field("medicineId") }
            : { medicineName: field("medicineName") }),
          dosage: field("dosage"),
          frequency: field("frequency"),
          durationDays: Number(field("durationDays")),
          quantity: Number(field("quantity")),
          instructions: field("instructions").trim() || undefined,
        };
      }),
    };
    const parsed = createPrescriptionSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setPending(true);
    try {
      const response = await fetch(
        `/api/encounters/${encodeURIComponent(encounterId)}/prescriptions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const result: CreatePrescriptionResponse & { error?: string } =
        await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to issue prescription.");
      setIssuedId(result.prescription.id);
      setItems([{ id: nextItemId.current++, source: "catalogue" }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to issue prescription.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={issue} className="space-y-4 rounded-xl border p-5">
      <h2 className="font-semibold">Issue prescription</h2>
      {catalogueLoading && needsCatalogue && (
        <p role="status" className="sr-only">
          Loading the medicine catalogue…
        </p>
      )}
      {catalogueError && (
        <p role="status" className="text-muted-foreground text-sm">
          The medicine catalogue could not load. You can still type a medicine name.
        </p>
      )}
      <fieldset disabled={pending} className="space-y-4">
        {items.map(({ id, source }, index) => {
          const prefix = `item-${id}`;
          return (
            <section
              key={id}
              aria-label={`Medicine ${index + 1}`}
              className="space-y-3 rounded-lg border p-4"
            >
              <label className="block text-sm" htmlFor={`${prefix}-source`}>
                Medicine source
              </label>
              <select
                id={`${prefix}-source`}
                className="bg-card w-full rounded-lg border p-2 text-sm"
                value={source}
                onChange={(event) => {
                  const source =
                    event.target.value === "outside" ? "outside" : "catalogue";
                  setItems((current) =>
                    current.map((item) => (item.id === id ? { ...item, source } : item))
                  );
                }}
              >
                <option value="catalogue">Catalogue medicine</option>
                <option value="outside">Type medicine name</option>
              </select>
              {source === "catalogue" ? (
                <div className="space-y-2">
                  <label className="block text-sm" htmlFor={`${prefix}-medicineId`}>
                    Medicine
                  </label>
                  {catalogueLoading ? (
                    <Skeleton className="h-9 w-full" aria-hidden="true" />
                  ) : (
                    <select
                      id={`${prefix}-medicineId`}
                      name={`${prefix}-medicineId`}
                      className="bg-card w-full rounded-lg border p-2 text-sm"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        {catalogue?.medicines.length
                          ? "Select a medicine"
                          : catalogueError
                            ? "Catalogue unavailable"
                            : "No catalogue medicines available"}
                      </option>
                      {catalogue?.medicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name} · {medicine.strength} · {medicine.form}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <Input
                  id={`${prefix}-medicineName`}
                  name={`${prefix}-medicineName`}
                  label="Medicine name"
                  showLabel
                  required
                  maxLength={100}
                />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id={`${prefix}-dosage`}
                  name={`${prefix}-dosage`}
                  label="Dosage"
                  showLabel
                  required
                  maxLength={200}
                />
                <Input
                  id={`${prefix}-frequency`}
                  name={`${prefix}-frequency`}
                  label="Frequency"
                  showLabel
                  required
                  maxLength={200}
                />
                <Input
                  id={`${prefix}-durationDays`}
                  name={`${prefix}-durationDays`}
                  label="Duration (days)"
                  showLabel
                  type="number"
                  required
                  min={1}
                  max={365}
                />
                <Input
                  id={`${prefix}-quantity`}
                  name={`${prefix}-quantity`}
                  label="Quantity"
                  showLabel
                  type="number"
                  required
                  min={1}
                  max={10000}
                />
              </div>
              <Input
                id={`${prefix}-instructions`}
                name={`${prefix}-instructions`}
                label="Instructions (optional)"
                showLabel
                maxLength={1000}
              />
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Remove medicine ${index + 1}`}
                  onClick={() =>
                    setItems((current) => current.filter((item) => item.id !== id))
                  }
                >
                  Remove
                </Button>
              )}
            </section>
          );
        })}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={items.length >= 20 || pending}
            onClick={() => {
              const id = nextItemId.current++;
              setItems((current) => [...current, { id, source: "catalogue" }]);
            }}
          >
            Add medicine
          </Button>
          <Button
            type="submit"
            disabled={pending || (catalogueLoading && needsCatalogue)}
          >
            {pending ? "Issuing..." : "Issue prescription"}
          </Button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      {issuedId && (
        <p role="status" className="text-sm break-all">
          Prescription issued. ID {issuedId}
        </p>
      )}
    </form>
  );
}
