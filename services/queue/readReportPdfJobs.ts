import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const REPORT_PDF_QUEUE_NAME = "report_pdf_generation";

const DEFAULT_BATCH_SIZE = 2;

/**
 * Visibility timeout in seconds.
 *
 * While a worker is processing a message, pgmq hides that
 * message from other consumers.
 *
 * If the worker crashes or never acknowledges it, the message
 * becomes visible again after this timeout so another worker
 * can retry it.
 */
const DEFAULT_VISIBILITY_TIMEOUT_SECONDS = 600;

export interface ReportPdfQueueMessagePayload {
  reportId: string;
  force: boolean;
  requestedAt: string;
}

export interface ReportPdfQueueJob {
  messageId: number;
  readCount: number;
  enqueuedAt: string;
  visibilityTimeoutAt: string;
  payload: ReportPdfQueueMessagePayload;
}

interface RawQueueMessage {
  msg_id: number | string;
  read_ct: number | string;
  enqueued_at: string;
  vt: string;
  message: unknown;
}

export interface ReadReportPdfJobsOptions {
  batchSize?: number;
  visibilityTimeoutSeconds?: number;
}

export async function readReportPdfJobs({
  batchSize = DEFAULT_BATCH_SIZE,
  visibilityTimeoutSeconds = DEFAULT_VISIBILITY_TIMEOUT_SECONDS,
}: ReadReportPdfJobsOptions = {}): Promise<ReportPdfQueueJob[]> {
  validateBatchSize(batchSize);
  validateVisibilityTimeout(visibilityTimeoutSeconds);

  const supabase = createSupabaseAdminClient();

  /*
   * pgmq.read(queue, visibilityTimeout, quantity)
   *
   * This reads visible queue messages and temporarily hides
   * them from other consumers.
   *
   * Important:
   * Reading does NOT permanently remove the message.
   * The worker must explicitly acknowledge/delete/archive it
   * after successful processing.
   */
  const { data, error } = await supabase.rpc(
    "read_report_pdf_generation_queue",
    {
      p_visibility_timeout_seconds: visibilityTimeoutSeconds,
      p_batch_size: batchSize,
    },
  );

  if (error) {
    console.error("Failed to read report PDF queue:", error);

    throw new Error("REPORT_PDF_QUEUE_READ_FAILED");
  }

  const rows = (data as RawQueueMessage[] | null) ?? [];

  if (rows.length === 0) {
    return [];
  }

  const jobs: ReportPdfQueueJob[] = [];

  for (const row of rows) {
    try {
      jobs.push(normalizeQueueMessage(row));
    } catch (error) {
      /*
       * Don't allow one malformed queue message to prevent all
       * valid messages in the batch from being processed.
       *
       * Later, the worker will handle malformed messages with a
       * dead-letter/archive strategy.
       */
      console.error("Invalid report PDF queue message:", {
        messageId: row.msg_id,
        error,
      });
    }
  }

  return jobs;
}

function normalizeQueueMessage(row: RawQueueMessage): ReportPdfQueueJob {
  const messageId = Number(row.msg_id);
  const readCount = Number(row.read_ct);

  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw new Error("Queue message ID is invalid.");
  }

  if (!Number.isInteger(readCount) || readCount < 0) {
    throw new Error("Queue read count is invalid.");
  }

  const payload = parseQueuePayload(row.message);

  return {
    messageId,
    readCount,
    enqueuedAt: row.enqueued_at,
    visibilityTimeoutAt: row.vt,
    payload,
  };
}

function parseQueuePayload(message: unknown): ReportPdfQueueMessagePayload {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    throw new Error("Queue payload must be an object.");
  }

  const payload = message as Record<string, unknown>;

  const reportId =
    typeof payload.reportId === "string" ? payload.reportId.trim() : "";

  if (!reportId) {
    throw new Error("Queue payload does not contain a valid reportId.");
  }

  const force = typeof payload.force === "boolean" ? payload.force : false;

  const requestedAt =
    typeof payload.requestedAt === "string" ? payload.requestedAt : "";

  if (!requestedAt) {
    throw new Error("Queue payload does not contain requestedAt.");
  }

  return {
    reportId,
    force,
    requestedAt,
  };
}

function validateBatchSize(batchSize: number): void {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10) {
    throw new Error("Queue batch size must be an integer between 1 and 10.");
  }
}

function validateVisibilityTimeout(visibilityTimeoutSeconds: number): void {
  if (
    !Number.isInteger(visibilityTimeoutSeconds) ||
    visibilityTimeoutSeconds < 30 ||
    visibilityTimeoutSeconds > 3600
  ) {
    throw new Error(
      "Queue visibility timeout must be between 30 and 3600 seconds.",
    );
  }
}
