"use client";

import { useEffect, useRef, useState } from "react";

import VoiceRecorder from "./VoiceRecorder";
import AudioPlayer from "../../../app/dashboard/get-report/VoiceComponents/AudioPlayer";
import RecordingStatus from "./RecordingStatus";
import RecordingTimer from "./RecordingTimer";
import ProcessVoiceButton from "../../../app/dashboard/get-report/VoiceComponents/ProcessVoiceButton";
import PraatMetrics from "./PraatMetrics";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { processVoice } from "@/services/voice-service";
import { useAssessment } from "@/hooks/useAssessment";
import { Timer } from "@/app/dashboard/get-report/VoiceComponents/Timer";
import { toast } from "sonner";

export default function VoiceAssessment() {
  const { updateVoice, assessment } = useAssessment();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

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
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
  };

  const handleError = (message: string) => {
    setError(message);
    setIsRecording(false);
  };

  const handleProcessVoice = async () => {
    if (!audioBlob) return;

    try {
      setError(null);
      setIsProcessing(true);

      const result = await processVoice(audioBlob);

      updateVoice({ ...result, processedAt: new Date().toISOString() });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process voice recording.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="mx-auto ">
      <CardHeader>
        <CardTitle>Voice Assessment</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <VoiceRecorder
          isRecording={isRecording}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onRecordingComplete={handleRecordingComplete}
          onError={handleError}
        />

        <RecordingStatus isRecording={isRecording} hasRecording={!!audioBlob} />

        <RecordingTimer duration={recordingDuration} />

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
            {toast.error(error)}
          </div>
        )}

        <AudioPlayer audio={audioBlob} />

        <PraatMetrics />

        {/* <ProcessVoiceButton
          disabled={!audioBlob}
          isProcessing={isProcessing}
          onProcess={handleProcessVoice}
        /> */}
      </CardContent>
    </Card>
  );
}

// "use client";

// import { useEffect, useRef, useState } from "react";

// import VoiceRecorder from "./VoiceRecorder";
// import AudioPlayer from "./AudioPlayer";
// import RecordingStatus from "./RecordingStatus";
// import RecordingTimer from "./RecordingTimer";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// export default function VoiceAssessment() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
//   const [recordingDuration, setRecordingDuration] = useState(0);
//   const [error, setError] = useState<string | null>(null);

//   const intervalRef = useRef<number | null>(null);

//   useEffect(() => {
//     if (!isRecording) {
//       if (intervalRef.current) {
//         window.clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }

//       return;
//     }

//     intervalRef.current = window.setInterval(() => {
//       setRecordingDuration((prev) => prev + 1);
//     }, 1000);

//     return () => {
//       if (intervalRef.current) {
//         window.clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     };
//   }, [isRecording]);

//   const handleRecordingStart = () => {
//     setError(null);
//     setAudioBlob(null);
//     setRecordingDuration(0);
//     setIsRecording(true);
//   };

//   const handleRecordingStop = () => {
//     setIsRecording(false);
//   };

//   const handleRecordingComplete = (blob: Blob) => {
//     setAudioBlob(blob);
//   };

//   const handleError = (message: string) => {
//     setError(message);
//     setIsRecording(false);
//   };

//   return (
//     <Card className="mx-auto w-full max-w-2xl">
//       <CardHeader>
//         <CardTitle>Voice Assessment</CardTitle>
//       </CardHeader>

//       <CardContent className="space-y-6">
//         <VoiceRecorder
//           isRecording={isRecording}
//           onRecordingStart={handleRecordingStart}
//           onRecordingStop={handleRecordingStop}
//           onRecordingComplete={handleRecordingComplete}
//           onError={handleError}
//         />

//         <RecordingStatus isRecording={isRecording} hasRecording={!!audioBlob} />

//         <RecordingTimer duration={recordingDuration} />

//         {error && (
//           <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
//             {error}
//           </div>
//         )}

//         <AudioPlayer audio={audioBlob} />

//         {/* ProcessVoiceButton */}
//       </CardContent>
//     </Card>
//   );
// }
