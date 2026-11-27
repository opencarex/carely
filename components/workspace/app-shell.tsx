import { Suspense, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/ui/avatar";
import { MobileNavigation, NavLinks } from "@/components/workspace/nav-links";
import {
  WorkspaceNavigationProgress,
  WorkspaceNavigationProvider,
} from "@/components/workspace/workspace-navigation";
import { roleNavigation } from "@/lib/config/navigation";
import { appContent } from "@/lib/config/content";
import { getHospitalContact } from "@/lib/services/settings";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  role: keyof typeof roleNavigation;
  user: { name: string; detail: string; initials?: string };
};

const workspaceNames: Record<string, string> = {
  doctor: "Doctor Workspace",
  nurse: "Nurse Workspace",
  reception: "Front Desk Workspace",
  pharmacy: "Pharmacy Workspace",
  admin: "Admin Workspace",
};

// Allow room for the patient sidebar's six links, help card, and logout footer.
const hideWhenSidebarVisible = "[@media(min-width:48rem)_and_(min-height:48rem)]:hidden";

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-md font-bold">
        {appContent.brand.initials}
      </span>
      <div>
        <p className="text-primary font-bold">{appContent.brand.name}</p>
        <p className="text-muted-foreground text-xs">{appContent.brand.descriptor}</p>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const clinicDate = new Intl.DateTimeFormat("en-LK", {
  dateStyle: "full",
  timeZone: "Asia/Colombo",
});

function HospitalCard({ name }: { name: string }) {
  return (
    <div className="bg-carely-surface flex items-center gap-3 rounded-lg border p-3">
      <span className="bg-secondary text-primary grid size-8 place-items-center rounded-md text-xs font-bold">
        {initials(name)}
      </span>
      <div>
        <p className="text-xs font-semibold">{name}</p>
        <p className="text-muted-foreground text-xs">Patient services</p>
      </div>
    </div>
  );
}

async function AppShell({ children, role, user: account }: AppShellProps) {
  const patient = role === "patient";
  const hospital = await getHospitalContact();
  const user = {
    ...account,
    initials: account.initials ?? (initials(account.name) || "CA"),
  };

  const sidebar = (
    <aside
      className={cn(
        "bg-card hidden h-full shrink-0 flex-col border-r [@media(min-width:48rem)_and_(min-height:48rem)]:flex",
        patient ? "w-68 px-4 py-5 lg:px-5" : "w-60 p-4"
      )}
    >
      {patient && <Brand />}
      <div className={patient ? "mt-4" : undefined}>
        <HospitalCard name={hospital.name} />
      </div>
      <p className="text-muted-foreground mt-6 mb-2 text-xs font-semibold uppercase">
        {patient ? "My care" : "Navigation"}
      </p>
      <Suspense fallback={<div className="h-36" />}>
        <NavLinks role={role} />
      </Suspense>
      <div className="mt-auto pt-4">
        {patient && (
          <div className="bg-carely-surface mb-2 rounded-lg border p-3">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {appContent.portal.supportNote}
            </p>
          </div>
        )}
        <LogoutButton />
      </div>
    </aside>
  );

  const topbar = (
    <header className="bg-card relative flex min-h-16 shrink-0 items-center gap-3 border-b px-4 md:min-h-18 md:gap-4 md:px-6">
      <div className={cn("shrink-0", patient ? hideWhenSidebarVisible : "md:w-56")}>
        <Brand />
      </div>
      <div className="hidden md:block">
        <p className="text-primary text-xs font-semibold uppercase">
          {patient ? appContent.brand.patientPortal : workspaceNames[role]}
        </p>
        <p className="text-xs font-medium">{clinicDate.format(new Date())}</p>
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-2 md:gap-3">
        <div className="flex min-w-0 items-center gap-2 md:gap-3 md:rounded-lg md:border md:px-3 md:py-2">
          <Avatar
            alt={user.name}
            fallback={user.initials}
            size={34}
            className={patient ? undefined : "hidden min-[400px]:inline-flex"}
          />
          <div className={cn("min-w-0", patient && "hidden md:block")}>
            <p className="truncate text-xs font-semibold" title={user.name}>
              {user.name}
            </p>
            <p className="text-muted-foreground text-xs">{user.detail}</p>
          </div>
        </div>
        <div className={cn("shrink-0", hideWhenSidebarVisible)}>
          <Suspense fallback={<div className="size-10" />}>
            <MobileNavigation role={role} patientAccount={patient ? user : undefined} />
          </Suspense>
        </div>
      </div>
      <WorkspaceNavigationProgress />
    </header>
  );

  const main = (
    <main className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </main>
  );

  const shell = patient ? (
    <div
      data-patient-shell
      className="bg-carely-surface flex h-dvh min-h-0 flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {topbar}
          {main}
        </div>
      </div>
    </div>
  ) : (
    <div className="bg-carely-surface flex h-dvh min-h-0 flex-col overflow-hidden">
      {topbar}
      <div className="flex min-h-0 flex-1">
        {sidebar}
        {main}
      </div>
    </div>
  );

  return <WorkspaceNavigationProvider>{shell}</WorkspaceNavigationProvider>;
}

export { AppShell };
