import { Badge } from "@/components/ui/badge";
import { Mic, CircleCheckBig } from "lucide-react";

interface RecordingStatusProps {
  isRecording: boolean;
  hasRecording: boolean;
}

export default function RecordingStatus({
  isRecording,
  hasRecording,
}: RecordingStatusProps) {
  if (isRecording) {
    return (
      <div className="flex items-center gap-3">
        <Badge
          variant="destructive"
          className="flex items-center gap-2 px-3 py-1"
        >
          <Mic className="h-4 w-4 animate-pulse" />
          Recording...
        </Badge>

        <p className="text-sm text-muted-foreground">
          Speak clearly into your microphone.
        </p>
      </div>
    );
  }

  if (hasRecording) {
    return (
      <div className="flex items-center gap-3">
        <Badge className="flex items-center gap-2 bg-green-600 hover:bg-green-600">
          <CircleCheckBig className="h-4 w-4" />
          Recording Complete
        </Badge>

        <p className="text-sm text-muted-foreground">
          Review your recording before processing.
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Press <strong>Start Recording</strong> to begin your voice assessment.
    </p>
  );
}
