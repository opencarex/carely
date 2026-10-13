import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageTitle, Panel, StatCards } from "@/components/workspace/workspace-ui";
import { adminRecentActivity } from "@/lib/mock/admin";
import { adminScreens } from "@/lib/mock/screens";

export const metadata: Metadata = { title: "Administration Dashboard" };
export const instant = false;

export default function AdminDashboardPage() {
  return (
    <>
      <PageTitle
        eyebrow="Administration"
        title="Hospital Overview"
        description="Staff and hospital operations at a glance."
      />
      <StatCards metrics={adminScreens.dashboard.metrics} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Recent activity" className="min-w-0 lg:col-span-2">
          <div className="space-y-3">
            {adminRecentActivity.map((item) => (
              <article
                key={item.time}
                className="bg-carely-surface flex flex-col gap-2 rounded-xl p-4 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4"
              >
                <time className="text-muted-foreground text-xs">{item.time}</time>
                <p className="text-primary text-sm font-semibold">{item.role}</p>
                <p className="text-sm sm:col-span-2">{item.description}</p>
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
              Review permissions
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
