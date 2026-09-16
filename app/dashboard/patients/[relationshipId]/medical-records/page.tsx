import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  UserRound,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  getPatientMedicalRecords,
  type PatientMedicalRecord,
} from "@/services/database/medical-records/getPatientMedicalRecords";
import MedicalRecordsHistory from "@/components/medical-records/MedicalRecordsHistory";

interface DoctorPatientMedicalRecordsPageProps {
  params: Promise<{
    relationshipId: string;
  }>;

  searchParams: Promise<{
    page?: string;
  }>;
}

const PAGE_SIZE = 10;

export default async function DoctorPatientMedicalRecordsPage({
  params,
  searchParams,
}: DoctorPatientMedicalRecordsPageProps) {
  /**
   * ============================================================
   * 1. AUTHENTICATE
   * ============================================================
   */
  const profile = await requireCurrentProfile();

  if (profile.role !== "doctor") {
    redirect("/dashboard");
  }

  /**
   * ============================================================
   * 2. READ ROUTE PARAMS
   * ============================================================
   */
  const { relationshipId } = await params;

  if (!relationshipId || !relationshipId.trim()) {
    notFound();
  }

  /**
   * ============================================================
   * 3. VERIFY ACTIVE DOCTOR-PATIENT RELATIONSHIP
   * ============================================================
   */
  const supabase = createSupabaseAdminClient();

  const { data: relationship, error: relationshipError } = await supabase
    .from("doctor_patient_relationships")
    .select(
      `
        id,
        doctor_id,
        patient_id,
        status
      `,
    )
    .eq("id", relationshipId)
    .eq("doctor_id", profile.id)
    .eq("status", "active")
    .maybeSingle();

  if (relationshipError) {
    console.error(
      "[Doctor Patient Medical Records] Relationship lookup failed:",
      relationshipError,
    );

    throw new Error("Unable to verify patient relationship.");
  }

  if (!relationship) {
    notFound();
  }

  /**
   * ============================================================
   * 4. LOAD SAFE PATIENT DISPLAY INFORMATION
   * ============================================================
   *
   * The relationship references auth.users.
   * We query profiles separately for display information.
   */
  const { data: patientProfile, error: patientProfileError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name
      `,
    )
    .eq("id", relationship.patient_id)
    .maybeSingle();

  if (patientProfileError) {
    console.error(
      "[Doctor Patient Medical Records] Patient profile lookup failed:",
      patientProfileError,
    );
  }

  /**
   * ============================================================
   * 5. PAGINATION
   * ============================================================
   */
  const queryParams = await searchParams;

  const page = parsePage(queryParams.page);

  /**
   * ============================================================
   * 6. LOAD PATIENT MEDICAL RECORDS
   * ============================================================
   */
  const result = await getPatientMedicalRecords({
    patientId: relationship.patient_id,

    page,

    pageSize: PAGE_SIZE,
  });

  const { records, pagination } = result;

  const patientName =
    patientProfile?.full_name ?? records[0]?.patientName ?? "Patient";

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      {/* ======================================================
          BACK TO PATIENT WORKSPACE
      ====================================================== */}
      <div className="mb-5">
        <Link
          href={`/dashboard/patients/${encodeURIComponent(relationshipId)}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-[#2e6cf6]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Patient
        </Link>
      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
              <FileText className="h-4 w-4 text-[#2e6cf6]" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2e6cf6]">
              Patient Health Records
            </p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#12355b]">
            Medical Records
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <span>Review assessment history and medical reports for</span>

            <span className="inline-flex items-center gap-1.5 font-semibold text-[#12355b]">
              <UserRound className="h-3.5 w-3.5 text-[#2e6cf6]" />

              {patientName}
            </span>
          </div>
        </div>

        {pagination.totalRecords > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
            <FileText className="h-3.5 w-3.5 text-[#2e6cf6]" />

            <span>
              <span className="font-semibold text-[#12355b]">
                {pagination.totalRecords}
              </span>{" "}
              {pagination.totalRecords === 1 ? "record" : "records"}
            </span>
          </div>
        )}
      </div>

      <MedicalRecordsHistory
        records={records}
        pagination={pagination}
        paginationBaseHref={`/dashboard/patients/${encodeURIComponent(
          relationshipId,
        )}/medical-records`}
        getRecordHref={(record) =>
          `/dashboard/patients/${encodeURIComponent(
            relationshipId,
          )}/medical-records/${encodeURIComponent(record.id)}`
        }
        emptyDescription={`${patientName} does not currently have any completed medical records.`}
      />
    </div>
  );
}

/**
 * ============================================================
 * MEDICAL RECORD ROW
 * ============================================================
 */

function MedicalRecordRow({
  record,
  relationshipId,
}: {
  record: PatientMedicalRecord;
  relationshipId: string;
}) {
  const ifi = record.metrics.ifi?.ifi ?? record.metrics.ifi?.rawIfi ?? null;

  const ifiRange = record.metrics.ifi?.ifiRange ?? null;

  const biologicalAge =
    record.metrics.biologicalAge?.displayBiologicalAgeYears ??
    record.metrics.biologicalAge?.biologicalAgeYears ??
    null;

  return (
    <Link
      href={`/dashboard/patients/${encodeURIComponent(
        relationshipId,
      )}/medical-records/${encodeURIComponent(record.id)}`}
      className="group block w-full bg-white px-4 py-4 text-left transition hover:bg-slate-50/80 sm:px-5"
    >
      {/* ====================================================
          DESKTOP
      ==================================================== */}
      <div className="hidden grid-cols-[minmax(180px,1.4fr)_minmax(130px,0.9fr)_minmax(120px,0.8fr)_minmax(150px,1fr)_minmax(130px,0.8fr)_40px] items-center gap-4 lg:grid">
        <AssessmentCell
          evaluationDate={record.evaluationDate}
          createdAt={record.createdAt}
        />

        <MetricValue
          value={ifi === null ? "—" : formatNumber(ifi, 2)}
          label="IFI Value"
          icon={<Activity className="h-3.5 w-3.5" />}
        />

        <MetricValue
          value={ifiRange === null ? "—" : String(ifiRange)}
          label="Range"
          icon={<HeartPulse className="h-3.5 w-3.5" />}
        />

        <MetricValue
          value={
            biologicalAge === null
              ? "—"
              : `${formatNumber(biologicalAge, 1)} yrs`
          }
          label="Biological"
        />

        <PdfStatus
          status={record.pdf.status}
          isAvailable={record.pdf.isAvailable}
        />

        <div className="flex justify-end">
          <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#2e6cf6]" />
        </div>
      </div>

      {/* ====================================================
          MOBILE / TABLET
      ==================================================== */}
      <div className="lg:hidden">
        <div className="flex items-start justify-between gap-4">
          <AssessmentCell
            evaluationDate={record.evaluationDate}
            createdAt={record.createdAt}
          />

          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#2e6cf6]" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MobileMetric
            label="IFI"
            value={ifi === null ? "—" : formatNumber(ifi, 2)}
          />

          <MobileMetric
            label="IFI Range"
            value={ifiRange === null ? "—" : String(ifiRange)}
          />

          <MobileMetric
            label="Biological Age"
            value={
              biologicalAge === null
                ? "—"
                : `${formatNumber(biologicalAge, 1)} yrs`
            }
          />

          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Report
            </p>

            <PdfStatus
              status={record.pdf.status}
              isAvailable={record.pdf.isAvailable}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * ============================================================
 * ASSESSMENT CELL
 * ============================================================
 */

function AssessmentCell({
  evaluationDate,
  createdAt,
}: {
  evaluationDate: string;
  createdAt: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
          <CalendarDays className="h-4 w-4 text-[#2e6cf6]" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#12355b]">
            {formatDate(evaluationDate)}
          </p>

          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
            <Clock3 className="h-3 w-3" />

            <span>Recorded {formatTime(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * DESKTOP METRIC
 * ============================================================
 */

function MetricValue({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-[#2e6cf6]">{icon}</span>}

        <p className="truncate text-sm font-semibold tabular-nums text-[#12355b]">
          {value}
        </p>
      </div>

      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.07em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

/**
 * ============================================================
 * MOBILE METRIC
 * ============================================================
 */

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-sm font-semibold tabular-nums text-[#12355b]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

/**
 * ============================================================
 * PDF STATUS
 * ============================================================
 */

function PdfStatus({
  status,
  isAvailable,
}: {
  status: "pending" | "queued" | "generating" | "ready" | "failed";

  isAvailable: boolean;
}) {
  if (status === "ready" && isAvailable) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Available
      </span>
    );
  }

  if (status === "queued" || status === "generating") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

        {status === "queued" ? "Queued" : "Generating"}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      Pending
    </span>
  );
}

/**
 * ============================================================
 * TABLE HEADING
 * ============================================================
 */

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
      {children}
    </p>
  );
}

/**
 * ============================================================
 * EMPTY STATE
 * ============================================================
 */

function EmptyState({ patientName }: { patientName: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#2e6cf6]/10">
        <FileText className="h-5 w-5 text-[#2e6cf6]" />
      </div>

      <h2 className="mt-4 text-sm font-semibold text-[#12355b]">
        No medical records yet
      </h2>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
        {patientName} does not currently have any completed medical records.
      </p>
    </div>
  );
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function parsePage(value: string | undefined): number {
  if (!value) {
    return 1;
  }

  if (!/^\d+$/.test(value)) {
    return 1;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
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

function formatTime(date: string): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
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
