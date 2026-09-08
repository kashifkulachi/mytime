import { Activity, HeartPulse, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[100vh] items-center justify-center bg-surface px-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-primary/10" />

          <div className="absolute inset-2 animate-ping rounded-full bg-primary/5" />

          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/30" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-background shadow-lg shadow-primary/5">
            <HeartPulse className="h-8 w-8 text-primary" strokeWidth={1.8} />
          </div>

          <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <Activity className="h-4 w-4 animate-pulse text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
