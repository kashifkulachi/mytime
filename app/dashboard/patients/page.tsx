"use client";

import {
  ArrowRight,
  Clock3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface DoctorPatientItem {
  relationshipId: string;

  patient: {
    fullName: string | null;
  };

  status: "active";

  acceptedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DoctorPatientsResponse {
  success: boolean;

  code?: string;
  message?: string;
  error?: string;

  patients?: DoctorPatientItem[];

  count?: number;
}

interface CreateConnectionResponse {
  success: boolean;

  code?: string;
  message?: string;
  error?: string;

  connection?: {
    relationshipId: string;

    status: "pending" | "active";

    patient: {
      fullName: string | null;
    };

    alreadyPending?: boolean;
    alreadyConnected?: boolean;
  };
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

function normalizeConnectionCodeInput(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "");
}

export default function DoctorPatientsPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<DoctorPatientItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [connectionCode, setConnectionCode] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isConnecting, setIsConnecting] = useState(false);

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    const returnPath = "/dashboard/patients";

    router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
  }, [router]);

  /**
   * ----------------------------------------------------------
   * LOAD ACTIVE PATIENTS
   * ----------------------------------------------------------
   */
  const loadPatients = useCallback(async () => {
    const response = await fetch("/api/doctor/patients", {
      method: "GET",
      cache: "no-store",
    });

    const data = (await response.json()) as DoctorPatientsResponse;

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (response.status === 403) {
      throw new Error(
        data.message ?? "This page is available only to doctor accounts.",
      );
    }

    if (!response.ok || !data.success || !data.patients) {
      throw new Error(
        data.message || data.error || "Unable to load your patients.",
      );
    }

    setPatients(data.patients);
  }, [redirectToLogin]);

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

        await loadPatients();
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load your patients.";

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
  }, [loadPatients]);

  /**
   * ----------------------------------------------------------
   * FILTER PATIENT LIST
   * ----------------------------------------------------------
   */
  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter(
      (patient) =>
        patient.patient.fullName?.toLowerCase().includes(query) ?? false,
    );
  }, [patients, searchQuery]);

  /**
   * ----------------------------------------------------------
   * CONNECT PATIENT
   * ----------------------------------------------------------
   */
  async function handleConnectPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isConnecting) {
      return;
    }

    const normalizedCode = normalizeConnectionCodeInput(connectionCode);

    if (!normalizedCode) {
      toast.error("Enter the patient connection code.");

      return;
    }

    setIsConnecting(true);

    try {
      const response = await fetch("/api/doctor/connections", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          connectionCode: normalizedCode,
        }),
      });

      const data = (await response.json()) as CreateConnectionResponse;

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data.message ?? "Only doctor accounts can connect to patients.",
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to create the patient connection request.",
        );
      }

      if (data.code === "PATIENT_ALREADY_CONNECTED") {
        toast.success(
          `${data.connection?.patient.fullName ?? "This patient"} is already connected to your account.`,
        );

        setConnectionCode("");
        setIsAddPatientOpen(false);

        await loadPatients();

        return;
      }

      if (data.code === "CONNECTION_REQUEST_ALREADY_PENDING") {
        toast.info(
          `A connection request for ${
            data.connection?.patient.fullName ?? "this patient"
          } is already awaiting approval.`,
        );

        setConnectionCode("");

        return;
      }

      toast.success(
        `Connection request sent to ${
          data.connection?.patient.fullName ?? "the patient"
        }.`,
      );

      setConnectionCode("");
      setIsAddPatientOpen(false);

      /**
       * The relationship is still pending, so it will not appear
       * in My Patients yet.
       *
       * Once the patient accepts, a later refresh will show it.
       */
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to connect to the patient.";

      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  }

  /**
   * ----------------------------------------------------------
   * PATIENT WORKSPACE
   * ----------------------------------------------------------
   *
   * relationshipId is intentionally used in the URL instead of
   * exposing patient auth UUID.
   *
   * The server will later resolve and authorize this relationship.
   */
  function handleOpenPatient(relationshipId: string) {
    router.push(`/dashboard/patients/${encodeURIComponent(relationshipId)}`);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

          <p className="text-sm font-medium text-slate-600">
            Loading your patients...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#f8f9fd]">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}

        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0ff] text-[#005cff]">
                <UsersRound className="h-5 w-5" />
              </span>

              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Clinical Workspace
              </p>
            </div>

            <h1 className="mt-4 text-[28px] font-bold tracking-[-0.025em] text-[#062d52] sm:text-[34px]">
              My Patients
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              Manage connected patients, review their MyTime records, and start
              new clinical assessments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddPatientOpen((current) => !current)}
            className="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#062542]"
          >
            <Plus className="h-4 w-4" />
            Add Patient
          </button>
        </header>

        {pageError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* Add Patient */}

        {isAddPatientOpen && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-[#cddcf3] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.035)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#005cff]">
                  <ShieldCheck className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="text-base font-bold text-[#092846]">
                    Add a Patient
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Ask the patient to generate a temporary MyTime connection
                    code from their Care Team page, then enter it below.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleConnectPatient} className="px-5 py-6 sm:px-6">
              <div className="max-w-xl">
                <label
                  htmlFor="patient-connection-code"
                  className="text-sm font-semibold text-[#092846]"
                >
                  Patient Connection Code
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="patient-connection-code"
                    type="text"
                    value={connectionCode}
                    onChange={(event) =>
                      setConnectionCode(event.target.value.toUpperCase())
                    }
                    placeholder="MYT-7K3Q-P9WX"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={20}
                    className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-4 font-mono text-sm font-semibold tracking-[0.08em] text-[#092846] outline-none transition placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#005cff] focus:ring-2 focus:ring-[#005cff]/10"
                  />

                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#062542] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConnecting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}

                    {isConnecting ? "Connecting..." : "Request Connection"}
                  </button>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#f7faff] px-3 py-3 text-xs leading-5 text-slate-500">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#063467]" />

                  <p>
                    Patient codes expire after 15 minutes and can be used only
                    once. Entering a code creates a pending request; the patient
                    must approve it before you can access their clinical data.
                  </p>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* Overview */}

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <OverviewCard
            icon={<UsersRound className="h-5 w-5" />}
            label="Active Patients"
            value={patients.length}
            description="Patients currently connected to your account."
          />

          {/* <OverviewCard
            icon={<Stethoscope className="h-5 w-5" />}
            label="Clinical Access"
            value={patients.length}
            description="Active patient relationships available for assessment."
          /> */}
        </section>

        {/* Patient List */}

        <section className="mt-7 rounded-2xl border border-slate-300 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#092846]">
                Active Patients
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Select a patient to open their clinical workspace.
              </p>
            </div>

            <div className="relative w-full sm:w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search patients"
                className="min-h-10 w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-[#092846] outline-none transition placeholder:text-slate-400 focus:border-[#005cff] focus:ring-2 focus:ring-[#005cff]/10"
              />
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            patients.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <UserRound className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-[#092846]">
                  No connected patients yet
                </h3>

                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                  Ask a patient for their temporary MyTime connection code, then
                  use Add Patient to send a connection request.
                </p>

                <button
                  type="button"
                  onClick={() => setIsAddPatientOpen(true)}
                  className="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#062542]"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Patient
                </button>
              </div>
            ) : (
              <div className="py-10 text-center">
                <Search className="mx-auto h-6 w-6 text-slate-400" />

                <p className="mt-3 text-sm font-semibold text-[#092846]">
                  No patients match your search
                </p>
              </div>
            )
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPatients.map((connection) => {
                const displayName =
                  connection.patient.fullName?.trim() || "Patient";

                return (
                  <button
                    key={connection.relationshipId}
                    type="button"
                    onClick={() => handleOpenPatient(connection.relationshipId)}
                    className="group flex w-full cursor-pointer flex-col gap-4 py-5 text-left transition sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-bold text-[#063467]">
                        {getInitials(displayName)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-[#092846]">
                            {displayName}
                          </h3>

                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Active
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          Connected {formatDate(connection.acceptedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end text-sm font-semibold text-[#063467] sm:self-auto">
                      Open Patient
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Refresh */}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void loadPatients().catch((error) => {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Unable to refresh patients.";

                toast.error(message);
              });
            }}
            className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#063467]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Patients
          </button>
        </div>
      </div>
    </main>
  );
}

interface OverviewCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}

function OverviewCard({ icon, label, value, description }: OverviewCardProps) {
  return (
    <article className="rounded-xl border border-slate-300 bg-white px-5 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef4ff] text-[#005cff]">
          {icon}
        </span>

        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-0.5 text-2xl font-bold tracking-[-0.03em] text-[#062d52]">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}
