import {
  Brain,
  HeartPulse,
  Info,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import type { IFIFunctionalProfile } from "@/types/ifi-functional-profile";

interface MedicalRecordIFIFunctionalProfileProps {
  profile: IFIFunctionalProfile;
}

interface RiskTheme {
  card: string;
  badge: string;
  value: string;
  dot: string;
}

export default function MedicalRecordIFIFunctionalProfile({
  profile,
}: MedicalRecordIFIFunctionalProfileProps) {
  const isNormal = profile.ifiRange === 0;

  const riskTheme = getRiskTheme(profile.riskLabel, profile.ifiRange);

  const axisConditions = [
    {
      key: "mental-intestinal",
      label: isNormal ? "Gut–Brain Axis" : "Mental–Intestinal",
      value: profile.mentalIntestinal,
      accent: isNormal ? "bg-[#12355b]" : "bg-[#14834a]",
    },
    {
      key: "endocrine-metabolic",
      label: "Endocrine–Metabolic",
      value: profile.endocrineMetabolic,
      accent: isNormal ? "bg-[#12355b]" : "bg-[#2e6cf6]",
    },
    {
      key: "tumoral-proliferative",
      label: "Tumoral–Proliferative",
      value: profile.tumoralProliferative,
      accent: isNormal ? "bg-[#12355b]" : "bg-[#e96a16]",
    },
    {
      key: "neurological",
      label: "Neurological",
      value: profile.neurological,
      accent: isNormal ? "bg-[#12355b]" : "bg-[#6b2caf]",
    },
    {
      key: "cardiovascular",
      label: "Cardiovascular",
      value: profile.cardiovascular,
      accent: isNormal ? "bg-[#12355b]" : "bg-[#c51f2c]",
    },
  ] as const;

  return (
    <section className="overflow-hidden mt-3 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
                <Brain className="h-4 w-4 text-[#2e6cf6]" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2e6cf6]">
                IFI Functional Profile
              </p>
            </div>

            <h2 className="text-lg font-semibold tracking-tight text-[#12355b] sm:text-xl">
              Five-Axis Functional Profile
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              {profile.subtitle}
            </p>
          </div>

          {/* Risk summary */}
          <div
            className={[
              "flex shrink-0 items-center gap-4 rounded-xl border px-4 py-3",
              riskTheme.card,
            ].join(" ")}
          >
            <div>
              <p
                className={[
                  "text-[10px] font-bold uppercase tracking-[0.1em]",
                  riskTheme.badge,
                ].join(" ")}
              >
                IFI Range
              </p>

              <p
                className={[
                  "mt-0.5 text-3xl font-bold tabular-nums leading-none",
                  riskTheme.value,
                ].join(" ")}
              >
                {profile.ifiRange}
              </p>
            </div>

            <div className="h-9 w-px bg-current opacity-10" />

            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={["h-2 w-2 rounded-full", riskTheme.dot].join(" ")}
                />

                <p
                  className={["text-xs font-semibold", riskTheme.badge].join(
                    " ",
                  )}
                >
                  {profile.riskLabel}
                </p>
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                Functional risk profile
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          INTRODUCTION
      ====================================================== */}
      <div className="px-5 pt-5 sm:px-6">
        <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2e6cf6]" />

          <p className="text-sm leading-6 text-slate-600">{profile.intro}</p>
        </div>
      </div>

      {/* ======================================================
          FIVE AXES
      ====================================================== */}
      <div className="px-5 py-5 sm:px-6">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#12355b]">
            Functional Areas
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            Five functional systems associated with this IFI range.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {axisConditions.map((condition) => (
            <div
              key={condition.key}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div
                className={[
                  "absolute inset-x-0 top-0 h-1",
                  condition.accent,
                ].join(" ")}
              />

              <div className="p-4 pt-5">
                <p className="min-h-[34px] text-[11px] font-bold uppercase leading-4 tracking-[0.06em] text-[#12355b]">
                  {condition.label}
                </p>

                <div className="mt-3 border-t   border-slate-100 pt-3">
                  <p
                    className={[
                      "text-sm font-semibold leading-5",
                      isNormal ? "text-emerald-700" : "text-slate-700",
                    ].join(" ")}
                  >
                    {condition.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================
          INTERPRETATION + SPECIALIST
      ====================================================== */}
      <div className="grid grid-cols-1 gap-4 border-t border-slate-200 bg-slate-50/40 px-5 py-5 sm:px-6 lg:grid-cols-2">
        {/* Interpretation */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
              <ShieldCheck className="h-4 w-4 text-[#2e6cf6]" />
            </div>

            <h3 className="text-sm font-semibold text-[#12355b]">
              {profile.interpretationTitle}
            </h3>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            {profile.interpretation}
          </p>
        </div>

        {/* Specialist */}
        <div
          className={[
            "rounded-lg border p-5",
            isNormal
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-red-200 bg-red-50/40",
          ].join(" ")}
        >
          <div className="mb-3 flex items-center gap-2">
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-lg",
                isNormal ? "bg-emerald-100" : "bg-red-100",
              ].join(" ")}
            >
              <Stethoscope
                className={[
                  "h-4 w-4",
                  isNormal ? "text-emerald-700" : "text-red-600",
                ].join(" ")}
              />
            </div>

            <h3 className="text-sm font-semibold text-[#12355b]">
              {profile.specialistTitle}
            </h3>
          </div>

          <p
            className={[
              "text-base font-semibold",
              isNormal ? "text-emerald-700" : "text-red-700",
            ].join(" ")}
          >
            {profile.specialist}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {profile.specialistDescription}
          </p>
        </div>
      </div>

      {/* ======================================================
          DISCLAIMER
      ====================================================== */}
      <div className="border-t border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
          <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

          <p className="text-xs leading-5 text-slate-600">
            {profile.disclaimer}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * ============================================================
 * RISK THEME
 * ============================================================
 */

function getRiskTheme(riskLabel: string, ifiRange: number): RiskTheme {
  const normalized = riskLabel.toUpperCase();

  if (ifiRange === 0 || normalized === "NORMAL") {
    return {
      card: "border-emerald-200 bg-emerald-50/60",

      badge: "text-emerald-700",

      value: "text-emerald-700",

      dot: "bg-emerald-500",
    };
  }

  if (normalized.includes("LOW RISK")) {
    return {
      card: "border-emerald-200 bg-emerald-50/60",

      badge: "text-emerald-700",

      value: "text-emerald-700",

      dot: "bg-emerald-500",
    };
  }

  if (normalized.includes("MODERATE RISK")) {
    return {
      card: "border-amber-200 bg-amber-50/60",

      badge: "text-amber-700",

      value: "text-amber-700",

      dot: "bg-amber-500",
    };
  }

  if (normalized.includes("VERY HIGH RISK")) {
    return {
      card: "border-red-200 bg-red-50/60",

      badge: "text-red-700",

      value: "text-red-700",

      dot: "bg-red-500",
    };
  }

  if (normalized.includes("HIGH RISK")) {
    return {
      card: "border-orange-200 bg-orange-50/60",

      badge: "text-orange-700",

      value: "text-orange-700",

      dot: "bg-orange-500",
    };
  }

  return {
    card: "border-slate-200 bg-slate-50",

    badge: "text-slate-700",

    value: "text-[#12355b]",

    dot: "bg-slate-400",
  };
}
