import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { getDoctorPatientByRelationshipId } from "@/services/database/relationships/getDoctorPatientByRelationshipId";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    relationshipId: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<Response> {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATION
     * --------------------------------------------------------
     */
    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. ROLE AUTHORIZATION
     * --------------------------------------------------------
     *
     * This workspace is currently doctor-only.
     *
     * We can add an explicit super_admin patient-workspace path
     * later if needed, but we should not silently reuse a doctor
     * route for that.
     */
    if (profile.role !== "doctor") {
      return NextResponse.json(
        {
          success: false,
          code: "DOCTOR_ROLE_REQUIRED",
          message: "Only doctors can access the patient clinical workspace.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. RELATIONSHIP ID
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
     * 4. SECURE RELATIONSHIP RESOLUTION
     * --------------------------------------------------------
     *
     * The service enforces:
     *
     * relationship.id        = requested relationship ID
     * relationship.doctor_id = authenticated doctor ID
     * relationship.status    = active
     *
     * It may resolve patientId internally, but that value must
     * never be serialized into this API response.
     */
    const relationship = await getDoctorPatientByRelationshipId({
      relationshipId: normalizedRelationshipId,

      doctorId: profile.id,
    });

    /**
     * --------------------------------------------------------
     * 5. NOT FOUND / NOT AUTHORIZED / NOT ACTIVE
     * --------------------------------------------------------
     *
     * We intentionally use one response for:
     *
     * - nonexistent relationship
     * - relationship belongs to another doctor
     * - relationship is no longer active
     *
     * This avoids leaking relationship state.
     */
    if (!relationship) {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_RELATIONSHIP_NOT_AVAILABLE",
          message: "This patient relationship is unavailable.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 6. SAFE BROWSER RESPONSE
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * relationship.patientId exists only in trusted server
     * memory and is intentionally omitted here.
     */
    return NextResponse.json(
      {
        success: true,

        patientWorkspace: {
          relationshipId: relationship.relationshipId,

          patient: {
            fullName: relationship.patient.fullName,
          },

          relationship: {
            status: relationship.relationship.status,

            createdAt: relationship.relationship.createdAt,

            acceptedAt: relationship.relationship.acceptedAt,

            updatedAt: relationship.relationship.updatedAt,
          },
        },
      },
      {
        status: 200,
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
          message:
            "Authentication is required to access this patient workspace.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * INVALID RELATIONSHIP ID
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

    console.error("[Doctor Patient Workspace API] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        code: "PATIENT_WORKSPACE_READ_FAILED",
        message: "Unable to load the patient clinical workspace.",
      },
      {
        status: 500,
      },
    );
  }
}
