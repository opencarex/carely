"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/components/workspace/workspace-ui";
import { LoadingRows } from "@/components/workspace/loading-skeleton";

type AuditEntry = {
  id: string;
  userId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type AuditResponse = {
  entries: AuditEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type AuditFilters = {
  user: string;
  action: string;
  from: string;
  to: string;
};

const emptyFilters: AuditFilters = { user: "", action: "", from: "", to: "" };
const emptyPagination: AuditResponse["pagination"] = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
};

const colomboTimestamp = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  dateStyle: "medium",
  timeStyle: "medium",
  hourCycle: "h23",
});

function formatTimestamp(value: string) {
  return colomboTimestamp.format(new Date(value));
}

function actorLabel(entry: AuditEntry) {
  return entry.actorName ?? (entry.userId ? "Deleted user" : "System");
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function AuditTrail() {
  const [draftFilters, setDraftFilters] = useState<AuditFilters>(emptyFilters);
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { user, action, from, to } = filters;
  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (user) search.set("user", user);
    if (action) search.set("action", action);
    if (from) search.set("from", from);
    if (to) search.set("to", to);

    async function loadAuditLog() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/audit?${search}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json()) as AuditResponse & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to load audit events.");
        if (controller.signal.aborted) return;
        setEntries(body.entries);
        setPagination(body.pagination);
        setHasLoaded(true);
        setSelected((current) =>
          current ? (body.entries.find((entry) => entry.id === current.id) ?? null) : null
        );
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setEntries([]);
        setHasLoaded(false);
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load audit events."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAuditLog();
    return () => controller.abort();
  }, [action, from, page, pageSize, refreshKey, to, user]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters({
      user: draftFilters.user.trim(),
      action: draftFilters.action.trim(),
      from: draftFilters.from,
      to: draftFilters.to,
    });
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  }

  function exportPage() {
    const columns = [
      "Event ID",
      "Date and time (Asia/Colombo)",
      "Actor",
      "Role",
      "User ID",
      "Action",
      "Entity type",
      "Entity ID",
      "Metadata",
    ];
    const rows = entries.map((entry) => [
      entry.id,
      formatTimestamp(entry.createdAt),
      actorLabel(entry),
      entry.actorRole ?? "",
      entry.userId ?? "",
      entry.action,
      entry.entityType,
      entry.entityId,
      JSON.stringify(entry.metadata),
    ]);
    const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `carely-audit-log-page-${pagination.page}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const totalPages = Math.max(1, pagination.totalPages);
  const firstShown = pagination.total === 0 ? 0 : (pagination.page - 1) * pageSize + 1;
  const lastShown = Math.min(pagination.page * pageSize, pagination.total);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <form onSubmit={applyFilters}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Input
              id="audit-user"
              label="User"
              showLabel
              placeholder="Name, email or user ID"
              value={draftFilters.user}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, user: event.target.value }))
              }
              controlSize="compact"
            />
            <Input
              id="audit-action"
              label="Action"
              showLabel
              placeholder="For example, appointment.booked"
              value={draftFilters.action}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, action: event.target.value }))
              }
              controlSize="compact"
            />
            <Input
              id="audit-from"
              label="From date"
              showLabel
              type="date"
              value={draftFilters.from}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, from: event.target.value }))
              }
              controlSize="compact"
            />
            <Input
              id="audit-to"
              label="To date"
              showLabel
              type="date"
              value={draftFilters.to}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, to: event.target.value }))
              }
              controlSize="compact"
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {hasLoaded && (
              <p className="text-muted-foreground text-sm" role="status">
                {loading
                  ? "Updating audit events…"
                  : `Showing ${firstShown}-${lastShown} of ${pagination.total} events`}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
              <Button type="submit" disabled={loading}>
                Apply filters
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={exportPage}
                disabled={entries.length === 0}
              >
                <Download />
                Export current page
              </Button>
            </div>
          </div>
        </form>
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
              ["Date and time", formatTimestamp(selected.createdAt)],
              ["Actor", actorLabel(selected)],
              ["Actor role", selected.actorRole ?? "System"],
              ["User ID", selected.userId ?? "Not available"],
              ["Action", selected.action],
              ["Entity type", selected.entityType],
              ["Entity ID", selected.entityId],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-muted-foreground text-xs">{label}</dt>
                <dd className="mt-1 font-medium wrap-break-word">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <p className="text-muted-foreground text-xs">Metadata</p>
            <pre className="bg-carely-surface mt-1 overflow-x-auto rounded-xl p-3 text-xs">
              {Object.keys(selected.metadata).length
                ? JSON.stringify(selected.metadata, null, 2)
                : "No metadata"}
            </pre>
          </div>
        </Panel>
      )}

      <Panel title="Activity log">
        <div className="space-y-3">
          {error && (
            <div role="alert" className="py-8 text-center">
              <p className="font-semibold">Audit events could not be loaded</p>
              <p className="text-muted-foreground mt-1 text-sm">{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setRefreshKey((current) => current + 1)}
              >
                Try again
              </Button>
            </div>
          )}
          {loading && !hasLoaded && (
            <LoadingRows
              label="Loading audit events…"
              rowClassName="bg-carely-surface border-0"
            />
          )}
          {!error &&
            entries.map((entry) => (
              <article key={entry.id} className="bg-carely-surface rounded-xl p-4">
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-12 xl:items-center">
                  <time
                    dateTime={entry.createdAt}
                    className="text-muted-foreground text-xs xl:col-span-2"
                  >
                    {formatTimestamp(entry.createdAt)}
                  </time>
                  <div className="min-w-0 xl:col-span-2">
                    <p className="text-sm font-semibold">{actorLabel(entry)}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {entry.actorRole ?? "System"}
                    </p>
                  </div>
                  <p className="text-primary text-xs font-semibold wrap-break-word xl:col-span-3">
                    {entry.action}
                  </p>
                  <dl className="text-sm xl:col-span-3">
                    <dt className="text-muted-foreground text-xs">Target</dt>
                    <dd className="mt-1 break-all">
                      {entry.entityType}: {entry.entityId}
                    </dd>
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
          {!error && !loading && entries.length === 0 && (
            <div role="status" className="py-8 text-center">
              <p className="font-semibold">No matching events</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Change the user, action or date-range filters.
              </p>
              <Button className="mt-4" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                if (!value) return;
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="min-h-9 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              Page {pagination.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || pagination.totalPages === 0 || page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
