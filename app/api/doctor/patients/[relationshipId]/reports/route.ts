import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createReportSchema } from "@/lib/schemas/report.schema";
import { createReport } from "@/services/database/reports/createReport";
import { getDoctorPatientByRelationshipId } from "@/services/database/relationships/getDoctorPatientByRelationshipId";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    relationshipId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATE CURRENT USER
     * --------------------------------------------------------
     */
    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. REQUIRE DOCTOR ROLE
     * --------------------------------------------------------
     *
     * Patient self-assessment continues to use:
     *
     * POST /api/reports
     *
     * This endpoint exists specifically for:
     *
     * doctor -> linked patient -> assessment -> report
     */
    if (profile.role !== "doctor") {
      return NextResponse.json(
        {
          success: false,
          code: "DOCTOR_ROLE_REQUIRED",
          message:
            "Only doctors can create reports through this patient assessment workflow.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. VALIDATE RELATIONSHIP ID
     * --------------------------------------------------------
     */
    const { relationshipId } = await params;

    const normalizedRelationshipId = relationshipId.trim();

    if (!normalizedRelationshipId) {
      return NextResponse.json(
        {
          success: false,
          code: "RELATIONSHIP_ID_REQUIRED",
          message: "A patient relationship ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 4. RE-VERIFY PATIENT ACCESS
     * --------------------------------------------------------
     *
     * Never trust the relationship stored in localStorage.
     *
     * At the exact moment the doctor submits the assessment,
     * verify again:
     *
     * relationship.id        = URL relationshipId
     * relationship.doctor_id = authenticated doctor
     * relationship.status    = active
     *
     * The service internally returns patientId, but that ID
     * never came from the browser.
     */
    const relationship = await getDoctorPatientByRelationshipId({
      relationshipId: normalizedRelationshipId,

      doctorId: profile.id,
    });

    if (!relationship) {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_RELATIONSHIP_NOT_AVAILABLE",
          message:
            "This patient relationship is unavailable or no longer active.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * FUTURE SUBSCRIPTION CHECK
     * --------------------------------------------------------
     *
     * This is where the doctor's subscription will later be
     * enforced.
     *
     * Example:
     *
     * await requireDoctorAssessmentSubscription(profile);
     *
     * super_admin will eventually have its own trusted workflow
     * and subscription bypass.
     */

    /**
     * --------------------------------------------------------
     * 5. PARSE JSON BODY
     * --------------------------------------------------------
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_JSON",
          message: "Invalid JSON request body.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 6. VALIDATE ASSESSMENT + CALCULATION DATA
     * --------------------------------------------------------
     *
     * Reuse the exact same report payload schema as the existing
     * patient self-assessment route.
     *
     * Ownership IDs are deliberately NOT part of this schema.
     */
    const parsedBody = createReportSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error(
        "[Doctor Create Report] Zod validation failed:",
        JSON.stringify(parsedBody.error.issues, null, 2),
      );

      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REPORT_PAYLOAD",
          message: "Invalid report payload.",
          errors: parsedBody.error.issues,
        },
        {
          status: 400,
        },
      );
    }

    const { patient, results } = parsedBody.data;

    /**
     * --------------------------------------------------------
     * 7. CREATE REPORT WITH TRUSTED OWNERSHIP
     * --------------------------------------------------------
     *
     * This is the critical difference from patient self-report:
     *
     * patient_id
     *   = internally resolved linked patient
     *
     * created_by_user_id
     *   = authenticated doctor
     *
     * Browser can never choose either UUID.
     */
    const report = await createReport({
      patientId: relationship.patientId,

      createdByUserId: profile.id,

      /**
       * Prefer the linked patient's authenticated profile name.
       *  relationship.patient.fullName?.trim() ||
       * If the profile has no name yet, fall back to the
       * validated assessment payload.
       */
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

    /**
     * --------------------------------------------------------
     * 8. SAFE RESPONSE
     * --------------------------------------------------------
     *
     * createReport() may contain patientId internally in its
     * TypeScript result depending on your current implementation.
     *
     * We return only what the browser actually needs.
     */
    return NextResponse.json(
      {
        success: true,

        message: "Patient report created successfully.",

        report: {
          id: report.id,

          patientName: report.patientName,

          dateOfBirth: report.dateOfBirth,

          evaluationDate: report.evaluationDate,

          gender: report.gender,

          results: report.results,

          pdfStatus: report.pdfStatus,

          pdfPath: report.pdfPath,

          pdfGeneratedAt: report.pdfGeneratedAt,

          pdfError: report.pdfError,

          createdAt: report.createdAt,

          updatedAt: report.updatedAt,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    /**
     * --------------------------------------------------------
     * UNAUTHENTICATED
     * --------------------------------------------------------
     */
    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHENTICATED",
          message: "Authentication is required to create a patient report.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * INVALID RELATIONSHIP
     * --------------------------------------------------------
     */
    if (
      error instanceof Error &&
      error.message === "Relationship ID is required."
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "RELATIONSHIP_ID_REQUIRED",
          message: "A patient relationship ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    console.error("[Doctor Create Report API] Failed:", error);

    /**
     * Do not expose raw Supabase/database errors to browser.
     */
    return NextResponse.json(
      {
        success: false,
        code: "DOCTOR_REPORT_CREATION_FAILED",
        message: "Unable to create the patient report.",
      },
      {
        status: 500,
      },
    );
  }
}
