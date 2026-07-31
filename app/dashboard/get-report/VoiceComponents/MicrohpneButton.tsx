import { useRecordingStatus } from "@/context/VoiceRecordingStatusContext";
import { Mic } from "lucide-react";
import type { RecordingStatus } from "@/context/VoiceRecordingStatusContext";

interface Props {
  onClick?: () => void;
}

const STATUS_BG: Record<RecordingStatus, string> = {
  ready: "bg-emerald-200",
  recording: "bg-red-200",
  recorded: "bg-amber-200",
  processing: "bg-sky-200",
  completed: "bg-green-200",
  failed: "bg-red-300",
};

export function MicrophoneButton({ onClick }: Props) {
  const { status } = useRecordingStatus();
  return (
    <button onClick={onClick} className="relative mt-4 mb-4 group">
      {status === "ready" && (
        <div className="absolute -inset-2 rounded-full border-2 border-emerald-200" />
      )}

      {status === "recording" && (
        <div className="absolute -inset-2 rounded-full border-4 border-red-200 animate-pulse" />
      )}

      {status === "recorded" && (
        <div className="absolute -inset-2 rounded-full border-2 border-amber-200" />
      )}

      {status === "processing" && (
        <div className="absolute -inset-2 rounded-full border-4 border-sky-200 animate-pulse" />
      )}

      {status === "completed" && (
        <div className="absolute -inset-2 rounded-full border-2 border-green-300" />
      )}

      <div
        className={`w-24 h-24 rounded-full   flex items-center justify-center shadow-md border border-outline-variant transition-all duration-300 group-hover:bg-surface-container-highest ${STATUS_BG[status]}`}
      >
        <span className="material-symbols-outlined text-4xl text-primary">
          <Mic />
        </span>
      </div>
    </button>
  );
}
