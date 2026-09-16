import Link from "next/link";
import MedicalRecordIFIFunctionalProfile from "@/components/medical-records/MedicalRecordIFIFunctionalProfile";

import type { IFIFunctionalProfile } from "@/types/ifi-functional-profile";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Droplets,
  FileText,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";

import type {
  PatientMedicalRecord,
  MedicalRecordPeptideRecommendation,
  MedicalRecordHBOTRecommendation,
} from "@/services/database/medical-records/getPatientMedicalRecords";

// interface MedicalRecordDetailsProps {
//   record: PatientMedicalRecord;

//   /**
//    * Different depending on where this component is used.
//    *
//    * Patient:
//    * /dashboard/medical-records
//    *
//    * Doctor:
//    * /dashboard/patients/[relationshipId]/medical-records
//    */
//   backHref: string;

//   backLabel?: string;

//   /**
//    * Allows us to slightly change the context label without
//    * duplicating the entire UI.
//    */
//   contextLabel?: string;
// }

interface MedicalRecordDetailsProps {
  record: PatientMedicalRecord;

  ifiFunctionalProfile?: IFIFunctionalProfile | null;

  backHref: string;

  backLabel?: string;

  contextLabel?: string;
}

export default function MedicalRecordDetails({
  record,
  ifiFunctionalProfile = null,
  backHref,
  backLabel = "Back to Medical Records",
  contextLabel = "Medical Record",
}: MedicalRecordDetailsProps) {
  const ifi = record.metrics.ifi;

  const biologicalAge = record.metrics.biologicalAge;

  const peptideDose = record.metrics.peptideDose;

  const hbot = record.metrics.hbotSessions;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      {/* ====================================================
          BACK
      ==================================================== */}
      <div className="mb-5">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-[#2e6cf6]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />

          {backLabel}
        </Link>
      </div>

      {/* ====================================================
          HEADER
      ==================================================== */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
                  <FileText className="h-4 w-4 text-[#2e6cf6]" />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#2e6cf6]">
                  {contextLabel}
                </p>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-[#12355b]">
                Assessment Details
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Clinical assessment recorded on{" "}
                {formatDate(record.evaluationDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PdfStatusBadge
                status={record.pdf.status}
                isAvailable={record.pdf.isAvailable}
              />

              <Link
                href={`/dashboard/reports/${encodeURIComponent(record.id)}`}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#2e6cf6] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#245bd4]"
              >
                <Download className="h-3.5 w-3.5" />
                Open PDF Report
              </Link>
            </div>
          </div>
        </div>

        {/* ==================================================
            PATIENT INFORMATION
        ================================================== */}
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <PatientInformationItem
            icon={<UserRound className="h-4 w-4" />}
            label="Patient"
            value={record.patientName}
          />

          <PatientInformationItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date of Birth"
            value={formatDate(record.dateOfBirth)}
          />

          <PatientInformationItem
            icon={<Stethoscope className="h-4 w-4" />}
            label="Gender"
            value={capitalize(record.gender)}
          />

          <PatientInformationItem
            icon={<Clock3 className="h-4 w-4" />}
            label="Evaluation Date"
            value={formatDate(record.evaluationDate)}
          />
        </div>
      </div>

      {/* ====================================================
          PRIMARY METRICS
      ==================================================== */}
      <section className="mt-6">
        <SectionHeading
          title="Assessment Metrics"
          description="Clinical measurements calculated from this assessment."
        />

        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="IFI Value"
            value={
              ifi?.ifi !== null && ifi?.ifi !== undefined
                ? formatNumber(ifi.ifi, 2)
                : "—"
            }
            icon={<Activity className="h-4 w-4" />}
          />

          <MetricCard
            label="IFI Range"
            value={
              ifi?.ifiRange !== null && ifi?.ifiRange !== undefined
                ? String(ifi.ifiRange)
                : "—"
            }
            icon={<HeartPulse className="h-4 w-4" />}
          />

          <MetricCard
            label="Biological Age"
            value={getBiologicalAge(record)}
            icon={<UserRound className="h-4 w-4" />}
          />

          <MetricCard
            label="Inflammation"
            value={
              ifi?.inflammationCoefficientPercent !== null &&
              ifi?.inflammationCoefficientPercent !== undefined
                ? `${formatNumber(ifi.inflammationCoefficientPercent, 1)}%`
                : "—"
            }
            icon={<Droplets className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* ====================================================
          IFI + BIOLOGICAL AGE
      ==================================================== */}
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {/* IFI */}
        <MetricSectionCard
          title="IFI Analysis"
          description="Inflammation Functional Index assessment."
          icon={<Activity className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <DetailValue
              label="IFI Value"
              value={
                ifi?.ifi !== null && ifi?.ifi !== undefined
                  ? formatNumber(ifi.ifi, 4)
                  : "—"
              }
            />

            <DetailValue
              label="IFI Range"
              value={
                ifi?.ifiRange !== null && ifi?.ifiRange !== undefined
                  ? String(ifi.ifiRange)
                  : "—"
              }
            />

            <DetailValue
              label="Inflammation Coefficient"
              value={
                ifi?.inflammationCoefficient !== null &&
                ifi?.inflammationCoefficient !== undefined
                  ? formatNumber(ifi.inflammationCoefficient, 4)
                  : "—"
              }
            />

            <DetailValue
              label="Inflammation %"
              value={
                ifi?.inflammationCoefficientPercent !== null &&
                ifi?.inflammationCoefficientPercent !== undefined
                  ? `${formatNumber(ifi.inflammationCoefficientPercent, 2)}%`
                  : "—"
              }
            />
          </div>
        </MetricSectionCard>

        {/* Biological age */}
        <MetricSectionCard
          title="Biological Age"
          description="Comparison between chronological and calculated biological age."
          icon={<UserRound className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <DetailValue
              label="Chronological Age"
              value={
                biologicalAge?.chronologicalAgeYears !== null &&
                biologicalAge?.chronologicalAgeYears !== undefined
                  ? `${formatNumber(
                      biologicalAge.chronologicalAgeYears,
                      1,
                    )} yrs`
                  : "—"
              }
            />

            <DetailValue
              label="Biological Age"
              value={
                biologicalAge?.displayBiologicalAgeYears !== null &&
                biologicalAge?.displayBiologicalAgeYears !== undefined
                  ? `${formatNumber(
                      biologicalAge.displayBiologicalAgeYears,
                      1,
                    )} yrs`
                  : biologicalAge?.biologicalAgeYears !== null &&
                      biologicalAge?.biologicalAgeYears !== undefined
                    ? `${formatNumber(biologicalAge.biologicalAgeYears, 1)} yrs`
                    : "—"
              }
            />

            <DetailValue
              label="Aging Coefficient"
              value={
                biologicalAge?.agingCoefficient !== null &&
                biologicalAge?.agingCoefficient !== undefined
                  ? formatNumber(biologicalAge.agingCoefficient, 4)
                  : "—"
              }
            />

            <DetailValue
              label="Aging Coefficient %"
              value={
                biologicalAge?.agingCoefficientPercent !== null &&
                biologicalAge?.agingCoefficientPercent !== undefined
                  ? `${formatNumber(biologicalAge.agingCoefficientPercent, 2)}%`
                  : "—"
              }
            />
          </div>
        </MetricSectionCard>
      </div>

      {ifiFunctionalProfile && (
        <MedicalRecordIFIFunctionalProfile profile={ifiFunctionalProfile} />
      )}

      {/* ====================================================
          PEPTIDE RECOMMENDATIONS
      ==================================================== */}
      {peptideDose && (
        <section className="mt-6">
          <SectionHeading
            title="Peptide Recommendations"
            description="Recommendations calculated for this assessment."
          />

          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#2e6cf6]" />

                <p className="text-xs font-semibold text-[#12355b]">
                  Recommended Therapies
                </p>
              </div>

              {peptideDose.ifiRange !== null && (
                <span className="rounded-md bg-[#2e6cf6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#2e6cf6]">
                  IFI Range {peptideDose.ifiRange}
                </span>
              )}
            </div>

            {peptideDose.recommendations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {peptideDose.recommendations.map((recommendation, index) => (
                  <PeptideRecommendationRow
                    key={
                      recommendation.treatmentId ??
                      `${recommendation.treatmentName}-${index}`
                    }
                    recommendation={recommendation}
                  />
                ))}
              </div>
            ) : (
              <EmptySubsection text="No peptide recommendations were stored for this assessment." />
            )}
          </div>

          {peptideDose.neuronOliveMoringa && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
                  <Droplets className="h-4 w-4 text-[#2e6cf6]" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#12355b]">
                    {peptideDose.neuronOliveMoringa.productName ??
                      "Nutritional Recommendation"}
                  </p>

                  {peptideDose.neuronOliveMoringa.activeIngredients && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {peptideDose.neuronOliveMoringa.activeIngredients}
                    </p>
                  )}

                  <p className="mt-3 text-sm font-semibold text-[#12355b]">
                    {peptideDose.neuronOliveMoringa.recommendedDrops !== null
                      ? formatNumber(
                          peptideDose.neuronOliveMoringa.recommendedDrops,
                          0,
                        )
                      : "—"}{" "}
                    {peptideDose.neuronOliveMoringa.unit ?? ""}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Recommended Dose
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ====================================================
          HBOT
      ==================================================== */}
      {hbot && (
        <section className="mt-6">
          <SectionHeading
            title="HBOT Recommendations"
            description="Hyperbaric oxygen therapy recommendations stored with this assessment."
          />

          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {hbot.recommendations.length > 0 ? (
              hbot.recommendations.map((recommendation, index) => (
                <HBOTRecommendationCard
                  key={
                    recommendation.protocolId ??
                    `${recommendation.protocolName}-${index}`
                  }
                  recommendation={recommendation}
                />
              ))
            ) : (
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <EmptySubsection text="No HBOT recommendations were stored for this assessment." />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ====================================================
          REPORT INFORMATION
      ==================================================== */}
      <section className="mt-6">
        <SectionHeading
          title="Report Information"
          description="Generation status and record information."
        />

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailValue
              label="Report Status"
              value={formatStatus(record.pdf.status)}
            />

            <DetailValue
              label="Assessment Created"
              value={formatDateTime(record.createdAt)}
            />

            <DetailValue
              label="PDF Generated"
              value={
                record.pdf.generatedAt
                  ? formatDateTime(record.pdf.generatedAt)
                  : "—"
              }
            />

            <DetailValue label="Report ID" value={shortReportId(record.id)} />
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * ============================================================
 * PATIENT INFORMATION ITEM
 * ============================================================
 */

function PatientInformationItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#2e6cf6]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-[#12355b]">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * TOP METRIC CARD
 * ============================================================
 */

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-xl font-semibold tabular-nums text-[#12355b]">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10 text-[#2e6cf6]">
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * SECTION CARD
 * ============================================================
 */

function MetricSectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10 text-[#2e6cf6]">
            {icon}
          </div>

          <div>
            <p className="text-sm font-semibold text-[#12355b]">{title}</p>

            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

/**
 * ============================================================
 * DETAIL VALUE
 * ============================================================
 */

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold tabular-nums text-[#12355b]">
        {value}
      </p>
    </div>
  );
}

/**
 * ============================================================
 * SECTION HEADING
 * ============================================================
 */

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-[#12355b]">{title}</h2>

      <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

/**
 * ============================================================
 * PEPTIDE ROW
 * ============================================================
 */

function PeptideRecommendationRow({
  recommendation,
}: {
  recommendation: MedicalRecordPeptideRecommendation;
}) {
  return (
    <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(180px,1.2fr)_minmax(180px,1fr)_minmax(120px,0.7fr)] md:items-center">
      <div>
        <p className="text-sm font-semibold text-[#12355b]">
          {recommendation.treatmentName ?? "Therapy"}
        </p>

        {recommendation.treatmentGroup && (
          <p className="mt-0.5 text-xs text-slate-500">
            {recommendation.treatmentGroup}
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Indication
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {recommendation.indication ?? "—"}
        </p>
      </div>

      <div className="md:text-right">
        <p className="text-sm font-semibold tabular-nums text-[#12355b]">
          {recommendation.recommendedDose !== null
            ? formatNumber(recommendation.recommendedDose, 2)
            : "—"}{" "}
          {recommendation.unit ?? ""}
        </p>

        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Recommended Dose
        </p>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * HBOT CARD
 * ============================================================
 */

function HBOTRecommendationCard({
  recommendation,
}: {
  recommendation: MedicalRecordHBOTRecommendation;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
          <ShieldCheck className="h-4 w-4 text-[#2e6cf6]" />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#12355b]">
            {recommendation.protocolName ?? "HBOT Protocol"}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Hyperbaric oxygen therapy
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailValue
          label="Pressure"
          value={
            recommendation.pressureAta !== null
              ? `${formatNumber(recommendation.pressureAta, 1)} ATA`
              : "—"
          }
        />

        <DetailValue
          label="Duration"
          value={
            recommendation.durationMinutes !== null
              ? `${formatNumber(recommendation.durationMinutes, 0)} min`
              : "—"
          }
        />

        <DetailValue
          label="Oxygen"
          value={
            recommendation.oxygenPercent !== null
              ? `${formatNumber(recommendation.oxygenPercent, 0)}%`
              : "—"
          }
        />

        <DetailValue
          label="Sessions"
          value={
            recommendation.calculatedSessions !== null
              ? formatNumber(recommendation.calculatedSessions, 1)
              : "—"
          }
        />
      </div>
    </div>
  );
}

/**
 * ============================================================
 * PDF STATUS
 * ============================================================
 */

function PdfStatusBadge({
  status,
  isAvailable,
}: {
  status: "pending" | "queued" | "generating" | "ready" | "failed";

  isAvailable: boolean;
}) {
  if (status === "ready" && isAvailable) {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Report Ready
      </span>
    );
  }

  if (status === "queued" || status === "generating") {
    return (
      <span className="inline-flex h-9 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700">
        {status === "queued" ? "Report Queued" : "Generating Report"}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600">
        Generation Failed
      </span>
    );
  }

  return (
    <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">
      Report Pending
    </span>
  );
}

/**
 * ============================================================
 * EMPTY SUBSECTION
 * ============================================================
 */

function EmptySubsection({ text }: { text: string }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-xs text-slate-500">{text}</p>
    </div>
  );
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getBiologicalAge(record: PatientMedicalRecord): string {
  const biologicalAge = record.metrics.biologicalAge;

  const value =
    biologicalAge?.displayBiologicalAgeYears ??
    biologicalAge?.biologicalAgeYears ??
    null;

  if (value === null) {
    return "—";
  }

  return `${formatNumber(value, 1)} yrs`;
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(date: string): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,

    maximumFractionDigits: decimals,
  }).format(value);
}

function capitalize(value: string): string {
  if (!value) {
    return "—";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatStatus(status: string): string {
  switch (status) {
    case "ready":
      return "Ready";

    case "generating":
      return "Generating";

    case "queued":
      return "Queued";

    case "failed":
      return "Failed";

    default:
      return "Pending";
  }
}

function shortReportId(id: string): string {
  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 8)}…`;
}
