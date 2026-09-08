"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  FileText,
  HeartPulse,
  LoaderCircle,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface PatientWorkspaceApiResponse {
  success: boolean;

  code?: string;
  message?: string;
  error?: string;

  patientWorkspace?: {
    relationshipId: string;

    patient: {
      fullName: string | null;
    };

    relationship: {
      status: "active";
      createdAt: string;
      acceptedAt: string | null;
      updatedAt: string;
    };
  };
}

type PatientWorkspace = NonNullable<
  PatientWorkspaceApiResponse["patientWorkspace"]
>;

function getInitials(name: string | null): string {
  if (!name) {
    return "PT";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "PT";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function DoctorPatientWorkspacePage() {
  const params = useParams<{
    relationshipId: string;
  }>();

  const router = useRouter();

  const relationshipId = params.relationshipId;

  const [workspace, setWorkspace] = useState<PatientWorkspace | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [pageError, setPageError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    const returnPath = `/dashboard/patients/${encodeURIComponent(
      relationshipId,
    )}`;

    router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
  }, [relationshipId, router]);

  /**
   * ----------------------------------------------------------
   * LOAD PATIENT WORKSPACE
   * ----------------------------------------------------------
   */
  const loadWorkspace = useCallback(async () => {
    if (!relationshipId) {
      throw new Error("A patient relationship ID was not provided.");
    }

    const response = await fetch(
      `/api/doctor/patients/${encodeURIComponent(relationshipId)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const data = (await response.json()) as PatientWorkspaceApiResponse;

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (response.status === 403) {
      throw new Error(
        data.message ??
          "You are not authorized to access this patient workspace.",
      );
    }

    if (response.status === 404) {
      throw new Error(
        data.message ?? "This patient relationship is unavailable.",
      );
    }

    if (!response.ok || !data.success || !data.patientWorkspace) {
      throw new Error(
        data.message || data.error || "Unable to load the patient workspace.",
      );
    }

    setWorkspace(data.patientWorkspace);
  }, [redirectToLogin, relationshipId]);

  /**
   * ----------------------------------------------------------
   * INITIAL LOAD
   * ----------------------------------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setIsLoading(true);
        setPageError(null);

        await loadWorkspace();
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load the patient workspace.";

        setPageError(message);

        toast.error(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadWorkspace]);

  const patientName = useMemo(
    () => workspace?.patient.fullName?.trim() || "Patient",
    [workspace],
  );

  /**
   * ----------------------------------------------------------
   * START DOCTOR ASSESSMENT
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * We pass only relationshipId through the URL.
   *
   * We do NOT expose the patient's auth UUID.
   *
   * The doctor assessment route will later resolve:
   *
   * relationshipId
   * + current authenticated doctor
   * + status = active
   *
   * before allowing report creation.
   */
  function handleStartAssessment() {
    if (!workspace) {
      return;
    }

    router.push(
      `/dashboard/patients/${encodeURIComponent(
        workspace.relationshipId,
      )}/assessment`,
    );
  }

  function handleOpenReports() {
    if (!workspace) {
      return;
    }

    router.push(
      `/dashboard/patients/${encodeURIComponent(
        workspace.relationshipId,
      )}/reports`,
    );
  }

  function handleOpenMonitoring() {
    if (!workspace) {
      return;
    }

    router.push(
      `/dashboard/patients/${encodeURIComponent(
        workspace.relationshipId,
      )}/ifi-monitoring`,
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

          <p className="text-sm font-medium text-slate-600">
            Loading patient workspace...
          </p>
        </div>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#032b52]">
            Patient workspace unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {pageError ?? "This patient relationship could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/patients")}
            className="mt-6 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#062542]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Patients
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#f8f9fd]">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Back */}

        <button
          type="button"
          onClick={() => router.push("/dashboard/patients")}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#063467]"
        >
          <ArrowLeft className="h-4 w-4" />
          My Patients
        </button>

        {/* Patient Header */}

        <section className="mt-5 rounded-2xl border border-slate-300 bg-white px-5 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-base font-bold text-[#063467]">
                {getInitials(patientName)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[24px] font-bold tracking-[-0.025em] text-[#062d52] sm:text-[30px]">
                    {patientName}
                  </h1>

                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700">
                    Active Patient
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Connected to your clinical workspace
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-[11px] font-medium text-slate-500">
                Connected Since
              </p>

              <p className="mt-1 text-sm font-semibold text-[#092846]">
                {formatDate(workspace.relationship.acceptedAt)}
              </p>
            </div>
          </div>
        </section>

        {/* Clinical Access Notice */}

        <section className="mt-5 flex items-start gap-3 rounded-xl border border-[#d6e3f5] bg-[#f7faff] px-4 py-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#005cff]" />

          <div>
            <h2 className="text-sm font-bold text-[#092846]">
              Authorized Clinical Access
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              This patient has approved your connection. Access to their MyTime
              reports and monitoring data remains available only while this
              relationship stays active.
            </p>
          </div>
        </section>

        {/* Primary Action */}

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.035)]">
          <div className="flex flex-col gap-6 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef4ff] text-[#005cff]">
                  <Stethoscope className="h-5 w-5" />
                </span>

                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Clinical Assessment
                </p>
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-[-0.02em] text-[#062d52]">
                Start a new MyTime assessment
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Begin a new voice, oximeter, and patient-metrics assessment for{" "}
                <span className="font-semibold text-[#092846]">
                  {patientName}
                </span>
                . This patient will remain the selected assessment subject for
                the full assessment workflow.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartAssessment}
              className="inline-flex min-h-11 w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#062542]"
            >
              New Assessment
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Workspace Modules */}

        <section className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <WorkspaceCard
            icon={<UserRound className="h-5 w-5" />}
            title="Patient Overview"
            description="Review the patient's connected MyTime clinical profile and relationship information."
            actionLabel="Current Patient"
            onClick={undefined}
          />

          <WorkspaceCard
            icon={<FileText className="h-5 w-5" />}
            title="Medical Reports"
            description="Review MyTime assessments and generated medical reports for this patient."
            actionLabel="View Reports"
            onClick={handleOpenReports}
          />

          <WorkspaceCard
            icon={<HeartPulse className="h-5 w-5" />}
            title="IFI Monitoring"
            description="Track longitudinal IFI recovery and daily monitoring across the patient's monitoring period."
            actionLabel="Open Monitoring"
            onClick={handleOpenMonitoring}
          />
        </section>

        {/* Patient Summary */}

        <section className="mt-7 rounded-2xl border border-slate-300 bg-white px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Activity className="h-5 w-5 text-[#005cff]" />

            <h2 className="text-base font-bold text-[#092846]">
              Patient Workspace
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <SummaryItem label="Patient" value={patientName} />

            <SummaryItem label="Relationship" value="Active" />

            <SummaryItem
              label="Connected"
              value={formatDate(workspace.relationship.acceptedAt)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

interface WorkspaceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onClick?: () => void;
}

function WorkspaceCard({
  icon,
  title,
  description,
  actionLabel,
  onClick,
}: WorkspaceCardProps) {
  const isInteractive = Boolean(onClick);

  return (
    <article className="flex min-h-[220px] flex-col rounded-xl border border-slate-300 bg-white px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef4ff] text-[#005cff]">
        {icon}
      </span>

      <h3 className="mt-4 text-base font-bold text-[#092846]">{title}</h3>

      <p className="mt-2 flex-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

      {isInteractive ? (
        <button
          type="button"
          onClick={onClick}
          className="mt-5 inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-[#063467] transition hover:text-[#005cff]"
        >
          {actionLabel}

          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <span className="mt-5 inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {actionLabel}
        </span>
      )}
    </article>
  );
}

interface SummaryItemProps {
  label: string;
  value: string;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#092846]">{value}</p>
    </div>
  );
}
