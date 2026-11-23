import { Suspense, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/ui/avatar";
import { MobileNavigation, NavLinks } from "@/components/workspace/nav-links";
import { roleNavigation } from "@/lib/config/navigation";
import { appContent } from "@/lib/config/content";
import { getHospitalContact } from "@/lib/services/settings";

type AppShellProps = {
  children: ReactNode;
  role: keyof typeof roleNavigation;
  user: { name: string; detail: string; initials?: string };
};

const workspaceNames: Record<string, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Workspace",
  nurse: "Nurse Workspace",
  reception: "Front Desk Workspace",
  pharmacy: "Pharmacy Workspace",
  admin: "Admin Workspace",
};

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
      className={
        patient
          ? "bg-card hidden h-full w-68 shrink-0 flex-col border-r px-4 py-5 md:flex lg:px-5"
          : "bg-card hidden h-full w-60 shrink-0 flex-col border-r p-4 md:flex"
      }
    >
      {patient ? (
        <Brand />
      ) : (
        <div className="hidden md:block">
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            Care operations
          </p>
          <p className="mt-2 text-sm font-semibold">{workspaceNames[role]}</p>
        </div>
      )}
      <div className="mt-4">
        <HospitalCard name={hospital.name} />
      </div>
      <p className="text-muted-foreground mt-6 mb-2 text-xs font-semibold uppercase">
        {patient ? "My care" : "Navigation"}
      </p>
      <Suspense fallback={<div className="h-36" />}>
        <NavLinks role={role} />
      </Suspense>
      <div className="mt-auto space-y-4 pt-8">
        {patient ? (
          <div className="bg-carely-surface rounded-lg border p-4">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="text-muted-foreground mt-2 text-xs">
              {appContent.portal.supportNote}
            </p>
          </div>
        ) : (
          <div className="bg-carely-surface flex items-center gap-3 rounded-lg border p-3">
            <Avatar alt={user.name} fallback={user.initials} />
            <div>
              <p className="text-xs font-semibold">{user.name}</p>
              <p className="text-muted-foreground text-xs">{user.detail}</p>
            </div>
          </div>
        )}
        <LogoutButton />
      </div>
    </aside>
  );

  const desktopTopbar = (
    <div className="bg-card hidden min-h-18 items-center justify-between gap-4 border-b px-6 md:flex">
      <div>
        {!patient ? (
          <p className="text-primary text-xs font-semibold uppercase">
            {workspaceNames[role]}
          </p>
        ) : (
          <p className="text-primary text-xs font-semibold uppercase">
            {appContent.brand.patientPortal}
          </p>
        )}
        <p className="text-xs font-medium">{clinicDate.format(new Date())}</p>
      </div>
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
        <Avatar alt={user.name} fallback={user.initials} size={34} />
        <div className="hidden sm:block">
          <p className="text-xs font-semibold">{user.name}</p>
          <p className="text-muted-foreground text-xs">{user.detail}</p>
        </div>
      </div>
    </div>
  );

  const mobileTopbar = (
    <header
      className={`${patient ? "z-30 shrink-0" : "sticky top-0 z-30"} bg-card flex h-16 items-center justify-between border-b px-4 md:hidden`}
    >
      <Brand />
      <div className="flex items-center gap-2">
        <Avatar alt={user.name} fallback={user.initials} size={34} />
        <Suspense fallback={<div className="size-10" />}>
          <MobileNavigation role={role} user={user} />
        </Suspense>
      </div>
    </header>
  );

  if (patient)
    return (
      <div
        data-patient-shell
        className="bg-carely-surface flex h-dvh min-h-0 flex-col overflow-hidden"
      >
        {mobileTopbar}
        <div className="flex min-h-0 flex-1">
          {sidebar}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {desktopTopbar}
            <main className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </div>
    );

  return (
    <div className="bg-carely-surface flex h-dvh min-h-0 flex-col overflow-hidden">
      {mobileTopbar}
      <header className="bg-card hidden min-h-18 shrink-0 items-center border-b md:flex">
        <div className="w-60 shrink-0 px-5">
          <Brand />
        </div>
        <div className="min-w-0 flex-1">{desktopTopbar}</div>
      </header>
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <main className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
