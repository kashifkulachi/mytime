import { ReportPage } from "@/components/medical-reports/ReportPage";
import { CalendarDays, HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";

const MIN_AGE = 1;
const MAX_AGE = 149;
const MAJOR_TICKS = [1, 15, 30, 45, 60, 75, 90, 105, 120, 135, 149] as const;

export interface BiologicalAgeReportProps {
  chronologicalAge: number;
  biologicalAge: number;
  title?: string;
  className?: string;
}

function clampAge(age: number) {
  if (!Number.isFinite(age)) return MIN_AGE;
  return Math.min(MAX_AGE, Math.max(MIN_AGE, age));
}

function ageToPercent(age: number) {
  return ((clampAge(age) - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100;
}

function formatAge(age: number) {
  return age.toFixed(1);
}

function AgeMarker({
  age,
  placement,
  label,
  labelClassName,
}: {
  age: number;
  placement: "above" | "below";
  label: string;
  labelClassName: string;
}) {
  const left = `${ageToPercent(age)}%`;

  return (
    <div
      className={`absolute z-20 flex -translate-x-1/2 flex-col items-center whitespace-nowrap ${
        placement === "above" ? "bottom-full mb-11" : "top-full mt-10"
      }`}
      style={{ left }}
    >
      {placement === "below" && (
        <span className="mb-2 h-0 w-0 border-x-[12px] border-b-[22px] border-x-transparent border-b-black" />
      )}

      <span
        className={`text-[13px] font-bold uppercase leading-none ${labelClassName}`}
      >
        {formatAge(age)} years
      </span>
      <span
        className={`mt-1 text-[13px] font-bold uppercase ${labelClassName}`}
      >
        {label}
      </span>

      {placement === "above" && (
        <span className="mt-2 h-0 w-0 border-x-[12px] border-t-[22px] border-x-transparent border-t-black" />
      )}
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  footer,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  footer: string;
  tone: "navy" | "green";
}) {
  const color = tone === "navy" ? "text-[#061a3d]" : "text-[#2f7429]";

  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-5 px-6 py-5">
      <div
        className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border ${color}`}
      >
        {icon}
      </div>
      <div className={`min-w-0 text-center ${color}`}>
        <p className="whitespace-nowrap text-[13px] font-bold uppercase leading-tight">
          {label}
        </p>
        <p className="mt-1 text-[38px] font-bold leading-none tracking-[-0.04em]">
          {value}
        </p>
        <p className="mt-2 text-[12px] font-bold uppercase leading-none">
          {footer}
        </p>
      </div>
    </div>
  );
}

export default function BiologicalAgeReport({
  chronologicalAge,
  biologicalAge,
  title = "ElidanLord MyTime",
  className = "",
}: BiologicalAgeReportProps) {
  const difference = biologicalAge - chronologicalAge;
  const differenceStatus =
    difference < 0
      ? "years younger"
      : difference > 0
        ? "years older"
        : "same age";
  const differenceValue = `${difference > 0 ? "+" : ""}${formatAge(difference)}`;

  return (
    <ReportPage>
      <section
        className={`w-full bg-white px-10 py-8 font-sans text-[#061a3d] print:px-8 print:py-6 ${className}`}
        aria-label="Biological age report"
      >
        <header className="text-center mb-30">
          <h1 className="text-[34px] font-bold leading-none tracking-[-0.025em]">
            {title}
          </h1>
          <div className="mt-3 flex items-center justify-center gap-5">
            <span className="h-px w-12 bg-[#6d9d5d]" />
            <p className="text-[20px] font-semibold uppercase tracking-[0.22em] text-[#666666]">
              Age Report
            </p>
            <span className="h-px w-12 bg-[#6d9d5d]" />
          </div>
        </header>

        <div className="mt-14 px-8">
          <div className="relative">
            <AgeMarker
              age={chronologicalAge}
              placement="above"
              label="Chronological Age (CA)"
              labelClassName="text-[#061a3d]"
            />

            <div className="relative h-[66px] rounded-md border-[1.5px] border-[#202020] bg-[linear-gradient(90deg,#e4f2fe_0%,#f8fbff_48%,#f1fae8_100%)] shadow-[inset_0_0_12px_rgba(47,116,41,0.04)]">
              <div className="absolute -top-[18px] left-0 right-0 h-[7px] bg-[repeating-linear-gradient(90deg,#222_0_1px,transparent_1px_calc(100%/148))]" />
              <div className="absolute -bottom-[18px] left-0 right-0 h-[7px] bg-[repeating-linear-gradient(90deg,#222_0_1px,transparent_1px_calc(100%/148))]" />

              {MAJOR_TICKS.map((tick) => {
                const left = `${ageToPercent(tick)}%`;
                return (
                  <div
                    key={tick}
                    className="absolute inset-y-0"
                    style={{ left }}
                  >
                    <span className="absolute bottom-full left-0 h-[18px] w-px bg-[#222]" />
                    <span className="absolute left-1/2 top-[-45px] -translate-x-1/2 text-[12px] font-bold">
                      {tick}
                    </span>
                    <span className="absolute left-0 top-full h-[18px] w-px bg-[#222]" />
                    <span className="absolute left-1/2 top-[86px] -translate-x-1/2 text-[12px] font-bold">
                      {tick}
                    </span>
                  </div>
                );
              })}

              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[17px] font-bold uppercase">
                Age (Years)
              </span>
              <span className="absolute right-[calc(100%+24px)] top-1/2 -translate-y-1/2 text-[13px] font-bold">
                1
              </span>
              <span className="absolute left-[calc(100%+24px)] top-1/2 -translate-y-1/2 text-[13px] font-bold">
                149
              </span>
            </div>

            <AgeMarker
              age={biologicalAge}
              placement="below"
              label="Biological Age (BA)"
              labelClassName="text-[#2f7429]"
            />
          </div>
        </div>

        <div className="mt-32 flex overflow-hidden rounded-lg border border-[#dddddd] bg-white shadow-[0_1px_5px_rgba(0,0,0,0.04)]">
          <SummaryItem
            icon={<CalendarDays className="h-10 w-10" strokeWidth={1.8} />}
            label="Chronological Age (CA)"
            value={formatAge(chronologicalAge)}
            footer="years"
            tone="navy"
          />
          <div className="my-5 w-px bg-[#dddddd]" />
          <SummaryItem
            icon={<HeartHandshake className="h-11 w-11" strokeWidth={1.7} />}
            label="Biological Age (BA)"
            value={formatAge(biologicalAge)}
            footer="years"
            tone="green"
          />
          <div className="my-5 w-px bg-[#dddddd]" />
          <SummaryItem
            icon={
              <span
                className={`text-[54px] font-bold leading-none ${difference > 0 ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                {difference === 0 ? "↔" : "↓"}
              </span>
            }
            label="Biological Age Difference"
            value={differenceValue}
            footer={differenceStatus}
            tone="green"
          />
        </div>

        <p className="mt-5 px-4 text-[13px] text-center mx-auto max-w-3/5 italic leading-snug text-[#ed1c24]">
          Disclaimer: This report is provided exclusively for wellness
          assessment and health monitoring purposes. It is not a medical
          diagnosis and does not replace the advice or diagnosis of a qualified
          healthcare professional. All rights reserved © ElidanLord MyTIME LLC.
        </p>
      </section>
    </ReportPage>
  );
}
