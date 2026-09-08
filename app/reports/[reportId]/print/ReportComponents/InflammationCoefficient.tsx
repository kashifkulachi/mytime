import { ReportPage } from "@/components/medical-reports/ReportPage";
import { CircleHelp, Flame, PersonStanding } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const RULER_VALUES = Array.from({ length: 101 }, (_, value) => value);
const RULER_LABELS = Array.from({ length: 11 }, (_, index) => index * 10);
const RULER_INSET_PERCENT = 2.5;

export interface InflammationCoefficientProps {
  /** Final Inflammation Coefficient already expressed as a percent, from 0 to 100. */
  inflammationCoefficientPercent: number;
  className?: string;
}

function clampCoefficient(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function toRulerPosition(value: number) {
  return (
    RULER_INSET_PERCENT +
    (clampCoefficient(value) / 100) * (100 - RULER_INSET_PERCENT * 2)
  );
}

function formatPercent(value: number) {
  return `${clampCoefficient(value).toFixed(2)} %`;
}

function coefficientTone(value: number) {
  if (value <= 25) return "#09721d";
  if (value <= 50) return "#b97600";
  if (value <= 75) return "#ed4b12";
  return "#bb1010";
}

export default function InflammationCoefficient({
  inflammationCoefficientPercent,
  className = "",
}: InflammationCoefficientProps) {
  const coefficient = clampCoefficient(inflammationCoefficientPercent);
  const markerLeft = `${toRulerPosition(coefficient - 1)}%`;
  const markerColor = coefficientTone(coefficient);

  return (
    <ReportPage>
      <section
        aria-label="Inflammation coefficient report"
        className={`mx-auto w-[1100px]   min-w-[1100px] overflow-hidden bg-white px-7 mt-5 pt-8 pb-0 font-sans text-[#071b74]   ${className}`}
      >
        <div className="flex justify-center items-center">
          <Image
            src="/Logo.jpg"
            width={270}
            height={100}
            quality={100}
            loading="eager"
            alt="MYTime Logo"
          />
        </div>
        <div className="grid grid-cols-[1.3fr_.93fr] items-start gap-6">
          <div className="pt-1 text-center">
            <h1 className="text-[38px] font-black uppercase leading-none tracking-[-0.035em] text-[#071b74]">
              Inflammation Coeff (%)
            </h1>
            <p className="mt-1 text-[16px] font-bold italic leading-none text-[#071b74]">
              Quantitative Assessment of Systemic Inflammatory Burden
            </p>
            <div className="mx-auto mt-4 max-w-[625px] rounded-[10px] border border-[#1d46d0] px-8 py-1.5 text-[15px] font-semibold leading-snug">
              The Inflammation Coeff (%) is a numerical value from{" "}
              <strong className="text-[#08711d]">0%</strong> to{" "}
              <strong className="text-[#c41010]">100%</strong>
              <br />
              that reflects the estimated level of systemic inflammation
              <br />
              based on physiological and functional parameters.
            </div>
          </div>

          <FormulaCard />
        </div>

        <h2 className="mt-3 text-center text-[20px] font-black leading-none text-[#071b74]">
          INFLAMMATION COEFF (%) RANGE: 0% – 100%
        </h2>

        <div className="mt-1 grid h-[166px] grid-cols-4 overflow-hidden rounded-[12px] border-2 border-[#161d69]">
          <RangePanel
            tone="#08711d"
            title="LOW INFLAMMATION"
            range="0% – 25%"
            description={
              <>
                Optimal inflammatory balance.
                <br />
                Low systemic inflammatory activity.
                <br />
                Lower risk of inflammation-related
                <br />
                dysfunction.
              </>
            }
          />
          <RangePanel
            tone="#b97600"
            title="MILD INFLAMMATION"
            range="25.1% – 50%"
            description={
              <>
                Slight increase in inflammatory activity.
                <br />
                Monitor lifestyle, diet and
                <br />
                risk factors.
              </>
            }
          />
          <RangePanel
            tone="#ed4b12"
            title="MODERATE INFLAMMATION"
            range="50.1% – 75%"
            description={
              <>
                Elevated inflammatory activity.
                <br />
                May be associated with chronic stress
                <br />
                or underlying conditions.
              </>
            }
          />
          <RangePanel
            tone="#bb1010"
            title="HIGH INFLAMMATION"
            range="75.1% – 100%"
            description={
              <>
                High inflammatory activity.
                <br />
                Associated with greater risk and
                <br />
                disease progression.
              </>
            }
            last
          />
        </div>

        <div className="relative -mt-0.5 h-[215px]">
          <div className="absolute inset-x-0 top-0 h-[41px]">
            <div className="absolute inset-x-[12px] top-0 h-[18px] border-t border-[#171d6b]">
              {RULER_VALUES.map((value) => {
                const isDecade = value % 10 === 0;
                return (
                  <span
                    key={value}
                    aria-hidden="true"
                    className={`absolute top-0 -translate-x-1/2 bg-[#263052] ${isDecade ? "h-[6px] w-[1.5px] opacity-80" : "h-[3px] w-px opacity-25"}`}
                    style={{ left: `${toRulerPosition(value)}%` }}
                  />
                );
              })}
            </div>
            {RULER_LABELS.map((value) => (
              <span
                key={value}
                className="absolute top-[20px] -translate-x-1/2 text-[15px] font-black"
                style={{
                  left: `${toRulerPosition(value)}%`,
                  color: coefficientTone(value === 100 ? 100 : value + 0.01),
                }}
              >
                {value}%
              </span>
            ))}
          </div>

          <div
            className="absolute top-[43px] z-10 -translate-x-1/2"
            style={{ left: markerLeft }}
          >
            <div className="relative flex h-[32px] flex-col items-center">
              <span
                className="h-[49px] w-[2px]"
                style={{ backgroundColor: markerColor }}
              />
              <span
                className="-mt-[1px] h-0 w-0 border-x-[6px] border-t-[9px] border-x-transparent"
                style={{ borderTopColor: markerColor }}
              />
            </div>
            <p className="mt-0 w-[110px] text-center text-[10px] font-black text-[#0626b4]">
              YOUR INFLAMMATION COEFF (%)
            </p>
            <div
              className="mx-auto mt-1 w-[110px] rounded-[9px] border-2 bg-white px-3 py-1.5 text-center"
              style={{ borderColor: markerColor, color: markerColor }}
            >
              <p className="text-[17px] font-bold bg-white  leading-none ">
                {formatPercent(coefficient)}
              </p>
            </div>
          </div>

          <div className="absolute inset-x-0 top-[170px] z-9 grid grid-cols-[365px_1fr_410px] items-start gap-8">
            <FactorsCard type="increase" />
            <div />
            <FactorsCard type="reduce" />
          </div>
        </div>

        <div className="mx-auto mt-1 flex w-[895px] mt-[110px] items-center justify-center gap-4 rounded-[8px] border border-[#6372bb] px-5 py-1.5 text-center">
          <CircleHelp
            className="h-9 w-9 shrink-0 text-[#071b74]"
            strokeWidth={2.5}
          />
          <p className="text-[12px] font-semibold leading-snug">
            The Inflammation Coeff (%) provides a functional estimate of
            systemic inflammation.
            <br />
            Values closer to <strong className="text-[#08711d]">0%</strong>{" "}
            indicate lower inflammation, while values closer to{" "}
            <strong className="text-[#c41010]">100%</strong> indicate higher
            inflammatory burden.
          </p>
        </div>

        <footer className="mt-2 rounded-[8px] border border-[#2944be] text-[#ed1d24] px-10 py-1.5 text-center text-[11px] font-semibold leading-snug">
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
    </ReportPage>
  );
}

function FormulaCard() {
  return (
    <aside className="rounded-[9px] border border-[#2047c9] px-3 py-2 text-[12px] font-semibold leading-snug text-[#071b74]">
      <h2 className="text-center text-[17px] font-black leading-none">
        INFLAMMATION COEFF FORMULA
      </h2>
      <p className="mt-3 whitespace-nowrap text-[14px] font-bold leading-none">
        Coeff (%) = (− IFI) × BMI ×{" "}
        <span className="inline-block align-middle text-center leading-none">
          <span className="border-b border-[#071b74] px-1">SpO₂</span>
          <br />
          100
        </span>{" "}
        ×{" "}
        <span className="inline-block align-middle text-center leading-none">
          <span className="border-b border-[#071b74] px-1">HR</span>
          <br />
          60
        </span>{" "}
        × (1 −{" "}
        <span className="inline-block align-middle text-center leading-none">
          <span className="border-b border-[#071b74] px-1">SpO₂</span>
          <br />
          100
        </span>
        ) × 100
      </p>
      <p className="mt-2 font-black">Where:</p>
      <ul className="list-none leading-[1.3]">
        <li>• IFI &nbsp;&nbsp;= Functional Integrity Index</li>
        <li>• BMI = Body Mass Index (kg/m²)</li>
        <li>• SpO₂ = Peripheral Oxygen Saturation (%)</li>
        <li>• HR &nbsp;&nbsp;= Heart Rate (beats per minute)</li>
      </ul>
    </aside>
  );
}

function RangePanel({
  tone,
  title,
  range,
  description,
  last = false,
}: {
  tone: string;
  title: string;
  range: string;
  description: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`px-5 pt-2 text-center ${last ? "" : "border-r border-[#d0a451]"}`}
      style={{ background: `${tone}0D` }}
    >
      <p
        className="text-[16px] font-black leading-none"
        style={{ color: tone }}
      >
        {title}
      </p>
      <p
        className="mt-2 text-[20px] font-black leading-none"
        style={{ color: tone }}
      >
        {range}
      </p>
      <div className="mx-2 mt-2 h-px" style={{ backgroundColor: tone }} />
      <p className="mt-2 text-[12px] font-semibold leading-snug text-[#111b45]">
        {description}
      </p>
    </div>
  );
}

function FactorsCard({ type }: { type: "increase" | "reduce" }) {
  const increase = type === "increase";
  const tone = increase ? "#4d148c" : "#08711d";
  const items = increase
    ? [
        "Poor diet and excess body fat",
        "Chronic stress and poor sleep quality",
        "Sedentary lifestyle",
        "Smoking and excessive alcohol",
        "Chronic infections or underlying disease",
        "Environmental toxins and pollutants",
      ]
    : [
        "Balanced anti-inflammatory diet",
        "Regular physical activity",
        "Adequate sleep and stress management",
        "Maintain healthy body weight",
        "Avoiding smoking and excessive alcohol",
        "Medical control of underlying conditions",
      ];
  const Icon = increase ? Flame : PersonStanding;
  return (
    <div
      className="flex min-h-[145px] items-center gap-3 rounded-[9px] border px-3 py-2"
      style={{ borderColor: tone }}
    >
      <div
        className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-2"
        style={{ borderColor: tone }}
      >
        <Icon className="h-11 w-11" style={{ color: tone }} strokeWidth={2.2} />
      </div>
      <div>
        <p
          className="text-[13px] font-black leading-tight"
          style={{ color: tone }}
        >
          FACTORS THAT MAY{" "}
          {increase ? "INCREASE INFLAMMATION" : "REDUCE INFLAMMATION"}
        </p>
        <ul className="mt-1 text-[11px] font-semibold leading-[1.3] text-[#071b74]">
          {items.map((item) => (
            <li key={item}>• &nbsp;{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
