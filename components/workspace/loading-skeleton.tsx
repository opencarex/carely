import type { ReactNode } from "react";

export function LoadingSkeleton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <p role="status" className="sr-only">
        {label}
      </p>
      <div aria-hidden="true">{children}</div>
    </>
  );
}
