"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { logoutAction } from "@/app/(auth)/logout/actions";

export default function LogoutButton() {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await logoutAction();

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message || "Logged out successfully.");

        /**
         * replace() prevents the user from simply navigating
         * back to the previous protected dashboard URL.
         */
        router.replace("/login");

        /**
         * Forces Server Components to re-evaluate using the
         * now-cleared Supabase authentication cookies.
         */
        router.refresh();
      } catch (error) {
        console.error("Unexpected logout client error:", error);

        toast.error("Unable to log out right now. Please try again.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      aria-busy={isPending}
      className="flex w-full cursor-pointer items-center gap-3 py-3 text-left text-on-surface-variant transition-colors duration-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}

      <span>{isPending ? "Signing Out..." : "Sign Out"}</span>
    </button>
  );
}
