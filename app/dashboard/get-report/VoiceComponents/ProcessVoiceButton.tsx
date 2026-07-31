"use client";

import { ArrowRight, Loader2Icon } from "lucide-react";
import { useRecordingStatus } from "@/context/VoiceRecordingStatusContext";

interface ProcessVoiceButtonProps {
  onProcess: () => void | Promise<void>;
}

export default function ProcessVoiceButton({
  onProcess,
}: ProcessVoiceButtonProps) {
  const { status } = useRecordingStatus();

  return (
    <button
      className="w-full border p-3 border-outline-variant gap-2  rounded-lg font-label-md flex items-center justify-center cursor-pointer gap-sm bg-secondary-container text-on-secondary hover:bg-secondary transition-colors disabled:opacity-50"
      disabled={
        status == "processing" || status == "completed" || status == "recording"
      }
      onClick={onProcess}
      id="btn-continue"
    >
      {status === "processing" ? (
        <>
          <Loader2Icon className="animate-spin" /> Processing
        </>
      ) : (
        <>
          <span className="material-symbols-outlined">
            <ArrowRight />
          </span>
          Analyze
        </>
      )}
    </button>
  );
}
