"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SIDEBAR_ICON_SIZE } from "@/lib/constants/ui";
import { roleNavigation } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";
import { useWorkspaceNavigation } from "@/components/workspace/workspace-navigation";

const focusOutline =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function NavLinks({
  role,
  onSelection,
}: {
  role: keyof typeof roleNavigation;
  onSelection?: () => void;
}) {
  const pathname = usePathname();
  const { navigate } = useWorkspaceNavigation();
  const items = roleNavigation[role];
  const patient = role === "patient";
  return (
    <nav className="flex shrink-0 flex-col gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isWorkspaceRoot = item.href === `/${role}`;
        const active =
          pathname === item.href ||
          (!isWorkspaceRoot && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onNavigate={(event) => {
              // Track the transition in the shell, which stays mounted when the drawer closes.
              event.preventDefault();
              onSelection?.();
              navigate(item.href);
            }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
              focusOutline,
              patient ? "group rounded-lg transition-colors" : "rounded-md",
              active
                ? cn("bg-primary text-primary-foreground", patient && "shadow-sm")
                : "text-foreground hover:bg-secondary"
            )}
          >
            <span
              className={cn(
                "grid place-items-center rounded-md",
                patient ? "size-8 shrink-0 transition-colors" : "size-7",
                active
                  ? "bg-card text-primary"
                  : cn(
                      "bg-secondary text-muted-foreground",
                      patient && "group-hover:text-primary"
                    )
              )}
            >
              <Icon size={SIDEBAR_ICON_SIZE - 4} />
            </span>
            <span className={patient ? "min-w-0 truncate" : undefined}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavigation({
  role,
  patientAccount,
}: {
  role: keyof typeof roleNavigation;
  patientAccount?: { name: string; detail: string; initials: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "bg-card grid size-10 place-items-center rounded-md border",
          focusOutline
        )}
        aria-label="Open navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="bg-foreground/30" />
        <DialogPrimitive.Popup className="bg-card fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain p-4 shadow-xl">
          <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
          <div className="mb-6 flex shrink-0 items-center gap-2">
            {patientAccount && (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar alt={patientAccount.name} fallback={patientAccount.initials} />
                <div>
                  <p className="text-sm font-semibold wrap-anywhere">
                    {patientAccount.name}
                  </p>
                  <p className="text-muted-foreground text-xs">{patientAccount.detail}</p>
                </div>
              </div>
            )}
            <DialogClose
              className={cn(
                "hover:bg-secondary ml-auto grid size-10 shrink-0 place-items-center rounded-md",
                focusOutline
              )}
              aria-label="Close navigation"
            >
              <X size={20} aria-hidden="true" />
            </DialogClose>
          </div>
          <NavLinks role={role} onSelection={() => setOpen(false)} />
          <div className="mt-auto shrink-0 pt-4">
            <LogoutButton />
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}

export { MobileNavigation, NavLinks };
