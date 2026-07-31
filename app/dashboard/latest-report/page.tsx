"use client";
import { useAssessment } from "@/hooks/useAssessment";
import {
  Activity,
  CalendarDays,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartPulse,
  Info,
  Ruler,
  Scale,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type ReportBreakdownValue = string | number | boolean | null | undefined;

export interface ReportData {
  breakdown?: Record<string, ReportBreakdownValue>;
  calculatedAt: string;
  evaluationDate: string;
  formulaVersion: string;
  functionalCondition: string;
  ifi: number;
  mainGroup: string;
  rawIfi: number;
}

interface ReportProps {
  patientName?: string;
  onBack?: () => void;
  onPrint?: () => void;
}

const formatDate = (date: string, includeTime = false): string => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(includeTime
      ? {
          hour: "numeric",
          minute: "2-digit",
        }
      : {}),
  }).format(parsedDate);
};

const formatNumber = (
  value: number | null,
  maximumFractionDigits = 2,
): string => {
  if (value == null) {
    return "";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
};

const formatLabel = (key: string): string =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatBreakdownValue = (
  key: string,
  value: ReportBreakdownValue,
): string => {
  if (value === null || value === undefined) {
    return "Not available";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    if (key.toLowerCase().includes("difference")) {
      return formatNumber(value, 4);
    }

    return formatNumber(value, 2);
  }

  return value;
};

const getBreakdownIcon = (key: string) => {
  const normalizedKey = key.toLowerCase();

  if (normalizedKey.includes("sex")) {
    return UserRound;
  }

  if (normalizedKey.includes("height")) {
    return Ruler;
  }

  if (normalizedKey.includes("bmi") || normalizedKey.includes("weight")) {
    return Scale;
  }

  return Calculator;
};

const getIfiStatus = (ifi: number) => {
  if (ifi >= 0) {
    return {
      label: "Within expected range",
      description:
        "The calculated IFI value is within the expected non-negative range.",
      containerClass:
        "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
      badgeClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    };
  }

  return {
    label: "Clinical attention indicated",
    description:
      "The calculated IFI value is negative and should be interpreted alongside the full clinical assessment.",
    containerClass:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
  };
};

export default function Page({ patientName, onBack, onPrint }: ReportProps) {
  const {
    assessment: { result: report },
  } = useAssessment();

  if (!report) {
    return null;
  }

  // const status = getIfiStatus(report?.IFI?.ifi);
  const breakdownItems = Object.entries(report?.IFI?.breakdown ?? {});

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    window.print();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Assessment results
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Functional Index Report
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review the calculated result and formula breakdown.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-slate-950"
            >
              <FileText className="h-4 w-4" />
              Print report
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-8 text-white sm:px-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                  <HeartPulse className="h-6 w-6" />
                </div>

                <p className="text-sm font-medium text-indigo-100">
                  Clinical assessment report
                </p>

                <h2 className="mt-1 text-3xl font-bold tracking-tight">
                  {patientName || "Patient Report"}
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
                    {report?.IFI?.mainGroup}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
                    {report?.IFI?.functionalCondition}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur sm:min-w-56">
                <p className="text-sm text-indigo-100">Final IFI score</p>

                <p className="mt-1 text-5xl font-bold tracking-tight">
                  {/* {formatNumber()} */}
                  {report?.IFI?.ifi}
                </p>

                <p className="mt-2 text-sm text-indigo-100">
                  Raw value: {report?.IFI?.rawIfi}
                </p>
              </div>
            </div>
          </header>

          {/* <div className="space-y-8 p-6 sm:p-8">
            <section
              className={`rounded-2xl border p-5 ${status.containerClass}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/60 shadow-sm dark:bg-white/10">
                  <Activity className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">Result interpretation</h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.badgeClass}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 opacity-80">
                    {status.description}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <ClipboardList className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-semibold">Assessment summary</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Core classification and calculation details.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  icon={CalendarDays}
                  label="Evaluation date"
                  value={formatDate(report?.IFI?.evaluationDate)}
                />

                <SummaryCard
                  icon={HeartPulse}
                  label="Functional condition"
                  value={report?.IFI?.functionalCondition}
                />

                <SummaryCard
                  icon={ShieldCheck}
                  label="Main group"
                  value={report?.IFI?.mainGroup}
                />

                <SummaryCard
                  icon={Calculator}
                  label="Formula version"
                  value={`v${report?.IFI?.formulaVersion}`}
                />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                  <Calculator className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-semibold">Calculation breakdown</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Values used when calculating the final IFI result.
                  </p>
                </div>
              </div>

              {breakdownItems.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {breakdownItems.map(([key, value]) => {
                    const Icon = getBreakdownIcon(key);

                    return (
                      <article
                        key={key}
                        className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-indigo-900 dark:hover:bg-slate-950"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition group-hover:text-indigo-600 dark:bg-slate-900 dark:ring-slate-800 dark:group-hover:text-indigo-400">
                            <Icon className="h-5 w-5" />
                          </div>

                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>

                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                          {formatLabel(key)}
                        </p>

                        <p className="mt-1 break-words text-lg font-semibold text-slate-900 dark:text-white">
                          {formatBreakdownValue(key, value)}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                  <Info className="mx-auto h-6 w-6 text-slate-400" />

                  <p className="mt-3 font-medium">
                    No calculation breakdown available
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Breakdown information was not included in this report.
                  </p>
                </div>
              )}
            </section>

            <footer className="flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />

                <span>
                  Calculated {formatDate(report?.IFI?.calculatedAt, true)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />

                <span>Formula version {report?.IFI?.formulaVersion}</span>
              </div>
            </footer>
          </div> */}
        </section>

        <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-400 print:mt-8">
          This report presents a calculated assessment result and should be
          interpreted by an appropriately qualified healthcare professional in
          conjunction with the complete patient assessment.
        </p>
      </div>
    </main>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-800">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{label}</p>

      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </article>
  );
}
