"use client";

import { useAssessment } from "@/hooks/useAssessment";
import {
  Activity,
  HeartPulse,
  Loader2,
  Minus,
  MoveRight,
  Radio,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MetricsGridProps {
  heartRate: number | null;
  spo2: number | null;
  isDeviceConnected: boolean;
  isListeningForNotifications: boolean;
  hasCompletemeasurement: boolean;
  saveMeasurement: () => boolean;
  disconnect: () => Promise<void>;
}

function getHeartRateStatus(heartRate: number | null): {
  label: string;
  description: string;
} {
  if (heartRate === null) {
    return {
      label: "Waiting",
      description: "Waiting for pulse data",
    };
  }

  if (heartRate < 60) {
    return {
      label: "Low",
      description: "Below the normal resting range",
    };
  }

  if (heartRate > 100) {
    return {
      label: "High",
      description: "Above the normal resting range",
    };
  }

  return {
    label: "Normal",
    description: "Within the normal resting range",
  };
}

function getSpo2Status(spo2: number | null): {
  label: string;
  description: string;
} {
  if (spo2 === null) {
    return {
      label: "Waiting",
      description: "Waiting for saturation data",
    };
  }

  if (spo2 < 90) {
    return {
      label: "Low",
      description: "Saturation is below the expected range",
    };
  }

  if (spo2 < 95) {
    return {
      label: "Monitor",
      description: "Saturation should be monitored",
    };
  }

  return {
    label: "Normal",
    description: "Stable oxygen saturation level",
  };
}

export default function MetricsGrid({
  heartRate,
  spo2,
  isDeviceConnected,
  isListeningForNotifications,
  hasCompletemeasurement,
  disconnect,
  saveMeasurement,
}: MetricsGridProps) {
  const [savingOximeterMetrics, setSavingOximeterMetrics] =
    useState<boolean>(false);
  const { assessment } = useAssessment();

  const savedOximeterValues = assessment.oximeter;

  const isLive = isDeviceConnected && isListeningForNotifications;

  const heartRateStatus = getHeartRateStatus(heartRate);

  const spo2Status = getSpo2Status(spo2);

  const hasAnyData =
    (spo2 != null && heartRate != null) ||
    (savedOximeterValues?.spo2 != null &&
      savedOximeterValues?.heartRate != null);

  async function handleContinueOximeter() {
    setSavingOximeterMetrics(true);

    try {
      const saved = saveMeasurement();
      await disconnect();

      if (!saved) {
        return;
      } else {
        toast.success("Data saved!");
      }

      // Continue with the success flow...
    } finally {
      setSavingOximeterMetrics(false);
    }
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-outline-variant bg-surface p-4 shadow-sm"
      aria-label="Live oximeter monitoring"
    >
      {/* Animated background shown only during live monitoring */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          isLive ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="live-monitoring-glow absolute -left-24 top-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />

        <div className="live-monitoring-glow live-monitoring-glow-delay absolute -right-24 bottom-0 h-52 w-52 rounded-full bg-tertiary/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />

            <h2 className="text-xl font-semibold text-on-surface">
              Live Health Monitoring
            </h2>
          </div>

          <p className="mt-1 text-sm text-on-surface-variant">
            Real-time readings received from the connected pulse oximeter
          </p>
        </div>

        <div
          className={`flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
            isLive
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-outline-variant bg-surface-container text-on-surface-variant"
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {isLive && (
              <span className="absolute inline-flex h-full w-full text-secondary animate-ping rounded-full bg-primary opacity-60" />
            )}

            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                isLive ? "bg-secondary" : "bg-outline"
              }`}
            />
          </span>

          {isLive
            ? "Live monitoring"
            : isDeviceConnected
              ? "Connected — waiting for data"
              : "Monitoring stopped"}
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* SpO2 Card */}
        <article
          className={`group relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-500 ${
            isLive ? "border-tertiary/30 shadow-md" : "border-outline-variant"
          }`}
        >
          {isLive && (
            <div className="live-card-scan live-card-scan-delay pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-tertiary/5 to-transparent" />
          )}

          <div className="relative flex min-h-[220px] flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10 ${
                    isLive ? "oxygen-icon-live" : ""
                  }`}
                >
                  <Activity className="h-5 w-5 text-tertiary" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    SpO₂
                  </p>

                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Oxygen saturation
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-tertiary/10 px-2.5 py-1 text-xs font-medium text-tertiary">
                {spo2Status.label}
              </span>
            </div>

            <div className="mt-5 flex items-end gap-2" aria-live="polite">
              <span
                className={`tabular-nums text-5xl font-semibold tracking-tight text-primary transition-all duration-300 ${
                  isLive && spo2 !== null ? "metric-value-live" : ""
                }`}
              >
                {spo2 ?? savedOximeterValues?.spo2 ?? "--"}
              </span>

              <span className="mb-1.5 text-base font-semibold text-on-surface-variant">
                %
              </span>
            </div>

            <div className="relative mt-5 h-16 overflow-hidden text-secondary rounded-lg bg-secondary/5">
              <svg
                viewBox="0 0 320 64"
                preserveAspectRatio="none"
                className="h-full w-full"
                aria-hidden="true"
              >
                <path
                  d="M0 33 C30 27 55 37 82 31 C110 25 135 35 162 30 C190 25 216 35 242 29 C270 23 294 33 320 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  className={`text-tertiary ${
                    isLive ? "oxygen-wave-live" : ""
                  }`}
                />

                {isLive && (
                  <circle
                    cx="320"
                    cy="28"
                    r="4"
                    fill="currentColor"
                    className="oxygen-dot-live text-tertiary"
                  />
                )}
              </svg>

              {!isLive && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                  <Minus className="h-5 w-5 text-outline" />
                </div>
              )}
            </div>

            <p className="mt-auto flex items-center gap-2 pt-3 text-sm text-on-surface-variant">
              <Activity className="h-4 w-4 text-tertiary" />
              {spo2Status.description}
            </p>
          </div>
        </article>

        {/* Heart Rate Card */}
        <article
          className={`group relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-500 ${
            isLive ? "border-primary/30 shadow-md" : "border-outline-variant"
          }`}
        >
          {isLive && (
            <div className="live-card-scan pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
          )}

          <div className="relative flex min-h-[220px] flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 ${
                    isLive ? "heart-icon-live" : ""
                  }`}
                >
                  <HeartPulse className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Heart Rate
                  </p>

                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Pulse rate
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {heartRateStatus.label}
              </span>
            </div>

            <div className="mt-5 flex items-end gap-2" aria-live="polite">
              <span
                className={`tabular-nums text-5xl font-semibold tracking-tight text-primary transition-all duration-300 ${
                  isLive && heartRate !== null ? "metric-value-live" : ""
                }`}
              >
                {heartRate ?? savedOximeterValues?.heartRate ?? "--"}
              </span>

              <span className="mb-1.5 text-base font-semibold text-on-surface-variant">
                BPM
              </span>
            </div>

            <div className="relative mt-5 h-16 overflow-hidden text-secondary rounded-lg bg-secondary/5">
              <svg
                viewBox="0 0 320 64"
                preserveAspectRatio="none"
                className="h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="heartAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity="0.18"
                    />

                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 42 L35 42 L48 38 L58 42 L76 42 L88 13 L100 54 L114 31 L126 42 L164 42 L176 38 L186 42 L205 42 L217 13 L229 54 L243 31 L255 42 L320 42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  className={`text-primary ${isLive ? "heart-wave-live" : ""}`}
                />

                <path
                  d="M0 42 L35 42 L48 38 L58 42 L76 42 L88 13 L100 54 L114 31 L126 42 L164 42 L176 38 L186 42 L205 42 L217 13 L229 54 L243 31 L255 42 L320 42 L320 64 L0 64 Z"
                  fill="url(#heartAreaGradient)"
                  className="text-primary"
                />
              </svg>

              {!isLive && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                  <Minus className="h-5 w-5 text-outline" />
                </div>
              )}
            </div>

            <p className="mt-auto flex items-center gap-2 pt-3 text-sm text-on-surface-variant">
              <TrendingUp className="h-4 w-4 text-primary" />
              {heartRateStatus.description}
            </p>
          </div>
        </article>

        {/* Monitoring Status Card */}
        <article
          className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-500 ${
            isLive
              ? "border-primary/20 bg-primary text-on-primary shadow-md"
              : "border-outline-variant bg-surface-container text-on-surface"
          }`}
        >
          {isLive && (
            <>
              <div className="monitoring-radar absolute -right-10 -top-10 h-40 w-40 rounded-full border border-on-primary/20" />
              <div className="monitoring-radar monitoring-radar-delay absolute -right-10 -top-10 h-40 w-40 rounded-full border border-on-primary/20" />
            </>
          )}

          <div className="relative flex min-h-[220px] flex-col">
            <div className="flex items-center justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isLive ? "bg-on-primary/15" : "bg-surface"
                }`}
              >
                {isDeviceConnected ? (
                  <Wifi className="h-5 w-5" />
                ) : (
                  <WifiOff className="h-5 w-5" />
                )}
              </div>

              {isLive && <Radio className="radio-live h-5 w-5" />}
            </div>

            <div className="mt-5">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                  isLive ? "text-on-primary/70" : "text-on-surface-variant"
                }`}
              >
                Device Status
              </p>

              <h3 className="mt-2 text-2xl font-semibold">
                {isLive
                  ? "Receiving live data"
                  : isDeviceConnected
                    ? "Waiting for readings"
                    : "Oximeter disconnected"}
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isLive ? "text-on-primary/75" : "text-on-surface-variant"
                }`}
              >
                {isLive
                  ? "The dashboard is receiving and displaying live SpO₂ and heart-rate signals."
                  : isDeviceConnected
                    ? "The device is connected, but no measurement notifications are currently arriving."
                    : "Connect or reconnect the oximeter to resume live monitoring."}
              </p>
            </div>

            <div
              className={`mt-auto flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${
                isLive ? "bg-on-primary/10" : "bg-surface"
              }`}
            >
              <button
                onClick={handleContinueOximeter}
                disabled={!hasAnyData}
                className="bg-tertiary border border-amber-200 rounded-4xl w-full flex items-center gap-2 justify-center text-[18px] p-2 m-3 text-on-primary  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {savingOximeterMetrics ? (
                  <span>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </span>
                ) : (
                  <span>
                    <MoveRight className="w-4 h-4" />
                  </span>
                )}
                Process Metrics
              </button>
            </div>
          </div>
        </article>
      </div>

      <style jsx>{`
        .heart-wave-live {
          stroke-dasharray: 90 230;
          animation: heart-wave 1.4s linear infinite;
        }

        .oxygen-wave-live {
          stroke-dasharray: 180 140;
          animation: oxygen-wave 2.2s linear infinite;
        }

        .heart-icon-live {
          animation: heart-beat 1s ease-in-out infinite;
        }

        .oxygen-icon-live {
          animation: oxygen-breathe 2s ease-in-out infinite;
        }

        .oxygen-dot-live {
          animation: oxygen-dot 1.4s ease-in-out infinite;
        }

        .metric-value-live {
          animation: metric-value 1.8s ease-in-out infinite;
        }

        .radio-live {
          animation: radio-pulse 1.4s ease-in-out infinite;
        }

        .live-card-scan {
          animation: card-scan 3s linear infinite;
        }

        .live-card-scan-delay {
          animation-delay: 1.2s;
        }

        .live-monitoring-glow {
          animation: monitoring-glow 4s ease-in-out infinite;
        }

        .live-monitoring-glow-delay {
          animation-delay: 2s;
        }

        .monitoring-radar {
          animation: monitoring-radar 2.2s ease-out infinite;
        }

        .monitoring-radar-delay {
          animation-delay: 1.1s;
        }

        @keyframes heart-wave {
          from {
            stroke-dashoffset: 320;
          }

          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes oxygen-wave {
          from {
            stroke-dashoffset: 320;
          }

          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes heart-beat {
          0%,
          100% {
            transform: scale(1);
          }

          15% {
            transform: scale(1.12);
          }

          30% {
            transform: scale(1);
          }

          45% {
            transform: scale(1.08);
          }

          60% {
            transform: scale(1);
          }
        }

        @keyframes oxygen-breathe {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.75;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes oxygen-dot {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(0.8);
            transform-origin: center;
          }

          50% {
            opacity: 1;
            transform: scale(1.35);
            transform-origin: center;
          }
        }

        @keyframes metric-value {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.78;
          }
        }

        @keyframes radio-pulse {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.12);
          }
        }

        @keyframes card-scan {
          from {
            transform: translateX(-140%);
          }

          to {
            transform: translateX(500%);
          }
        }

        @keyframes monitoring-glow {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.55;
          }

          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes monitoring-radar {
          0% {
            transform: scale(0.4);
            opacity: 0.6;
          }

          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .heart-wave-live,
          .oxygen-wave-live,
          .heart-icon-live,
          .oxygen-icon-live,
          .oxygen-dot-live,
          .metric-value-live,
          .radio-live,
          .live-card-scan,
          .live-monitoring-glow,
          .monitoring-radar {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
