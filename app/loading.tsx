import { appContent } from "@/lib/mock/content";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-carely-surface flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="relative mb-4 flex items-center justify-center">
        <div className="border-primary/20 border-t-primary size-10 animate-spin rounded-full border-[3px]" />
      </div>

      <div className="max-w-xs space-y-1">
        <h2 className="text-foreground text-base font-semibold tracking-tight">
          Loading {appContent.brand.name}
        </h2>
      </div>
    </div>
  );
}
