"use client";

import { useState } from "react";
import { usePharmacyDemo } from "@/components/pharmacy/pharmacy-demo-provider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Panel } from "@/components/workspace/workspace-ui";
import { StockItemForm } from "@/components/pharmacy/stock-item-form";
import { StockBadge } from "@/components/pharmacy/stock-badge";
import { displayExpiry } from "@/lib/mock/pharmacy";

export function StockEditor() {
  const { medicines, changes, updateStock } = usePharmacyDemo();
  const [selectedId, setSelectedId] = useState("MED-0042");
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState("");
  const medicine = medicines.find((item) => item.id === selectedId)!;
  return (
    <>
      <div className="bg-card mb-5 rounded-xl border p-4">
        <label htmlFor="stock-medicine" className="mb-2 block text-xs font-semibold">
          Select stock item
        </label>
        <Select
          value={selectedId}
          items={medicines.map((item) => ({ value: item.id, label: item.name }))}
          onValueChange={(value) => {
            if (value) {
              setSelectedId(value);
              setMessage("");
            }
          }}
        >
          <SelectTrigger id="stock-medicine">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {medicines.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Stock item" className="min-w-0 lg:col-span-2">
          <StockItemForm
            key={`${medicine.id}-${version}`}
            medicine={medicine}
            onCancel={() => {
              setVersion((previous) => previous + 1);
              setMessage("Unsaved changes discarded.");
            }}
            onSave={(updated) => {
              updateStock(updated);
              setMessage("Stock changes saved in this demo session.");
            }}
          />
          {message && (
            <p role="status" className="text-primary mt-4 text-sm">
              {message}
            </p>
          )}
        </Panel>
        <div className="min-w-0 space-y-5">
          <Panel title="Stock health">
            <StockBadge medicine={medicine} />
            <p className="mt-3 text-sm">
              {medicine.quantity < medicine.threshold
                ? `${medicine.threshold - medicine.quantity} units below threshold`
                : "Quantity meets the reorder threshold"}
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Last updated</dt>
                <dd className="mt-1">{medicine.updated}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Expiry</dt>
                <dd className="mt-1">{displayExpiry(medicine.expiry)}</dd>
              </div>
            </dl>
            <p className="text-muted-foreground mt-4 text-xs">
              Demo changes are held for this pharmacy session. Audit persistence will be
              connected with the backend.
            </p>
          </Panel>
          <Panel title="Recent stock changes">
            <div className="space-y-3">
              {changes
                .filter((item) => item.medicineId === selectedId)
                .slice(0, 5)
                .map((item, index) => (
                  <div
                    key={index}
                    className="bg-carely-surface flex flex-wrap items-center justify-between gap-3 rounded-lg p-3 text-sm"
                  >
                    <span className="text-muted-foreground text-xs">{item.time}</span>
                    <span>
                      {item.from} &rarr; {item.to}
                    </span>
                  </div>
                ))}
              {!changes.some((item) => item.medicineId === selectedId) && (
                <p className="text-muted-foreground text-sm">No demo changes recorded.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
