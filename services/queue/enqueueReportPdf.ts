import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface EnqueueReportPdfInput {
  reportId: string;
  force?: boolean;
}

export interface EnqueueReportPdfResult {
  reportId: string;
  pdfStatus: "queued";
  queueMessageId: number;
  alreadyQueued: boolean;
}

interface EnqueueReportPdfRpcRow {
  report_id: string;
  pdf_status: string;
  queue_message_id: number | string | null;
  already_queued: boolean;
}

export async function enqueueReportPdf({
  reportId,
  force = false,
}: EnqueueReportPdfInput): Promise<EnqueueReportPdfResult> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("enqueue_report_pdf_generation", {
    p_report_id: normalizedReportId,
    p_force: force,
  });

  if (error) {
    throw mapQueueError(error.message);
  }

  const rows = data as EnqueueReportPdfRpcRow[] | null;

  if (!rows || rows.length === 0) {
    throw new Error(
      "The report could not be added to the PDF generation queue.",
    );
  }

  const row = rows[0];

  if (row.pdf_status !== "queued") {
    throw new Error(`Unexpected PDF queue status returned: ${row.pdf_status}`);
  }

  const queueMessageId = Number(row.queue_message_id);

  if (!Number.isFinite(queueMessageId) || queueMessageId <= 0) {
    throw new Error(
      "The PDF generation queue did not return a valid message ID.",
    );
  }

  return {
    reportId: row.report_id,
    pdfStatus: "queued",
    queueMessageId,
    alreadyQueued: row.already_queued,
  };
}

function mapQueueError(databaseMessage: string): Error {
  if (databaseMessage.includes("REPORT_NOT_FOUND")) {
    return new Error("REPORT_NOT_FOUND");
  }

  if (databaseMessage.includes("PDF_ALREADY_GENERATING")) {
    return new Error("PDF_ALREADY_GENERATING");
  }

  if (databaseMessage.includes("PDF_ALREADY_READY")) {
    return new Error("PDF_ALREADY_READY");
  }

  if (databaseMessage.includes("QUEUE_MESSAGE_CREATION_FAILED")) {
    return new Error("QUEUE_MESSAGE_CREATION_FAILED");
  }

  console.error("Unexpected report PDF queue database error:", databaseMessage);

  return new Error("REPORT_PDF_QUEUE_FAILED");
}
