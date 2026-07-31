"use client";

import { useAssessment } from "@/hooks/useAssessment";

export default function PraatMetrics() {
  const { assessment } = useAssessment();

  if (!assessment.voice) {
    return null;
  }

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <h3 className="text-lg font-semibold">Voice Metrics</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Frequency</p>
          <p className="font-medium">
            {assessment.voice.metrics.frequency.toFixed(2)} Hz
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Amplitude</p>
          <p className="font-medium">
            {assessment.voice.metrics.amplitude.toFixed(4)}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Intensity</p>
          <p className="font-medium">
            {assessment.voice.metrics.intensity.toFixed(2)} dB
          </p>
        </div>
      </div>
    </div>
  );
}
