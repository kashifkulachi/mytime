import { ReportPage } from "@/components/medical-reports/ReportPage";
import { BarChart3, CalendarDays, PersonStanding } from "lucide-react";
import type { ReactNode } from "react";
import PatientInfoReport from "./PatientInfoReport";

const MIN_AGE = 0;
const MAX_AGE = 149;
const RULER_EDGE_INSET_PERCENT = 2.5;
const AGE_LABELS = Array.from({ length: 16 }, (_, index) =>
  index === 15 ? 149 : index * 10,
);
const RULER_TICKS = Array.from({ length: MAX_AGE + 1 }, (_, age) => age);

export interface AgingCoefficientReportProps {
  /** Calendar age in years, for example 50.0. */
  chronologicalAge: number;
  /** Functional age calculated by the biological-age formula, in years. */
  biologicalAge: number;
  /**
   * Final age difference supplied by your calculation: biological age minus
   * chronological age. It is displayed as-is and is not recalculated here.
   */
  ageDifferenceYears: number;
  /**
   * Aging Coefficient already expressed as a percentage, for example -16.82.
   * This component displays the supplied calculation and never recalculates it.
   */
  agingCoefficientPercent: number;
  className?: string;
}

type AgeRelationship = "negative" | "zero" | "positive";

function clampAge(age: number) {
  if (!Number.isFinite(age)) return MIN_AGE;
  return Math.min(MAX_AGE, Math.max(MIN_AGE, age));
}

function ageToPercent(age: number) {
  return ((clampAge(age) - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100;
}

/**
 * Keeps every ruler value—including 0 and 149—safely inside the bar.
 * The same scale is intentionally used by tick marks and labels.
 */
function ageToRulerPercent(age: number) {
  return (
    RULER_EDGE_INSET_PERCENT +
    (ageToPercent(age) * (100 - RULER_EDGE_INSET_PERCENT * 2)) / 100
  );
}

function formatAge(age: number) {
  return Number.isFinite(age) ? age.toFixed(2) : "0.0";
}

function formatCoefficient(value: number) {
  return Number.isFinite(value)
    ? `${value > 0 ? "+" : ""}${value.toFixed(2)} %`
    : "0.00 %";
}

function getRelationship(difference: number): AgeRelationship {
  if (difference < 0) return "negative";
  if (difference > 0) return "positive";
  return "zero";
}

function relationshipCopy(relationship: AgeRelationship) {
  if (relationship === "negative")
    return "Biological Age is younger than Chronological Age";
  if (relationship === "positive")
    return "Biological Age is older than Chronological Age";
  return "Biological Age equals Chronological Age";
}

function AgeValueCard({
  age,
  label,
  tone,
}: {
  age: number;
  label: string;
  tone: "green" | "blue";
}) {
  const color = tone === "green" ? "#107923" : "#075ec7";

  return (
    <div className="flex flex-col items-center">
      <p className="mb-1 text-[12px] font-bold leading-none" style={{ color }}>
        {label}
      </p>
      <div
        className="rounded-[9px] border-[1.5px] bg-white px-5 py-1.5 shadow-sm"
        style={{ borderColor: color }}
      >
        <p className="text-[20px] font-bold leading-none" style={{ color }}>
          {formatAge(age)} years
        </p>
      </div>
    </div>
  );
}

export default function AgingCoefficientReport({
  chronologicalAge,
  biologicalAge,
  ageDifferenceYears,
  agingCoefficientPercent,
  className = "",
}: AgingCoefficientReportProps) {
  const difference = Number.isFinite(ageDifferenceYears)
    ? ageDifferenceYears
    : 0;
  const relationship = getRelationship(difference);
  /*
   * The cards, difference guide, labels, and tick marks must use this exact
   * inset scale. Using the full 0–100% width for cards makes them drift from
   * the ruler because the ruler deliberately has visible left/right padding.
   */
  const chronologicalPosition = ageToRulerPercent(chronologicalAge);
  const biologicalPosition = ageToRulerPercent(biologicalAge);
  const chronologicalLeft = `${chronologicalPosition}%`;
  const biologicalLeft = `${biologicalPosition}%`;
  const differenceLineLeft = `${Math.min(chronologicalPosition, biologicalPosition)}%`;
  const differenceLineWidth = `${Math.abs(biologicalPosition - chronologicalPosition)}%`;
  const differenceLabelLeft = `${(chronologicalPosition + biologicalPosition) / 2}%`;
  const relationshipColor =
    relationship === "negative"
      ? "#16802a"
      : relationship === "positive"
        ? "#ed1d24"
        : "#146ed1";

  return (
    <section
      aria-label="Biological age and aging coefficient report"
      className={`mx-auto w-[1100px]  min-w-[1100px] overflow-hidden bg-white/60 px-7 pt-8 pb-0 font-sans text-[#071d68]  ${className}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_250px] items-start gap-9">
        <main className="min-w-0">
          <header className="text-center">
            <h1 className="text-[31px] font-black uppercase leading-none tracking-[-0.04em]">
              Biological Age &amp; Aging Coefficient
            </h1>
            <p className="mt-2 text-[16px] font-semibold italic leading-none">
              Relationship Between Chronological Age, Biological Age and Aging
              Coefficient
            </p>
          </header>

          <p className="mx-auto mt-4 max-w-[650px] rounded-[9px] border border-[#284bb3] px-5 py-2 text-center text-[14px] font-medium leading-snug">
            The Aging Coefficient reflects the difference between your{" "}
            <strong className="text-[#075ec7]">Biological Age</strong>{" "}
            (functional age) and your{" "}
            <strong className="text-[#107923]">Chronological Age</strong>{" "}
            (calendar age).
          </p>

          <div className="relative mt-5 h-[326px]">
            {/*
              This is the one positioning system for the complete diagram.
              The ruler and both age indicators share its left/right edges.
            */}
            <div className="absolute inset-y-0 left-5 right-5">
              <div
                className="absolute top-0 -translate-x-1/2"
                style={{ left: chronologicalLeft }}
              >
                <AgeValueCard
                  age={chronologicalAge}
                  label="CHRONOLOGICAL AGE"
                  tone="green"
                />
                <div className="mx-auto h-8 w-px bg-[#107923]" />
                <span className="mx-auto block h-2.5 w-2.5 rounded-full bg-[#107923]" />
              </div>

              <div className="absolute inset-x-0 top-[116px]">
                <span className="absolute -top-5 left-3 text-[12px] font-bold">
                  0 years
                </span>
                <span className="absolute -top-5 right-3 text-[12px] font-bold">
                  149 years
                </span>
                <div className="relative h-[67px] overflow-hidden rounded-[9px] border-[2px] border-[#101d5e] bg-[linear-gradient(90deg,#c9e4ff_0%,#f5fbff_31%,#e7f5d4_48%,#fff0a9_63%,#ffb9a6_82%,#ff8f8f_100%)]">
                  <div className="absolute inset-x-[12px] top-1/2 h-px bg-[#606878]" />
                  <div className="absolute inset-0">
                    {RULER_TICKS.map((age) => {
                      const isDecade = age % 10 === 0;
                      return (
                        <span
                          key={age}
                          aria-hidden="true"
                          className={`absolute left-0 -translate-x-1/2 bg-[#35405c] ${
                            isDecade
                              ? "top-[30px] h-[6px] w-[1.5px] opacity-80"
                              : "top-[32px] h-[3px] w-px opacity-25"
                          }`}
                          style={{ left: `${ageToRulerPercent(age)}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="absolute inset-0">
                    {AGE_LABELS.map((age) => (
                      <span
                        key={age}
                        className="absolute top-[42px] -translate-x-1/2 text-[11px] font-bold text-[#071d68]"
                        style={{ left: `${ageToRulerPercent(age)}%` }}
                      >
                        {age}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {biologicalAge > 20 && (
                <>
                  <div className="absolute inset-x-0 top-[188px] flex items-center justify-between">
                    <FunctionalDirectionArrow
                      direction="left"
                      color="#146ed1"
                    />
                    <FunctionalDirectionArrow
                      direction="right"
                      color="#ed1d24"
                    />
                  </div>
                  <p className="absolute left-0 top-[205px] w-[90px] text-center text-[10px] font-bold leading-tight text-[#146ed1]">
                    YOUNGER
                    <br />
                    FUNCTIONAL AGE
                  </p>
                </>
              )}

              {biologicalAge < 130 && (
                <>
                  <p className="absolute right-0 top-[205px] w-[90px] text-center text-[10px] font-bold leading-tight text-[#ed1d24]">
                    OLDER
                    <br />
                    FUNCTIONAL AGE
                  </p>

                  <div className="absolute inset-x-0 top-[188px]  flex items-center justify-between">
                    <div></div>
                    <FunctionalDirectionArrow
                      direction="right"
                      color="#ed1d24"
                    />
                  </div>
                </>
              )}

              <div
                className="absolute top-[195px] -translate-x-1/2"
                style={{ left: biologicalLeft }}
              >
                <span className="mx-auto block h-[55px] w-[2px] bg-[#075ec7]" />
                <span className="mx-auto -mt-[58px] block h-0 w-0 border-x-[7px] border-b-[11px] border-x-transparent border-b-[#075ec7]" />

                {/* <span className="mx-auto -mt-[78px] block h-2.5 w-2.5 border  bg-[#075ec7] border-[#075ec7]" /> */}
                <div className="mt-[50px]">
                  <AgeValueCard
                    age={biologicalAge}
                    label="BIOLOGICAL AGE"
                    tone="blue"
                  />
                </div>
              </div>

              <div
                className="absolute top-[210px] h-[34px] "
                style={{
                  left: differenceLineLeft,
                  width: differenceLineWidth,
                }}
              >
                {/* Dashed line */}
                <div className="absolute left-0 right-0 top-0 border-t border-dashed border-[#7235a5]" />

                {/* Start dot */}
                <div className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7235a5]" />

                {/* End dot */}
                <div className="absolute right-0 top-0 h-1.5 w-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7235a5]" />
              </div>

              <p
                className="absolute top-[218px] border border-[#7235a5] px-4 -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 text-[12px] font-bold"
                style={{ left: differenceLabelLeft, color: "#7235a5" }}
              >
                Δ Age = {formatAge(difference)} years
                {difference > 0 ? " Older" : " Younger "}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2  mt-3 overflow-hidden rounded-[8px] border border-[#7884b9]">
            <Definition
              icon={<CalendarDays className="h-8 w-8" />}
              title="CHRONOLOGICAL AGE"
              tone="#107923"
              text="Calendar age calculated from the date of birth."
            />
            <Definition
              icon={<PersonStanding className="h-8 w-8" />}
              title="BIOLOGICAL AGE"
              tone="#075ec7"
              text="Estimated functional age derived from the VitaVoice physiological model."
            />
            <Definition
              icon={<BarChart3 className="h-8 w-8" />}
              title="AGING COEFFICIENT (%)"
              tone="#7235a5"
              text="Indicates whether biological aging is slower, equal, or faster than expected."
            />

            <div className="rounded-[8px] col-span-3 text-[11px] border border-[#8c51b5] px-3 py-2 text-center text-[10px] leading-tight">
              <p className="font-black text-[13px] text-[#7235a5]">
                AGING COEFFICIENT FORMULA
              </p>
              <p className="mt-1 font-medium">
                Aging Coefficient (%) ={" "}
                <span className="inline-block border-y border-[#071d68] px-2 py-0.5">
                  Biological Age − Chronological Age
                  <br />
                  Biological Age
                </span>{" "}
                × 100
              </p>

              <p className="mt-1 font-medium">
                <span style={{ color: "#16802a" }} className="font-bold">
                  Negative:
                </span>{" "}
                younger biological age &nbsp;|&nbsp;
                <span style={{ color: "#ed1d24" }} className="font-bold">
                  Zero:
                </span>{" "}
                same age &nbsp;|&nbsp;{" "}
                <span style={{ color: "#146ed1" }} className="font-bold">
                  Positive:
                </span>{" "}
                older biological age
              </p>
            </div>
          </div>
        </main>

        <aside className="space-y-5 pt-1">
          <div className="rounded-[9px] flex flex-col gap-2 border border-[#3449b2] px-4 py-3 text-center">
            <h2 className="text-[15px] font-black uppercase">
              Aging Coefficient
            </h2>
            <p
              className="mt-1 text-[29px] font-black leading-none"
              style={{ color: relationshipColor }}
            >
              {formatCoefficient(agingCoefficientPercent)}
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-snug">
              ({relationshipCopy(relationship)})
            </p>
            <div className="my-3 h-px bg-[#6471aa]" />
            <h2 className="text-[14px] font-black uppercase">Interpretation</h2>
            <Interpretation
              tone="#16802a"
              label="Negative"
              text="Biological age is younger than chronological age."
            />
            <Interpretation
              tone="#146ed1"
              label="Zero"
              text="Biological age equals chronological age."
            />
            <Interpretation
              tone="#ed1d24"
              label="Positive"
              text="Biological age is older than chronological age."
            />
          </div>
          <div className="rounded-[9px] flex flex-col gap-2 border border-[#8c51b5] px-3 py-3 text-[11px] leading-relaxed">
            <h2 className="text-center text-[15px] font-black uppercase text-[#7235a5]">
              Example
            </h2>
            <p className="mt-2 font-bold text-[#107923]">
              Chronological Age{" "}
              <span className="float-right">
                {formatAge(chronologicalAge)} years
              </span>
            </p>
            <p className="mt-1 font-bold text-[#075ec7]">
              Biological Age{" "}
              <span className="float-right">
                {formatAge(biologicalAge)} years
              </span>
            </p>
            <div className="my-2 h-px bg-[#9b6fb9]" />
            <div className="text-[#7235a5] font-bold text-center text-[10px]">
              <p>Δ Age = Biological Age − Chronological Age</p>
              <p className="mt-1 text-center font-bold">
                = {formatAge(biologicalAge)} − {formatAge(chronologicalAge)} ={" "}
                {difference > 0 ? "+" : ""}
                {formatAge(difference)} years
              </p>
            </div>
          </div>
        </aside>
      </div>

      <footer className="mt-2 rounded-[8px] border border-[#2944be] px-10 text-[#ed1d24] py-1.5 text-center text-[11px] font-semibold leading-snug">
        <p className="text-[16px] font-black uppercase leading-none">
          Important
        </p>
        <p className="mt-1">
          This report is intended for educational and functional monitoring
          purposes only.
        </p>
        <p>
          It is not intended to diagnose, treat, cure, or prevent any disease,
          nor does it replace professional medical evaluation.
        </p>
        <div className="mx-auto my-1 h-px max-w-[870px] bg-[#5363b2]" />
        <p className="text-[12px] font-bold">
          Please consult your primary care physician regarding your health
          status, symptoms, and the need for appropriate clinical evaluation.
        </p>
      </footer>
    </section>
  );
}

function Definition({
  icon,
  title,
  tone,
  text,
}: {
  icon: ReactNode;
  title: string;
  tone: string;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-r border-[#c0c5dd] px-3 py-3 last:border-r-0">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: tone }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-[13px] font-black leading-tight"
          style={{ color: tone }}
        >
          {title}
        </p>
        <p className="mt-1 text-[11px] font-medium leading-snug text-[#071d68]">
          {text}
        </p>
      </div>
    </div>
  );
}

function FunctionalDirectionArrow({
  direction,
  color,
}: {
  direction: "left" | "right";
  color: string;
}) {
  const isLeft = direction === "left";

  return (
    <svg
      aria-hidden="true"
      className="h-6 w-[80px]"
      viewBox="0 0 140 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={
          isLeft ? "M138 12H8M18 3L8 12L18 21" : "M2 12H132M122 3L132 12L122 21"
        }
        stroke={color}
        strokeWidth="3"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function Interpretation({
  tone,
  label,
  text,
}: {
  tone: string;
  label: string;
  text: string;
}) {
  return (
    <p className="mt-2 flex items-start gap-2 text-left text-[10px] leading-snug">
      <span
        className="mt-[2px] h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: tone }}
      />
      <span className="font-medium">
        <strong className="font-bold" style={{ color: tone }}>
          {label} →{" "}
        </strong>
        {text}
      </span>
    </p>
  );
}

function DifferenceSpanArrow() {
  return (
    <svg
      className="block h-full w-full overflow-visible"
      viewBox="0 0 100 16"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 8H99M1 8L8 2M1 8L8 14M99 8L92 2M99 8L92 14"
        stroke="#7235a5"
        strokeWidth="3"
        strokeLinecap="square"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
