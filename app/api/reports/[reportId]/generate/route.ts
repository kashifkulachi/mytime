// // Before DOctor Patient has active relationship and requireReport Access hepler function

// import { after, NextResponse } from "next/server";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
// import { getReportById } from "@/services/database/reports/getReportById";
// import { enqueueReportPdf } from "@/services/queue/enqueueReportPdf";

// export const runtime = "nodejs";

// interface RouteContext {
//   params: Promise<{
//     reportId: string;
//   }>;
// }

// export async function POST(
//   request: Request,
//   context: RouteContext,
// ): Promise<Response> {
//   try {
//     /**
//      * --------------------------------------------------------
//      * 1. AUTHENTICATION
//      * --------------------------------------------------------
//      *
//      * PDF generation and regeneration are protected operations.
//      *
//      * Anonymous users must never be able to enqueue expensive
//      * Puppeteer work simply by knowing a report UUID.
//      */
//     const profile = await requireCurrentProfile();

//     /**
//      * --------------------------------------------------------
//      * 2. REPORT ID
//      * --------------------------------------------------------
//      */
//     const { reportId } = await context.params;

//     const normalizedReportId = reportId.trim();

//     if (!normalizedReportId) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "INVALID_REPORT_ID",
//           message: "The report ID is invalid.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 3. LOAD REPORT
//      * --------------------------------------------------------
//      *
//      * We load the report before enqueueing so authorization can
//      * be based on trusted database ownership.
//      */
//     const report = await getReportById(normalizedReportId);

//     if (!report) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "REPORT_NOT_FOUND",
//           message: "The requested report was not found.",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 4. AUTHORIZATION
//      * --------------------------------------------------------
//      */
//     const isSuperAdmin = profile.role === "super_admin";

//     const isPatientOwner = report.patientId === profile.id;

//     const isReportCreator = report.createdByUserId === profile.id;

//     let canGenerateReport = false;

//     if (isSuperAdmin) {
//       canGenerateReport = true;
//     } else if (profile.role === "patient") {
//       canGenerateReport = isPatientOwner;
//     } else if (profile.role === "doctor") {
//       canGenerateReport = isPatientOwner || isReportCreator;
//     }

//     if (!canGenerateReport) {
//       console.warn(
//         `[Report PDF Access] User ${profile.id} with role ${profile.role} attempted to generate report ${report.id} without authorization.`,
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           code: "REPORT_ACCESS_DENIED",
//           message: "You are not authorized to generate this report.",
//         },
//         {
//           status: 403,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * FUTURE SUBSCRIPTION AUTHORIZATION
//      * --------------------------------------------------------
//      *
//      * This is where subscription enforcement will eventually
//      * happen.
//      *
//      * Intended rules:
//      *
//      * patient
//      *   → active patient subscription required
//      *
//      * doctor
//      *   → active doctor subscription required
//      *
//      * super_admin
//      *   → subscription bypass
//      *
//      * IMPORTANT:
//      * Subscription state must be checked server-side from the
//      * trusted database/payment system.
//      *
//      * Never accept:
//      *
//      * hasSubscription: true
//      *
//      * from the browser.
//      *
//      * Example future call:
//      *
//      * await requireReportGenerationSubscription(profile);
//      */

//     /**
//      * --------------------------------------------------------
//      * 5. FORCE OPTION
//      * --------------------------------------------------------
//      *
//      * force=true is used for:
//      *
//      * - manually retrying a failed report
//      * - regenerating when the Storage object is missing
//      *
//      * The caller cannot use force=true to bypass ownership.
//      * Authorization has already been completed above.
//      */
//     const url = new URL(request.url);

//     const force = url.searchParams.get("force") === "true";

//     /**
//      * --------------------------------------------------------
//      * 6. ENQUEUE
//      * --------------------------------------------------------
//      */
//     const result = await enqueueReportPdf({
//       reportId: normalizedReportId,
//       force,
//     });

//     /**
//      * --------------------------------------------------------
//      * 7. IMMEDIATE WORKER TRIGGER
//      * --------------------------------------------------------
//      *
//      * The queue remains the durable source of truth.
//      *
//      * after() simply gives Vercel an immediate opportunity to
//      * process the queued job instead of waiting for Cron.
//      *
//      * This is especially important for user-triggered
//      * regeneration:
//      *
//      * failed
//      * → force enqueue
//      * → queued
//      * → after()
//      * → worker
//      * → generating
//      */
//     after(async () => {
//       try {
//         await triggerPdfWorker(request);
//       } catch (error) {
//         /**
//          * Do not fail the original request.
//          *
//          * The queue message already exists safely in Supabase.
//          * Cron/manual worker invocation remains the recovery
//          * mechanism.
//          */
//         console.error("[PDF Queue] Immediate worker trigger failed:", error);
//       }
//     });

//     return NextResponse.json(
//       {
//         success: true,

//         message: result.alreadyQueued
//           ? "PDF generation is already queued."
//           : "PDF generation has been queued.",

//         report: {
//           id: result.reportId,
//           pdfStatus: result.pdfStatus,
//           queueMessageId: result.queueMessageId,
//           alreadyQueued: result.alreadyQueued,
//         },
//       },
//       {
//         status: result.alreadyQueued ? 200 : 202,
//       },
//     );
//   } catch (error) {
//     const normalized = normalizeError(error);

//     /**
//      * --------------------------------------------------------
//      * AUTHENTICATION
//      * --------------------------------------------------------
//      */
//     if (normalized.message === "Authentication required.") {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "UNAUTHENTICATED",
//           message: "Authentication is required to generate this report.",
//         },
//         {
//           status: 401,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * QUEUE / REPORT ERRORS
//      * --------------------------------------------------------
//      */
//     if (normalized.message === "INVALID_REPORT_ID") {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "INVALID_REPORT_ID",
//           message: "The report ID is invalid.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     if (normalized.message === "REPORT_NOT_FOUND") {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "REPORT_NOT_FOUND",
//           message: "The requested report was not found.",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     if (normalized.message === "PDF_ALREADY_GENERATING") {
//       return NextResponse.json(
//         {
//           success: true,
//           code: "PDF_ALREADY_GENERATING",
//           message: "The PDF is already being generated.",
//         },
//         {
//           status: 202,
//         },
//       );
//     }

//     if (normalized.message === "PDF_ALREADY_READY") {
//       return NextResponse.json(
//         {
//           success: true,
//           code: "PDF_ALREADY_READY",
//           message: "The PDF has already been generated.",
//         },
//         {
//           status: 200,
//         },
//       );
//     }

//     if (normalized.message === "QUEUE_MESSAGE_CREATION_FAILED") {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "QUEUE_MESSAGE_CREATION_FAILED",
//           message: "The PDF generation request could not be queued.",
//         },
//         {
//           status: 503,
//         },
//       );
//     }

//     console.error("[Report PDF Generate API] Failed:", normalized);

//     return NextResponse.json(
//       {
//         success: false,
//         code: "REPORT_PDF_QUEUE_FAILED",
//         message: "Unable to queue PDF generation.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

// async function triggerPdfWorker(request: Request): Promise<void> {
//   const cronSecret = process.env.CRON_SECRET;

//   if (!cronSecret) {
//     throw new Error("CRON_SECRET is not configured.");
//   }

//   const requestUrl = new URL(request.url);

//   /**
//    * Reuse the same deployment origin.
//    *
//    * Local:
//    *
//    * http://localhost:3000
//    *
//    * Vercel:
//    *
//    * https://your-project.vercel.app
//    */
//   const workerUrl = new URL("/api/internal/pdf-worker", requestUrl.origin);

//   const response = await fetch(workerUrl, {
//     method: "GET",

//     headers: {
//       Authorization: `Bearer ${cronSecret}`,
//     },

//     cache: "no-store",
//   });

//   if (!response.ok) {
//     const body = await response.text().catch(() => "");

//     throw new Error(`PDF worker returned ${response.status}: ${body}`);
//   }
// }

// function normalizeError(error: unknown): Error {
//   if (error instanceof Error) {
//     return error;
//   }

//   if (typeof error === "string") {
//     return new Error(error);
//   }

//   return new Error("Unknown PDF queue error.");
// }

import { after, NextResponse } from "next/server";

import {
  isReportAccessError,
  requireReportAccess,
} from "@/lib/auth/requireReportAccess";
import { enqueueReportPdf } from "@/services/queue/enqueueReportPdf";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { reportId } = await context.params;

    /**
     * Centralized authentication + authorization.
     *
     * This checks:
     *
     * patient
     *   → owns the report
     *
     * doctor
     *   → created the report
     *   OR
     *   → has an active doctor-patient relationship
     *
     * super_admin
     *   → any report
     */
    const { report, profile } = await requireReportAccess({
      reportId,
      action: "generate",
    });

    /**
     * --------------------------------------------------------
     * FUTURE SUBSCRIPTION GATE
     * --------------------------------------------------------
     *
     * This is the correct place to enforce report-generation
     * subscription access later.
     *
     * Example future logic:
     *
     * if (profile.role !== "super_admin") {
     *   await requireActiveReportSubscription(profile.id);
     * }
     *
     * Important:
     *
     * - patient subscription
     * - doctor subscription
     * - super_admin bypass
     *
     * must all be checked server-side.
     */
    void profile;

    const url = new URL(request.url);

    const force = url.searchParams.get("force") === "true";

    /**
     * Use the canonical report ID loaded from the database rather
     * than blindly passing the URL parameter forward.
     */
    const result = await enqueueReportPdf({
      reportId: report.id,
      force,
    });

    /**
     * --------------------------------------------------------
     * IMMEDIATE WORKER TRIGGER
     * --------------------------------------------------------
     *
     * The queue message is already durable before this runs.
     *
     * after() gives the worker an immediate opportunity to process
     * the queued report without waiting for Cron.
     *
     * Normal:
     *
     * pending
     * → queued
     * → after()
     * → worker
     * → generating
     *
     * Retry:
     *
     * failed
     * → force=true
     * → queued
     * → after()
     * → worker
     * → generating
     */
    after(async () => {
      try {
        await triggerPdfWorker(request);
      } catch (error) {
        /**
         * Do not fail the user's enqueue request.
         *
         * The queue message is already safely stored.
         *
         * Manual worker invocation / Cron remains the recovery
         * mechanism if the immediate trigger fails.
         */
        console.error("[PDF Queue] Immediate worker trigger failed:", error);
      }
    });

    return NextResponse.json(
      {
        success: true,

        message: result.alreadyQueued
          ? "PDF generation is already queued."
          : "PDF generation has been queued.",

        report: {
          id: result.reportId,
          pdfStatus: result.pdfStatus,
          queueMessageId: result.queueMessageId,
          alreadyQueued: result.alreadyQueued,
        },
      },
      {
        status: result.alreadyQueued ? 200 : 202,
      },
    );
  } catch (error) {
    const normalized = normalizeError(error);

    /**
     * --------------------------------------------------------
     * UNAUTHENTICATED
     * --------------------------------------------------------
     */
    if (normalized.message === "Authentication required.") {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHENTICATED",
          message: "Authentication is required to generate this report.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * CENTRAL REPORT ACCESS ERRORS
     * --------------------------------------------------------
     */
    if (isReportAccessError(error)) {
      if (error.code === "INVALID_REPORT_ID") {
        return NextResponse.json(
          {
            success: false,
            code: error.code,
            message: error.message,
          },
          {
            status: 400,
          },
        );
      }

      if (error.code === "REPORT_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            code: error.code,
            message: error.message,
          },
          {
            status: 404,
          },
        );
      }

      if (error.code === "REPORT_ACCESS_DENIED") {
        return NextResponse.json(
          {
            success: false,
            code: error.code,
            message: "You are not authorized to generate this report.",
          },
          {
            status: 403,
          },
        );
      }
    }

    /**
     * --------------------------------------------------------
     * QUEUE-SPECIFIC STATES
     * --------------------------------------------------------
     */
    if (normalized.message === "INVALID_REPORT_ID") {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REPORT_ID",
          message: "The report ID is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (normalized.message === "REPORT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          code: "REPORT_NOT_FOUND",
          message: "The requested report was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (normalized.message === "PDF_ALREADY_GENERATING") {
      return NextResponse.json(
        {
          success: true,
          code: "PDF_ALREADY_GENERATING",
          message: "The PDF is already being generated.",
        },
        {
          status: 202,
        },
      );
    }

    if (normalized.message === "PDF_ALREADY_READY") {
      return NextResponse.json(
        {
          success: true,
          code: "PDF_ALREADY_READY",
          message: "The PDF has already been generated.",
        },
        {
          status: 200,
        },
      );
    }

    if (normalized.message === "QUEUE_MESSAGE_CREATION_FAILED") {
      return NextResponse.json(
        {
          success: false,
          code: "QUEUE_MESSAGE_CREATION_FAILED",
          message: "The PDF generation request could not be queued.",
        },
        {
          status: 503,
        },
      );
    }

    console.error("[Report PDF Generate API] Failed:", normalized);

    return NextResponse.json(
      {
        success: false,
        code: "REPORT_PDF_QUEUE_FAILED",
        message: "Unable to queue PDF generation.",
      },
      {
        status: 500,
      },
    );
  }
}

async function triggerPdfWorker(request: Request): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new Error("CRON_SECRET is not configured.");
  }

  const requestUrl = new URL(request.url);

  const workerUrl = new URL("/api/internal/pdf-worker", requestUrl.origin);

  const response = await fetch(workerUrl, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },

    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(`PDF worker returned ${response.status}: ${body}`);
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown PDF queue error.");
}
