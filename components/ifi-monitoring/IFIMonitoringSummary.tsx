import type {
  IFIMonitoringSlopeResult,
  IFIMonitoringSummary as IFIMonitoringSummaryType,
} from "@/types/calculations/ifi-monitoring";

interface IFIMonitoringSummaryProps {
  summary: IFIMonitoringSummaryType;
}

function formatIfi(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return value.toFixed(4);
}

function formatRecovery(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

function formatChange(value: number | null): string {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toFixed(4)}`;
  }

  return value.toFixed(4);
}

function formatSlope(slope: IFIMonitoringSlopeResult): string {
  if (slope.slopeIfiPerDay === null) {
    return "—";
  }

  const value =
    slope.slopeIfiPerDay > 0
      ? `+${slope.slopeIfiPerDay.toFixed(4)}`
      : slope.slopeIfiPerDay.toFixed(4);

  return `${value} IFI/day`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function getRecoveryWidth(value: number): number {
  /**
   * This clamp is VISUAL ONLY.
   *
   * The actual clinical calculation is never changed.
   *
   * Example:
   * Recovery = 116.7%
   *
   * Text still displays:
   * 116.7%
   *
   * But a progress bar cannot meaningfully be wider
   * than its container.
   */
  return Math.max(0, Math.min(value, 100));
}

export default function IFIMonitoringSummary({
  summary,
}: IFIMonitoringSummaryProps) {
  const recoveryBarWidth = getRecoveryWidth(summary.latestRecoveryPercent);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-semibold tracking-tight text-[#12355b]">
            Longitudinal Results
          </h2>

          <p className="text-[12px] leading-5 text-slate-500">
            Summary of the patient&apos;s IFI progression across the selected
            31-day monitoring cycle.
          </p>
        </div>
      </div>

      {/* Primary clinical metrics */}
      <div className="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        {/* Base IFI */}
        <div className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Base IFI
          </p>

          <p className="mt-2 font-mono text-[24px] font-semibold tracking-tight text-[#12355b]">
            {formatIfi(summary.baselineIfi)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
            <span>Day 0</span>

            <span className="text-slate-300">•</span>

            <span>{formatDate(summary.baselineDate)}</span>
          </div>

          <p className="mt-3 text-[10px] font-medium text-emerald-700">
            Recovery {formatRecovery(summary.baselineRecoveryPercent)}
          </p>
        </div>

        {/* Latest IFI */}
        <div className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Latest IFI
          </p>

          <p className="mt-2 font-mono text-[24px] font-semibold tracking-tight text-[#12355b]">
            {formatIfi(summary.latestIfi)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
            <span>Day {summary.latestMonitoringDay}</span>

            <span className="text-slate-300">•</span>

            <span>{formatDate(summary.latestDate)}</span>
          </div>

          <p className="mt-3 text-[10px] font-medium text-[#2e6cf6]">
            Change from Base {formatChange(summary.latestChangeFromBaseline)}
          </p>
        </div>

        {/* Day 18 */}
        <div className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Day 18 IFI
            </p>

            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-[#2e6cf6]">
              Checkpoint
            </span>
          </div>

          <p className="mt-2 font-mono text-[24px] font-semibold tracking-tight text-[#12355b]">
            {formatIfi(summary.day18.ifi)}
          </p>

          <p className="mt-2 text-[10px] text-slate-500">
            {formatDate(summary.day18.date)}
          </p>

          {summary.day18.hasObservation ? (
            <p className="mt-3 text-[10px] font-medium text-emerald-700">
              Recovery {formatRecovery(summary.day18.recoveryPercent)}
            </p>
          ) : (
            <p className="mt-3 text-[10px] font-medium text-slate-400">
              No Day 18 assessment
            </p>
          )}
        </div>

        {/* Final IFI */}
        <div className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Final IFI
          </p>

          <p className="mt-2 font-mono text-[24px] font-semibold tracking-tight text-[#12355b]">
            {formatIfi(summary.finalIfi)}
          </p>

          <p className="mt-2 text-[10px] text-slate-500">Day 30</p>

          {summary.finalIfi !== null ? (
            <p className="mt-3 text-[10px] font-medium text-emerald-700">
              Recovery {formatRecovery(summary.finalRecoveryPercent)}
            </p>
          ) : (
            <p className="mt-3 text-[10px] font-medium text-slate-400">
              Awaiting Day 30 assessment
            </p>
          )}
        </div>
      </div>

      {/* Recovery */}
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Latest Recovery
              </p>

              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-[24px] font-semibold tracking-tight text-[#12355b]">
                  {formatRecovery(summary.latestRecoveryPercent)}
                </p>

                <span className="text-[10px] text-slate-500">
                  Day {summary.latestMonitoringDay}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-[10px] text-slate-400">Maximum Recovery</p>

              <p className="mt-0.5 text-[13px] font-semibold text-emerald-700">
                {formatRecovery(summary.maximumRecoveryPercent)}
              </p>
            </div>
          </div>

          <div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#2e6cf6] transition-[width] duration-300"
                style={{
                  width: `${recoveryBarWidth}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[9px] font-medium text-slate-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {summary.latestRecoveryPercent > 100 && (
            <p className="text-[10px] leading-4 text-slate-500">
              Calculated Recovery exceeds 100%. The displayed percentage
              preserves the formula result; only the visual progress bar is
              capped at its container width.
            </p>
          )}
        </div>
      </div>

      {/* Trend / slope metrics */}
      <div className="grid grid-cols-1 border-b border-slate-200 md:grid-cols-3">
        <SlopeCard
          label="Overall Slope"
          slope={summary.overallSlope}
          description="Across all recorded observations"
        />

        <SlopeCard
          label="Day 0–18 Slope"
          slope={summary.slopeToDay18}
          description="Early monitoring phase"
          bordered
        />

        <SlopeCard
          label="Day 18–30 Slope"
          slope={summary.slopeDay18To30}
          description="Later monitoring phase"
        />
      </div>

      {/* Monitoring completeness */}
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
        <MetricCard
          label="Observed Days"
          value={`${summary.observedDays} / 31`}
        />

        <MetricCard label="Missing Days" value={String(summary.missingDays)} />

        <MetricCard
          label="Assessments"
          value={String(summary.totalAssessments)}
        />

        <MetricCard
          label="Latest Day"
          value={`Day ${summary.latestMonitoringDay}`}
        />
      </div>
    </section>
  );
}

interface SlopeCardProps {
  label: string;
  slope: IFIMonitoringSlopeResult;
  description: string;
  bordered?: boolean;
}

function SlopeCard({
  label,
  slope,
  description,
  bordered = false,
}: SlopeCardProps) {
  return (
    <div
      className={[
        "p-5 sm:p-6",
        bordered ? "border-y border-slate-200 md:border-x md:border-y-0" : "",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-mono text-[15px] font-semibold text-[#12355b]">
        {formatSlope(slope)}
      </p>

      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
        <span>
          {slope.observationCount}{" "}
          {slope.observationCount === 1 ? "observation" : "observations"}
        </span>
      </div>

      <p className="mt-3 text-[10px] leading-4 text-slate-400">{description}</p>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="p-4 text-center sm:p-5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-[15px] font-semibold text-[#12355b]">{value}</p>
    </div>
  );
}
