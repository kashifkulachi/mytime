import { NextRequest, NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

import { getPatientMedicalRecords } from "@/services/database/medical-records/getPatientMedicalRecords";

/**
 * ============================================================
 * GET /api/medical-records
 * ============================================================
 *
 * Patient self-service endpoint.
 *
 * Example:
 *
 * /api/medical-records
 *
 * /api/medical-records?page=1&pageSize=20
 *
 * Security:
 *
 * - User must be authenticated
 * - User must have patient role
 * - patientId is NEVER taken from the browser
 * - patientId is resolved from the authenticated profile
 */
export async function GET(request: NextRequest) {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATE
     * --------------------------------------------------------
     */
    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. PATIENT-ONLY ENDPOINT
     * --------------------------------------------------------
     *
     * Doctors will use:
     *
     * /api/doctor/patients/[relationshipId]/medical-records
     *
     * That endpoint will resolve the linked patient server-side.
     */
    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          error: "This medical records endpoint is available only to patients.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. READ PAGINATION
     * --------------------------------------------------------
     */
    const searchParams = request.nextUrl.searchParams;

    const page = parsePositiveInteger(searchParams.get("page"), 1);

    const pageSize = parsePositiveInteger(searchParams.get("pageSize"), 20);

    /**
     * Keep the API limit aligned with the shared service.
     */
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
     * 4. LOAD CURRENT PATIENT'S MEDICAL RECORDS
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * We do NOT read:
     *
     * ?patientId=...
     *
     * from the browser.
     *
     * The authenticated profile determines ownership.
     */
    const result = await getPatientMedicalRecords({
      patientId: profile.id,

      page,

      pageSize,
    });

    /**
     * --------------------------------------------------------
     * 5. SAFE RESPONSE
     * --------------------------------------------------------
     */
    return NextResponse.json(
      {
        success: true,

        records: result.records,

        pagination: result.pagination,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("[GET /api/medical-records]", error);

    /**
     * requireCurrentProfile() currently throws when there is no
     * authenticated profile.
     *
     * Keep the public API response generic.
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
        error: "Unable to load medical records.",
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
 *
 * Examples:
 *
 * null      -> fallback
 * ""        -> fallback
 * "2"       -> 2
 * "0"       -> fallback
 * "-1"      -> fallback
 * "abc"     -> fallback
 * "2.5"     -> fallback
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
