import type { IFIMonitoringDayResult } from "@/types/calculations/ifi-monitoring";

interface IFIMonitoringTableProps {
  days: IFIMonitoringDayResult[];
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  /**
   * Monitoring dates are calendar dates, not timestamps.
   *
   * Constructing the Date from local numeric components prevents
   * YYYY-MM-DD values from being shifted by the viewer's timezone.
   *
   * Example:
   * 2026-09-17 must display as Sep 17, 2026 everywhere.
   */
  const calendarDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(calendarDate);
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

function formatDailyChange(value: number | null): string {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toFixed(4)}`;
  }

  return value.toFixed(4);
}

function getDailyChangeClass(value: number | null): string {
  if (value === null) {
    return "text-slate-400";
  }

  if (value > 0) {
    return "text-emerald-700";
  }

  if (value < 0) {
    return "text-rose-700";
  }

  return "text-slate-600";
}

export default function IFIMonitoringTable({ days }: IFIMonitoringTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-semibold tracking-tight text-[#12355b]">
            31-Day IFI Monitoring
          </h2>

          <p className="text-[12px] leading-5 text-slate-500">
            Daily recorded IFI values, calculated recovery, and change between
            observed assessments.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="bg-[#12355b] text-white">
              <th className="w-[90px] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.04em]">
                Monitoring
                <span className="block">Day</span>
              </th>

              <th className="min-w-[150px] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em]">
                Date
              </th>

              <th className="min-w-[130px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.04em]">
                IFI Value
              </th>

              <th className="min-w-[130px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.04em]">
                Recovery
              </th>

              <th className="min-w-[140px] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.04em]">
                Daily Change
              </th>

              <th className="min-w-[130px] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.04em]">
                Assessments
              </th>

              <th className="min-w-[130px] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.04em]">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {days.map((day) => {
              const isObserved = day.hasObservation;
              const isDay18 = day.day === 18;
              const isDay30 = day.day === 30;

              return (
                <tr
                  key={day.day}
                  className={[
                    "border-b border-slate-100 transition-colors last:border-b-0",
                    isObserved
                      ? "hover:bg-slate-50"
                      : "bg-slate-50/60 text-slate-400",
                    isDay18
                      ? "border-l-4 border-l-[#2e6cf6]"
                      : "border-l-4 border-l-transparent",
                  ].join(" ")}
                >
                  {/* Day */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={[
                          "flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold",
                          isObserved
                            ? "bg-[#12355b]/8 text-[#12355b]"
                            : "bg-slate-100 text-slate-400",
                        ].join(" ")}
                      >
                        {day.day}
                      </span>

                      {isDay18 && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#2e6cf6]">
                          Day 18
                        </span>
                      )}

                      {isDay30 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                          Final
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] font-medium text-slate-700">
                    {formatDate(day.date)}
                  </td>

                  {/* IFI */}
                  <td
                    className={[
                      "px-4 py-3 text-right font-mono text-[12px] font-semibold tabular-nums",
                      isObserved
                        ? "bg-amber-50/70 text-[#12355b]"
                        : "text-slate-300",
                    ].join(" ")}
                  >
                    {formatIfi(day.ifi)}
                  </td>

                  {/* Recovery */}
                  <td
                    className={[
                      "px-4 py-3 text-right text-[12px] font-semibold tabular-nums",
                      isObserved
                        ? "bg-emerald-50/70 text-emerald-800"
                        : "text-slate-300",
                    ].join(" ")}
                  >
                    {formatRecovery(day.recoveryPercent)}
                  </td>

                  {/* Daily Change */}
                  <td
                    className={[
                      "px-4 py-3 text-right font-mono text-[12px] font-medium tabular-nums",
                      getDailyChangeClass(day.dailyChange),
                    ].join(" ")}
                  >
                    {formatDailyChange(day.dailyChange)}
                  </td>

                  {/* Assessment count */}
                  <td className="px-4 py-3 text-center">
                    {day.assessmentCount > 0 ? (
                      <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        {day.assessmentCount}
                      </span>
                    ) : (
                      <span className="text-[12px] text-slate-300">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {isObserved ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Recorded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        Missing
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[10px] leading-4 text-slate-500">
          Missing days indicate that no IFI assessment was recorded for that
          monitoring date.
        </p>

        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-100" />
            IFI
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100" />
            Recovery
          </span>
        </div>
      </div>
    </section>
  );
}
