"use client";

import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock3,
  UserRound,
} from "lucide-react";

import type { IFIMonitoringCycleStatus } from "@/types/calculations/ifi-monitoring";
import Image from "next/image";

export interface IFIMonitoringCycleOption {
  id: string;
  startDate: string;
  endDate: string;
  status: IFIMonitoringCycleStatus;
  completedAt: string | null;
}

interface IFIMonitoringPatientHeaderProps {
  patientName: string;
  dateOfBirth?: string | null;

  cycles: IFIMonitoringCycleOption[];
  selectedCycleId: string;

  latestMonitoringDay: number;

  /**
   * Day 0 evaluation date / monitoring start date.
   */
  evaluationDate: string;

  /**
   * Timestamp when the selected monitoring cycle was created.
   *
   * Optional for now because our current lightweight cycle API
   * does not expose createdAt yet.
   */
  createdAt?: string | null;

  isChangingCycle?: boolean;

  onCycleChange: (cycleId: string) => void;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  /**
   * IMPORTANT:
   *
   * This is a calendar date, not a timestamp.
   *
   * Do NOT use:
   *   new Date("2026-09-17")
   *   Date.UTC(...)
   *   toISOString()
   *
   * Creating the Date from numeric components preserves the
   * calendar date in the viewer's local timezone.
   */
  const localCalendarDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(localCalendarDate);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCycleLabel(
  cycle: IFIMonitoringCycleOption,
  index: number,
): string {
  const period = `${formatDate(cycle.startDate)} – ${formatDate(cycle.endDate)}`;

  if (cycle.status === "active") {
    return `Current Cycle • ${period}`;
  }

  if (cycle.status === "cancelled") {
    return `Cancelled Cycle • ${period}`;
  }

  return `Previous Cycle ${index + 1} • ${period}`;
}

function getStatusStyles(status: IFIMonitoringCycleStatus): string {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "completed":
      return "border-blue-200 bg-blue-50 text-[#2e6cf6]";

    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getStatusLabel(status: IFIMonitoringCycleStatus): string {
  switch (status) {
    case "active":
      return "Active";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

export default function IFIMonitoringPatientHeader({
  patientName,
  dateOfBirth,
  cycles,
  selectedCycleId,
  latestMonitoringDay,
  evaluationDate,
  createdAt,
  isChangingCycle = false,
  onCycleChange,
}: IFIMonitoringPatientHeaderProps) {
  const selectedCycle =
    cycles.find((cycle) => cycle.id === selectedCycleId) ?? null;

  /**
   * Day numbers run from 0 through 30.
   *
   * For human-facing progress:
   *
   * Day 0 = first of 31 monitoring positions.
   * Day 4 = fifth calendar position in the cycle.
   *
   * The user specifically requested wording such as
   * "Day 4 of 31", so we preserve the clinical Day number
   * rather than displaying "5 of 31".
   */
  const progressPercent = Math.max(
    0,
    Math.min((latestMonitoringDay / 30) * 100, 100),
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex justify-center items-center py-3">
        <Image
          src="/Logo.jpg"
          width={200}
          height={40}
          alt="MYTime Logo"
          quality={100}
          unoptimized
          className="object-cover"
        />
      </div>
      {/* Main heading */}
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#12355b] text-white">
              <Activity className="h-5 w-5" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2e6cf6]">
                Clinical Monitoring
              </p>

              <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-[#12355b] sm:text-[22px]">
                IFI Monitoring
              </h1>

              <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">
                31-day longitudinal monitoring of Functional Inflammation Index
                measurements and calculated recovery.
              </p>
            </div>
          </div>

          {/* Cycle selector */}
          <div className="w-full lg:w-[390px]">
            <label
              htmlFor="ifi-monitoring-cycle"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
            >
              Monitoring Cycle
            </label>

            <div className="relative">
              <select
                id="ifi-monitoring-cycle"
                value={selectedCycleId}
                disabled={isChangingCycle || cycles.length <= 1}
                onChange={(event) => onCycleChange(event.target.value)}
                className="
                  h-10
                  w-full
                  appearance-none
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  pl-3
                  pr-10
                  text-[11px]
                  font-medium
                  text-[#12355b]
                  outline-none
                  transition
                  hover:border-slate-300
                  focus:border-[#2e6cf6]
                  focus:ring-2
                  focus:ring-[#2e6cf6]/10
                  disabled:cursor-not-allowed
                  disabled:bg-slate-50
                  disabled:text-slate-500
                  cursor-pointer
                "
              >
                {cycles.map((cycle, index) => (
                  <option key={cycle.id} value={cycle.id}>
                    {formatCycleLabel(cycle, index)}
                  </option>
                ))}
              </select>

              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />
            </div>

            {isChangingCycle && (
              <p className="mt-1.5 text-[10px] text-slate-400">
                Loading selected monitoring cycle...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Patient identity */}
      <div className="grid grid-cols-1 border-b border-slate-200 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 lg:border-b-0 lg:border-r lg:px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#12355b]">
            <UserRound className="h-4 w-4" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Patient
            </p>

            <p className="mt-0.5 truncate text-[14px] font-semibold text-[#12355b]">
              {patientName}
            </p>

            {dateOfBirth && (
              <p className="mt-0.5 text-[10px] text-slate-500">
                DOB {formatDate(dateOfBirth)}
              </p>
            )}
          </div>
        </div>

        {/* Cycle status */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Cycle Status
            </p>

            {selectedCycle && (
              <div className="mt-1.5">
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                    getStatusStyles(selectedCycle.status),
                  ].join(" ")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />

                  {getStatusLabel(selectedCycle.status)}
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Monitoring Progress
            </p>

            <p className="mt-1 text-[14px] font-semibold text-[#12355b]">
              Day {latestMonitoringDay}{" "}
              <span className="text-[11px] font-medium text-slate-400">
                of 31
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Monitoring progress */}
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="text-[10px] font-medium text-slate-500">Day 0</span>

          <span className="text-[10px] font-medium text-slate-500">Day 18</span>

          <span className="text-[10px] font-medium text-slate-500">Day 30</span>
        </div>

        <div className="relative h-2 rounded-full bg-slate-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#2e6cf6] transition-[width] duration-300"
            style={{
              width: `${progressPercent}%`,
            }}
          />

          {/* Day 18 checkpoint */}
          <span
            className="
              absolute
              left-[60%]
              top-1/2
              h-3
              w-3
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              border-2
              border-white
              bg-[#12355b]
              shadow-sm
            "
            title="Day 18 checkpoint"
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <MetadataItem
          icon={<CalendarDays className="h-4 w-4" />}
          label="Evaluation Date"
          value={formatDate(evaluationDate)}
        />

        <MetadataItem
          icon={<CalendarDays className="h-4 w-4" />}
          label="Cycle Start"
          value={selectedCycle ? formatDate(selectedCycle.startDate) : "—"}
        />

        <MetadataItem
          icon={<CalendarDays className="h-4 w-4" />}
          label="Cycle End"
          value={selectedCycle ? formatDate(selectedCycle.endDate) : "—"}
        />

        <MetadataItem
          icon={<Clock3 className="h-4 w-4" />}
          label="Created"
          value={formatDateTime(createdAt)}
        />
      </div>
    </section>
  );
}

interface MetadataItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function MetadataItem({ icon, label, value }: MetadataItemProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[11px] font-semibold text-[#12355b]">
          {value}
        </p>
      </div>
    </div>
  );
}
