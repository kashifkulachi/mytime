"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const confirmed = searchParams.get("confirmed");

    if (confirmed !== "true") {
      return;
    }

    toast.success("Email confirmed successfully.", {
      description: "Your account is now active and ready to use.",
      icon: <CheckCircle2 className="h-5 w-5" />,
    });

    router.replace("/dashboard", {
      scroll: false,
    });
  }, [router, searchParams]);

  return (
    <div className="p-6 lg:p-8">
      <div className="rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your health monitoring dashboard components will be added here.
        </p>
      </div>
    </div>
  );
}
