"use client";
import { useAssessment } from "@/hooks/useAssessment";

export default function PraatMetrics() {
  const { assessment } = useAssessment();

  if (!assessment.voice) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-182.5 m-auto mt-5">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-[17px] flex flex-col items-center justify-center shadow-sm">
        <span className="text-[19px] text-on-surface-variant font-semibold mb-2">
          Amplitude
        </span>
        <div className="flex items-baseline gap-3">
          <span className="text-[18px] font-semibold text-primary">
            {assessment.voice?.metrics.amplitude.toFixed(2)}
          </span>
          <span className="text-body-sm text-on-surface-variant font-semibold">
            dB
          </span>
        </div>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-[17px] flex flex-col items-center justify-center shadow-sm">
        <span className="text-[19px] text-on-surface-variant font-semibold mb-2">
          Frequency
        </span>
        <div className="flex items-baseline gap-3">
          <span className="text-[18px] font-semibold text-primary">
            {assessment.voice?.metrics.frequency.toFixed(2)}
          </span>
          <span className="text-body-sm text-on-surface-variant font-semibold">
            Hz
          </span>
        </div>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-[17px] flex flex-col items-center justify-center shadow-sm">
        <span className="text-[19px] text-on-surface-variant font-semibold mb-2">
          Intensity
        </span>
        <div className="flex items-baseline gap-3">
          <span className="text-[18px] font-semibold text-primary">
            {assessment.voice?.metrics.intensity.toFixed(2)}
          </span>
          <span className="text-body-sm text-on-surface-variant">W/m²</span>
        </div>
      </div>
    </div>
  );
}
