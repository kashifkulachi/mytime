import { ReportPage } from "@/components/medical-reports/ReportPage";
import {
  Activity,
  Clock3,
  HeartPulse,
  Info,
  Leaf,
  ShieldCheck,
  Stethoscope,
  Wind,
} from "lucide-react";
import Image from "next/image";

export interface HBOTProtocol {
  id: "high-pressure" | "medium-pressure" | "low-pressure" | string;
  name: string;
  pressureAta: number;
  durationMinutes: number;
  oxygenPercent: number;
}

export interface HBOTRecommendation {
  protocol: HBOTProtocol;
  calculatedSessions: number;
}

export interface HBOTSessionReportProps {
  recommendations: HBOTRecommendation[];
  className?: string;
}

const TONES: Record<string, { primary: string; dark: string; pale: string }> = {
  "high-pressure": { primary: "#40108c", dark: "#2b0764", pale: "#f3edff" },
  "medium-pressure": { primary: "#0b3f9e", dark: "#082a73", pale: "#eaf1ff" },
  "low-pressure": { primary: "#11652c", dark: "#07451c", pale: "#edf9ef" },
};

function toneFor(id: string) {
  return TONES[id] ?? TONES["medium-pressure"];
}
function formatSessions(value: number) {
  return Number.isFinite(value) ? Math.round(value) : "—";
}
function typeName(id: string) {
  return id === "high-pressure"
    ? "HIGH-PRESSURE HBOT"
    : id === "low-pressure"
      ? "LOW-PRESSURE HBOT"
      : "MEDIUM-PRESSURE HBOT";
}

function chamberCopy(id: string) {
  return id === "low-pressure"
    ? "Soft Chamber (Hood/Shroud)"
    : "Rigid Chamber (Monoplace)";
}
function factor(id: string) {
  return id === "high-pressure"
    ? "20"
    : id === "medium-pressure"
      ? "25"
      : "71.4";
}

export default function HBOTSessionReport({
  recommendations,
  className = "",
}: HBOTSessionReportProps) {
  const ordered = ["low-pressure", "medium-pressure", "high-pressure"]
    .map((id) => recommendations.find((item) => item.protocol.id === id))
    .filter((item): item is HBOTRecommendation => Boolean(item));
  return (
    <ReportPage>
      <section
        aria-label="Hyperbaric oxygen therapy recommendation"
        className={`mx-auto mt-3  w-[1100px] min-w-[1100px] overflow-hidden bg-white px-2 py-2 font-sans text-[#091b6c]  ${className}`}
      >
        {/* <div className="flex items-center text-center justify-center gap-2 mb-4">
          <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] border-[#0a297c] text-[28px] font-serif font-black text-[#a86500]">
            EL
          </span>
          <div>
            <p className="text-[42px] font-serif leading-[.8] text-[#09216d]">
              Elidan<span className="text-[#bd7105]">Lord</span>
            </p>
            <p className="mt-2 border-y border-[#bd7105] px-10 text-[28px] tracking-[.22em] leading-none">
              MyTime
            </p>
            <p className="text-[11px] tracking-[.5em]">LLC</p>
          </div>
        </div> */}
        <header className="grid grid-cols-[270px_1fr_280px] items-start justify-between gap-5 ">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Image
              src="/Logo.jpg"
              width={270}
              height={100}
              quality={100}
              loading="eager"
              alt="MYTime Logo"
            />
          </div>
          <div className="text-center ">
            <h1 className="text-[25px] font-black uppercase leading-none tracking-[-.035em]">
              Hyperbaric Oxygen Therapy (HBOT) Recommendation
            </h1>
            <p className="mt-1 text-[17px] font-bold italic leading-none">
              Functional Recommendation Based on the Functional Integrity Index
              (IFI)
            </p>
            <div className="mt-3 rounded-[9px] border border-[#8cb7ff] px-8 py-1.5 text-[13px] font-semibold leading-snug">
              HBOT enhances oxygen delivery, reduces inflammation, supports
              tissue repair and optimizes cellular function according to the
              individual functional status.
            </div>
          </div>
          <CorrelationCard />
        </header>
        <div className="mt-2 grid grid-cols-[120px_1fr_300px] gap-3">
          <TypesRail />
          <div>
            <div className="grid grid-cols-3 gap-2">
              {ordered.map((item) => (
                <ProtocolCard key={item.protocol.id} recommendation={item} />
              ))}
            </div>
            <ProtocolTable recommendations={ordered} />
          </div>
          <aside className="space-y-2">
            <ClinicalRange />
            <SessionFactors />
          </aside>
        </div>
        <Benefits />
        <Footer />
      </section>
    </ReportPage>
  );
}

function CorrelationCard() {
  return (
    <aside className="rounded-[9px] border border-[#6678bd] text-center text-[10px] font-semibold leading-snug">
      <p className="rounded-t-[8px] bg-[#071d70] py-1 text-[14px] font-black text-white">
        MATHEMATICAL CORRELATION
      </p>
      <p className="px-3 pt-2 text-[20px] font-serif font-bold leading-tight">
        IFI × N = |IFI| / BMI × 20
        <br />× (2.5 / ATA) × (90 / Time) × (100 / O₂)
      </p>
      <div className="px-3 pb-2 text-left leading-[1.45]">
        <p>N = Estimated number of sessions</p>
        <p>ATA = Pressure in atmospheres absolute</p>
        <p>Time = Session duration in minutes</p>
        <p>O₂ = Oxygen concentration (%)</p>
        <p>IFI = Functional Integrity Index</p>
      </div>
    </aside>
  );
}
function TypesRail() {
  return (
    <aside className=" overflow-hidden rounded-[9px] border border-[#78aa7d]">
      <p className="py-3 text-center text-[19px] font-black leading-none text-[#135423]">
        TYPES
        <br />
        OF HBOT
      </p>
      <RailItem
        icon={ShieldCheck}
        tone="#351080"
        label="HIGH-PRESSURE HBOT"
        value="2.5 ATA"
        text="Maximum therapeutic effect for complex or chronic conditions."
      />
      <RailItem
        icon={Activity}
        tone="#074aa4"
        label="MEDIUM-PRESSURE HBOT"
        value="2.0 ATA"
        text="Balanced therapeutic effect for a wide range of conditions."
      />
      <RailItem
        icon={Leaf}
        tone="#197337"
        label="LOW-PRESSURE HBOT"
        value="1.6 ATA"
        text="Gentler option for supportive care, recovery and prevention."
      />
    </aside>
  );
}
function RailItem({
  icon: Icon,
  tone,
  label,
  value,
  text,
}: {
  icon: typeof ShieldCheck;
  tone: string;
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="border-t border-[#a7b8e5] px-2 py-3 text-center">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: tone }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p
        className="-mt-8 pl-9 text-[11px] font-black leading-tight"
        style={{ color: tone }}
      >
        {label}
      </p>
      <p
        className="mx-auto mt-3 w-fit rounded-[4px] px-2 py-1 text-[19px] font-black leading-none text-white"
        style={{ backgroundColor: tone }}
      >
        {value}
      </p>
      <p className="mt-2 text-[9px] font-semibold leading-snug">{text}</p>
    </div>
  );
}
function ProtocolCard({
  recommendation,
}: {
  recommendation: HBOTRecommendation;
}) {
  const { protocol } = recommendation;
  const tone = toneFor(protocol.id);
  return (
    <article className="overflow-hidden  rounded-[9px] border border-[#9aace4]">
      <p
        className="py-1 text-center text-[15px] font-black leading-none text-white"
        style={{ backgroundColor: tone.dark }}
      >
        {typeName(protocol.id)}
      </p>
      <p className="mt-2 text-center text-[12px] font-semibold">
        {chamberCopy(protocol.id)}
        <br />
        Single Occupant
      </p>
      {/* <Chamber tone={tone.primary} high={protocol.id === "high-pressure"} /> */}
      <Chamber tone={tone.primary} high={protocol.id} />
      {/* <Chamber tone={tone.primary} high="high-pressure" /> */}
      <div className="mx-1 mb-1 grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#a3b6e9] text-center">
        <Metric icon={Activity} value={protocol.pressureAta} label="ATA" />
        <Metric
          icon={Wind}
          value={`${protocol.oxygenPercent}%`}
          label={protocol.oxygenPercent === 21 ? "Ambient Air" : "Oxygen"}
        />
        <Metric
          icon={Clock3}
          value={protocol.durationMinutes}
          label="min/session"
        />
      </div>
    </article>
  );
}
function Chamber({ tone, high }: { tone: string; high: string }) {
  return (
    <div className="relative  mx-auto my-2 h-[150px] w-[250px]">
      <Image
        src={
          high == "low-pressure"
            ? "/low-pressure-hyperbaric.jpg"
            : high == "medium-pressure"
              ? "/medium-pressure-hyperbaric.jpg"
              : high == "high-pressure"
                ? "/high-pressure-hyperbaric.jpg"
                : ""
        }
        width={157}
        height={10}
        alt={`${high} Hyperbaric`}
        className="ml-7 mt-[-10px]"
        loading="eager"
      />
      {/* <div
        className={`absolute bottom-5 left-4 h-[84px] w-[195px] rounded-[45px] border-[5px] border-[#9da8b2] bg-[linear-gradient(110deg,#c6d0d6,#fff_24%,#d5dce1_52%,#fff_76%,#aeb9c1)] shadow-[inset_12px_0_14px_rgba(80,95,107,.2),0_7px_8px_rgba(22,31,46,.2)] ${high ? "" : "rounded-l-[70px]"}`}
      >
        <span className="absolute left-3 top-4 h-12 w-12 rounded-full border-4 border-[#616d77] bg-[radial-gradient(circle_at_35%_30%,#fff,#9ca8b0_65%)]" />
        <span className="absolute right-6 top-5 h-9 w-9 rounded-full border-4 border-[#616d77] bg-[#263544]" />
        <span className="absolute bottom-[-15px] left-4 h-4 w-10 rounded bg-[#7c8b96]" />
        <span className="absolute bottom-[-15px] right-4 h-4 w-10 rounded bg-[#7c8b96]" />
      </div>
      <div className="absolute bottom-1 right-2 h-16 w-16 rounded-t-[13px] border-2 border-[#8a98a4] bg-[linear-gradient(120deg,#eef3f5,#aebbc4)] shadow-md">
        <span className="absolute left-3 top-3 h-5 w-10 rounded bg-[#172836]" />
        <span
          className="absolute bottom-2 left-5 h-2 w-7 rounded"
          style={{ backgroundColor: tone }}
        />
      </div> */}
      <div className="absolute bottom-1 left-11 h-3 w-[175px] rounded-[50%] bg-[#263746]/20 blur-sm" />
    </div>
  );
}
function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Activity;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1 border-r border-[#b6c4e7] px-1 py-2 last:border-r-0">
      <Icon className="h-5 w-5 text-[#09277b]" />
      <div>
        <p className="text-[16px] font-black leading-none">{value}</p>
        <p className="mt-1 text-[9px] font-semibold leading-none">{label}</p>
      </div>
    </div>
  );
}
function ProtocolTable({
  recommendations,
}: {
  recommendations: HBOTRecommendation[];
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-[9px] border border-[#4965c7]">
      <p className="bg-[#081f77] py-2 text-center text-[14px] font-black text-white">
        HBOT PROTOCOL RECOMMENDATION BY PRESSURE, DURATION, AND OXYGEN
        CONCENTRATION
      </p>
      <table className="w-full table-fixed border-collapse text-center">
        <thead className="bg-[#102b7a] text-[10px] font-black text-white">
          <tr>
            <th>HBOT TYPE</th>
            <th>
              PRESSURE
              <br />
              (ATA)
            </th>
            <th>
              OXYGEN
              <br />
              CONCENTRATION
            </th>
            <th>
              SESSION DURATION
              <br />
              (min)
            </th>
            <th className="w-[32%]">FORMULA (SESSIONS)</th>
            <th>
              ESTIMATED
              <br />
              SESSIONS*
            </th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map(({ protocol, calculatedSessions }) => (
            <tr
              key={protocol.id}
              className="border-t border-[#b3c3eb] text-[11px] font-semibold"
            >
              <td
                className="py-1.5 font-black"
                style={{ color: toneFor(protocol.id).dark }}
              >
                {typeName(protocol.id)}
              </td>
              <td>{protocol.pressureAta} ATA</td>
              <td>
                {protocol.oxygenPercent}%{" "}
                {protocol.oxygenPercent === 21 ? "(Ambient Air)" : "Oxygen"}
              </td>
              <td>{protocol.durationMinutes}</td>
              <td className="px-2 text-[10px]">
                IFI × N = |IFI| / BMI × 20 × factors
                <br />
                <strong>
                  Simplified: IFI × N = |IFI| × {factor(protocol.id)}
                </strong>
              </td>
              <td
                className="text-[16px] font-black"
                style={{ color: toneFor(protocol.id).dark }}
              >
                {formatSessions(calculatedSessions)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="py-1 text-center text-[9px] font-semibold">
        * Full-precision calculated sessions; clinical scheduling must be
        determined by a qualified clinician.
      </p>
    </div>
  );
}
function ClinicalRange() {
  const rows = [
    ["> +1.20", "Optimal / Athletic Performance", "#e9f6e9"],
    ["+0.61 to +1.20", "Good Functional Reserve", "#f4f7e9"],
    ["0.00 to +0.60", "Normal Functional Balance", "#f5faef"],
    ["0.00", "Functional Equilibrium (Target)", "#e3f2df"],
    [
      "-0.01 to -2.45",
      "Sub-normal: Endocrine–Metabolic Predisposition",
      "#fff6d5",
    ],
    ["-2.46 to -3.77", "Sub-normal: Tumoral Predisposition", "#ffefd0"],
    ["-3.78 to -5.65", "Sub-normal: Neurological Predisposition", "#ffdcca"],
    ["< -5.65", "Sub-normal: Cardiovascular Predisposition", "#f7b9b9"],
  ];
  return (
    <div className="overflow-hidden rounded-[9px] border border-[#7586c4]">
      <p className="bg-[#0b2475] py-1 text-center text-[13px] font-black text-white">
        IFI CLINICAL INTERPRETATION (RANGE)
      </p>
      <div className="grid grid-cols-[36%_1fr] bg-[#edf1ff] text-center text-[9px] font-black">
        <p className="py-1">IFI RANGE</p>
        <p className="border-l border-[#9daee2] py-1">
          FUNCTIONAL STATUS / CLINICAL SIGNIFICANCE
        </p>
      </div>
      {rows.map(([range, text, bg]) => (
        <div
          key={range}
          className="grid grid-cols-[36%_1fr] text-center text-[10px] font-semibold"
          style={{ backgroundColor: bg }}
        >
          <p className="border-t border-[#b3c1e8] py-1">{range}</p>
          <p className="border-l border-t border-[#b3c1e8] px-1 py-1">{text}</p>
        </div>
      ))}
    </div>
  );
}
function SessionFactors() {
  return (
    <div className="rounded-[9px] border border-[#9baae1] px-3 py-2">
      <p className="text-center text-[13px] font-black">
        SESSION FACTORS THAT MODIFY N
      </p>
      <Factor
        icon={Activity}
        title="PRESSURE (ATA)"
        text="Higher pressure → Fewer sessions needed"
      />
      <Factor
        icon={Clock3}
        title="DURATION (min)"
        text="Longer duration → Fewer sessions needed"
      />
      <Factor
        icon={Wind}
        title="OXYGEN CONCENTRATION (%)"
        text="Higher O₂ concentration → Fewer sessions needed"
      />
      <Factor
        icon={HeartPulse}
        title="IFI (Functional Integrity Index)"
        text="Greater |IFI| magnitude → More sessions needed"
      />
    </div>
  );
}
function Factor({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Activity;
  title: string;
  text: string;
}) {
  return (
    <div className="mt-2 flex gap-2">
      <Icon className="h-6 w-6 shrink-0 text-[#0b2a80]" />
      <p className="text-[9px] font-semibold leading-snug">
        <strong>{title}</strong>
        <br />
        {text}
      </p>
    </div>
  );
}
function Benefits() {
  const items = [
    [
      Wind,
      "#0b4da1",
      "TARGETED OXYGENATION",
      "Increases dissolved oxygen in plasma and tissues to support cellular metabolism, angiogenesis and tissue repair.",
    ],
    [
      ShieldCheck,
      "#173c9d",
      "ANTI-INFLAMMATORY EFFECT",
      "Reduces inflammatory cytokines and oxidative stress.",
    ],
    [
      Activity,
      "#4b1488",
      "TISSUE REPAIR & REGENERATION",
      "Supports cellular repair, collagen synthesis and functional recovery.",
    ],
    [
      HeartPulse,
      "#12625f",
      "IMMUNE MODULATION",
      "Enhances immune function and supports chronic inflammation management.",
    ],
    [
      Activity,
      "#1255a7",
      "FUNCTIONAL OPTIMIZATION",
      "Supports mitochondrial function, physical recovery and quality of life.",
    ],
  ] as const;
  return (
    <div className="my-2 grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] rounded-[9px] border border-[#a0b2e5] py-2">
      <p className="border-r border-[#a0b2e5] text-center text-[15px] font-black leading-none">
        HBOT
        <br />
        BENEFITS
      </p>
      {items.map(([Icon, color, title, text]) => (
        <div
          key={title}
          className="flex gap-2 border-r border-[#d0d8ef] px-3 last:border-r-0"
        >
          <Icon className="h-8 w-8 shrink-0" style={{ color }} />
          <p className="text-[9px] font-semibold leading-snug">
            <strong style={{ color }}>{title}</strong>
            <br />
            {text}
          </p>
        </div>
      ))}
    </div>
  );
}
function Footer() {
  return (
    <footer className="mt-2 grid grid-cols-[1fr_260px] gap-2">
      <div className="flex items-center gap-4 rounded-[9px] bg-[#071e78] px-5 py-3 text-white">
        <Info className="h-10 w-10 shrink-0" />
        <div>
          <p className="text-[15px] font-black">IMPORTANT</p>
          <p className="text-[11px] font-semibold">
            This recommendation is intended for educational and functional
            monitoring purposes only.
            <br />
            Hyperbaric oxygen therapy should be prescribed and supervised by
            qualified healthcare professionals according to individual clinical
            needs.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-[9px] border border-[#8da3e2] px-3">
        <Stethoscope className="h-9 w-9 text-[#0b2a80]" />
        <p className="text-[10px] font-semibold">
          <strong>MEDICAL SUPERVISION</strong>
          <br />
          All HBOT protocols should be prescribed and supervised by qualified
          healthcare professionals.
        </p>
      </div>
    </footer>
  );
}
