import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface ClaimReportPdfInput {
  reportId: string;
  queueMessageId: number;
}

export interface ClaimReportPdfResult {
  reportId: string;
  pdfStatus: "generating";
  generationAttempt: number;
  generationStartedAt: string;
}

interface ClaimReportPdfRpcRow {
  report_id: string;
  pdf_status: string;
  generation_attempt: number;
  generation_started_at: string;
}

export async function claimReportPdf({
  reportId,
  queueMessageId,
}: ClaimReportPdfInput): Promise<ClaimReportPdfResult> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  if (!Number.isInteger(queueMessageId) || queueMessageId <= 0) {
    throw new Error("A valid queue message ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("claim_report_pdf_generation", {
    p_report_id: normalizedReportId,
    p_queue_message_id: queueMessageId,
  });

  if (error) {
    throw mapClaimError(error.message);
  }

  const rows = data as ClaimReportPdfRpcRow[] | null;

  if (!rows || rows.length === 0) {
    throw new Error("The PDF generation job could not be claimed.");
  }

  const row = rows[0];

  if (row.pdf_status !== "generating") {
    throw new Error(`Unexpected PDF status after claim: ${row.pdf_status}`);
  }

  if (
    !Number.isInteger(row.generation_attempt) ||
    row.generation_attempt <= 0
  ) {
    throw new Error("The PDF generation attempt number is invalid.");
  }

  if (!row.generation_started_at) {
    throw new Error("The PDF generation start timestamp was not returned.");
  }

  return {
    reportId: row.report_id,
    pdfStatus: "generating",
    generationAttempt: row.generation_attempt,
    generationStartedAt: row.generation_started_at,
  };
}

function mapClaimError(databaseMessage: string): Error {
  if (databaseMessage.includes("REPORT_NOT_FOUND")) {
    return new Error("REPORT_NOT_FOUND");
  }

  if (databaseMessage.includes("REPORT_NOT_QUEUED")) {
    return new Error("REPORT_NOT_QUEUED");
  }

  if (databaseMessage.includes("REPORT_QUEUE_MESSAGE_MISSING")) {
    return new Error("REPORT_QUEUE_MESSAGE_MISSING");
  }

  if (databaseMessage.includes("STALE_QUEUE_MESSAGE")) {
    return new Error("STALE_QUEUE_MESSAGE");
  }

  console.error("Unexpected report PDF claim database error:", databaseMessage);

  return new Error("REPORT_PDF_CLAIM_FAILED");
}
