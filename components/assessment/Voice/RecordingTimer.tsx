import { Timer } from "lucide-react";

interface RecordingTimerProps {
  duration: number;
}

export default function RecordingTimer({ duration }: RecordingTimerProps) {
  const minutes = Math.floor(duration / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (duration % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border bg-muted/40 px-5 py-4">
      <Timer className="h-5 w-5 text-primary" />

      <span className="font-mono text-2xl font-semibold tracking-widest">
        {minutes}:{seconds}
      </span>
    </div>
  );
}
