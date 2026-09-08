"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { useRecordingStatus } from "@/context/VoiceRecordingStatusContext";
import { toast } from "sonner";

interface VoiceRecorderProps {
  isRecording: boolean;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onRecordingComplete: (audio: Blob) => void;
  onError?: (message: string) => void;
}

export default function VoiceRecorder({
  isRecording,
  onRecordingStart,
  onRecordingStop,
  onRecordingComplete,
  onError,
}: VoiceRecorderProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const { status } = useRecordingStatus();

  const startRecording = async () => {
    try {
      setIsRequestingPermission(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        onRecordingComplete(audioBlob);

        stream.getTracks().forEach((track) => track.stop());

        recorderRef.current = null;
        streamRef.current = null;
        chunksRef.current = [];
      };

      recorder.start();
      onRecordingStart();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      toast.error(message);

      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
            onError?.("Microphone permission was denied.");
            break;

          case "NotFoundError":
            onError?.("No microphone was found.");
            break;

          case "NotReadableError":
            onError?.(
              "Microphone is already being used by another application.",
            );
            break;

          default:
            onError?.("Unable to access your microphone.");
        }
      } else {
        onError?.("Unable to access your microphone.");
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      onRecordingStop();
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      type="button"
      // variant={isRecording ? "destructive" : "default"}
      className={` flex-1 p-2 text-[15px] py-md cursor-pointer bg-primary text-on-primary rounded-lg font-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity h-12 ${isRecording ? "text-error bg-error-container" : ""}`}
      onClick={handleClick}
      disabled={
        isRequestingPermission ||
        status == "recorded" ||
        status == "processing" ||
        status == "completed"
      }
    >
      {isRecording ? (
        <>
          <Square className="h-5 w-5 fill-current" />
          Stop Recording
        </>
      ) : (
        <>
          <Mic className="h-5 w-5" />
          Start Recording
        </>
      )}
    </button>
  );
}
