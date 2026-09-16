import { NextRequest, NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getPatientMedicalRecords } from "@/services/database/medical-records/getPatientMedicalRecords";

interface RouteContext {
  params: Promise<{
    relationshipId: string;
  }>;
}

/**
 * ============================================================
 * GET
 * /api/doctor/patients/[relationshipId]/medical-records
 * ============================================================
 *
 * Doctor medical-record history endpoint.
 *
 * Security flow:
 *
 * authenticated user
 *      ↓
 * must be doctor
 *      ↓
 * relationshipId from URL
 *      ↓
 * relationship must belong to logged-in doctor
 *      ↓
 * relationship must be ACTIVE
 *      ↓
 * resolve patient_id server-side
 *      ↓
 * load medical records
 *
 * The browser never supplies patient_id.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATE CURRENT USER
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
     * 3. READ RELATIONSHIP ID
     * --------------------------------------------------------
     */
    const { relationshipId } = await context.params;

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

    /**
     * --------------------------------------------------------
     * 4. VERIFY ACTIVE DOCTOR-PATIENT RELATIONSHIP
     * --------------------------------------------------------
     *
     * We use the admin client because authorization is being
     * explicitly enforced here before any patient data is
     * returned.
     *
     * IMPORTANT:
     *
     * We check BOTH:
     *
     * doctor_id = currently authenticated doctor
     *
     * AND
     *
     * status = active
     *
     * Therefore a doctor cannot access:
     *
     * - another doctor's relationship
     * - a pending relationship
     * - a revoked relationship
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
        "[Doctor Medical Records] Relationship lookup failed:",
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
     * Do not reveal whether:
     *
     * - relationship does not exist
     * - relationship belongs to another doctor
     * - relationship was revoked
     * - relationship is still pending
     *
     * All of those become the same 404 response.
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
     * 5. READ PAGINATION
     * --------------------------------------------------------
     */
    const searchParams = request.nextUrl.searchParams;

    const page = parsePositiveInteger(searchParams.get("page"), 1);

    const pageSize = parsePositiveInteger(searchParams.get("pageSize"), 20);

    if (pageSize > 100) {
      return NextResponse.json(
        {
          error: "pageSize cannot be greater than 100.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 6. LOAD PATIENT MEDICAL RECORDS
     * --------------------------------------------------------
     *
     * patient_id comes from the verified relationship.
     *
     * It does NOT come from:
     *
     * request body
     * query string
     * localStorage
     * frontend state
     */
    const result = await getPatientMedicalRecords({
      patientId: relationship.patient_id,

      page,

      pageSize,
    });

    /**
     * --------------------------------------------------------
     * 7. RETURN SAFE MEDICAL RECORD DTOs
     * --------------------------------------------------------
     */
    return NextResponse.json(
      {
        success: true,

        relationship: {
          id: relationship.id,
        },

        records: result.records,

        pagination: result.pagination,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "[GET /api/doctor/patients/[relationshipId]/medical-records]",
      error,
    );

    /**
     * Match the behavior of our patient API.
     */
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
        error: "Unable to load patient medical records.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * ============================================================
 * QUERY PARAMETER PARSER
 * ============================================================
 */
function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}
