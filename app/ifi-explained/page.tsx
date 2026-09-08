"use client";

import Image from "next/image";
import { useState } from "react";

type AxisId =
  | "cardiovascular"
  | "endocrine"
  | "gut-brain"
  | "neurological"
  | "tumoral";

interface IFIAxis {
  id: AxisId;
  number: string;
  shortName: string;
  title: string;
  description: string;
  image: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentText: string;
  glow: string;
  summary: string;
}

const AXES: IFIAxis[] = [
  {
    id: "cardiovascular",
    number: "01",
    shortName: "Cardiovascular",
    title: "Cardiovascular Predisposition Axis",
    description:
      "Explore how increasing IFI values may correspond with progressive cardiovascular functional imbalance and conditions involving circulation, vascular integrity, blood pressure and cardiac function.",
    image: "/cardiovascular.png",
    accent: "bg-[#172E8F]",
    accentSoft: "bg-[#EEF2FF]",
    accentBorder: "border-[#C7D2FE]",
    accentText: "text-[#172E8F]",
    glow: "shadow-[0_24px_80px_rgba(23,46,143,0.13)]",
    summary:
      "Focuses on the functional integrity of the heart, arteries, capillaries, veins and circulatory system.",
  },
  {
    id: "endocrine",
    number: "02",
    shortName: "Endocrine",
    title: "Endocrine–Metabolic Axis",
    description:
      "Understand how the IFI range may relate to functional metabolic imbalance involving glucose regulation, insulin response, thyroid function, lipid metabolism and endocrine homeostasis.",
    image: "/endocrine.png",
    accent: "bg-[#157143]",
    accentSoft: "bg-[#ECFDF3]",
    accentBorder: "border-[#BBF7D0]",
    accentText: "text-[#157143]",
    glow: "shadow-[0_24px_80px_rgba(21,113,67,0.13)]",
    summary:
      "Focuses on metabolic regulation, pancreatic function, liver function, hormones and related endocrine systems.",
  },
  {
    id: "gut-brain",
    number: "03",
    shortName: "Gut–Brain",
    title: "Gut–Brain Axis",
    description:
      "Learn about the bidirectional relationship between the gastrointestinal system, microbiota, immune signaling, neurotransmitters and the central nervous system.",
    image: "/gut-brain.png",
    accent: "bg-[#7E2B91]",
    accentSoft: "bg-[#FAF1FC]",
    accentBorder: "border-[#E9C9EF]",
    accentText: "text-[#7E2B91]",
    glow: "shadow-[0_24px_80px_rgba(126,43,145,0.13)]",
    summary:
      "Focuses on communication between the brain and gastrointestinal system through neural, immune, hormonal and metabolic pathways.",
  },
  {
    id: "neurological",
    number: "04",
    shortName: "Neurological",
    title: "Neurological Predisposition Axis",
    description:
      "Review how functional changes may relate to neurological regulation, neural connectivity, cognition, movement, cerebral circulation and neurodegenerative patterns.",
    image: "/neurological.png",
    accent: "bg-[#1059B4]",
    accentSoft: "bg-[#EFF6FF]",
    accentBorder: "border-[#BFDBFE]",
    accentText: "text-[#1059B4]",
    glow: "shadow-[0_24px_80px_rgba(16,89,180,0.13)]",
    summary:
      "Focuses on functional integrity across neural networks, cognition, movement, cerebral circulation and nervous-system regulation.",
  },
  {
    id: "tumoral",
    number: "05",
    shortName: "Tumoral",
    title: "Tumoral–Proliferative Axis",
    description:
      "Explore the educational classification of increasing IFI values in relation to cellular regulation, proliferation, immune surveillance and sex-specific homologous conditions.",
    image: "/tumor.png",
    accent: "bg-[#C30D66]",
    accentSoft: "bg-[#FFF1F7]",
    accentBorder: "border-[#FBCFE8]",
    accentText: "text-[#C30D66]",
    glow: "shadow-[0_24px_80px_rgba(195,13,102,0.13)]",
    summary:
      "Focuses on functional patterns associated with cellular proliferation, regulation and related monitoring considerations.",
  },
];

const IFI_GUIDE = [
  {
    range: "0",
    title: "Functional Balance",
    description:
      "A value of zero represents the reference state of functional balance within an IFI axis.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dotClassName: "bg-emerald-500",
  },
  {
    range: "1–5",
    title: "Early Functional Change",
    description:
      "Lower-range values can represent an early departure from the reference state and may be useful for monitoring trends over time.",
    className: "border-sky-200 bg-sky-50 text-sky-800",
    dotClassName: "bg-sky-500",
  },
  {
    range: "6–10",
    title: "Increasing Imbalance",
    description:
      "The functional signal is becoming more pronounced and may deserve greater attention alongside symptoms and clinical history.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    dotClassName: "bg-amber-500",
  },
  {
    range: "11–18",
    title: "Elevated Monitoring Priority",
    description:
      "Higher values indicate a stronger functional deviation within the axis and can support a more focused conversation with a clinician.",
    className: "border-orange-200 bg-orange-50 text-orange-900",
    dotClassName: "bg-orange-500",
  },
  {
    range: "19–25",
    title: "Highest Monitoring Priority",
    description:
      "Values toward the upper end represent the strongest functional signal in the model and should be interpreted with appropriate clinical context.",
    className: "border-rose-200 bg-rose-50 text-rose-900",
    dotClassName: "bg-rose-500",
  },
];

export default function IFIExplainedPage() {
  const [selectedAxisId, setSelectedAxisId] =
    useState<AxisId>("cardiovascular");

  const [isImageOpen, setIsImageOpen] = useState(false);

  const selectedAxis =
    AXES.find((axis) => axis.id === selectedAxisId) ?? AXES[0];

  return (
    <main className="min-h-screen bg-[#F7F8FC] text-[#111936]">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
        <div className="pointer-events-none absolute left-[-180px] top-[-180px] h-[500px] w-[500px] rounded-full bg-[#E7E8FF] blur-[100px]" />
        <div className="pointer-events-none absolute right-[-140px] top-[60px] h-[420px] w-[420px] rounded-full bg-[#E9F9F1] blur-[100px]" />

        <div className="relative mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-[980px] text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D9DCF7] bg-[#F5F5FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#363A85]">
              <span className="h-2 w-2 rounded-full bg-[#5B5BD6]" />
              IFI Patient Education Center
            </div>

            <h1 className="text-balance text-4xl font-black tracking-[-0.045em] text-[#111936] sm:text-5xl lg:text-[68px] lg:leading-[1.02]">
              Understand what your
              <span className="block bg-gradient-to-r from-[#202F8E] via-[#5946A8] to-[#136B50] bg-clip-text text-transparent">
                IFI range means
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-[800px] text-base leading-8 text-slate-600 sm:text-lg">
              The Integral Functional Index, or IFI, organizes functional
              monitoring into five major biological axes. Each axis uses a range
              from <strong className="text-[#111936]">0 to 25</strong> to help
              visualize the degree of functional imbalance detected by the
              monitoring model.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {AXES.map((axis) => (
                <button
                  key={axis.id}
                  type="button"
                  onClick={() => {
                    setSelectedAxisId(axis.id);

                    document.getElementById("axis-explorer")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  {axis.shortName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY / EXPLANATION */}
      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid overflow-hidden rounded-[28px] border border-[#DDE2EB] bg-white shadow-[0_20px_70px_rgba(15,23,42,0.06)] lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-7 sm:p-9 lg:p-11">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#243B8B]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v18M3 12h18"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>

            <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-[#4755A4]">
              What the IFI is designed to show
            </p>

            <h2 className="max-w-[800px] text-2xl font-black tracking-[-0.025em] text-[#111936] sm:text-3xl">
              A monitoring signal — not a standalone medical diagnosis
            </h2>

            <p className="mt-5 max-w-[850px] text-[15px] leading-7 text-slate-600">
              The IFI is intended to help organize and communicate patterns in
              functional monitoring. A higher value can indicate that a
              particular functional axis deserves closer attention, but it
              cannot by itself confirm that a patient has any disease shown in
              the educational diagrams.
            </p>
          </div>

          <div className="border-t border-[#E7EAF0] bg-[#FAFBFC] p-7 sm:p-9 lg:border-l lg:border-t-0 lg:p-11">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-700">
              Best next step
            </p>

            <p className="mt-3 text-xl font-bold leading-8 text-[#111936]">
              Use the result to start a better conversation with your healthcare
              professional.
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Your clinician can interpret IFI trends alongside symptoms,
              medical history, physical examination and appropriate diagnostic
              testing.
            </p>
          </div>
        </div>
      </section>

      {/* HOW TO READ IFI */}
      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mb-8 max-w-[760px]">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#4755A4]">
            Reading the scale
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#111936] sm:text-4xl">
            From functional balance to increased monitoring priority
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Think of IFI as a continuum. The number is most useful when viewed
            together with the affected biological axis and changes observed
            across repeated assessments.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {IFI_GUIDE.map((item) => (
            <article
              key={item.range}
              className={`rounded-[24px] border p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg ${item.className}`}
            >
              <div className="mb-7 flex items-center justify-between">
                <div className={`h-3 w-3 rounded-full ${item.dotClassName}`} />

                <span className="text-xs font-bold uppercase tracking-[0.08em] opacity-70">
                  IFI
                </span>
              </div>

              <p className="text-[30px] font-black tracking-[-0.04em]">
                {item.range}
              </p>

              <h3 className="mt-2 text-base font-extrabold">{item.title}</h3>

              <p className="mt-3 text-sm leading-6 opacity-80">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-600 p-[3px]">
          <div className="flex h-12 items-center justify-between rounded-full bg-white px-6 text-xs font-bold text-slate-600 sm:text-sm">
            <span>0 · Reference</span>
            <span>Increasing functional deviation</span>
            <span>25 · Highest signal</span>
          </div>
        </div>
      </section>

      {/* FIVE AXES OVERVIEW */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto mb-12 max-w-[760px] text-center">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#4755A4]">
              Five Functional Axes
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#111936] sm:text-4xl">
              One IFI framework, five areas of functional monitoring
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Select an axis to explore its educational map and the 25
              conditions used to explain increasing functional predisposition.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {AXES.map((axis) => {
              const isSelected = selectedAxis.id === axis.id;

              return (
                <button
                  key={axis.id}
                  type="button"
                  onClick={() => {
                    setSelectedAxisId(axis.id);

                    setTimeout(() => {
                      document.getElementById("axis-explorer")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 50);
                  }}
                  className={`group cursor-pointer rounded-[24px] border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isSelected
                      ? `${axis.accentBorder} ${axis.accentSoft} ${axis.glow}`
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white ${axis.accent}`}
                    >
                      {axis.number}
                    </span>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 ${
                        isSelected ? axis.accentText : "text-slate-400"
                      }`}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m9 18 6-6-6-6"
                      />
                    </svg>
                  </div>

                  <h3 className="mt-6 text-lg font-extrabold text-[#111936]">
                    {axis.shortName}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {axis.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SELECTED AXIS */}
      <section
        id="axis-explorer"
        className="scroll-mt-8 mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20"
      >
        <div className="grid items-start gap-8 xl:grid-cols-[350px_minmax(0,1fr)]">
          {/* SIDE NAV */}
          <aside className="xl:sticky xl:top-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
              <div className="px-4 pb-3 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Explore the axes
                </p>
              </div>

              <div className="space-y-2">
                {AXES.map((axis) => {
                  const active = selectedAxis.id === axis.id;

                  return (
                    <button
                      key={axis.id}
                      type="button"
                      onClick={() => setSelectedAxisId(axis.id)}
                      className={`flex w-full cursor-pointer items-center gap-4 rounded-[18px] p-3 text-left transition ${
                        active
                          ? `${axis.accentSoft} ${axis.accentText}`
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                          active
                            ? `${axis.accent} text-white`
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {axis.number}
                      </span>

                      <div>
                        <p className="text-sm font-extrabold">
                          {axis.shortName}
                        </p>

                        <p className="mt-0.5 text-[11px] font-medium opacity-65">
                          IFI Axis
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <article
            className={`overflow-hidden rounded-[32px] border bg-white ${selectedAxis.accentBorder} ${selectedAxis.glow}`}
          >
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="max-w-[760px]">
                  <div
                    className={`mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-[0.1em] ${selectedAxis.accentSoft} ${selectedAxis.accentText}`}
                  >
                    Axis {selectedAxis.number}
                  </div>

                  <h2 className="text-3xl font-black tracking-[-0.035em] text-[#111936] sm:text-4xl">
                    {selectedAxis.title}
                  </h2>

                  <p className="mt-4 max-w-[790px] text-[15px] leading-7 text-slate-600">
                    {selectedAxis.description}
                  </p>
                </div>

                <div
                  className={`shrink-0 rounded-2xl px-5 py-4 ${selectedAxis.accentSoft}`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${selectedAxis.accentText}`}
                  >
                    Educational scale
                  </p>

                  <p className="mt-1 text-2xl font-black text-[#111936]">
                    IFI 0–25
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  0 · Reference
                </span>

                <span className="rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">
                  1–5 · Early change
                </span>

                <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                  6–10 · Increasing
                </span>

                <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700">
                  11–18 · Elevated
                </span>

                <span className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  19–25 · Highest
                </span>
              </div>
            </div>

            {/* IMAGE */}
            <div className="border-t border-slate-100 bg-[#F8F9FC] p-3 sm:p-5 lg:p-7">
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm"
              >
                <Image
                  src={selectedAxis.image}
                  alt={`${selectedAxis.title} educational IFI classification chart`}
                  width={1568}
                  height={992}
                  priority
                  className="h-auto w-full transition duration-500 group-hover:scale-[1.008]"
                />

                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-xs font-bold text-[#111936] shadow-lg backdrop-blur-md">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4M11 8v6M8 11h6" />
                  </svg>
                  Enlarge diagram
                </div>
              </button>
            </div>

            {/* HOW TO USE */}
            <div className="grid border-t border-slate-200 md:grid-cols-3">
              <div className="p-6 lg:p-8">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Step 01
                </span>

                <h3 className="mt-3 font-extrabold text-[#111936]">
                  Find your IFI
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Start with the IFI value calculated from your monitoring
                  assessment.
                </p>
              </div>

              <div className="border-t border-slate-200 p-6 md:border-l md:border-t-0 lg:p-8">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Step 02
                </span>

                <h3 className="mt-3 font-extrabold text-[#111936]">
                  Review the matching level
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The diagram provides an educational progression of conditions
                  associated with the functional axis.
                </p>
              </div>

              <div className="border-t border-slate-200 p-6 md:border-l md:border-t-0 lg:p-8">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Step 03
                </span>

                <h3 className="mt-3 font-extrabold text-[#111936]">
                  Discuss the result
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bring meaningful or persistent changes to your healthcare
                  professional for appropriate evaluation.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* TREND EDUCATION */}
      <section className="bg-[#111936] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#AEB8FF]">
              More than one number
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              Trends can be more informative than a single measurement.
            </h2>

            <p className="mt-5 max-w-[560px] text-base leading-7 text-slate-300">
              Repeated monitoring can help show whether functional indicators
              remain stable, improve or move further away from the reference
              state.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
              <div className="mb-8 text-3xl font-black text-[#8FE0B8]">↓</div>

              <h3 className="font-extrabold">Decreasing IFI</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                May represent movement toward the reference state within the
                monitored axis.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
              <div className="mb-8 text-3xl font-black text-[#F7CE6B]">→</div>

              <h3 className="font-extrabold">Stable IFI</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Can help establish whether the functional signal is remaining
                relatively consistent.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
              <div className="mb-8 text-3xl font-black text-[#FF8A8A]">↑</div>

              <h3 className="font-extrabold">Increasing IFI</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                May indicate a stronger functional deviation worth reviewing in
                clinical context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="rounded-[28px] border border-[#F0D8A9] bg-[#FFFDF7] p-7 sm:p-9 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:p-10">
          <div className="max-w-[920px]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3D5] text-[#8D6010]">
                <span className="font-black">!</span>
              </div>

              <h2 className="text-lg font-black text-[#111936]">
                Important medical information
              </h2>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              This educational page and the IFI classifications shown here are
              intended to support health monitoring and patient education. They
              are not intended to diagnose, treat, cure or prevent disease. A
              condition appearing at or near an IFI value does not mean that the
              patient has that condition. Medical diagnoses require assessment
              by an appropriately qualified healthcare professional.
            </p>
          </div>

          <div className="mt-7 shrink-0 lg:mt-0">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">
                Recommended action
              </p>

              <p className="mt-1 max-w-[280px] font-extrabold leading-6 text-emerald-950">
                Discuss concerning results, trends or symptoms with your
                healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IMAGE LIGHTBOX */}
      {isImageOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080C20]/95 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedAxis.title} diagram`}
          onClick={() => setIsImageOpen(false)}
        >
          <button
            type="button"
            aria-label="Close diagram"
            onClick={() => setIsImageOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 sm:right-7 sm:top-7"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          <div
            className="max-h-[94vh] max-w-[96vw] overflow-auto rounded-[20px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedAxis.image}
              alt={`${selectedAxis.title} full educational chart`}
              width={1568}
              height={992}
              className="h-auto min-w-[900px] max-w-none"
            />
          </div>
        </div>
      )}
    </main>
  );
}
