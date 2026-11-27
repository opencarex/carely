"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";

const WorkspaceNavigationContext = createContext<{
  navigate: (href: string) => void;
  isPending: boolean;
} | null>(null);

export function WorkspaceNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(href: string) {
    startTransition(() => router.push(href));
  }

  return (
    <WorkspaceNavigationContext.Provider value={{ navigate, isPending }}>
      {children}
    </WorkspaceNavigationContext.Provider>
  );
}

export function useWorkspaceNavigation() {
  const navigation = useContext(WorkspaceNavigationContext);
  if (!navigation) throw new Error("Workspace navigation requires its provider.");
  return navigation;
}

export function WorkspaceNavigationProgress() {
  const { isPending } = useWorkspaceNavigation();
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
      {isPending && <PendingProgress />}
    </div>
  );
}

function PendingProgress() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <>
      <span className="sr-only">Loading page…</span>
      <div aria-hidden="true" className="bg-primary/15 h-0.5 overflow-hidden">
        <div className="bg-primary h-full w-1/3 motion-safe:animate-[workspace-progress_1.2s_ease-in-out_infinite]" />
      </div>
    </>
  );
}
