// import { NextResponse } from "next/server";

// import { getReportById } from "@/services/database/reports/getReportById";
// import { generateAndStoreReportPdf } from "@/lib/pdf-service/generateAndStoreReportPdf";

// interface GenerateReportRouteContext {
//   params: Promise<{
//     reportId: string;
//   }>;
// }

// export async function POST(
//   _request: Request,
//   { params }: GenerateReportRouteContext,
// ) {
//   try {
//     const { reportId } = await params;

//     const normalizedReportId = reportId.trim();

//     if (!normalizedReportId) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Report ID is required.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     const report = await getReportById(normalizedReportId);

//     if (!report) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Report not found.",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     /*
//      * If the PDF is already ready and has a stored path,
//      * don't generate another copy unnecessarily.
//      */
//     if (report.pdfStatus === "ready" && report.pdfPath) {
//       return NextResponse.json(
//         {
//           success: true,
//           message: "Report PDF is already ready.",
//           report: {
//             id: report.id,
//             pdfStatus: report.pdfStatus,
//             pdfPath: report.pdfPath,
//             pdfGeneratedAt: report.pdfGeneratedAt,
//           },
//         },
//         {
//           status: 200,
//         },
//       );
//     }

//     /*
//      * For now, prevent a second generation request while
//      * another generation is already marked as running.
//      */
//     if (report.pdfStatus === "generating") {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Report PDF is already being generated.",
//           report: {
//             id: report.id,
//             pdfStatus: report.pdfStatus,
//           },
//         },
//         {
//           status: 409,
//         },
//       );
//     }

//     const generatedPdf = await generateAndStoreReportPdf({
//       reportId: normalizedReportId,
//     });

//     const updatedReport = await getReportById(normalizedReportId);

//     if (!updatedReport) {
//       throw new Error(
//         "Report PDF was generated, but the updated report could not be retrieved.",
//       );
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Report PDF generated successfully.",
//         report: {
//           id: updatedReport.id,
//           pdfStatus: updatedReport.pdfStatus,
//           pdfPath: generatedPdf.pdfPath,
//           pdfGeneratedAt: updatedReport.pdfGeneratedAt,
//         },
//       },
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     console.error("Generate report PDF API error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to generate report PDF.",
//         error:
//           error instanceof Error
//             ? error.message
//             : "Unknown PDF generation error.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

import { NextResponse } from "next/server";

import { getReportById } from "@/services/database/reports/getReportById";
import { generateAndStoreReportPdf } from "@/lib/pdf-service/generateAndStoreReportPdf";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GenerateReportRouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: GenerateReportRouteContext,
) {
  try {
    const { reportId } = await params;

    const normalizedReportId = reportId.trim();

    if (!normalizedReportId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REPORT_ID",
          message: "Report ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * Optional forced regeneration
     * --------------------------------------------------------
     *
     * Normal:
     *
     * POST /api/reports/{id}/generate
     *
     * Forced:
     *
     * POST /api/reports/{id}/generate?force=true
     *
     * Force is used when the database still says the PDF is
     * ready but the actual Storage object has disappeared.
     */
    const { searchParams } = new URL(request.url);

    const force = searchParams.get("force") === "true";

    const report = await getReportById(normalizedReportId);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          code: "REPORT_NOT_FOUND",
          message: "Report not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * Never allow two active generators for the same report.
     * --------------------------------------------------------
     *
     * Even force=true cannot bypass this protection.
     */
    if (report.pdfStatus === "generating") {
      return NextResponse.json(
        {
          success: false,
          code: "PDF_ALREADY_GENERATING",
          message: "Report PDF is already being generated.",
          report: {
            id: report.id,
            pdfStatus: report.pdfStatus,
          },
        },
        {
          status: 409,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * Existing ready report
     * --------------------------------------------------------
     *
     * Normal generation request:
     *
     * ready + path
     *     ↓
     * return existing metadata
     *
     * Forced generation request:
     *
     * ready + path + force=true
     *     ↓
     * continue and regenerate
     */
    if (report.pdfStatus === "ready" && report.pdfPath && !force) {
      return NextResponse.json(
        {
          success: true,
          message: "Report PDF is already ready.",
          report: {
            id: report.id,
            pdfStatus: report.pdfStatus,
            pdfPath: report.pdfPath,
            pdfGeneratedAt: report.pdfGeneratedAt,
          },
        },
        {
          status: 200,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * Generate / regenerate
     * --------------------------------------------------------
     *
     * Supported cases:
     *
     * pending
     * failed
     * ready + force=true
     *
     * generateAndStoreReportPdf() will:
     *
     * 1. set status = generating
     * 2. render the database-backed print page
     * 3. generate the PDF
     * 4. upload with upsert=true
     * 5. set status = ready
     *
     * If anything fails it sets status = failed.
     */
    const generatedPdf = await generateAndStoreReportPdf({
      reportId: normalizedReportId,
    });

    /*
     * Fetch again instead of manually constructing the final
     * state. This ensures the API returns what is actually
     * persisted in Supabase.
     */
    const updatedReport = await getReportById(normalizedReportId);

    if (!updatedReport) {
      throw new Error(
        "Report PDF was generated, but the updated report record could not be retrieved.",
      );
    }

    if (updatedReport.pdfStatus !== "ready" || !updatedReport.pdfPath) {
      throw new Error(
        "PDF generation completed without a valid ready report state.",
      );
    }

    return NextResponse.json(
      {
        success: true,

        message: force
          ? "Report PDF regenerated successfully."
          : "Report PDF generated successfully.",

        regenerated: force,

        report: {
          id: updatedReport.id,

          pdfStatus: updatedReport.pdfStatus,

          pdfPath: generatedPdf.pdfPath,

          pdfGeneratedAt: updatedReport.pdfGeneratedAt,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Generate report PDF API error:", error);

    return NextResponse.json(
      {
        success: false,
        code: "PDF_GENERATION_FAILED",
        message: "Failed to generate the medical report PDF.",
        error:
          error instanceof Error
            ? error.message
            : "Unknown PDF generation error.",
      },
      {
        status: 500,
      },
    );
  }
}
