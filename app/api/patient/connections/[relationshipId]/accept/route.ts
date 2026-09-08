import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { acceptDoctorPatientInvitation } from "@/services/database/relationships/acceptDoctorPatientInvitation";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    relationshipId: string;
  }>;
}

export async function POST(
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
     * Only patients may accept doctor connection requests.
     */
    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_ROLE_REQUIRED",
          message: "Only patients can accept doctor connection requests.",
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
     * 4. ACCEPT INVITATION
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * patientId comes ONLY from the authenticated profile.
     *
     * The browser supplies only the relationshipId.
     */
    const accepted = await acceptDoctorPatientInvitation({
      relationshipId: normalizedRelationshipId,

      patientId: profile.id,
    });

    return NextResponse.json(
      {
        success: true,
        code: "CONNECTION_ACCEPTED",

        message: "Doctor connection request accepted successfully.",

        connection: {
          relationshipId: accepted.relationshipId,

          status: accepted.status,

          acceptedAt: accepted.acceptedAt,

          doctor: {
            fullName: accepted.doctor.fullName,
          },
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
          message:
            "Authentication is required to accept this connection request.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * INVALID / UNAUTHORIZED RELATIONSHIP
     * --------------------------------------------------------
     *
     * We intentionally use the same response for:
     *
     * - relationship doesn't exist
     * - relationship belongs to another patient
     * - relationship is no longer pending
     *
     * This avoids leaking relationship state.
     */
    if (normalized.message === "PENDING_INVITATION_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          code: "PENDING_INVITATION_NOT_FOUND",
          message:
            "This doctor connection request is unavailable or has already been handled.",
        },
        {
          status: 404,
        },
      );
    }

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
     * UNEXPECTED FAILURE
     * --------------------------------------------------------
     */
    console.error("[Patient Connection Accept API] Failed:", normalized);

    return NextResponse.json(
      {
        success: false,
        code: "CONNECTION_ACCEPT_FAILED",
        message: "Unable to accept the doctor connection request.",
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

  return new Error("Unknown patient connection acceptance error.");
}
