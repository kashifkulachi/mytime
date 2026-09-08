// import "server-only";

// import { createSupabaseAdminClient } from "@/lib/supabase/admin";
// import { acknowledgeReportPdfJob } from "@/services/queue/acknowledgeReportPdfJob";
// import { claimReportPdf } from "@/services/queue/claimReportPdf";
// import {
//   readReportPdfJobs,
//   type ReportPdfQueueJob,
// } from "@/services/queue/readReportPdfJobs";
// import { generateAndStoreReportPdf } from "@/lib/pdf-service/generateAndStoreReportPdf";

// const DEFAULT_BATCH_SIZE = 1;

// /**
//  * Maximum number of deliveries for one queue message.
//  *
//  * pgmq increments read_ct whenever the message is read.
//  */
// const MAX_GENERATION_ATTEMPTS = 3;

// export interface ProcessReportPdfJobsOptions {
//   batchSize?: number;
// }

// export interface ProcessedReportPdfJob {
//   messageId: number;
//   reportId: string;
//   status: "completed" | "retry_scheduled" | "failed" | "discarded";
//   attempt: number;
//   error?: string;
// }

// export interface ProcessReportPdfJobsResult {
//   jobsRead: number;
//   completed: number;
//   retryScheduled: number;
//   failed: number;
//   discarded: number;
//   jobs: ProcessedReportPdfJob[];
// }

// interface ReportQueueState {
//   id: string;
//   pdfStatus: string;
//   pdfQueueMessageId: number | null;
// }

// /**
//  * Process one small batch of PDF jobs.
//  *
//  * The Vercel worker route is responsible for repeatedly calling
//  * this function while enough execution time remains.
//  */
// export async function processReportPdfJobs({
//   batchSize = DEFAULT_BATCH_SIZE,
// }: ProcessReportPdfJobsOptions = {}): Promise<ProcessReportPdfJobsResult> {
//   const jobs = await readReportPdfJobs({
//     batchSize,
//   });

//   const results: ProcessedReportPdfJob[] = [];

//   /**
//    * Sequential processing is intentional.
//    *
//    * Puppeteer/Chromium is memory intensive, so we do not generate
//    * several PDFs concurrently inside one worker invocation.
//    */
//   for (const job of jobs) {
//     const result = await processSingleReportPdfJob(job);

//     results.push(result);
//   }

//   return {
//     jobsRead: jobs.length,

//     completed: results.filter((job) => job.status === "completed").length,

//     retryScheduled: results.filter((job) => job.status === "retry_scheduled")
//       .length,

//     failed: results.filter((job) => job.status === "failed").length,

//     discarded: results.filter((job) => job.status === "discarded").length,

//     jobs: results,
//   };
// }

// async function processSingleReportPdfJob(
//   job: ReportPdfQueueJob,
// ): Promise<ProcessedReportPdfJob> {
//   const { messageId, readCount, payload } = job;

//   const { reportId } = payload;

//   console.log(
//     `[PDF Worker] Processing report ${reportId}, queue message ${messageId}, delivery ${readCount}.`,
//   );

//   /**
//    * ----------------------------------------------------------
//    * 1. Retry limit
//    * ----------------------------------------------------------
//    *
//    * Before marking anything failed, check whether this queue
//    * message belongs to a report that is ALREADY ready.
//    *
//    * This protects us from:
//    *
//    * PDF succeeds
//    * → report becomes ready
//    * → queue archive fails
//    * → message appears again
//    * → read_ct eventually exceeds retry limit
//    *
//    * A ready report must never become failed because of an
//    * acknowledgement problem.
//    */
//   if (readCount > MAX_GENERATION_ATTEMPTS) {
//     const alreadyCompleted = await acknowledgeIfReportAlreadyReady({
//       reportId,
//       messageId,
//       readCount,
//     });

//     if (alreadyCompleted) {
//       return alreadyCompleted;
//     }

//     await markReportAsFinalFailure({
//       reportId,
//       messageId,
//       error: "PDF generation exceeded the maximum retry attempts.",
//     });

//     await safelyAcknowledgeMessage(messageId);

//     return {
//       messageId,
//       reportId,
//       status: "failed",
//       attempt: readCount,
//       error: "Maximum PDF generation attempts exceeded.",
//     };
//   }

//   /**
//    * ----------------------------------------------------------
//    * 2. Atomically claim report
//    * ----------------------------------------------------------
//    *
//    * Normal:
//    *
//    * queued → generating
//    *
//    * Hardened SQL also allows stale "generating" recovery for
//    * the same queue message.
//    */
//   try {
//     await claimReportPdf({
//       reportId,
//       queueMessageId: messageId,
//     });
//   } catch (error) {
//     return handleClaimFailure(job, error);
//   }

//   /**
//    * ----------------------------------------------------------
//    * 3. Generate + upload + mark ready
//    * ----------------------------------------------------------
//    */
//   try {
//     await generateAndStoreReportPdf({
//       reportId,
//     });
//   } catch (error) {
//     const generationError = normalizeError(error);

//     console.error(
//       `[PDF Worker] Generation failed for report ${reportId} on attempt ${readCount}:`,
//       generationError,
//     );

//     if (readCount < MAX_GENERATION_ATTEMPTS) {
//       await prepareReportForRetry({
//         reportId,
//         messageId,
//         error: generationError.message,
//       });

//       /**
//        * Do NOT archive the queue message.
//        *
//        * pgmq will make the same message visible again after its
//        * visibility timeout.
//        */
//       return {
//         messageId,
//         reportId,
//         status: "retry_scheduled",
//         attempt: readCount,
//         error: generationError.message,
//       };
//     }

//     await markReportAsFinalFailure({
//       reportId,
//       messageId,
//       error: generationError.message,
//     });

//     await safelyAcknowledgeMessage(messageId);

//     return {
//       messageId,
//       reportId,
//       status: "failed",
//       attempt: readCount,
//       error: generationError.message,
//     };
//   }

//   /**
//    * ----------------------------------------------------------
//    * 4. Generation succeeded
//    * ----------------------------------------------------------
//    *
//    * generateAndStoreReportPdf() has already changed:
//    *
//    * generating → ready
//    *
//    * Archive the queue message.
//    */
//   await acknowledgeReportPdfJob({
//     messageId,
//   });

//   console.log(`[PDF Worker] Report ${reportId} completed successfully.`);

//   return {
//     messageId,
//     reportId,
//     status: "completed",
//     attempt: readCount,
//   };
// }

// async function handleClaimFailure(
//   job: ReportPdfQueueJob,
//   error: unknown,
// ): Promise<ProcessedReportPdfJob> {
//   const claimError = normalizeError(error);

//   const {
//     messageId,
//     readCount,
//     payload: { reportId },
//   } = job;

//   /**
//    * ----------------------------------------------------------
//    * Report deleted
//    * ----------------------------------------------------------
//    */
//   if (claimError.message === "REPORT_NOT_FOUND") {
//     console.warn(
//       `[PDF Worker] Report ${reportId} no longer exists. Archiving queue message ${messageId}.`,
//     );

//     await safelyAcknowledgeMessage(messageId);

//     return {
//       messageId,
//       reportId,
//       status: "discarded",
//       attempt: readCount,
//       error: "REPORT_NOT_FOUND",
//     };
//   }

//   /**
//    * ----------------------------------------------------------
//    * Old queue message
//    * ----------------------------------------------------------
//    */
//   if (claimError.message === "STALE_QUEUE_MESSAGE") {
//     console.warn(
//       `[PDF Worker] Stale queue message ${messageId} rejected for report ${reportId}.`,
//     );

//     await safelyAcknowledgeMessage(messageId);

//     return {
//       messageId,
//       reportId,
//       status: "discarded",
//       attempt: readCount,
//       error: "STALE_QUEUE_MESSAGE",
//     };
//   }

//   /**
//    * ----------------------------------------------------------
//    * Missing DB queue ownership
//    * ----------------------------------------------------------
//    */
//   if (claimError.message === "REPORT_QUEUE_MESSAGE_MISSING") {
//     console.error(
//       `[PDF Worker] Report ${reportId} has no associated queue message.`,
//     );

//     await safelyAcknowledgeMessage(messageId);

//     return {
//       messageId,
//       reportId,
//       status: "discarded",
//       attempt: readCount,
//       error: "REPORT_QUEUE_MESSAGE_MISSING",
//     };
//   }

//   /**
//    * ----------------------------------------------------------
//    * Report already READY
//    * ----------------------------------------------------------
//    *
//    * This is the important acknowledgement-recovery path.
//    *
//    * Example:
//    *
//    * PDF generated successfully
//    * → DB = ready
//    * → queue archive failed
//    * → same message becomes visible again
//    * → claim rejects because status isn't queued
//    *
//    * We inspect the DB and, if this SAME queue message belongs
//    * to an already-ready report, archive it and finish.
//    */
//   if (isReportNotQueuedError(claimError)) {
//     const alreadyCompleted = await acknowledgeIfReportAlreadyReady({
//       reportId,
//       messageId,
//       readCount,
//     });

//     if (alreadyCompleted) {
//       return alreadyCompleted;
//     }

//     /**
//      * A non-ready REPORT_NOT_QUEUED case should remain
//      * unacknowledged.
//      *
//      * In particular, the report could still be generating.
//      * Our hardened SQL decides when a generating attempt is
//      * stale enough to reclaim.
//      */
//     console.warn(
//       `[PDF Worker] Report ${reportId} is not currently claimable. Queue message ${messageId} will remain unacknowledged.`,
//     );

//     return {
//       messageId,
//       reportId,
//       status: "retry_scheduled",
//       attempt: readCount,
//       error: claimError.message,
//     };
//   }

//   console.error(`[PDF Worker] Unable to claim report ${reportId}:`, claimError);

//   /**
//    * Unknown infrastructure/database errors should not destroy
//    * the message.
//    */
//   return {
//     messageId,
//     reportId,
//     status: "retry_scheduled",
//     attempt: readCount,
//     error: claimError.message,
//   };
// }

// /**
//  * Checks whether a redelivered queue message belongs to a report
//  * whose PDF is already successfully generated.
//  *
//  * If:
//  *
//  * - report exists
//  * - report status = ready
//  * - report's queue message ID matches this exact message
//  *
//  * then generation is already complete and the only remaining
//  * task is to archive the stale queue message.
//  */
// async function acknowledgeIfReportAlreadyReady({
//   reportId,
//   messageId,
//   readCount,
// }: {
//   reportId: string;
//   messageId: number;
//   readCount: number;
// }): Promise<ProcessedReportPdfJob | null> {
//   const report = await getReportQueueState(reportId);

//   if (!report) {
//     return null;
//   }

//   if (report.pdfStatus !== "ready") {
//     return null;
//   }

//   /**
//    * Never archive a message based only on report status.
//    *
//    * It must still be the exact queue message associated with
//    * this generation request.
//    */
//   if (report.pdfQueueMessageId !== messageId) {
//     return null;
//   }

//   console.warn(
//     `[PDF Worker] Report ${reportId} is already ready. Archiving leftover queue message ${messageId} without regenerating the PDF.`,
//   );

//   await safelyAcknowledgeMessage(messageId);

//   return {
//     messageId,
//     reportId,
//     status: "completed",
//     attempt: readCount,
//   };
// }

// async function getReportQueueState(
//   reportId: string,
// ): Promise<ReportQueueState | null> {
//   const supabase = createSupabaseAdminClient();

//   const { data, error } = await supabase
//     .from("reports")
//     .select("id, pdf_status, pdf_queue_message_id")
//     .eq("id", reportId)
//     .maybeSingle();

//   if (error) {
//     console.error(
//       `[PDF Worker] Unable to inspect queue state for report ${reportId}:`,
//       error,
//     );

//     throw new Error("REPORT_QUEUE_STATE_READ_FAILED");
//   }

//   if (!data) {
//     return null;
//   }

//   return {
//     id: data.id,
//     pdfStatus: data.pdf_status,
//     pdfQueueMessageId: normalizeQueueMessageId(data.pdf_queue_message_id),
//   };
// }

// interface PrepareReportForRetryInput {
//   reportId: string;
//   messageId: number;
//   error: string;
// }

// async function prepareReportForRetry({
//   reportId,
//   messageId,
//   error,
// }: PrepareReportForRetryInput): Promise<void> {
//   const supabase = createSupabaseAdminClient();

//   const sanitizedError = sanitizeErrorMessage(error);

//   const { data, error: updateError } = await supabase
//     .from("reports")
//     .update({
//       pdf_status: "queued",
//       pdf_error: sanitizedError,
//       pdf_generation_started_at: null,
//       updated_at: new Date().toISOString(),
//     })
//     .eq("id", reportId)
//     .eq("pdf_queue_message_id", messageId)
//     .select("id")
//     .maybeSingle();

//   if (updateError) {
//     console.error(
//       `[PDF Worker] Failed to prepare report ${reportId} for retry:`,
//       updateError,
//     );

//     throw new Error("REPORT_PDF_RETRY_PREPARATION_FAILED");
//   }

//   if (!data) {
//     throw new Error("REPORT_PDF_RETRY_STATE_MISMATCH");
//   }

//   console.warn(
//     `[PDF Worker] Report ${reportId} returned to queued state for another attempt.`,
//   );
// }

// interface MarkReportAsFinalFailureInput {
//   reportId: string;
//   messageId: number;
//   error: string;
// }

// async function markReportAsFinalFailure({
//   reportId,
//   messageId,
//   error,
// }: MarkReportAsFinalFailureInput): Promise<void> {
//   const supabase = createSupabaseAdminClient();

//   /**
//    * Never overwrite a successfully completed report.
//    */
//   const { data, error: updateError } = await supabase
//     .from("reports")
//     .update({
//       pdf_status: "failed",
//       pdf_error: sanitizeErrorMessage(error),
//       pdf_generation_started_at: null,
//       updated_at: new Date().toISOString(),
//     })
//     .eq("id", reportId)
//     .eq("pdf_queue_message_id", messageId)
//     .neq("pdf_status", "ready")
//     .select("id")
//     .maybeSingle();

//   if (updateError) {
//     console.error(
//       `[PDF Worker] Failed to mark report ${reportId} as final failure:`,
//       updateError,
//     );

//     throw new Error("REPORT_PDF_FINAL_FAILURE_UPDATE_FAILED");
//   }

//   if (!data) {
//     console.warn(
//       `[PDF Worker] Final failure update skipped for report ${reportId}. The report may already be ready or no longer belong to queue message ${messageId}.`,
//     );
//   }
// }

// /**
//  * Used only when intentionally finalizing/discarding a queue
//  * message.
//  */
// async function safelyAcknowledgeMessage(messageId: number): Promise<void> {
//   try {
//     await acknowledgeReportPdfJob({
//       messageId,
//     });
//   } catch (error) {
//     console.error(
//       `[PDF Worker] Failed to archive queue message ${messageId}:`,
//       error,
//     );

//     throw error;
//   }
// }

// function isReportNotQueuedError(error: Error): boolean {
//   return (
//     error.message === "REPORT_NOT_QUEUED" ||
//     error.message.startsWith("REPORT_NOT_QUEUED:")
//   );
// }

// function normalizeQueueMessageId(value: unknown): number | null {
//   if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
//     return value;
//   }

//   if (typeof value === "string") {
//     const parsed = Number(value);

//     if (Number.isSafeInteger(parsed) && parsed > 0) {
//       return parsed;
//     }
//   }

//   return null;
// }

// function normalizeError(error: unknown): Error {
//   if (error instanceof Error) {
//     return error;
//   }

//   if (typeof error === "string") {
//     return new Error(error);
//   }

//   return new Error("Unknown PDF worker error.");
// }

// function sanitizeErrorMessage(error: string): string {
//   const normalized = error.trim() || "PDF generation failed.";

//   const MAX_LENGTH = 500;

//   if (normalized.length <= MAX_LENGTH) {
//     return normalized;
//   }

//   return `${normalized.slice(0, MAX_LENGTH)}...`;
// }

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { acknowledgeReportPdfJob } from "@/services/queue/acknowledgeReportPdfJob";
import { claimReportPdf } from "@/services/queue/claimReportPdf";
import {
  readReportPdfJobs,
  type ReportPdfQueueJob,
} from "@/services/queue/readReportPdfJobs";
import { generateAndStoreReportPdf } from "@/lib/pdf-service/generateAndStoreReportPdf";

const DEFAULT_BATCH_SIZE = 1;

export interface ProcessReportPdfJobsOptions {
  batchSize?: number;
}

export interface ProcessedReportPdfJob {
  messageId: number;
  reportId: string;
  status: "completed" | "retry_scheduled" | "failed" | "discarded";
  attempt: number;
  error?: string;
}

export interface ProcessReportPdfJobsResult {
  jobsRead: number;
  completed: number;
  retryScheduled: number;
  failed: number;
  discarded: number;
  jobs: ProcessedReportPdfJob[];
}

interface ReportQueueState {
  id: string;
  pdfStatus: string;
  pdfQueueMessageId: number | null;
}

/**
 * Process one small batch of report PDF jobs.
 *
 * Important retry policy:
 *
 * 1. A normal caught generation failure is NOT automatically retried.
 *    The report becomes "failed" and the user may explicitly regenerate it.
 *
 * 2. Infrastructure crashes/timeouts are different. If the worker disappears
 *    before acknowledging the message, pgmq keeps the message and our stale
 *    generation recovery can claim it later.
 *
 * This gives us both:
 *
 * - predictable user-facing failures
 * - infrastructure-level crash recovery
 */
export async function processReportPdfJobs({
  batchSize = DEFAULT_BATCH_SIZE,
}: ProcessReportPdfJobsOptions = {}): Promise<ProcessReportPdfJobsResult> {
  const jobs = await readReportPdfJobs({
    batchSize,
  });

  const results: ProcessedReportPdfJob[] = [];

  /**
   * Chromium is memory intensive.
   *
   * Keep generation sequential inside a worker invocation.
   */
  for (const job of jobs) {
    const result = await processSingleReportPdfJob(job);

    results.push(result);
  }

  return {
    jobsRead: jobs.length,

    completed: results.filter((job) => job.status === "completed").length,

    retryScheduled: results.filter((job) => job.status === "retry_scheduled")
      .length,

    failed: results.filter((job) => job.status === "failed").length,

    discarded: results.filter((job) => job.status === "discarded").length,

    jobs: results,
  };
}

async function processSingleReportPdfJob(
  job: ReportPdfQueueJob,
): Promise<ProcessedReportPdfJob> {
  const {
    messageId,
    readCount,
    payload: { reportId },
  } = job;

  console.log(
    `[PDF Worker] Processing report ${reportId}, queue message ${messageId}, delivery ${readCount}.`,
  );

  /**
   * ----------------------------------------------------------
   * 1. Atomically claim the report.
   * ----------------------------------------------------------
   *
   * Normal transition:
   *
   * queued → generating
   *
   * The hardened SQL claim function also supports reclaiming a
   * stale "generating" report after a worker crash, provided this
   * exact queue message still owns the generation request.
   */
  try {
    await claimReportPdf({
      reportId,
      queueMessageId: messageId,
    });
  } catch (error) {
    return handleClaimFailure(job, error);
  }

  /**
   * ----------------------------------------------------------
   * 2. Generate PDF + upload + update report.
   * ----------------------------------------------------------
   */
  try {
    await generateAndStoreReportPdf({
      reportId,
    });
  } catch (error) {
    const generationError = normalizeError(error);

    console.error(
      `[PDF Worker] PDF generation failed for report ${reportId}:`,
      generationError,
    );

    /**
     * This was a KNOWN/CATCHABLE generation failure.
     *
     * Do not automatically send the report back to "queued".
     *
     * Instead:
     *
     * generating → failed
     *
     * and archive this queue message.
     *
     * The dashboard can now clearly show the failure and let
     * the user explicitly request regeneration.
     */
    await markReportAsGenerationFailure({
      reportId,
      messageId,
      error: generationError.message,
    });

    await safelyAcknowledgeMessage(messageId);

    console.warn(
      `[PDF Worker] Report ${reportId} failed. Queue message ${messageId} archived. User regeneration is required.`,
    );

    return {
      messageId,
      reportId,
      status: "failed",
      attempt: readCount,
      error: generationError.message,
    };
  }

  /**
   * ----------------------------------------------------------
   * 3. Generation succeeded.
   * ----------------------------------------------------------
   *
   * generateAndStoreReportPdf() has already persisted:
   *
   * generating → ready
   *
   * The only remaining operation is archiving this queue message.
   */
  await acknowledgeReportPdfJob({
    messageId,
  });

  console.log(`[PDF Worker] Report ${reportId} completed successfully.`);

  return {
    messageId,
    reportId,
    status: "completed",
    attempt: readCount,
  };
}

async function handleClaimFailure(
  job: ReportPdfQueueJob,
  error: unknown,
): Promise<ProcessedReportPdfJob> {
  const claimError = normalizeError(error);

  const {
    messageId,
    readCount,
    payload: { reportId },
  } = job;

  /**
   * Report was deleted.
   *
   * There is nothing left to generate.
   */
  if (claimError.message === "REPORT_NOT_FOUND") {
    console.warn(
      `[PDF Worker] Report ${reportId} no longer exists. Archiving queue message ${messageId}.`,
    );

    await safelyAcknowledgeMessage(messageId);

    return {
      messageId,
      reportId,
      status: "discarded",
      attempt: readCount,
      error: "REPORT_NOT_FOUND",
    };
  }

  /**
   * This message belongs to an older generation request.
   */
  if (claimError.message === "STALE_QUEUE_MESSAGE") {
    console.warn(
      `[PDF Worker] Stale queue message ${messageId} rejected for report ${reportId}.`,
    );

    await safelyAcknowledgeMessage(messageId);

    return {
      messageId,
      reportId,
      status: "discarded",
      attempt: readCount,
      error: "STALE_QUEUE_MESSAGE",
    };
  }

  /**
   * DB/queue ownership no longer agrees.
   */
  if (claimError.message === "REPORT_QUEUE_MESSAGE_MISSING") {
    console.error(
      `[PDF Worker] Report ${reportId} has no associated queue message.`,
    );

    await safelyAcknowledgeMessage(messageId);

    return {
      messageId,
      reportId,
      status: "discarded",
      attempt: readCount,
      error: "REPORT_QUEUE_MESSAGE_MISSING",
    };
  }

  /**
   * REPORT_NOT_QUEUED can mean several things:
   *
   * ready
   * generating
   * failed
   * etc.
   */
  if (isReportNotQueuedError(claimError)) {
    /**
     * First protect the successful-generation/failed-ack case.
     *
     * If generation already succeeded and the DB is "ready",
     * this leftover queue message only needs to be archived.
     */
    const alreadyCompleted = await acknowledgeIfReportAlreadyReady({
      reportId,
      messageId,
      readCount,
    });

    if (alreadyCompleted) {
      return alreadyCompleted;
    }

    const state = await getReportQueueState(reportId);

    /**
     * If this report is already failed, generation has already
     * terminated intentionally.
     *
     * There is no reason to keep redelivering the same message.
     */
    if (
      state &&
      state.pdfStatus === "failed" &&
      state.pdfQueueMessageId === messageId
    ) {
      console.warn(
        `[PDF Worker] Report ${reportId} is already failed. Archiving leftover queue message ${messageId}.`,
      );

      await safelyAcknowledgeMessage(messageId);

      return {
        messageId,
        reportId,
        status: "discarded",
        attempt: readCount,
        error: claimError.message,
      };
    }

    /**
     * Do not archive a generating report here.
     *
     * A previous worker may have crashed.
     *
     * The hardened SQL claim function determines when that
     * generation becomes stale enough to reclaim.
     */
    console.warn(
      `[PDF Worker] Report ${reportId} is not currently claimable. Queue message ${messageId} remains unacknowledged for infrastructure recovery.`,
    );

    return {
      messageId,
      reportId,
      status: "retry_scheduled",
      attempt: readCount,
      error: claimError.message,
    };
  }

  /**
   * Unknown DB/infrastructure errors are intentionally not
   * acknowledged.
   *
   * Losing the message would be worse than allowing pgmq to
   * expose it again later.
   */
  console.error(`[PDF Worker] Unable to claim report ${reportId}:`, claimError);

  return {
    messageId,
    reportId,
    status: "retry_scheduled",
    attempt: readCount,
    error: claimError.message,
  };
}

/**
 * Protect against:
 *
 * PDF succeeded
 * → report became ready
 * → queue acknowledgement failed
 * → same message was redelivered
 *
 * In that situation we archive only the queue message.
 * We never regenerate or change ready → failed.
 */
async function acknowledgeIfReportAlreadyReady({
  reportId,
  messageId,
  readCount,
}: {
  reportId: string;
  messageId: number;
  readCount: number;
}): Promise<ProcessedReportPdfJob | null> {
  const report = await getReportQueueState(reportId);

  if (!report) {
    return null;
  }

  if (report.pdfStatus !== "ready") {
    return null;
  }

  if (report.pdfQueueMessageId !== messageId) {
    return null;
  }

  console.warn(
    `[PDF Worker] Report ${reportId} is already ready. Archiving leftover queue message ${messageId}.`,
  );

  await safelyAcknowledgeMessage(messageId);

  return {
    messageId,
    reportId,
    status: "completed",
    attempt: readCount,
  };
}

async function getReportQueueState(
  reportId: string,
): Promise<ReportQueueState | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, pdf_status, pdf_queue_message_id")
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    console.error(
      `[PDF Worker] Unable to inspect queue state for report ${reportId}:`,
      error,
    );

    throw new Error("REPORT_QUEUE_STATE_READ_FAILED");
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    pdfStatus: data.pdf_status,
    pdfQueueMessageId: normalizeQueueMessageId(data.pdf_queue_message_id),
  };
}

interface MarkReportAsGenerationFailureInput {
  reportId: string;
  messageId: number;
  error: string;
}

/**
 * Persist a normal/caught PDF generation failure.
 *
 * This state is intentionally user-actionable:
 *
 * generating → failed
 *
 * A new generation should only begin after the user explicitly
 * requests regeneration.
 */
async function markReportAsGenerationFailure({
  reportId,
  messageId,
  error,
}: MarkReportAsGenerationFailureInput): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data, error: updateError } = await supabase
    .from("reports")
    .update({
      pdf_status: "failed",
      pdf_error: sanitizeErrorMessage(error),
      pdf_generation_started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("pdf_queue_message_id", messageId)
    .eq("pdf_status", "generating")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error(
      `[PDF Worker] Failed to persist generation failure for report ${reportId}:`,
      updateError,
    );

    throw new Error("REPORT_PDF_FAILURE_UPDATE_FAILED");
  }

  if (!data) {
    throw new Error("REPORT_PDF_FAILURE_STATE_MISMATCH");
  }
}

async function safelyAcknowledgeMessage(messageId: number): Promise<void> {
  try {
    await acknowledgeReportPdfJob({
      messageId,
    });
  } catch (error) {
    console.error(
      `[PDF Worker] Failed to archive queue message ${messageId}:`,
      error,
    );

    throw error;
  }
}

function isReportNotQueuedError(error: Error): boolean {
  return (
    error.message === "REPORT_NOT_QUEUED" ||
    error.message.startsWith("REPORT_NOT_QUEUED:")
  );
}

function normalizeQueueMessageId(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown PDF worker error.");
}

function sanitizeErrorMessage(error: string): string {
  const normalized = error.trim() || "PDF generation failed.";

  const MAX_LENGTH = 500;

  if (normalized.length <= MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_LENGTH)}...`;
}
