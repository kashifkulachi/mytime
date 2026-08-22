import { NextResponse } from "next/server";

import { getReportById } from "@/services/database/reports/getReportById";

interface GetReportRouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: GetReportRouteContext,
) {
  try {
    const { reportId } = await params;

    const normalizedReportId = reportId.trim();

    if (!normalizedReportId) {
      return NextResponse.json(
        {
          success: false,
          message: "Report ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const report = await getReportById(normalizedReportId);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        report: {
          id: report.id,

          patient: {
            name: report.patientName,
            dateOfBirth: report.dateOfBirth,
            evaluationDate: report.evaluationDate,
          },

          results: {
            IFI: report.results.IFI,
            BiologicalAge: report.results.BiologicalAge,
          },

          pdf: {
            status: report.pdfStatus,
            path: report.pdfPath,
            generatedAt: report.pdfGeneratedAt,
            error: report.pdfError,
          },

          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Get report API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve report.",
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      {
        status: 500,
      },
    );
  }
}
