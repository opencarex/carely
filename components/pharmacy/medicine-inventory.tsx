"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Panel, StatCards } from "@/components/workspace/workspace-ui";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
import { MedicineForm } from "./medicine-form";
import { StockBadge } from "./stock-badge";
import { useMedicineCatalogue } from "./pharmacy-api";
import type { MedicineStockView } from "@/lib/schemas/pharmacy";

export function MedicineInventory() {
  const { data, loading, error, refresh } = useMedicineCatalogue();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MedicineStockView | undefined>();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const medicines = data?.medicines ?? [];
  const filtered = medicines.filter((item) =>
    `${item.name} ${item.form} ${item.strength} ${item.id}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  return (
    <>
      {error && (
        <p role="alert" className="text-destructive mb-4">
          Unable to load the latest stock.{" "}
          <Button variant="link" onClick={() => void refresh()}>
            Retry
          </Button>
        </p>
      )}
      {data && (
        <StatCards
          metrics={[
            {
              label: "Catalogue medicines",
              value: String(medicines.length),
              tone: "blue",
            },
            {
              label: "Active medicines",
              value: String(medicines.filter((item) => item.isActive).length),
              tone: "sky",
            },
            {
              label: "Active medicines out of stock",
              value: String(
                medicines.filter((item) => item.isActive && item.quantityOnHand === 0)
                  .length
              ),
              tone: "red",
            },
          ]}
        />
      )}
      {message && (
        <p role="status" className="text-primary mb-4 text-sm">
          {message}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <Panel title="Medicine inventory">
          <div className="mb-5 flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1">
              <Input
                id="inventory-search"
                label="Search medicine"
                showLabel
                placeholder="Search name, form, strength or ID"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                controlSize="compact"
              />
            </div>
            <DialogTrigger render={<Button />} onClick={() => setSelected(undefined)}>
              Add medicine
            </DialogTrigger>
            <Button variant="outline" onClick={() => void refresh()}>
              Refresh
            </Button>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            Available quantity excludes expired batches. Receive stock to add a new batch.
          </p>
          {loading && (
            <LoadingRows
              label="Loading medicine inventory…"
              rowClassName="bg-carely-surface border-0"
            />
          )}
          <div className="space-y-3">
            {filtered.map((medicine) => (
              <article
                key={medicine.id}
                className="bg-carely-surface flex flex-wrap items-center justify-between gap-4 rounded-xl p-4"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{medicine.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {medicine.form} · {medicine.strength}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs break-all">
                    {medicine.id}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    Available: <strong>{medicine.quantityOnHand}</strong>
                  </p>
                  <p className="text-muted-foreground">
                    Next expiry: {medicine.nextExpiryDate ?? "No available batches"}
                  </p>
                  <StockBadge medicine={medicine} />
                </div>
                <div className="flex gap-3">
                  <DialogTrigger
                    render={<Button variant="outline" size="sm" />}
                    aria-label={`Edit ${medicine.name}`}
                    onClick={() => setSelected(medicine)}
                  >
                    Edit
                  </DialogTrigger>
                  <Link
                    href={`/pharmacy/stock?medicine=${medicine.id}`}
                    className="text-primary self-center text-sm font-semibold underline"
                  >
                    Stock batches
                  </Link>
                </div>
              </article>
            ))}
            {data && !filtered.length && (
              <p role="status" className="text-muted-foreground py-8 text-center text-sm">
                {medicines.length
                  ? "No medicines match your search."
                  : "No medicines yet. Add a medicine to get started."}
              </p>
            )}
          </div>
        </Panel>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? "Edit medicine" : "Add medicine"}</DialogTitle>
            <DialogDescription>
              Save the catalogue details. Stock is received separately in batches.
            </DialogDescription>
          </DialogHeader>
          <MedicineForm
            key={`${selected?.id ?? "new"}-${open}`}
            medicine={selected}
            onCancel={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              setMessage(selected ? "Medicine updated." : "Medicine added.");
              void refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
