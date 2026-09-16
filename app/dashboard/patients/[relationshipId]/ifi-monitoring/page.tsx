"use client";

import { AlertCircle, ArrowLeft, LoaderCircle, RefreshCw } from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import { useCallback, useEffect, useState } from "react";

import IFIMonitoringDashboard from "@/components/ifi-monitoring/IFIMonitoringDashboard";

/**
 * ============================================================
 * API RESPONSE
 * ============================================================
 *
 * We intentionally use the same patient-workspace endpoint
 * already used by:
 *
 * /dashboard/patients/[relationshipId]
 *
 * That endpoint verifies the doctor/patient relationship and
 * returns the patient's display information.
 */

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

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function DoctorPatientIFIMonitoringPage() {
  const params = useParams<{
    relationshipId: string;
  }>();

  const router = useRouter();

  const relationshipId = params.relationshipId;

  const [workspace, setWorkspace] = useState<PatientWorkspace | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [pageError, setPageError] = useState<string | null>(null);

  /**
   * ----------------------------------------------------------
   * LOGIN REDIRECT
   * ----------------------------------------------------------
   */

  const redirectToLogin = useCallback(() => {
    const returnPath = `/dashboard/patients/${encodeURIComponent(
      relationshipId,
    )}/ifi-monitoring`;

    router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
  }, [relationshipId, router]);

  /**
   * ----------------------------------------------------------
   * LOAD PATIENT WORKSPACE
   * ----------------------------------------------------------
   *
   * This resolves the patient from the authenticated doctor's
   * active relationship.
   *
   * We do NOT accept or construct a patient UUID in this page.
   */

  useEffect(() => {
    const controller = new AbortController();

    async function loadWorkspace() {
      try {
        if (!relationshipId) {
          throw new Error("A patient relationship ID was not provided.");
        }

        const response = await fetch(
          `/api/doctor/patients/${encodeURIComponent(relationshipId)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = (await response.json()) as PatientWorkspaceApiResponse;

        if (controller.signal.aborted) {
          return;
        }

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
            data.message ||
              data.error ||
              "Unable to load the patient workspace.",
          );
        }

        setWorkspace(data.patientWorkspace);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error(
          "[Doctor IFI Monitoring] Failed to load patient workspace:",
          error,
        );

        if (!controller.signal.aborted) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load the patient workspace.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      controller.abort();
    };
  }, [relationshipId, redirectToLogin]);

  /**
   * ----------------------------------------------------------
   * LOADING
   * ----------------------------------------------------------
   */

  if (isLoading) {
    return (
      <main className="flex min-h-[500px] w-full items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            className="h-6 w-6 animate-spin text-[#2e6cf6]"
            strokeWidth={1.8}
          />

          <p className="text-[12px] font-medium text-slate-500">
            Loading patient monitoring...
          </p>
        </div>
      </main>
    );
  }

  /**
   * ----------------------------------------------------------
   * ERROR / UNAVAILABLE
   * ----------------------------------------------------------
   */

  if (!workspace) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[450px] w-full max-w-[700px] items-center justify-center">
          <div className="w-full rounded-xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
              <AlertCircle
                className="h-5 w-5 text-rose-600"
                strokeWidth={1.8}
              />
            </div>

            <h1 className="mt-4 text-[17px] font-semibold text-[#12355b]">
              Patient Monitoring Unavailable
            </h1>

            <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-500">
              {pageError ?? "This patient relationship could not be loaded."}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#2e6cf6] px-4 text-[11px] font-semibold text-white transition hover:bg-[#255bd4]"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
              Try Again
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/patients/${encodeURIComponent(relationshipId)}`,
                )
              }
              className="mx-auto mt-4 flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-[#12355b]"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
              Back to Patient Workspace
            </button>
          </div>
        </div>
      </main>
    );
  }

  /**
   * ----------------------------------------------------------
   * PATIENT DISPLAY NAME
   * ----------------------------------------------------------
   */

  const patientName = workspace.patient.fullName?.trim() || "Patient";

  /**
   * ----------------------------------------------------------
   * DOCTOR MONITORING ENDPOINT
   * ----------------------------------------------------------
   *
   * Important:
   *
   * relationshipId is the only relationship identifier sent
   * by this page.
   *
   * The doctor monitoring API is responsible for independently
   * verifying:
   *
   * - authenticated user is a doctor
   * - relationship belongs to that doctor
   * - relationship is active
   * - patientId comes from that relationship
   */

  const monitoringApiEndpoint = `/api/doctor/patients/${encodeURIComponent(
    workspace.relationshipId,
  )}/ifi-monitoring`;

  return (
    <main className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* Navigation */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/patients/${encodeURIComponent(
                  workspace.relationshipId,
                )}`,
              )
            }
            className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-500 transition hover:text-[#12355b]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            Back to Patient Workspace
          </button>
        </div>

        {/* Shared monitoring dashboard */}
        <IFIMonitoringDashboard
          apiEndpoint={monitoringApiEndpoint}
          patientName={patientName}
        />
      </div>
    </main>
  );
}
