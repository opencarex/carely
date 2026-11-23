import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageTitle, Panel, StatCards } from "@/components/workspace/workspace-ui";
import { requireRole } from "@/lib/auth-guard";
import { getAdminOverview } from "@/lib/services/admin-overview";

export const metadata: Metadata = { title: "Administration Dashboard" };
export const instant = false;

const activityTime = new Intl.DateTimeFormat("en-LK", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Colombo",
});

export default async function AdminDashboardPage() {
  const { user } = await requireRole("admin");
  const { staffCount, scheduledDoctors, openQueues, entries } = await getAdminOverview({
    userId: user.id,
    role: user.role,
  });
  return (
    <>
      <PageTitle
        eyebrow="Administration"
        title="Hospital Overview"
        description="Staff and hospital operations at a glance."
      />
      <StatCards
        metrics={[
          { label: "Active staff", value: String(staffCount), tone: "blue" },
          {
            label: "Doctors scheduled today",
            value: String(scheduledDoctors),
            tone: "blue",
          },
          { label: "Open queues", value: String(openQueues), tone: "sky" },
        ]}
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Recent activity" className="min-w-0 lg:col-span-2">
          <div className="space-y-3">
            {entries.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No audit events recorded yet.
              </p>
            )}
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="bg-carely-surface flex flex-col gap-2 rounded-xl p-4 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4"
              >
                <time
                  dateTime={entry.createdAt}
                  className="text-muted-foreground text-xs"
                >
                  {activityTime.format(new Date(entry.createdAt))}
                </time>
                <p className="text-primary text-sm font-semibold capitalize">
                  {entry.actorRole ?? "System"}
                </p>
                <p className="text-sm wrap-break-word sm:col-span-2">{entry.action}</p>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Quick actions">
          <div className="space-y-3">
            <Link href="/admin/staff" className={buttonVariants({ fullWidth: true })}>
              Add staff member
            </Link>
            <Link
              href="/admin/settings"
              className={buttonVariants({ fullWidth: true, variant: "outline" })}
            >
              Manage hospital settings
            </Link>
            <Link
              href="/admin/audit"
              className={buttonVariants({ fullWidth: true, variant: "outline" })}
            >
              Open audit trail
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}
