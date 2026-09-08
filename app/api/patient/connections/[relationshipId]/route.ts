import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { revokeDoctorPatientRelationship } from "@/services/database/relationships/revokeDoctorPatientRelationship";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    relationshipId: string;
  }>;
}

export async function DELETE(
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
     * Only patients may reject or revoke doctor relationships
     * through this endpoint.
     */
    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_ROLE_REQUIRED",
          message: "Only patients can reject or revoke doctor connections.",
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
          message: "A relationship ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 4. REJECT / REVOKE
     * --------------------------------------------------------
     *
     * patientId comes only from the authenticated profile.
     *
     * The browser supplies only the relationshipId.
     *
     * Service permits:
     *
     * pending -> revoked
     * active  -> revoked
     */
    const revoked = await revokeDoctorPatientRelationship({
      relationshipId: normalizedRelationshipId,

      patientId: profile.id,
    });

    return NextResponse.json(
      {
        success: true,
        code: "CONNECTION_REVOKED",

        message: "Doctor connection removed successfully.",

        connection: {
          relationshipId: revoked.relationshipId,

          status: revoked.status,

          revokedAt: revoked.revokedAt,
        },
      },
      {
        status: 200,
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
          message: "Authentication is required to manage doctor connections.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * BAD RELATIONSHIP ID
     * --------------------------------------------------------
     */
    if (normalized.message === "RELATIONSHIP_ID_REQUIRED") {
      return NextResponse.json(
        {
          success: false,
          code: "RELATIONSHIP_ID_REQUIRED",
          message: "A relationship ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * NOT FOUND / NOT OWNED / ALREADY REVOKED
     * --------------------------------------------------------
     *
     * We intentionally return one generic response for:
     *
     * - relationship does not exist
     * - relationship belongs to another patient
     * - relationship is already revoked
     *
     * This avoids leaking relationship state.
     */
    if (normalized.message === "DOCTOR_PATIENT_RELATIONSHIP_NOT_AVAILABLE") {
      return NextResponse.json(
        {
          success: false,
          code: "DOCTOR_PATIENT_RELATIONSHIP_NOT_AVAILABLE",
          message:
            "This doctor connection is unavailable or has already been removed.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * UNEXPECTED FAILURE
     * --------------------------------------------------------
     */
    console.error("[Patient Connection Revoke API] Failed:", normalized);

    return NextResponse.json(
      {
        success: false,
        code: "CONNECTION_REVOKE_FAILED",
        message: "Unable to remove the doctor connection.",
      },
      {
        status: 500,
      },
    );
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown patient connection revoke error.");
}
