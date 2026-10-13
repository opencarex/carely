"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Panel } from "@/components/workspace/workspace-ui";
import { adminAuditEntries, type AuditEntry } from "@/lib/mock/admin";

export function AuditTrail() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const filtered = adminAuditEntries.filter((entry) => {
    const matchesQuery = [
      entry.id,
      entry.action,
      entry.description,
      entry.actor,
      entry.actorRole,
      entry.resource,
      entry.department,
      entry.date,
      entry.time,
    ].some((value) => value.toLowerCase().includes(query.trim().toLowerCase()));
    return (
      matchesQuery &&
      (category === "All" || entry.category === category) &&
      (!date || entry.date === date)
    );
  });
  function exportLog() {
    const columns = [
      "Event ID",
      "Date",
      "Time",
      "Actor",
      "Role",
      "Action",
      "Resource",
      "Department",
    ];
    const rows = filtered.map((entry) => [
      entry.id,
      entry.date,
      entry.time,
      entry.actor,
      entry.actorRole,
      entry.action,
      entry.resource,
      entry.department,
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "carely-audit-log.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 sm:col-span-2">
            <Input
              id="audit-search"
              label="Search activity log"
              showLabel
              placeholder="Filter by actor, action, patient ID or date"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              controlSize="compact"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="audit-category" className="block text-xs font-semibold">
              Category
            </label>
            <Select
              value={category}
              onValueChange={(value) => {
                if (value) setCategory(value);
              }}
            >
              <SelectTrigger id="audit-category" className="min-h-11 sm:min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "Patient", "Clinical", "Inventory", "Security"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value === "All" ? "All categories" : value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            id="audit-date"
            label="Date"
            showLabel
            type="date"
            controlSize="compact"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {filtered.length} of {adminAuditEntries.length} events shown
          </p>
          <Button variant="outline" onClick={exportLog}>
            <Download />
            Export filtered log
          </Button>
        </div>
      </Card>
      {selected && (
        <Panel
          title="Event details"
          action={
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close event details"
              onClick={() => setSelected(null)}
            >
              <X />
            </Button>
          }
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Event ID", selected.id],
              ["Date and time", `${selected.date} ${selected.time}`],
              ["Actor", selected.actor],
              ["Role", selected.actorRole],
              ["Action", selected.action],
              ["Resource", selected.resource],
              ["Department", selected.department],
              ["Description", selected.description],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-muted-foreground text-xs">{label}</dt>
                <dd className="mt-1 font-medium wrap-break-word">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}
      <Panel title="Activity log">
        <div className="space-y-3">
          {filtered.map((entry) => (
            <article key={entry.id} className="bg-carely-surface rounded-xl p-4">
              <div className="flex flex-col gap-4 xl:grid xl:grid-cols-12 xl:items-center">
                <time
                  dateTime={`${entry.date}T${entry.time}`}
                  className="text-muted-foreground text-xs xl:col-span-1"
                >
                  {entry.time}
                </time>
                <div className="min-w-0 xl:col-span-2">
                  <p className="text-sm font-semibold">{entry.actor}</p>
                  <p className="text-muted-foreground mt-1 text-xs xl:hidden">
                    {entry.actorRole}
                  </p>
                </div>
                <p className="text-primary text-xs font-semibold wrap-break-word xl:col-span-3">
                  {entry.action}
                </p>
                <dl className="grid grid-cols-2 gap-3 text-sm xl:col-span-4">
                  <div>
                    <dt className="text-muted-foreground text-xs xl:sr-only">Resource</dt>
                    <dd className="mt-1 break-all xl:mt-0">{entry.resource}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs xl:sr-only">
                      Department
                    </dt>
                    <dd className="mt-1 xl:mt-0">{entry.department}</dd>
                  </div>
                </dl>
                <Button
                  variant="link"
                  size="sm"
                  className="justify-start xl:col-span-2 xl:justify-end"
                  onClick={() => setSelected(entry)}
                  aria-label={`View details for ${entry.id}`}
                >
                  View details
                </Button>
              </div>
            </article>
          ))}
          {!filtered.length && (
            <div role="status" className="py-8 text-center">
              <p className="font-semibold">No matching events</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Change the search, category or date filter.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setDate("");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
