import { useRecordingStatus } from "@/context/VoiceRecordingStatusContext";
import { WaveformBar } from "./WaveformBar";
import type { RecordingStatus } from "@/context/VoiceRecordingStatusContext";

// export type RecordingStatus =
//   | "ready"
//   | "recording"
//   | "paused"
//   | "processing"
//   | "failed"
//   | "completed";

const heights = [
  8, 16, 12, 24, 16, 32, 20, 40, 16, 24, 12, 48, 24, 32, 16, 40, 20, 28, 12, 20,
];

export function Waveform() {
  const { status } = useRecordingStatus();
  return (
    <div className="flex h-16 w-full items-end justify-center gap-1 overflow-hidden px-xl">
      {heights.map((height, i) => {
        const props = getBarProps(status, height, i);

        return (
          <WaveformBar
            key={i}
            height={props!.height}
            className={props!.className}
            style={{
              animationDelay: `${i * 70}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

function getBarProps(status: RecordingStatus, height: number, index: number) {
  switch (status) {
    case "ready":
      return {
        height: Math.max(8, height * 0.35),
        className: "bg-outline opacity-50",
      };

    case "recording":
      return {
        height,
        className: "bg-red-500 animate-wave",
      };

    case "recorded":
      return {
        height,
        className: "bg-amber-500 opacity-80",
      };

    case "processing":
      return {
        height,
        className: "bg-sky-500 animate-pulse",
      };

    case "failed":
      return {
        height,
        className: "bg-red-500 animate-pulse",
      };

    case "completed":
      return {
        height,
        className: "bg-emerald-500",
      };
  }
}
