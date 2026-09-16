"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { IFIMonitoringDayResult } from "@/types/calculations/ifi-monitoring";

interface IFIMonitoringChartProps {
  days: IFIMonitoringDayResult[];
}

interface ChartDataPoint {
  day: number;
  date: string;
  ifi: number | null;
  recoveryPercent: number | null;
  dailyChange: number | null;
  hasObservation: boolean;
}

interface TooltipPayloadItem {
  payload: ChartDataPoint;
}

interface MonitoringTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatIfi(value: number | null): string {
  if (value === null) {
    return "Not recorded";
  }

  return value.toFixed(4);
}

function formatRecovery(value: number | null): string {
  if (value === null) {
    return "Not available";
  }

  return `${value.toFixed(1)}%`;
}

function formatDailyChange(value: number | null): string {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toFixed(4)}`;
  }

  return value.toFixed(4);
}

/**
 * Custom clinical tooltip.
 *
 * This deliberately displays IFI and Recovery together while
 * keeping only IFI on the chart's Y-axis.
 */
function MonitoringTooltip({ active, payload }: MonitoringTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="min-w-[210px] rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <div className="mb-2 border-b border-slate-100 pb-2">
        <p className="text-[11px] font-semibold text-[#12355b]">
          Monitoring Day {point.day}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-500">
          {formatDate(point.date)}
        </p>
      </div>

      {point.hasObservation ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-5">
            <span className="text-[10px] text-slate-500">IFI Value</span>

            <span className="font-mono text-[11px] font-semibold text-[#12355b]">
              {formatIfi(point.ifi)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-5">
            <span className="text-[10px] text-slate-500">Recovery</span>

            <span className="text-[11px] font-semibold text-emerald-700">
              {formatRecovery(point.recoveryPercent)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-5">
            <span className="text-[10px] text-slate-500">Daily Change</span>

            <span className="font-mono text-[11px] font-semibold text-slate-700">
              {formatDailyChange(point.dailyChange)}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-slate-50 px-3 py-2">
          <p className="text-[10px] leading-4 text-slate-500">
            No IFI assessment was recorded for this monitoring day.
          </p>
        </div>
      )}
    </div>
  );
}

export default function IFIMonitoringChart({ days }: IFIMonitoringChartProps) {
  const chartData: ChartDataPoint[] = days.map((day) => ({
    day: day.day,
    date: day.date,
    ifi: day.ifi,
    recoveryPercent: day.recoveryPercent,
    dailyChange: day.dailyChange,
    hasObservation: day.hasObservation,
  }));

  const observedDays = days.filter(
    (day) => day.hasObservation && day.ifi !== null,
  );

  const latestObservedDay =
    observedDays.length > 0 ? observedDays[observedDays.length - 1] : null;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-[#12355b]">
            IFI Monitoring Trend
          </h2>

          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">
            Actual IFI measurements recorded throughout the 31-day monitoring
            period.
          </p>
        </div>

        {latestObservedDay && (
          <div className="flex items-center gap-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Latest IFI
              </p>

              <p className="mt-0.5 font-mono text-[14px] font-semibold text-[#12355b]">
                {formatIfi(latestObservedDay.ifi)}
              </p>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Recovery
              </p>

              <p className="mt-0.5 text-[14px] font-semibold text-emerald-700">
                {formatRecovery(latestObservedDay.recoveryPercent)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Graph */}
      <div className="px-2 pb-3 pt-6 sm:px-5">
        <div className="h-[360px] w-full sm:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 25,
                bottom: 15,
                left: 5,
              }}
            >
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                vertical={true}
              />

              <XAxis
                dataKey="day"
                type="number"
                domain={[0, 30]}
                ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]}
                tick={{
                  fill: "#64748b",
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: "#cbd5e1",
                }}
                tickLine={{
                  stroke: "#cbd5e1",
                }}
                label={{
                  value: "Monitoring Day",
                  position: "insideBottom",
                  offset: -8,
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />

              <YAxis
                width={55}
                tick={{
                  fill: "#64748b",
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: "#cbd5e1",
                }}
                tickLine={{
                  stroke: "#cbd5e1",
                }}
                tickFormatter={(value: number) => value.toFixed(1)}
                label={{
                  value: "IFI",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />

              <Tooltip
                content={<MonitoringTooltip />}
                cursor={{
                  stroke: "#94a3b8",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              {/* Day 18 clinical checkpoint */}
              <ReferenceLine
                x={18}
                stroke="#2e6cf6"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: "Day 18",
                  position: "insideTopRight",
                  fill: "#2e6cf6",
                  fontSize: 10,
                }}
              />

              {/* Final monitoring day */}
              <ReferenceLine
                x={30}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: "Day 30",
                  position: "insideTopLeft",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />

              <Line
                type="linear"
                dataKey="ifi"
                name="IFI Value"
                stroke="#12355b"
                strokeWidth={2.5}
                connectNulls={false}
                dot={{
                  r: 4,
                  fill: "#ffffff",
                  stroke: "#2e6cf6",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#2e6cf6",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend / explanation */}
      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2 text-[10px] text-slate-600">
            <span className="h-0.5 w-5 bg-[#12355b]" />
            Actual IFI
          </span>

          <span className="inline-flex items-center gap-2 text-[10px] text-slate-600">
            <span className="h-3 w-px border-l border-dashed border-[#2e6cf6]" />
            Day 18 checkpoint
          </span>
        </div>

        <p className="max-w-xl text-[10px] leading-4 text-slate-500">
          Only recorded patient assessments are plotted. Missing monitoring days
          are not estimated or interpolated.
        </p>
      </div>
    </section>
  );
}
