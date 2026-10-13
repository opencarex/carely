"use client";

import { useState } from "react";
import { usePharmacyDemo } from "@/components/pharmacy/pharmacy-demo-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Panel, StatCards } from "@/components/workspace/workspace-ui";
import { StockItemForm } from "@/components/pharmacy/stock-item-form";
import { StockBadge } from "@/components/pharmacy/stock-badge";
import {
  pharmacyMedicines,
  displayExpiry,
  type MedicineStock,
} from "@/lib/mock/pharmacy";

export function MedicineInventory() {
  const { medicines, updateStock } = usePharmacyDemo();
  const [query, setQuery] = useState("");
  const [referenceTime] = useState(() => Date.now());
  const [selected, setSelected] = useState<MedicineStock>(pharmacyMedicines[1]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = medicines.filter((item) =>
    `${item.name} ${item.id}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  const expiring = medicines.filter(
    (item) =>
      item.expiry &&
      item.quantity > 0 &&
      new Date(item.expiry).getTime() >= referenceTime &&
      new Date(item.expiry).getTime() <= referenceTime + 90 * 86400000
  ).length;
  return (
    <>
      <StatCards
        metrics={[
          { label: "Demo stock items", value: String(medicines.length), tone: "blue" },
          {
            label: "Low stock",
            value: String(
              medicines.filter(
                (item) => item.quantity > 0 && item.quantity < item.threshold
              ).length
            ),
            tone: "amber",
          },
          {
            label: "Out of stock",
            value: String(medicines.filter((item) => item.quantity === 0).length),
            tone: "red",
          },
          { label: "Expiring within 90 days", value: String(expiring), tone: "sky" },
        ]}
      />
      {message && (
        <p role="status" className="text-primary mb-4 text-sm">
          {message}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <Panel title="Medicine inventory">
          <div className="mb-5">
            <Input
              id="inventory-search"
              label="Search medicine"
              showLabel
              placeholder="Search medicine name or ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              controlSize="compact"
            />
          </div>
          <div className="space-y-3">
            {filtered.map((medicine) => (
              <article
                key={medicine.id}
                className="bg-carely-surface flex flex-col gap-4 rounded-xl p-4 xl:grid xl:grid-cols-12 xl:items-center"
              >
                <div className="min-w-0 xl:col-span-3">
                  <h3 className="text-sm font-semibold">{medicine.name}</h3>
                  <p className="text-muted-foreground mt-1 text-xs">{medicine.id}</p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm xl:col-span-3">
                  <div>
                    <dt className="text-muted-foreground text-xs">Quantity</dt>
                    <dd className="mt-1">{medicine.quantity}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Reorder</dt>
                    <dd className="mt-1">{medicine.threshold}</dd>
                  </div>
                </dl>
                <div className="xl:col-span-2">
                  <StockBadge medicine={medicine} />
                </div>
                <p className="text-muted-foreground text-sm xl:col-span-3">
                  Expiry {displayExpiry(medicine.expiry)}
                </p>
                <DialogTrigger
                  render={
                    <Button
                      variant="link"
                      size="sm"
                      className="justify-start xl:col-span-1"
                    />
                  }
                  aria-label={`Edit ${medicine.name}`}
                  onClick={() => setSelected(medicine)}
                >
                  Edit
                </DialogTrigger>
              </article>
            ))}
            {!filtered.length && (
              <p role="status" className="text-muted-foreground py-8 text-center text-sm">
                No medicines match your search.
              </p>
            )}
          </div>
        </Panel>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit stock item</DialogTitle>
            <DialogDescription>
              Update quantity, reorder threshold and expiry details.
            </DialogDescription>
          </DialogHeader>
          <StockItemForm
            key={`${selected.id}-${open}`}
            medicine={selected}
            onCancel={() => setOpen(false)}
            onSave={(medicine) => {
              updateStock(medicine);
              setOpen(false);
              setMessage(`${medicine.name} updated in this demo session.`);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
