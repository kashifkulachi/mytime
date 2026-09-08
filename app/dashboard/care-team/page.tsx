"use client";

import {
  Check,
  Clock3,
  Copy,
  Link2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRoundCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ConnectionCodeResponse {
  success: boolean;
  code?: string;
  message?: string;
  error?: string;

  connection?: {
    code: string;
    expiresAt: string;
    expiresInSeconds: number;
  };
}

interface DoctorConnectionItem {
  relationshipId: string;

  doctor: {
    fullName: string | null;
  };

  status: "pending" | "active";

  acceptedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

interface PatientDoctorsResponse {
  success: boolean;

  code?: string;
  message?: string;
  error?: string;

  connections?: {
    pending: DoctorConnectionItem[];
    active: DoctorConnectionItem[];

    counts: {
      pending: number;
      active: number;
      total: number;
    };
  };
}

interface ConnectionMutationResponse {
  success: boolean;

  code?: string;
  message?: string;
  error?: string;
}

interface GeneratedCode {
  code: string;
  expiresAt: string;
}

function formatDateTime(value: string | null | undefined): string {
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
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getDoctorInitials(name: string | null): string {
  if (!name) {
    return "DR";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "DR";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getRemainingTime(expiresAt: string | null): string {
  if (!expiresAt) {
    return "Expired";
  }

  const expires = new Date(expiresAt).getTime();

  if (Number.isNaN(expires)) {
    return "Expired";
  }

  const remaining = expires - Date.now();

  if (remaining <= 0) {
    return "Expired";
  }

  const totalSeconds = Math.floor(remaining / 1000);

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PatientConnectionsPage() {
  const router = useRouter();

  const [pendingConnections, setPendingConnections] = useState<
    DoctorConnectionItem[]
  >([]);

  const [activeConnections, setActiveConnections] = useState<
    DoctorConnectionItem[]
  >([]);

  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const [actionRelationshipId, setActionRelationshipId] = useState<
    string | null
  >(null);

  const [pageError, setPageError] = useState<string | null>(null);

  const [countdownTick, setCountdownTick] = useState(0);

  const redirectToLogin = useCallback(() => {
    const returnPath = "/dashboard/connections";

    router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
  }, [router]);

  /**
   * ----------------------------------------------------------
   * LOAD CONNECTIONS
   * ----------------------------------------------------------
   */
  const loadConnections = useCallback(async () => {
    const response = await fetch("/api/patient/doctors", {
      method: "GET",
      cache: "no-store",
    });

    const data = (await response.json()) as PatientDoctorsResponse;

    if (response.status === 401) {
      redirectToLogin();

      return;
    }

    if (response.status === 403) {
      throw new Error(
        data.message ?? "This page is available only to patient accounts.",
      );
    }

    if (!response.ok || !data.success || !data.connections) {
      throw new Error(
        data.message || data.error || "Unable to load doctor connections.",
      );
    }

    setPendingConnections(data.connections.pending);

    setActiveConnections(data.connections.active);
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

        await loadConnections();
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load doctor connections.";

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
  }, [loadConnections]);

  /**
   * Keep the connection-code countdown current.
   */
  useEffect(() => {
    if (!generatedCode) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCountdownTick((current) => current + 1);
    }, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [generatedCode]);

  const remainingCodeTime = useMemo(() => {
    void countdownTick;

    return getRemainingTime(generatedCode?.expiresAt ?? null);
  }, [countdownTick, generatedCode?.expiresAt]);

  const isCodeExpired = remainingCodeTime === "Expired";

  /**
   * ----------------------------------------------------------
   * GENERATE CONNECTION CODE
   * ----------------------------------------------------------
   */
  async function handleGenerateCode() {
    if (isGeneratingCode) {
      return;
    }

    setIsGeneratingCode(true);

    try {
      const response = await fetch("/api/patient/connections/code", {
        method: "POST",
      });

      const data = (await response.json()) as ConnectionCodeResponse;

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (response.status === 403) {
        throw new Error(
          data.message ??
            "Only patient accounts can generate a connection code.",
        );
      }

      if (!response.ok || !data.success || !data.connection) {
        throw new Error(
          data.message || data.error || "Unable to generate a connection code.",
        );
      }

      setGeneratedCode({
        code: data.connection.code,

        expiresAt: data.connection.expiresAt,
      });

      toast.success("A new doctor connection code has been generated.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to generate a connection code.";

      toast.error(message);
    } finally {
      setIsGeneratingCode(false);
    }
  }

  /**
   * ----------------------------------------------------------
   * COPY CONNECTION CODE
   * ----------------------------------------------------------
   */
  async function handleCopyCode() {
    if (!generatedCode || isCodeExpired) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedCode.code);

      toast.success("Connection code copied.");
    } catch {
      toast.error("Unable to copy the connection code.");
    }
  }

  /**
   * ----------------------------------------------------------
   * ACCEPT REQUEST
   * ----------------------------------------------------------
   */
  async function handleAccept(relationshipId: string) {
    if (actionRelationshipId) {
      return;
    }

    setActionRelationshipId(relationshipId);

    try {
      const response = await fetch(
        `/api/patient/connections/${encodeURIComponent(relationshipId)}/accept`,
        {
          method: "POST",
        },
      );

      const data = (await response.json()) as ConnectionMutationResponse;

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to accept the doctor connection request.",
        );
      }

      toast.success("Doctor connection accepted.");

      await loadConnections();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to accept the doctor connection request.";

      toast.error(message);
    } finally {
      setActionRelationshipId(null);
    }
  }

  /**
   * ----------------------------------------------------------
   * REJECT / REVOKE
   * ----------------------------------------------------------
   */
  async function handleRemove(
    relationshipId: string,
    mode: "reject" | "revoke",
  ) {
    if (actionRelationshipId) {
      return;
    }

    const confirmed = window.confirm(
      mode === "reject"
        ? "Reject this doctor connection request?"
        : "Remove this doctor? They will immediately lose access to your connected report data.",
    );

    if (!confirmed) {
      return;
    }

    setActionRelationshipId(relationshipId);

    try {
      const response = await fetch(
        `/api/patient/connections/${encodeURIComponent(relationshipId)}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as ConnectionMutationResponse;

      if (response.status === 401) {
        redirectToLogin();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to update the doctor connection.",
        );
      }

      toast.success(
        mode === "reject"
          ? "Doctor request rejected."
          : "Doctor connection removed.",
      );

      await loadConnections();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update the doctor connection.";

      toast.error(message);
    } finally {
      setActionRelationshipId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

          <p className="text-sm font-medium text-slate-600">
            Loading doctor connections...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#f8f9fd]">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}

        <header>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0ff] text-[#005cff]">
              <UserRoundCheck className="h-5 w-5" />
            </span>

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Patient Access
            </p>
          </div>

          <h1 className="mt-4 text-[28px] font-bold tracking-[-0.025em] text-[#062d52] sm:text-[34px]">
            Doctor Connections
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
            Securely connect your MyTime account with a doctor, review pending
            requests, and control which doctors currently have access.
          </p>
        </header>

        {pageError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* Connection Code */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.035)]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#005cff]">
                <Link2 className="h-5 w-5" />
              </span>

              <div>
                <h2 className="text-base font-bold text-[#092846]">
                  Connect with a Doctor
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Generate a temporary code and share it directly with your
                  doctor. Creating a new code immediately invalidates the
                  previous one.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-6">
            {!generatedCode ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-[#fafbfe] px-5 py-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-[#063467]" />

                <h3 className="mt-3 text-sm font-bold text-[#092846]">
                  No active connection code
                </h3>

                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                  Generate a short-lived code when your doctor is ready to
                  connect.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void handleGenerateCode();
                  }}
                  disabled={isGeneratingCode}
                  className="mt-5 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#062542] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingCode ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}

                  {isGeneratingCode
                    ? "Generating..."
                    : "Generate Connection Code"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-[#cddcf3] bg-[#f7faff] px-5 py-6 sm:px-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Temporary MyTime Code
                    </p>

                    <p className="mt-2 font-mono text-[26px] font-bold tracking-[0.12em] text-[#062d52] sm:text-[32px]">
                      {generatedCode.code}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <Clock3 className="h-4 w-4 text-slate-500" />

                      <span
                        className={
                          isCodeExpired
                            ? "font-semibold text-red-600"
                            : "font-medium text-slate-600"
                        }
                      >
                        {isCodeExpired
                          ? "This code has expired"
                          : `Expires in ${remainingCodeTime}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyCode();
                      }}
                      disabled={isCodeExpired}
                      className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#092846] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void handleGenerateCode();
                      }}
                      disabled={isGeneratingCode}
                      className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#062542] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGeneratingCode ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Generate New Code
                    </button>
                  </div>
                </div>

                <p className="mt-5 border-t border-[#dce6f4] pt-4 text-xs leading-5 text-slate-500">
                  This code can be used once and expires after 15 minutes.
                  Entering the code only creates a pending request. You must
                  still approve the doctor before access is granted.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Pending Requests */}

        <section className="mt-7 rounded-2xl border border-slate-300 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-6">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#092846]">
                Pending Requests
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review doctors requesting access to your MyTime account.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {pendingConnections.length} pending
            </span>
          </div>

          {pendingConnections.length === 0 ? (
            <EmptyState
              icon={<Stethoscope className="h-5 w-5" />}
              title="No pending doctor requests"
              description="New doctor connection requests will appear here for your approval."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingConnections.map((connection) => {
                const isBusy =
                  actionRelationshipId === connection.relationshipId;

                return (
                  <div
                    key={connection.relationshipId}
                    className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <DoctorIdentity
                      name={connection.doctor.fullName}
                      subtitle={`Requested ${formatDateTime(
                        connection.createdAt,
                      )}`}
                      status="Pending approval"
                      statusType="pending"
                    />

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          void handleRemove(
                            connection.relationshipId,
                            "reject",
                          );
                        }}
                        disabled={Boolean(actionRelationshipId)}
                        className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void handleAccept(connection.relationshipId);
                        }}
                        disabled={Boolean(actionRelationshipId)}
                        className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#062542] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Active Doctors */}

        <section className="mt-7 rounded-2xl border border-slate-300 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-6">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#092846]">
                Connected Doctors
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Doctors currently authorized to access your connected MyTime
                reports.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {activeConnections.length} connected
            </span>
          </div>

          {activeConnections.length === 0 ? (
            <EmptyState
              icon={<UserRoundCheck className="h-5 w-5" />}
              title="No connected doctors"
              description="Once you approve a doctor connection, it will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {activeConnections.map((connection) => {
                const isBusy =
                  actionRelationshipId === connection.relationshipId;

                return (
                  <div
                    key={connection.relationshipId}
                    className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <DoctorIdentity
                      name={connection.doctor.fullName}
                      subtitle={`Connected ${formatDateTime(
                        connection.acceptedAt,
                      )}`}
                      status="Active"
                      statusType="active"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        void handleRemove(connection.relationshipId, "revoke");
                      }}
                      disabled={Boolean(actionRelationshipId)}
                      className="inline-flex min-h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove Doctor
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void loadConnections().catch((error) => {
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
            Refresh Connections
          </button>
        </div>
      </div>
    </main>
  );
}

interface DoctorIdentityProps {
  name: string | null;
  subtitle: string;
  status: string;
  statusType: "pending" | "active";
}

function DoctorIdentity({
  name,
  subtitle,
  status,
  statusType,
}: DoctorIdentityProps) {
  const displayName = name?.trim() || "Doctor";

  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-bold text-[#063467]">
        {getDoctorInitials(displayName)}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-bold text-[#092846]">
            {displayName}
          </h3>

          <span
            className={[
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",

              statusType === "active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            {status}
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="py-9 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon}
      </div>

      <h3 className="mt-3 text-sm font-bold text-[#092846]">{title}</h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
