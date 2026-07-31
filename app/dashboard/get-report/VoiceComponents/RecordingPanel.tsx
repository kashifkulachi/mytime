"use client";

import { StatusBadge } from "./StatusBadge";
import { MicrophoneButton } from "./MicrohpneButton";
import { Timer } from "./Timer";
import { Waveform } from "./Waveform";
import { useAssessment } from "@/hooks/useAssessment";
import { useEffect, useRef, useState } from "react";
import { processVoice } from "@/services/voice-service";
import VoiceRecorder from "@/components/assessment/Voice/VoiceRecorder";
import AudioPlayer from "./AudioPlayer";
import ActionsButtons from "./ResetButton";
import { useRecordingStatus } from "@/context/VoiceRecordingStatusContext";
import ProcessVoiceButton from "./ProcessVoiceButton";
import { toast } from "sonner";
import PraatMetrics from "./PraatMetrics";

export function RecordingPanel() {
  const { updateVoice, resetVoice } = useAssessment();
  const { status, setStatus } = useRecordingStatus();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingStartRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  if (error) {
    toast.error(error);
  }

  useEffect(() => {
    if (!isRecording) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRecording]);

  const handleRecordingStart = () => {
    setError(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsRecording(true);
    setStatus("recording");
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
    setStatus("recorded");
    recordingStartRef.current = null;
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setStatus("recorded");
  };

  const handleError = (message: string) => {
    setError(message);
    setIsRecording(false);
  };

  const handleReset = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsRecording(false);
    setIsProcessing(false);

    setAudioBlob(null);
    setRecordingDuration(0);
    setStatus("ready");
    setError(null);
    resetVoice();
  };

  const handleProcessVoice = async () => {
    if (!audioBlob) return;

    try {
      setError(null);
      setIsProcessing(true);
      setStatus("processing");
      const result = await processVoice(audioBlob);

      updateVoice({ ...result, processedAt: new Date().toISOString() });
      setStatus("completed");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process voice recording.",
      );
      toast.error(error!.toString());
      setStatus("failed");
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="bg-surface-container-lowest rounded-xl border col-span-1 md:col-span-2 border-outline-variant p-3 md:p-5 flex flex-col shadow-sm flex-1">
      <div className="flex justify-between items-center mb-3 mt-4">
        <div>
          <h2 className="font-headline-md text-headline-xl font-semibold text-primary">
            Microphone Input
          </h2>
        </div>

        <StatusBadge />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-37.5">
        <MicrophoneButton />

        <Timer duration={recordingDuration} />

        <Waveform />
      </div>

      <div
        className={`p-5 grid md:grid-cols-3 mt-5 wrap-anywhere gap-2 ${status === "ready" ? `md:translate-x-1/3` : ""}`}
      >
        <VoiceRecorder
          isRecording={isRecording}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onRecordingComplete={handleRecordingComplete}
          onError={handleError}
        />

        {status !== "ready" && (
          <>
            <ActionsButtons reset={handleReset} />
            <ProcessVoiceButton onProcess={handleProcessVoice} />
          </>
        )}
      </div>

      {status !== "completed" && <AudioPlayer audio={audioBlob} />}
      <PraatMetrics />
    </div>
  );
}
