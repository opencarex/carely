"use client";

import { useState, type FormEvent } from "react";
import { usePharmacyDemo } from "@/components/pharmacy/pharmacy-demo-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Panel } from "@/components/workspace/workspace-ui";
import { pharmacyPrescriptions } from "@/lib/mock/pharmacy";
import { cn } from "@/lib/utils";

export function PrescriptionWorkbench() {
  const { prescriptions, setPrescriptions, medicines, updateStock } = usePharmacyDemo();
  const [query, setQuery] = useState("");
  const [referenceTime] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    pharmacyPrescriptions[0].id
  );
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = prescriptions.filter((item) =>
    `${item.id} ${item.patientId} ${item.patientName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const prescription = filtered.find((item) => item.id === selectedId);
  const rows =
    prescription?.medicines.map((item) => ({
      ...item,
      stock: medicines.find((stock) => stock.id === item.medicineId)!,
    })) ?? [];
  const hasStock =
    rows.length > 0 &&
    rows.every(
      (item) =>
        item.stock.quantity >= item.required &&
        item.stock.expiry &&
        new Date(`${item.stock.expiry}T23:59:59`).getTime() > referenceTime
    );
  const canDispense = prescription?.status === "Pending" && hasStock;
  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    setSearch(term);
    setMessage("");
    const first = prescriptions.find((item) =>
      `${item.id} ${item.patientId} ${item.patientName}`
        .toLowerCase()
        .includes(term.toLowerCase())
    );
    setSelectedId(first?.id ?? null);
  }
  function dispense() {
    if (
      !prescription ||
      !canDispense ||
      !rows.every(
        (item) => new Date(`${item.stock.expiry}T23:59:59`).getTime() > Date.now()
      )
    ) {
      setMessage(
        "This prescription cannot be dispensed. Review its status and available stock."
      );
      setOpen(false);
      return;
    }
    rows.forEach((item) =>
      updateStock({
        ...item.stock,
        quantity: item.stock.quantity - item.required,
        updated: "Just now by A. Silva",
      })
    );
    setPrescriptions((previous) =>
      previous.map((item) =>
        item.id === prescription.id ? { ...item, status: "Dispensed" } : item
      )
    );
    setOpen(false);
    setMessage(
      `${prescription.id} fully dispensed in this demo. Stock quantities have been reduced for this session.`
    );
  }
  return (
    <>
      <form
        onSubmit={find}
        className="bg-card mb-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <Input
            id="prescription-search"
            label="Search prescriptions"
            showLabel
            placeholder="Search by patient ID or prescription ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            controlSize="compact"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>
      {message && (
        <p role="status" className="text-primary mb-4 text-sm">
          {message}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Patient prescriptions" className="min-w-0">
          <p className="text-muted-foreground mb-4 text-xs">
            All statuses &middot; {filtered.length} results
          </p>
          <div className="mb-4 lg:hidden">
            <label
              htmlFor="prescription-selection"
              className="mb-2 block text-xs font-semibold"
            >
              Select a prescription
            </label>
            <Select
              value={selectedId}
              items={filtered.map((item) => ({
                value: item.id,
                label: item.id + " - " + item.patientName + " (" + item.status + ")",
              }))}
              onValueChange={(value) => {
                if (value) setSelectedId(value);
              }}
            >
              <SelectTrigger id="prescription-selection" className="min-w-0 gap-2">
                <SelectValue
                  className="min-w-0 truncate"
                  placeholder="Select a prescription"
                />
              </SelectTrigger>
              <SelectContent className="max-h-80 max-w-[calc(100vw-2rem)] overflow-y-auto">
                {filtered.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.id} - {item.patientName} ({item.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden space-y-3 lg:block">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={selectedId === item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setMessage("");
                }}
                className={cn(
                  "focus-visible:ring-ring/40 w-full rounded-xl p-4 text-left outline-none focus-visible:ring-2",
                  selectedId === item.id
                    ? "bg-secondary"
                    : "bg-carely-surface hover:bg-secondary/60"
                )}
              >
                <span className="text-primary block text-sm font-semibold">
                  {item.id}
                </span>
                <span className="mt-1 block text-sm">
                  {item.patientName} &middot; {item.patientId}
                </span>
                <span className="text-muted-foreground mt-2 block text-xs">
                  {item.status} &middot; {item.issued}
                </span>
              </button>
            ))}
            {!filtered.length && (
              <p role="status" className="text-muted-foreground py-6 text-center text-sm">
                No matching prescriptions.
              </p>
            )}
          </div>
          {!filtered.length && (
            <p role="status" className="text-muted-foreground py-4 text-sm lg:hidden">
              No matching prescriptions.
            </p>
          )}
        </Panel>
        {prescription ? (
          <Panel
            title={`Prescription ${prescription.id}`}
            className="min-w-0 lg:col-span-2"
          >
            <Badge
              className={
                prescription.status === "Dispensed"
                  ? "bg-carely-success-soft text-carely-success"
                  : ""
              }
            >
              {prescription.status === "Pending"
                ? "Pending dispensing"
                : prescription.status}
            </Badge>
            <h3 className="mt-4 text-sm font-semibold">
              {prescription.patientName} &middot; {prescription.patientId}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Prescribed by {prescription.doctor} &middot; {prescription.department}{" "}
              &middot; {prescription.issued}
            </p>
            <h3 className="mt-5 mb-3 text-sm font-semibold">Prescribed medicines</h3>
            <div className="space-y-3">
              {rows.map((item) => (
                <article key={item.medicineId} className="rounded-xl border p-4">
                  <h4 className="text-sm font-semibold">{item.stock.name}</h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {item.directions} &middot; {item.duration}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs">Required</dt>
                      <dd className="mt-1">
                        {item.required} {item.stock.unit}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Available</dt>
                      <dd
                        className={cn(
                          "mt-1",
                          item.stock.quantity < item.required && "text-destructive"
                        )}
                      >
                        {item.stock.quantity} {item.stock.unit}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            {prescription.status === "Pending" && (
              <p
                className={cn(
                  "mt-4 text-sm",
                  hasStock ? "text-primary" : "text-destructive"
                )}
              >
                {hasStock
                  ? "Stock available for full dispensing"
                  : "Full dispensing unavailable. Check stock quantity and expiry before continuing."}
              </p>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedId(null);
                    setMessage("");
                  }}
                >
                  Back to results
                </Button>
                <DialogTrigger render={<Button disabled={!canDispense} />}>
                  Confirm Dispensing
                </DialogTrigger>
              </div>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm full dispensing</DialogTitle>
                  <DialogDescription>
                    {prescription.patientName} &middot; {prescription.patientId} &middot;{" "}
                    {prescription.id}
                  </DialogDescription>
                </DialogHeader>
                <ul className="space-y-2 text-sm">
                  {rows.map((item) => (
                    <li key={item.medicineId}>
                      {item.stock.name} &middot; {item.required} {item.stock.unit}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground text-xs">
                  Confirming dispenses the complete prescription once and reduces the demo
                  stock.
                </p>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Back to review
                  </DialogClose>
                  <Button onClick={dispense} disabled={!canDispense}>
                    Confirm Dispensing
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Panel>
        ) : (
          <Panel title="Prescription details" className="min-w-0 lg:col-span-2">
            <p className="text-muted-foreground text-sm">
              Select a prescription from the results to review its medicines.
            </p>
          </Panel>
        )}
      </div>
    </>
  );
}
