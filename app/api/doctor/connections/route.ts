import { NextResponse } from "next/server";
import { z } from "zod";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createDoctorPatientInvitation } from "@/services/database/relationships/createDoctorPatientInvitation";

export const runtime = "nodejs";

const createDoctorConnectionSchema = z.object({
  connectionCode: z
    .string()
    .trim()
    .min(1, "Connection code is required.")
    .max(20, "Connection code is invalid."),
});

export async function POST(request: Request): Promise<Response> {
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
     * Only doctors may initiate a patient connection through
     * this endpoint.
     */
    if (profile.role !== "doctor") {
      return NextResponse.json(
        {
          success: false,
          code: "DOCTOR_ROLE_REQUIRED",
          message:
            "Only doctors can connect to patients using a connection code.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. PARSE REQUEST BODY
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
     * 4. VALIDATE CONNECTION CODE
     * --------------------------------------------------------
     */
    const parsedBody = createDoctorConnectionSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CONNECTION_REQUEST",
          message: "A valid patient connection code is required.",
          errors: parsedBody.error.issues,
        },
        {
          status: 400,
        },
      );
    }

    const { connectionCode } = parsedBody.data;

    /**
     * --------------------------------------------------------
     * 5. CREATE / REUSE PENDING RELATIONSHIP
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * doctorId comes only from the authenticated profile.
     *
     * The browser never sends:
     *
     * doctorId
     * patientId
     *
     * The patient is resolved internally from the secure,
     * short-lived connection code.
     */
    const invitation = await createDoctorPatientInvitation({
      doctorId: profile.id,
      connectionCode,
    });

    /**
     * --------------------------------------------------------
     * 6. EXISTING ACTIVE RELATIONSHIP
     * --------------------------------------------------------
     */
    if (invitation.alreadyActive) {
      return NextResponse.json(
        {
          success: true,
          code: "PATIENT_ALREADY_CONNECTED",
          message: "This patient is already connected to your account.",

          connection: {
            relationshipId: invitation.relationshipId,

            status: invitation.status,

            patient: {
              fullName: invitation.patient.fullName,
            },

            alreadyConnected: true,
          },
        },
        {
          status: 200,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 7. EXISTING PENDING REQUEST
     * --------------------------------------------------------
     */
    if (invitation.alreadyPending) {
      return NextResponse.json(
        {
          success: true,
          code: "CONNECTION_REQUEST_ALREADY_PENDING",

          message: "A connection request for this patient is already pending.",

          connection: {
            relationshipId: invitation.relationshipId,

            status: invitation.status,

            patient: {
              fullName: invitation.patient.fullName,
            },

            alreadyPending: true,
          },
        },
        {
          status: 200,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 8. NEW / REOPENED PENDING REQUEST
     * --------------------------------------------------------
     *
     * This does NOT grant report access yet.
     *
     * Patient must explicitly accept the request.
     */
    return NextResponse.json(
      {
        success: true,
        code: "CONNECTION_REQUEST_CREATED",

        message: "Patient connection request created successfully.",

        connection: {
          relationshipId: invitation.relationshipId,

          status: invitation.status,

          patient: {
            fullName: invitation.patient.fullName,
          },

          alreadyPending: false,
          alreadyConnected: false,
        },
      },
      {
        status: 201,
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
          message: "Authentication is required to connect to a patient.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * CONNECTION CODE ERRORS
     * --------------------------------------------------------
     */

    if (
      normalized.message === "CONNECTION_CODE_REQUIRED" ||
      normalized.message === "INVALID_CONNECTION_CODE"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CONNECTION_CODE",
          message: "The patient connection code is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (normalized.message === "CONNECTION_CODE_EXPIRED") {
      return NextResponse.json(
        {
          success: false,
          code: "CONNECTION_CODE_EXPIRED",
          message:
            "This patient connection code has expired. Ask the patient to generate a new code.",
        },
        {
          status: 410,
        },
      );
    }

    if (normalized.message === "CONNECTION_CODE_ALREADY_USED") {
      return NextResponse.json(
        {
          success: false,
          code: "CONNECTION_CODE_ALREADY_USED",
          message:
            "This patient connection code has already been used. Ask the patient to generate a new code.",
        },
        {
          status: 409,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * ROLE / PROFILE CONSISTENCY ERRORS
     * --------------------------------------------------------
     */
    if (
      normalized.message === "DOCTOR_PROFILE_NOT_FOUND" ||
      normalized.message === "DOCTOR_ROLE_REQUIRED"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "DOCTOR_ROLE_REQUIRED",
          message: "A valid doctor profile is required.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      normalized.message === "PATIENT_PROFILE_NOT_FOUND" ||
      normalized.message === "PATIENT_ROLE_REQUIRED"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_CONNECTION_INVALID",
          message:
            "The patient account associated with this connection code is unavailable.",
        },
        {
          status: 409,
        },
      );
    }

    if (normalized.message === "CANNOT_CONNECT_TO_SELF") {
      return NextResponse.json(
        {
          success: false,
          code: "CANNOT_CONNECT_TO_SELF",
          message:
            "You cannot create a patient relationship with your own account.",
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
    console.error("[Doctor Connections API] Failed:", normalized);

    return NextResponse.json(
      {
        success: false,
        code: "DOCTOR_PATIENT_CONNECTION_FAILED",
        message: "Unable to create the patient connection request.",
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

  return new Error("Unknown doctor-patient connection error.");
}
