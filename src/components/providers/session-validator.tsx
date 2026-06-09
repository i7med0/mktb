"use client";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { checkSessionToken } from "@/app/actions/auth";

export function SessionValidator() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.role === "OFFICE") {
      const validate = async () => {
        const isValid = await checkSessionToken((session.user as any).sessionToken);
        if (!isValid) {
          signOut({ callbackUrl: "/login?error=session_expired" });
        }
      };

      validate(); // Check immediately on mount
      const interval = setInterval(validate, 60000); // Check every 60 seconds instead of 5
      return () => clearInterval(interval);
    }
  }, [session]);

  return null;
}
