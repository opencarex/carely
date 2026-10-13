"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MedicineStock } from "@/lib/mock/pharmacy";

export function StockItemForm({
  medicine,
  onSave,
  onCancel,
}: {
  medicine: MedicineStock;
  onSave: (medicine: MedicineStock) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const quantity = Number(data.get("quantity"));
    const threshold = Number(data.get("threshold"));
    const batch = String(data.get("batch")).trim();
    const expiry = String(data.get("expiry"));
    if (
      !Number.isSafeInteger(quantity) ||
      !Number.isSafeInteger(threshold) ||
      quantity < 0 ||
      threshold < 0
    ) {
      setError("Quantity and reorder threshold must be non-negative whole numbers.");
      return;
    }
    if (quantity > 0 && (!batch || !expiry)) {
      setError("Record a batch number and expiry date for available stock.");
      return;
    }
    setError("");
    onSave({
      ...medicine,
      quantity,
      threshold,
      batch,
      expiry,
      updated: "Just now by A. Silva",
    });
  }
  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <p className="font-semibold">{medicine.name}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {medicine.form} &middot; {medicine.id}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="stock-quantity"
          name="quantity"
          label="Current quantity"
          showLabel
          type="number"
          min={0}
          max={1000000000}
          step={1}
          required
          defaultValue={medicine.quantity}
        />
        <Input
          id="stock-threshold"
          name="threshold"
          label="Reorder threshold"
          showLabel
          type="number"
          min={0}
          max={1000000000}
          step={1}
          required
          defaultValue={medicine.threshold}
        />
        <Input
          id="stock-batch"
          name="batch"
          label="Batch number"
          showLabel
          maxLength={80}
          defaultValue={medicine.batch}
        />
        <Input
          id="stock-expiry"
          name="expiry"
          label="Expiry date"
          showLabel
          type="date"
          defaultValue={medicine.expiry}
        />
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
