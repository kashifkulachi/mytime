import { NextResponse } from "next/server";

import { createReportSchema } from "@/lib/validations/report.schema";
import { createReport } from "@/services/database/reports/createReport";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const parsedBody = createReportSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error(
        "Zod validation errors:",
        JSON.stringify(parsedBody.error.issues, null, 2),
      );
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report payload.",
          errors: parsedBody.error.issues,
        },
        {
          status: 400,
        },
      );
    }

    const { patient, results } = parsedBody.data;

    const report = await createReport({
      patientName: patient.name,
      dateOfBirth: patient.dateOfBirth,
      evaluationDate: patient.evaluationDate,
      gender: patient.gender,

      results: {
        IFI: results.IFI,
        BiologicalAge: results.BiologicalAge,
        PeptideDose: results.PeptideDose,
        HBOTSessions: results.HBOTSessions,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Report created successfully.",
        report,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create report API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create report.",
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      {
        status: 500,
      },
    );
  }
}
