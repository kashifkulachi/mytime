"use client";

import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CircleCheckBig } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AudioPlayerProps {
  audio: Blob | null;
}

export default function AudioPlayer({ audio }: AudioPlayerProps) {
  const audioUrl = useMemo(() => {
    if (!audio) return null;

    return URL.createObjectURL(audio);
  }, [audio]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (!audio || !audioUrl) {
    return null;
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex items-center gap-3">
            <Badge className="flex items-center gap-2 text-[15px] p-2 py-3 bg-green-600 hover:bg-green-600">
              <CircleCheckBig className="h-4 w-4" />
              Recording Complete
            </Badge>

            <p className="text-sm text-muted-foreground">
              Review your recording before processing.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <audio controls preload="metadata" className="w-full">
            <source src={audioUrl} type={audio.type} />
            Your browser does not support audio playback.
          </audio>
        </CardContent>
      </Card>
    </div>
  );
}
