import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AcknowledgeReportPdfJobInput {
  messageId: number;
}

export interface AcknowledgeReportPdfJobResult {
  messageId: number;
  archived: true;
}

interface ArchiveReportPdfJobRpcRow {
  message_id: number | string;
  archived: boolean;
}

export async function acknowledgeReportPdfJob({
  messageId,
}: AcknowledgeReportPdfJobInput): Promise<AcknowledgeReportPdfJobResult> {
  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw new Error("A valid queue message ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc(
    "archive_report_pdf_generation_job",
    {
      p_message_id: messageId,
    },
  );

  if (error) {
    console.error(
      `Failed to archive report PDF queue message ${messageId}:`,
      error,
    );

    throw new Error("REPORT_PDF_QUEUE_ACKNOWLEDGEMENT_FAILED");
  }

  const rows = data as ArchiveReportPdfJobRpcRow[] | null;

  if (!rows || rows.length === 0) {
    throw new Error("The queue did not return an acknowledgement result.");
  }

  const row = rows[0];

  const returnedMessageId = Number(row.message_id);

  if (!Number.isInteger(returnedMessageId) || returnedMessageId !== messageId) {
    throw new Error(
      "The queue acknowledgement returned an unexpected message ID.",
    );
  }

  if (row.archived !== true) {
    throw new Error("The PDF queue message was not archived.");
  }

  return {
    messageId: returnedMessageId,
    archived: true,
  };
}
