import { BarChart3, CalendarDays, PersonStanding } from "lucide-react";
import type { ReactNode } from "react";

const MIN_AGE = 0;
const MAX_AGE = 149;
const AGE_LABELS = Array.from({ length: 16 }, (_, index) =>
  index === 15 ? 149 : index * 10,
);

export interface AgingCoefficientReportProps {
  /** Calendar age in years, for example 50.0. */
  chronologicalAge: number;
  /** Functional age calculated by the biological-age formula, in years. */
  biologicalAge: number;
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
  agingCoefficientPercent,
  className = "",
}: AgingCoefficientReportProps) {
  const difference = biologicalAge - chronologicalAge;
  const relationship = getRelationship(difference);
  const chronologicalLeft = `${ageToPercent(chronologicalAge)}%`;
  const biologicalLeft = `${ageToPercent(biologicalAge)}%`;
  const chronologicalPosition = ageToPercent(chronologicalAge);
  const biologicalPosition = ageToPercent(biologicalAge);
  const differenceLineLeft = `${Math.min(chronologicalPosition, biologicalPosition)}%`;
  const differenceLineWidth = `${Math.abs(biologicalPosition - chronologicalPosition)}%`;
  const differenceLabelLeft = `${(chronologicalPosition + biologicalPosition) / 2}%`;
  const relationshipColor =
    relationship === "negative"
      ? "#16802a"
      : relationship === "positive"
        ? "#ed1d24"
        : "#146ed1";
  const arrow =
    relationship === "negative" ? "↓" : relationship === "positive" ? "↑" : "↔";

  return (
    <section
      aria-label="Biological age and aging coefficient report"
      className={` w-[920px] bg-white px-7 py-3 font-sans text-[#071d68] print:px-5 print:py-2 ${className}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_218px] gap-7">
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

          <div className="relative mt-12 h-[302px] px-3">
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

            <div className="absolute left-3 right-3 top-[111px]">
              <span className="absolute -top-5 left-0 text-[12px] font-bold">
                0 years
              </span>
              <span className="absolute -top-5 right-0 text-[12px] font-bold">
                149 years
              </span>
              <div className="relative h-[67px] overflow-hidden rounded-[9px] border-[2px] border-[#101d5e] bg-[linear-gradient(90deg,#c9e4ff_0%,#f5fbff_31%,#e7f5d4_48%,#fff0a9_63%,#ffb9a6_82%,#ff8f8f_100%)]">
                <div className="absolute inset-x-[12px] top-1/2 h-px bg-[#606878]" />
                <div className="absolute inset-x-[12px] top-[calc(50%-12px)] h-6 bg-[repeating-linear-gradient(90deg,#566070_0_1px,transparent_1px_calc(100%/149))]" />
                {AGE_LABELS.map((age) => (
                  <div
                    key={age}
                    className="absolute bottom-1 top-1"
                    style={{ left: `${ageToPercent(age)}%` }}
                  >
                    <span className="absolute top-[13px] h-[22px] w-px bg-[#35405c]" />
                    <span className="absolute top-[39px] -translate-x-1/2 text-[11px] font-bold text-[#071d68]">
                      {age}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute left-3 right-3 top-[194px] flex items-center justify-between">
              <div className="flex items-center text-[#146ed1]">
                <span className="text-[31px] leading-none">←</span>
                <span className="h-[2px] w-[104px] bg-[#146ed1]" />
              </div>
              <div className="flex items-center text-[#ed1d24]">
                <span className="h-[2px] w-[104px] bg-[#ed1d24]" />
                <span className="text-[31px] leading-none">→</span>
              </div>
            </div>
            <p className="absolute left-6 top-[227px] w-24 text-center text-[10px] font-bold leading-tight text-[#146ed1]">
              YOUNGER
              <br />
              FUNCTIONAL AGE
            </p>
            <p className="absolute right-6 top-[227px] w-24 text-center text-[10px] font-bold leading-tight text-[#ed1d24]">
              OLDER
              <br />
              FUNCTIONAL AGE
            </p>

            <div
              className="absolute top-[185px] -translate-x-1/2"
              style={{ left: biologicalLeft }}
            >
              <span className="mx-auto block h-[75px] w-[2px] bg-[#075ec7]" />
              <span className="mx-auto -mt-[78px] block h-0 w-0 border-x-[7px] border-b-[11px] border-x-transparent border-b-[#075ec7]" />
              <div className="mt-[66px]">
                <AgeValueCard
                  age={biologicalAge}
                  label="BIOLOGICAL AGE"
                  tone="blue"
                />
              </div>
            </div>

            <div
              className="absolute top-[205px] h-[42px] border-t border-dashed border-[#8b7baf]"
              style={{ left: differenceLineLeft, width: differenceLineWidth }}
            />
            <p
              className="absolute top-[240px] -translate-x-1/2 whitespace-nowrap text-[12px] font-bold"
              style={{ left: differenceLabelLeft, color: "#7235a5" }}
            >
              Δ Age = {difference > 0 ? "+" : ""}
              {formatAge(difference)} years
            </p>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#7884b9]">
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
          </div>
        </main>

        <aside className="space-y-4">
          <div className="rounded-[9px] border border-[#3449b2] px-4 py-3 text-center">
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
          <div className="rounded-[9px] border border-[#8c51b5] px-3 py-3 text-[11px] leading-relaxed">
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
            <p>Δ Age = Biological Age − Chronological Age</p>
            <p className="mt-1 text-center font-bold">
              = {formatAge(biologicalAge)} − {formatAge(chronologicalAge)} ={" "}
              {difference > 0 ? "+" : ""}
              {formatAge(difference)} years
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1.65fr] gap-3">
        <div className="rounded-[8px] border border-[#7884b9] px-3 py-2 text-center text-[9px] leading-tight">
          <p className="font-bold text-[#7235a5]">AGING COEFFICIENT (%)</p>
          <p className="mt-1">
            Negative: younger biological age &nbsp;|&nbsp; Zero: same age
            &nbsp;|&nbsp; Positive: older biological age
          </p>
        </div>
        <div className="rounded-[8px] border border-[#8c51b5] px-3 py-2 text-center text-[10px] leading-tight">
          <p className="font-bold text-[#7235a5]">AGING COEFFICIENT FORMULA</p>
          <p className="mt-1">
            Aging Coefficient (%) ={" "}
            <span className="inline-block border-y border-[#071d68] px-2 py-0.5">
              Biological Age − Chronological Age
              <br />
              Biological Age
            </span>{" "}
            × 100
          </p>
        </div>
      </div>

      <footer className="mt-3 rounded-[8px] border border-[#3248b0] px-8 py-2 text-center text-[10px] leading-snug">
        <p className="font-black uppercase">Important</p>
        <p>
          This report is intended for educational and functional monitoring
          purposes only.
        </p>
        <p>
          It is not intended to diagnose, treat, cure, or prevent any disease,
          nor does it replace professional medical evaluation.
        </p>
        <div className="my-1 h-px bg-[#6d78ac]" />
        <p className="font-semibold">
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
          className="text-[9px] font-black leading-tight"
          style={{ color: tone }}
        >
          {title}
        </p>
        <p className="mt-1 text-[8px] font-medium leading-snug text-[#071d68]">
          {text}
        </p>
      </div>
    </div>
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
      <span>
        <strong style={{ color: tone }}>{label} → </strong>
        {text}
      </span>
    </p>
  );
}
