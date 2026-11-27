"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useVisiblePolling<T>(url: string | null, intervalMs = 30_000) {
  const [result, setResult] = useState<{
    url: string | null;
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ url, data: null, error: null, loading: true });
  const controller = useRef<AbortController | null>(null);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    if (!url || document.visibilityState !== "visible") return;
    const requestVersion = ++version.current;
    controller.current?.abort();
    const pending = new AbortController();
    controller.current = pending;
    try {
      const response = await fetch(url, { cache: "no-store", signal: pending.signal });
      if (!response.ok) throw new Error("Unable to refresh.");
      const data = (await response.json()) as T;
      if (!pending.signal.aborted && requestVersion === version.current) {
        setResult({ url, data, error: null, loading: false });
      }
    } catch (cause) {
      if (!pending.signal.aborted && requestVersion === version.current) {
        setResult((previous) => ({
          url,
          data: previous.url === url ? previous.data : null,
          error: cause instanceof Error ? cause.message : "Unable to refresh.",
          loading: false,
        }));
      }
    } finally {
      if (controller.current === pending) controller.current = null;
    }
  }, [url]);

  const cancelPending = useCallback(() => {
    version.current++;
    controller.current?.abort();
  }, []);

  useEffect(() => {
    if (!url) return;
    const initial = window.setTimeout(() => void refresh(), 0);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
      else cancelPending();
    };
    const onFocus = () => {
      void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => void refresh(), intervalMs);
    return () => {
      cancelPending();
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [url, intervalMs, refresh, cancelPending]);
  // Hide data from the previous URL while its replacement loads.
  return {
    data: result.url === url ? result.data : null,
    error: result.url === url ? result.error : null,
    loading: Boolean(url && (result.url !== url || result.loading)),
    refresh,
  };
}
