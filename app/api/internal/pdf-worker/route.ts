// import { NextResponse } from "next/server";

// import { processReportPdfJobs } from "@/services/queue/processReportPdfJobs";

// export const runtime = "nodejs";

// /**
//  * Maximum function duration configured for this Vercel route.
//  *
//  * We intentionally stop processing BEFORE reaching this limit.
//  */
// export const maxDuration = 300;

// /**
//  * Never read several queue jobs up front.
//  *
//  * One job is claimed/read at a time so we only make work invisible
//  * when we actually intend to process it.
//  */
// const JOB_BATCH_SIZE = 1;

// /**
//  * Stop accepting new work before the Vercel function limit.
//  *
//  * maxDuration = 300s
//  * worker processing budget = 250s
//  *
//  * This leaves roughly 50 seconds for:
//  * - cleanup
//  * - Supabase updates
//  * - queue acknowledgement
//  * - network latency
//  * - function shutdown
//  */
// const WORKER_TIME_BUDGET_MS = 250_000;

// /**
//  * Even if we technically still have time remaining, don't begin
//  * another Puppeteer job when the remaining budget is too small.
//  */
// const MINIMUM_TIME_TO_START_NEXT_JOB_MS = 60_000;

// /**
//  * Additional protection against an unexpectedly large number of
//  * very fast jobs being processed in a single invocation.
//  *
//  * This is not the queue batch size.
//  * Jobs are still fetched one at a time.
//  */
// const MAX_JOBS_PER_INVOCATION = 10;

// export async function GET(request: Request): Promise<Response> {
//   const authorization = request.headers.get("authorization");

//   const cronSecret = process.env.CRON_SECRET;

//   if (!cronSecret) {
//     console.error("[PDF Worker] CRON_SECRET is not configured.");

//     return NextResponse.json(
//       {
//         success: false,
//         code: "CRON_SECRET_NOT_CONFIGURED",
//         message: "PDF worker authentication is not configured.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }

//   if (authorization !== `Bearer ${cronSecret}`) {
//     return NextResponse.json(
//       {
//         success: false,
//         code: "UNAUTHORIZED",
//         message: "Unauthorized.",
//       },
//       {
//         status: 401,
//       },
//     );
//   }

//   const invocationStartedAt = Date.now();

//   let jobsRead = 0;
//   let completed = 0;
//   let retryScheduled = 0;
//   let failed = 0;
//   let discarded = 0;

//   const jobs: Array<{
//     messageId: number;
//     reportId: string;
//     attempt: number | null;
//     status: string;
//     durationMs: number;
//     hasError: boolean;
//   }> = [];

//   try {
//     while (true) {
//       const elapsedMs = Date.now() - invocationStartedAt;
//       const remainingBudgetMs = WORKER_TIME_BUDGET_MS - elapsedMs;

//       /**
//        * We have already processed at least one job.
//        *
//        * Don't start another expensive Puppeteer operation unless
//        * there is enough safe execution time remaining.
//        */
//       if (
//         jobsRead > 0 &&
//         remainingBudgetMs < MINIMUM_TIME_TO_START_NEXT_JOB_MS
//       ) {
//         console.log("[PDF Worker] Stopping because time budget is low.", {
//           elapsedMs,
//           remainingBudgetMs,
//           jobsRead,
//         });

//         break;
//       }

//       if (jobsRead >= MAX_JOBS_PER_INVOCATION) {
//         console.log("[PDF Worker] Maximum jobs per invocation reached.", {
//           jobsRead,
//         });

//         break;
//       }

//       const jobStartedAt = Date.now();

//       /**
//        * Read/process exactly ONE queue message.
//        */
//       const result = await processReportPdfJobs({
//         batchSize: JOB_BATCH_SIZE,
//       });

//       /**
//        * Queue is currently empty.
//        *
//        * There is nothing else for this invocation to do.
//        */
//       if (result.jobsRead === 0) {
//         break;
//       }

//       const jobDurationMs = Date.now() - jobStartedAt;

//       jobsRead += result.jobsRead;
//       completed += result.completed;
//       retryScheduled += result.retryScheduled;
//       failed += result.failed;
//       discarded += result.discarded;

//       for (const job of result.jobs) {
//         jobs.push({
//           messageId: job.messageId,
//           reportId: job.reportId,
//           attempt: job.attempt,
//           status: job.status,
//           durationMs: jobDurationMs,
//           hasError: Boolean(job.error),
//         });
//       }

//       console.log("[PDF Worker] PDF queue job processed.", {
//         jobDurationMs,
//         totalJobsProcessed: jobsRead,
//         remainingBudgetMs:
//           WORKER_TIME_BUDGET_MS - (Date.now() - invocationStartedAt),
//       });

//       /**
//        * Loop again.
//        *
//        * The next iteration checks the time budget BEFORE reading
//        * another queue message.
//        */
//     }

//     const durationMs = Date.now() - invocationStartedAt;

//     console.log("[PDF Worker] Invocation completed.", {
//       jobsRead,
//       completed,
//       retryScheduled,
//       failed,
//       discarded,
//       durationMs,
//     });

//     return NextResponse.json(
//       {
//         success: true,

//         message:
//           jobsRead === 0
//             ? "No PDF generation jobs are currently available."
//             : "PDF worker invocation completed.",

//         worker: {
//           jobsRead,
//           completed,
//           retryScheduled,
//           failed,
//           discarded,
//           durationMs,

//           stoppedBecauseTimeBudgetReached:
//             durationMs >=
//             WORKER_TIME_BUDGET_MS - MINIMUM_TIME_TO_START_NEXT_JOB_MS,

//           jobs,
//         },
//       },
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     const normalizedError = normalizeError(error);

//     const durationMs = Date.now() - invocationStartedAt;

//     console.error("[PDF Worker] Invocation failed:", {
//       error: normalizedError.message,
//       jobsRead,
//       completed,
//       retryScheduled,
//       failed,
//       discarded,
//       durationMs,
//     });

//     return NextResponse.json(
//       {
//         success: false,
//         code: "PDF_WORKER_FAILED",
//         message: "The PDF worker encountered an unexpected error.",

//         worker: {
//           jobsRead,
//           completed,
//           retryScheduled,
//           failed,
//           discarded,
//           durationMs,
//         },
//       },
//       {
//         status: 500,
//       },
//     );
//   }
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

import { NextResponse } from "next/server";

import {
  acquireReportPdfWorkerLease,
  releaseReportPdfWorkerLease,
} from "@/services/queue/reportPdfWorkerLease";

import { processReportPdfJobs } from "@/services/queue/processReportPdfJobs";

export const runtime = "nodejs";

/**
 * Maximum duration Vercel may allow this function to execute.
 *
 * The worker intentionally stops accepting NEW PDF jobs well
 * before reaching this limit.
 */
export const maxDuration = 300;

/**
 * Database worker lease duration.
 *
 * This must be longer than our normal processing budget.
 */
const WORKER_LEASE_SECONDS = 300;

/**
 * How long this invocation is allowed to actively drain the queue.
 *
 * We stop before maxDuration so there is time left for:
 *
 * - queue acknowledgement
 * - Supabase updates
 * - lease release
 * - HTTP response
 */
const WORKER_PROCESSING_BUDGET_MS = 240_000;

/**
 * Never read several jobs ahead of time.
 *
 * We fetch/process exactly one queue message, then decide whether
 * there is enough time to start another one.
 */
const JOB_BATCH_SIZE = 1;

/**
 * We don't start another potentially expensive Puppeteer job when
 * too little safe execution time remains.
 *
 * IMPORTANT:
 *
 * This does NOT delay the FIRST job.
 *
 * The first queued report starts immediately after the worker
 * acquires the lease.
 */
const MINIMUM_TIME_TO_START_ANOTHER_JOB_MS = 60_000;

/**
 * Secondary safety limit.
 *
 * Normally the time budget will stop us first, but this prevents
 * an unexpected loop from processing an unlimited number of jobs.
 */
const MAX_JOBS_PER_INVOCATION = 10;

interface ProcessedWorkerJob {
  messageId: number;
  reportId: string;
  attempt: number | null;
  status: string;
  durationMs: number;
  hasError: boolean;
}

export async function GET(request: Request): Promise<Response> {
  /*
   * ----------------------------------------------------------
   * 1. Authenticate internal worker request
   * ----------------------------------------------------------
   */

  const authorization = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[PDF Worker] CRON_SECRET is not configured.");

    return NextResponse.json(
      {
        success: false,
        code: "CRON_SECRET_NOT_CONFIGURED",
        message: "PDF worker authentication is not configured.",
      },
      {
        status: 500,
      },
    );
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  const invocationStartedAt = Date.now();

  /*
   * ----------------------------------------------------------
   * 2. Acquire global PDF worker lease
   * ----------------------------------------------------------
   *
   * This is intentionally done BEFORE reading the queue.
   *
   * If another Vercel worker is already processing PDFs, this
   * invocation exits without touching any queue messages.
   */

  let leaseToken: string | null = null;

  try {
    const leaseResult = await acquireReportPdfWorkerLease(WORKER_LEASE_SECONDS);

    if (!leaseResult.acquired || !leaseResult.lease) {
      const durationMs = Date.now() - invocationStartedAt;

      console.log("[PDF Worker] Another worker already owns the lease.", {
        durationMs,
      });

      return NextResponse.json(
        {
          success: true,
          code: "PDF_WORKER_ALREADY_ACTIVE",
          message: "Another PDF worker is already processing the queue.",

          worker: {
            leaseAcquired: false,
            jobsRead: 0,
            completed: 0,
            retryScheduled: 0,
            failed: 0,
            discarded: 0,
            durationMs,
          },
        },
        {
          status: 200,
        },
      );
    }

    leaseToken = leaseResult.lease.token;

    console.log("[PDF Worker] Worker lease acquired.", {
      acquiredAt: leaseResult.lease.acquiredAt,

      expiresAt: leaseResult.lease.expiresAt,
    });
  } catch (error) {
    const normalizedError = normalizeError(error);

    console.error(
      "[PDF Worker] Failed to acquire worker lease:",
      normalizedError.message,
    );

    return NextResponse.json(
      {
        success: false,
        code: "PDF_WORKER_LEASE_ACQUIRE_FAILED",
        message: "Unable to acquire the PDF worker lease.",
      },
      {
        status: 500,
      },
    );
  }

  /*
   * ----------------------------------------------------------
   * 3. Drain queue sequentially
   * ----------------------------------------------------------
   */

  let jobsRead = 0;
  let completed = 0;
  let retryScheduled = 0;
  let failed = 0;
  let discarded = 0;

  const jobs: ProcessedWorkerJob[] = [];

  let stopReason: "queue_empty" | "time_budget" | "job_limit" | "worker_error" =
    "queue_empty";

  try {
    while (true) {
      const elapsedMs = Date.now() - invocationStartedAt;

      const remainingProcessingBudgetMs =
        WORKER_PROCESSING_BUDGET_MS - elapsedMs;

      /*
       * IMPORTANT:
       *
       * The FIRST job is not delayed by this check.
       *
       * Once we already processed at least one job, we decide
       * whether enough safe time remains to start another.
       */
      if (
        jobsRead > 0 &&
        remainingProcessingBudgetMs < MINIMUM_TIME_TO_START_ANOTHER_JOB_MS
      ) {
        stopReason = "time_budget";

        break;
      }

      if (jobsRead >= MAX_JOBS_PER_INVOCATION) {
        stopReason = "job_limit";

        console.log("[PDF Worker] Maximum jobs per invocation reached.", {
          jobsRead,
        });

        break;
      }

      /*
       * ------------------------------------------------------
       * Read and process exactly ONE queue job.
       * ------------------------------------------------------
       *
       * If this is a newly queued report and the queue was
       * previously empty, this happens immediately.
       *
       * processReportPdfJobs()
       *      ↓
       * readReportPdfJobs()
       *      ↓
       * claimReportPdf()
       *      ↓
       * reports.pdf_status = "generating"
       *      ↓
       * generateAndStoreReportPdf()
       */

      const jobStartedAt = Date.now();

      const result = await processReportPdfJobs({
        batchSize: JOB_BATCH_SIZE,
      });

      /*
       * Nothing available.
       *
       * Release the worker lease and exit normally.
       */
      if (result.jobsRead === 0) {
        stopReason = "queue_empty";

        console.log("[PDF Worker] Queue is empty.");

        break;
      }

      const jobDurationMs = Date.now() - jobStartedAt;

      jobsRead += result.jobsRead;

      completed += result.completed;

      retryScheduled += result.retryScheduled;

      failed += result.failed;

      discarded += result.discarded;

      for (const job of result.jobs) {
        jobs.push({
          messageId: job.messageId,
          reportId: job.reportId,
          attempt: job.attempt,
          status: job.status,
          durationMs: jobDurationMs,
          hasError: Boolean(job.error),
        });
      }

      console.log("[PDF Worker] Queue job processed.", {
        jobDurationMs,
        totalJobsProcessed: jobsRead,

        completed,
        retryScheduled,
        failed,
        discarded,

        remainingProcessingBudgetMs:
          WORKER_PROCESSING_BUDGET_MS - (Date.now() - invocationStartedAt),
      });

      /*
       * DO NOT return here.
       *
       * Loop around and check whether we have enough time
       * to immediately process another queued report.
       */
    }
  } catch (error) {
    stopReason = "worker_error";

    const normalizedError = normalizeError(error);

    console.error("[PDF Worker] Queue processing failed:", {
      error: normalizedError.message,

      jobsRead,
      completed,
      retryScheduled,
      failed,
      discarded,
    });

    /*
     * We intentionally continue into finally so the lease gets
     * released whenever this invocation still owns it.
     */

    return NextResponse.json(
      {
        success: false,
        code: "PDF_WORKER_FAILED",
        message: "The PDF worker encountered an unexpected error.",

        worker: {
          leaseAcquired: true,
          jobsRead,
          completed,
          retryScheduled,
          failed,
          discarded,

          durationMs: Date.now() - invocationStartedAt,
        },
      },
      {
        status: 500,
      },
    );
  } finally {
    /*
     * --------------------------------------------------------
     * 4. Release worker lease
     * --------------------------------------------------------
     *
     * This runs whether:
     *
     * - queue became empty
     * - time budget became low
     * - job limit was reached
     * - processing threw an exception
     */

    if (leaseToken) {
      try {
        const released = await releaseReportPdfWorkerLease(leaseToken);

        if (released) {
          console.log("[PDF Worker] Worker lease released.");
        } else {
          /*
           * Usually means the lease expired and another worker
           * acquired a newer lease before this invocation tried
           * to release its old one.
           *
           * The token protection prevents us from releasing
           * that newer worker's lease.
           */
          console.warn(
            "[PDF Worker] Worker lease was not released because this invocation no longer owns it.",
          );
        }
      } catch (releaseError) {
        console.error(
          "[PDF Worker] Failed to release worker lease:",
          normalizeError(releaseError).message,
        );

        /*
         * Do not replace the actual worker result with a lease
         * release error.
         *
         * The database lease has an expiry as a recovery
         * mechanism.
         */
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * 5. Successful invocation response
   * ----------------------------------------------------------
   */

  const durationMs = Date.now() - invocationStartedAt;

  // console.log("[PDF Worker] Invocation completed.", {
  //   stopReason,
  //   jobsRead,
  //   completed,
  //   retryScheduled,
  //   failed,
  //   discarded,
  //   durationMs,
  // });

  return NextResponse.json(
    {
      success: true,

      message:
        jobsRead === 0
          ? "No PDF generation jobs are currently available."
          : "PDF worker invocation completed.",

      worker: {
        leaseAcquired: true,

        stopReason,

        jobsRead,
        completed,
        retryScheduled,
        failed,
        discarded,

        durationMs,

        jobs,
      },
    },
    {
      status: 200,
    },
  );
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
