"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    setSignOutFailed(false);
    try {
      const result = await authClient.signOut({ fetchOptions: { throw: true } });
      if (!result?.success) throw new Error("Sign-out did not complete.");
      window.location.replace("/login");
    } catch {
      setSignOutFailed(true);
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        fullWidth
        disabled={isSigningOut}
        focusableWhenDisabled
        onClick={handleLogout}
        className="border-destructive text-destructive hover:bg-destructive/10 focus-visible:ring-ring focus-visible:ring-offset-card justify-start focus-visible:ring-offset-2"
      >
        <LogOut aria-hidden="true" />
        {isSigningOut ? "Logging out…" : "Log out"}
      </Button>
      {signOutFailed && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          Unable to log out. Please try again.
        </p>
      )}
    </>
  );
}
