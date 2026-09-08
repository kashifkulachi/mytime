import "server-only";

import { randomUUID } from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * The database lease currently lasts for 300 seconds.
 *
 * The worker itself should stop accepting new PDF jobs before this
 * lease expires.
 *
 * Later, the worker route will use a smaller processing budget
 * (for example ~240-250 seconds) so it has enough time to:
 *
 * - finish the current database work
 * - acknowledge the queue message
 * - release this lease
 * - return the HTTP response
 */
const DEFAULT_LEASE_SECONDS = 300;

const MIN_LEASE_SECONDS = 30;
const MAX_LEASE_SECONDS = 900;

export interface ReportPdfWorkerLease {
  token: string;
  acquiredAt: string;
  expiresAt: string;
}

export interface AcquireReportPdfWorkerLeaseResult {
  acquired: boolean;

  /**
   * Present only when THIS worker successfully acquired the lease.
   *
   * We deliberately do not expose another worker's lease token
   * when acquisition fails.
   */
  lease: ReportPdfWorkerLease | null;
}

interface AcquireLeaseRpcRow {
  acquired: boolean;
  lease_token: string | null;
  acquired_at: string | null;
  expires_at: string | null;
}

/**
 * Attempts to acquire the global report PDF worker lease.
 *
 * Only one worker invocation should be allowed to drain the PDF
 * queue at a time.
 *
 * If another worker currently owns the lease, this function does
 * NOT throw. It returns:
 *
 * {
 *   acquired: false,
 *   lease: null
 * }
 *
 * That allows the extra Vercel invocation to exit normally.
 */
export async function acquireReportPdfWorkerLease(
  leaseSeconds: number = DEFAULT_LEASE_SECONDS,
): Promise<AcquireReportPdfWorkerLeaseResult> {
  validateLeaseDuration(leaseSeconds);

  const supabase = createSupabaseAdminClient();

  /**
   * Every worker invocation gets a unique token.
   *
   * The database stores this token when the lease is acquired.
   * The same token is required when releasing the lease.
   *
   * This prevents an old/stale worker from releasing a lease
   * currently owned by another invocation.
   */
  const requestedLeaseToken = randomUUID();

  const { data, error } = await supabase.rpc(
    "acquire_report_pdf_worker_lease",
    {
      p_lease_token: requestedLeaseToken,
      p_lease_seconds: leaseSeconds,
    },
  );

  if (error) {
    throw mapAcquireLeaseError(error.message);
  }

  const row = getFirstRow<AcquireLeaseRpcRow>(data);

  if (!row) {
    throw new Error("PDF_WORKER_LEASE_EMPTY_RESPONSE");
  }

  /**
   * Another worker already owns the lease.
   *
   * This is expected under concurrent traffic and is not an error.
   */
  if (!row.acquired) {
    return {
      acquired: false,
      lease: null,
    };
  }

  /**
   * The RPC says we acquired the lease, therefore all lease
   * metadata must be present and the returned token must be ours.
   */
  if (!row.lease_token || !row.acquired_at || !row.expires_at) {
    throw new Error("PDF_WORKER_LEASE_INVALID_RESPONSE");
  }

  if (row.lease_token !== requestedLeaseToken) {
    throw new Error("PDF_WORKER_LEASE_TOKEN_MISMATCH");
  }

  validateTimestamp(row.acquired_at, "PDF_WORKER_LEASE_INVALID_ACQUIRED_AT");

  validateTimestamp(row.expires_at, "PDF_WORKER_LEASE_INVALID_EXPIRES_AT");

  return {
    acquired: true,

    lease: {
      token: row.lease_token,
      acquiredAt: row.acquired_at,
      expiresAt: row.expires_at,
    },
  };
}

/**
 * Releases a worker lease owned by this invocation.
 *
 * The database only releases the lease when the supplied token
 * matches the currently active lease token.
 *
 * This protects against the following race:
 *
 * Worker A gets lease
 * → Worker A stalls
 * → lease expires
 * → Worker B gets new lease
 * → Worker A wakes up and tries to release
 *
 * Worker A must NOT be able to release Worker B's lease.
 */
export async function releaseReportPdfWorkerLease(
  leaseToken: string,
): Promise<boolean> {
  if (!isUuid(leaseToken)) {
    throw new Error("INVALID_PDF_WORKER_LEASE_TOKEN");
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc(
    "release_report_pdf_worker_lease",
    {
      p_lease_token: leaseToken,
    },
  );

  if (error) {
    throw mapReleaseLeaseError(error.message);
  }

  /**
   * PostgreSQL boolean RPC functions normally return a boolean
   * directly through Supabase.
   */
  if (typeof data !== "boolean") {
    throw new Error("PDF_WORKER_LEASE_RELEASE_INVALID_RESPONSE");
  }

  return data;
}

function validateLeaseDuration(leaseSeconds: number): void {
  if (
    !Number.isInteger(leaseSeconds) ||
    leaseSeconds < MIN_LEASE_SECONDS ||
    leaseSeconds > MAX_LEASE_SECONDS
  ) {
    throw new Error("INVALID_PDF_WORKER_LEASE_DURATION");
  }
}

function validateTimestamp(value: string, errorCode: string): void {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new Error(errorCode);
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getFirstRow<T>(data: unknown): T | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const row = data[0];

  if (typeof row !== "object" || row === null) {
    return null;
  }

  return row as T;
}

function mapAcquireLeaseError(message: string): Error {
  if (message.includes("INVALID_LEASE_TOKEN")) {
    return new Error("INVALID_PDF_WORKER_LEASE_TOKEN");
  }

  if (message.includes("INVALID_LEASE_DURATION")) {
    return new Error("INVALID_PDF_WORKER_LEASE_DURATION");
  }

  return new Error(
    `PDF_WORKER_LEASE_ACQUIRE_FAILED:${sanitizeErrorMessage(message)}`,
  );
}

function mapReleaseLeaseError(message: string): Error {
  if (message.includes("INVALID_LEASE_TOKEN")) {
    return new Error("INVALID_PDF_WORKER_LEASE_TOKEN");
  }

  return new Error(
    `PDF_WORKER_LEASE_RELEASE_FAILED:${sanitizeErrorMessage(message)}`,
  );
}

function sanitizeErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 300);
}
