import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getPatientMedicalRecordById } from "@/services/database/medical-records/getPatientMedicalRecordById";

interface RouteContext {
  params: Promise<{
    relationshipId: string;
    reportId: string;
  }>;
}

/**
 * ============================================================
 * GET
 * /api/doctor/patients/[relationshipId]/medical-records/[reportId]
 * ============================================================
 *
 * Doctor detail endpoint for one patient medical record.
 *
 * Security flow:
 *
 * authenticated user
 *      ↓
 * must be doctor
 *      ↓
 * relationship must belong to logged-in doctor
 *      ↓
 * relationship must be active
 *      ↓
 * patient_id resolved server-side
 *      ↓
 * report must belong to that patient
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATE
     * --------------------------------------------------------
     */
    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. DOCTOR-ONLY ENDPOINT
     * --------------------------------------------------------
     */
    if (profile.role !== "doctor") {
      return NextResponse.json(
        {
          error: "This endpoint is available only to doctors.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. READ ROUTE PARAMS
     * --------------------------------------------------------
     */
    const { relationshipId, reportId } = await context.params;

    if (!relationshipId || !relationshipId.trim()) {
      return NextResponse.json(
        {
          error: "Relationship ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!reportId || !reportId.trim()) {
      return NextResponse.json(
        {
          error: "Report ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 4. VERIFY ACTIVE RELATIONSHIP
     * --------------------------------------------------------
     */
    const supabase = createSupabaseAdminClient();

    const { data: relationship, error: relationshipError } = await supabase
      .from("doctor_patient_relationships")
      .select(
        `
          id,
          doctor_id,
          patient_id,
          status
        `,
      )
      .eq("id", relationshipId)
      .eq("doctor_id", profile.id)
      .eq("status", "active")
      .maybeSingle();

    if (relationshipError) {
      console.error(
        "[Doctor Medical Record Detail] Relationship lookup failed:",
        relationshipError,
      );

      return NextResponse.json(
        {
          error: "Unable to verify patient relationship.",
        },
        {
          status: 500,
        },
      );
    }

    /**
     * We intentionally return the same response if:
     *
     * - relationship doesn't exist
     * - belongs to another doctor
     * - is pending
     * - is revoked
     */
    if (!relationship) {
      return NextResponse.json(
        {
          error: "Active patient relationship not found.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 5. LOAD MEDICAL RECORD
     * --------------------------------------------------------
     *
     * patientId comes from the verified relationship.
     *
     * It is never accepted from the browser.
     */
    const record = await getPatientMedicalRecordById({
      patientId: relationship.patient_id,

      reportId,
    });

    /**
     * --------------------------------------------------------
     * 6. REPORT NOT FOUND / NOT OWNED BY PATIENT
     * --------------------------------------------------------
     */
    if (!record) {
      return NextResponse.json(
        {
          error: "Medical record not found.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 7. RETURN SAFE DTO
     * --------------------------------------------------------
     */
    return NextResponse.json(
      {
        success: true,

        relationship: {
          id: relationship.id,
        },

        record,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "[GET /api/doctor/patients/[relationshipId]/medical-records/[reportId]]",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Unable to load patient medical record.",
      },
      {
        status: 500,
      },
    );
  }
}
