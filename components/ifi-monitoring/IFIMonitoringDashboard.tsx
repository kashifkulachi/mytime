"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Activity, LoaderCircle, RefreshCw } from "lucide-react";

import IFIMonitoringPatientHeader, {
  type IFIMonitoringCycleOption,
} from "./IFIMonitoringPatientHeader";

import IFIMonitoringSummary from "./IFIMonitoringSummary";
import IFIMonitoringTable from "./IFIMonitoringTable";
import IFIMonitoringChart from "./IFIMonitoringChart";

import type {
  IFIMonitoringCalculationResult,
  IFIMonitoringCycleStatus,
  IFIMonitoringInput,
} from "@/types/calculations/ifi-monitoring";
import { DownloadIFIMonitoringPdfButton } from "./DownloadIFIMonitoringPdfButton";

/**
 * ============================================================
 * API TYPES
 * ============================================================
 */

interface IFIMonitoringApiCycle {
  id: string;
  startDate: string;
  endDate: string;
  status: IFIMonitoringCycleStatus;
  completedAt: string | null;

  /**
   * Optional for now.
   *
   * We can expose this from the API in the next metadata
   * improvement.
   */
  createdAt?: string | null;
}

interface IFIMonitoringCycleData {
  cycle: {
    id: string;
    patientId: string;
    baselineReportId: string;
    startDate: string;
    endDate: string;
    status: IFIMonitoringCycleStatus;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

  input: IFIMonitoringInput;

  calculation: IFIMonitoringCalculationResult;
}

interface IFIMonitoringApiResponse {
  success: boolean;

  cycles: IFIMonitoringApiCycle[];

  selectedCycleId: string | null;

  data: IFIMonitoringCycleData | null;

  /**
   * Present on the doctor endpoint.
   */
  relationship?: {
    id: string;
  };

  error?: string;
}

/**
 * ============================================================
 * COMPONENT PROPS
 * ============================================================
 */

interface IFIMonitoringDashboardProps {
  /**
   * API used by this dashboard.
   *
   * Patient:
   *
   * /api/ifi-monitoring
   *
   * Doctor:
   *
   * /api/doctor/patients/[relationshipId]/ifi-monitoring
   */
  apiEndpoint: string;

  /**
   * Patient identity is supplied by the server page.
   *
   * This prevents the client from trying to resolve patient
   * ownership itself.
   */
  patientName: string;

  dateOfBirth?: string | null;
}

/**
 * ============================================================
 * MAIN DASHBOARD
 * ============================================================
 */

export default function IFIMonitoringDashboard({
  apiEndpoint,
  patientName,
  dateOfBirth,
}: IFIMonitoringDashboardProps) {
  const [response, setResponse] = useState<IFIMonitoringApiResponse | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [isChangingCycle, setIsChangingCycle] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /**
   * ----------------------------------------------------------
   * LOAD MONITORING
   * ----------------------------------------------------------
   */
  const loadMonitoring = useCallback(
    async ({
      cycleId,
      changingCycle = false,
    }: {
      cycleId?: string;
      changingCycle?: boolean;
    } = {}) => {
      try {
        if (changingCycle) {
          setIsChangingCycle(true);
        } else {
          setIsLoading(true);
        }

        setError(null);

        const url = new URL(apiEndpoint, window.location.origin);

        if (cycleId) {
          url.searchParams.set("cycleId", cycleId);
        }

        const result = await fetch(url.toString(), {
          method: "GET",

          credentials: "include",

          headers: {
            Accept: "application/json",
          },

          /**
           * Monitoring should reflect the patient's latest
           * report state rather than a stale browser cache.
           */
          cache: "no-store",
        });

        const body = (await result.json()) as
          | IFIMonitoringApiResponse
          | {
              error?: string;
            };

        if (!result.ok) {
          throw new Error(body.error || "Unable to load IFI monitoring.");
        }

        setResponse(body as IFIMonitoringApiResponse);
      } catch (loadError) {
        console.error("[IFI Monitoring Dashboard] Load failed:", loadError);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load IFI monitoring.",
        );
      } finally {
        setIsLoading(false);
        setIsChangingCycle(false);
      }
    },
    [apiEndpoint],
  );

  /**
   * ----------------------------------------------------------
   * INITIAL LOAD
   * ----------------------------------------------------------
   */
  //   useEffect(() => {
  //     void loadMonitoring();
  //   }, [loadMonitoring]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialMonitoring() {
      try {
        const url = new URL(apiEndpoint, window.location.origin);

        const result = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const body = (await result.json()) as
          | IFIMonitoringApiResponse
          | {
              error?: string;
            };

        if (!result.ok) {
          throw new Error(body.error || "Unable to load IFI monitoring.");
        }

        if (!controller.signal.aborted) {
          setResponse(body as IFIMonitoringApiResponse);

          setError(null);
          setIsLoading(false);
        }
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "[IFI Monitoring Dashboard] Initial load failed:",
          loadError,
        );

        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load IFI monitoring.",
          );

          setIsLoading(false);
        }
      }
    }

    void loadInitialMonitoring();

    return () => {
      controller.abort();
    };
  }, [apiEndpoint]);
  /**
   * ----------------------------------------------------------
   * CYCLE CHANGE
   * ----------------------------------------------------------
   */
  const handleCycleChange = (cycleId: string) => {
    if (!cycleId || cycleId === response?.selectedCycleId) {
      return;
    }

    void loadMonitoring({
      cycleId,
      changingCycle: true,
    });
  };

  /**
   * ----------------------------------------------------------
   * INITIAL LOADING STATE
   * ----------------------------------------------------------
   */
  if (isLoading && !response) {
    return (
      <DashboardShell>
        <MonitoringLoadingState />
      </DashboardShell>
    );
  }

  /**
   * ----------------------------------------------------------
   * INITIAL ERROR STATE
   * ----------------------------------------------------------
   */
  if (error && !response) {
    return (
      <DashboardShell>
        <MonitoringErrorState
          message={error}
          onRetry={() => void loadMonitoring()}
        />
      </DashboardShell>
    );
  }

  /**
   * ----------------------------------------------------------
   * NO CYCLE / EMPTY STATE
   * ----------------------------------------------------------
   */
  if (
    !response ||
    response.cycles.length === 0 ||
    !response.selectedCycleId ||
    !response.data
  ) {
    return (
      <DashboardShell>
        <MonitoringEmptyState />
      </DashboardShell>
    );
  }

  const cycleData = response.data;

  const monitoring = cycleData.calculation;

  const selectedCycle =
    response.cycles.find((cycle) => cycle.id === response.selectedCycleId) ??
    null;

  /**
   * Convert API cycles to the frontend cycle option type.
   */
  const cycleOptions: IFIMonitoringCycleOption[] = response.cycles.map(
    (cycle) => ({
      id: cycle.id,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
      completedAt: cycle.completedAt,
    }),
  );

  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* Non-blocking refresh / cycle error */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                strokeWidth={1.8}
              />

              <p className="text-[11px] leading-5 text-rose-700">{error}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadMonitoring({
                  cycleId: response.selectedCycleId ?? undefined,
                })
              }
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-rose-700 hover:text-rose-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {/*
         * =========================================================
         * MONITORING ACTIONS
         * =========================================================
         *
         * This toolbar intentionally lives OUTSIDE the PDF capture
         * container so the Download PDF button does not appear
         * inside the downloaded document.
         */}
        <div className="flex items-center justify-end">
          <DownloadIFIMonitoringPdfButton
            patientName={patientName}
            cycleStartDate={monitoring.startDate}
          />
        </div>

        {/*
         * =========================================================
         * PDF CAPTURE AREA
         * =========================================================
         *
         * Everything inside this element becomes part of the
         * downloaded IFI monitoring PDF.
         *
         * Keep interactive actions such as Download PDF outside.
         */}
        <div data-ifi-monitoring-pdf="true" className="space-y-5 bg-white">
          {/* Patient + cycle header */}
          <IFIMonitoringPatientHeader
            patientName={patientName}
            dateOfBirth={dateOfBirth}
            cycles={cycleOptions}
            selectedCycleId={response.selectedCycleId}
            latestMonitoringDay={monitoring.summary.latestMonitoringDay}
            evaluationDate={monitoring.startDate}
            createdAt={cycleData.cycle.createdAt}
            isChangingCycle={isChangingCycle}
            onCycleChange={handleCycleChange}
          />

          {/* Longitudinal results */}
          <IFIMonitoringSummary summary={monitoring.summary} />

          {/*
           * =====================================================
           * PRIMARY CLINICAL DATA
           * =====================================================
           *
           * The table deliberately comes BEFORE the graph.
           *
           * 1. Actual IFI
           * 2. Recovery
           * 3. Daily Change
           * 4. Then graphical visualization
           */}
          <IFIMonitoringTable days={monitoring.days} />

          {/* Secondary visualization */}
          <IFIMonitoringChart days={monitoring.days} />

          {/* Clinical note */}
          <ClinicalMonitoringNote formulaVersion={monitoring.formulaVersion} />
        </div>
      </div>
    </DashboardShell>
  );
}

/**
 * ============================================================
 * DASHBOARD SHELL
 * ============================================================
 *
 * Intentionally does NOT create another full-page background,
 * sidebar, header, or fixed viewport.
 *
 * Your existing /dashboard layout owns those.
 */

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1500px]">{children}</div>
    </div>
  );
}

/**
 * ============================================================
 * LOADING
 * ============================================================
 */

function MonitoringLoadingState() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <LoaderCircle
              className="h-5 w-5 animate-spin text-[#2e6cf6]"
              strokeWidth={1.8}
            />
          </div>

          <h2 className="mt-4 text-[15px] font-semibold text-[#12355b]">
            Loading IFI Monitoring
          </h2>

          <p className="mx-auto mt-1.5 max-w-sm text-[11px] leading-5 text-slate-500">
            Preparing the selected 31-day monitoring cycle and longitudinal
            results.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * ERROR
 * ============================================================
 */

function MonitoringErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm">
      <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
            <AlertCircle className="h-5 w-5 text-rose-600" strokeWidth={1.8} />
          </div>

          <h2 className="mt-4 text-[15px] font-semibold text-[#12355b]">
            Unable to Load Monitoring
          </h2>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            {message}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#2e6cf6] px-4 text-[11px] font-semibold text-white transition hover:bg-[#255bd4] focus:outline-none focus:ring-2 focus:ring-[#2e6cf6]/30"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * EMPTY
 * ============================================================
 */

function MonitoringEmptyState() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
            <Activity className="h-5 w-5 text-[#12355b]" strokeWidth={1.8} />
          </div>

          <h2 className="mt-4 text-[15px] font-semibold text-[#12355b]">
            No IFI Monitoring Cycle Yet
          </h2>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            A 31-day IFI monitoring cycle will become available after an
            eligible assessment establishes the patient&apos;s Day 0 monitoring
            record.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * CLINICAL NOTE
 * ============================================================
 */

function ClinicalMonitoringNote({
  formulaVersion,
}: {
  formulaVersion: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#12355b] shadow-sm ring-1 ring-slate-200">
          <Activity className="h-3.5 w-3.5" strokeWidth={1.8} />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#12355b]">
            Monitoring Information
          </p>

          <p className="mt-1 max-w-4xl text-[10px] leading-[1.65] text-slate-500">
            This view presents recorded IFI assessments across the selected
            31-day monitoring period. Missing days indicate that no assessment
            was recorded for that date and are not automatically estimated or
            interpolated.
          </p>

          <p className="mt-2 text-[9px] text-slate-400">
            Calculation version:{" "}
            <span className="font-mono">{formulaVersion}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
