import { useRecordingStatus } from "@/context/VoiceRecordingStatusContext";
import type { RecordingStatus } from "@/context/VoiceRecordingStatusContext";

const STATUS_CONFIG: Record<
  RecordingStatus,
  {
    label: string;
    className: string;
    dotClass: string;
  }
> = {
  ready: {
    label: "Ready",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dotClass: "bg-emerald-500",
  },

  recording: {
    label: "Recording",
    className: "bg-red-50 text-red-700 border border-red-200",
    dotClass: "bg-red-500 animate-pulse",
  },

  recorded: {
    label: "Recorded",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dotClass: "bg-amber-500",
  },

  processing: {
    label: "Processing",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
    dotClass: "bg-sky-500 animate-pulse",
  },
  failed: {
    label: "Failed",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
    dotClass: "bg-rose-500",
  },
  completed: {
    label: "Completed",
    className: "bg-green-50 text-green-700 border border-green-200",
    dotClass: "bg-green-500",
  },
};

export function StatusBadge() {
  const { status } = useRecordingStatus();
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-colors",
        config.className,
      ].join(" ")}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} />

      <span>{config.label}</span>
    </div>
  );
}
