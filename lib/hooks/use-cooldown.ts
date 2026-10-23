"use client";

import { useCallback, useEffect, useState } from "react";

export function useCooldown(initialSeconds: number = 60) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const startCooldown = useCallback(
    (seconds: number = initialSeconds) => {
      setCountdown(seconds);
    },
    [initialSeconds]
  );

  const resetCooldown = useCallback(() => {
    setCountdown(0);
  }, []);

  return {
    countdown,
    isCoolingDown: countdown > 0,
    startCooldown,
    resetCooldown,
  };
}
