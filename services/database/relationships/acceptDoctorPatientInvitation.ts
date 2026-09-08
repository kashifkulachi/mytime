import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AcceptDoctorPatientInvitationInput {
  relationshipId: string;
  patientId: string;
}

export interface AcceptedDoctorPatientInvitation {
  relationshipId: string;
  status: "active";
  acceptedAt: string;

  doctor: {
    fullName: string | null;
  };
}

interface RelationshipDatabaseRow {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: string;
  accepted_at: string | null;
}

/**
 * Accept a pending doctor-patient connection request.
 *
 * SECURITY:
 *
 * patientId MUST come from the authenticated patient's profile.
 *
 * The browser may provide relationshipId because it is an opaque
 * resource identifier, but ownership is always independently
 * verified using patient_id.
 *
 * The update requires all three conditions:
 *
 *   id         = relationshipId
 *   patient_id = authenticated patient
 *   status     = pending
 *
 * Therefore knowing another relationship UUID does not allow a
 * patient to accept somebody else's invitation.
 */
export async function acceptDoctorPatientInvitation({
  relationshipId,
  patientId,
}: AcceptDoctorPatientInvitationInput): Promise<AcceptedDoctorPatientInvitation> {
  const normalizedRelationshipId = relationshipId.trim();
  const normalizedPatientId = patientId.trim();

  if (!normalizedRelationshipId) {
    throw new Error("RELATIONSHIP_ID_REQUIRED");
  }

  if (!normalizedPatientId) {
    throw new Error("PATIENT_ID_REQUIRED");
  }

  const supabase = createSupabaseAdminClient();

  const acceptedAt = new Date().toISOString();

  /**
   * ----------------------------------------------------------
   * 1. Atomically change pending -> active
   * ----------------------------------------------------------
   *
   * The ownership check is part of the UPDATE itself.
   *
   * This is important. We do NOT:
   *
   *   SELECT relationship
   *   check patient
   *   UPDATE relationship
   *
   * because that creates an unnecessary read/update gap.
   */
  const { data, error } = await supabase
    .from("doctor_patient_relationships")
    .update({
      status: "active",
      accepted_at: acceptedAt,
      revoked_at: null,
      updated_at: acceptedAt,
    })
    .eq("id", normalizedRelationshipId)
    .eq("patient_id", normalizedPatientId)
    .eq("status", "pending")
    .select(
      `
        id,
        doctor_id,
        patient_id,
        status,
        accepted_at
      `,
    )
    .maybeSingle();

  if (error) {
    console.error(
      `[Patient Connection] Failed to accept relationship ${normalizedRelationshipId}:`,
      error,
    );

    throw new Error("DOCTOR_PATIENT_INVITATION_ACCEPT_FAILED");
  }

  /**
   * No matching row can mean:
   *
   * - relationship doesn't exist
   * - relationship belongs to another patient
   * - relationship is no longer pending
   *
   * We intentionally don't reveal which one here.
   */
  if (!data) {
    throw new Error("PENDING_INVITATION_NOT_FOUND");
  }

  const relationship = data as RelationshipDatabaseRow;

  if (relationship.status !== "active" || !relationship.accepted_at) {
    console.error(
      "[Patient Connection] Invitation update returned unexpected state:",
      {
        relationshipId: relationship.id,
        status: relationship.status,
      },
    );

    throw new Error("DOCTOR_PATIENT_INVITATION_ACCEPT_FAILED");
  }

  /**
   * ----------------------------------------------------------
   * 2. Retrieve safe doctor display information
   * ----------------------------------------------------------
   *
   * We don't return doctor_id to the frontend.
   */
  const { data: doctorProfile, error: doctorError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        role,
        full_name
      `,
    )
    .eq("id", relationship.doctor_id)
    .maybeSingle();

  if (doctorError) {
    /**
     * IMPORTANT:
     *
     * The relationship has ALREADY been activated at this point.
     *
     * Therefore a failure to load cosmetic doctor information
     * must not incorrectly tell the patient that acceptance
     * failed.
     */
    console.error(
      `[Patient Connection] Relationship ${relationship.id} was accepted, but doctor profile could not be loaded:`,
      doctorError,
    );

    return {
      relationshipId: relationship.id,

      status: "active",

      acceptedAt: relationship.accepted_at,

      doctor: {
        fullName: null,
      },
    };
  }

  /**
   * Defensive consistency check.
   *
   * Our database relationship constraints should already
   * guarantee this.
   */
  if (doctorProfile && doctorProfile.role !== "doctor") {
    console.error(
      `[Patient Connection] Relationship ${relationship.id} references a non-doctor profile.`,
    );

    return {
      relationshipId: relationship.id,

      status: "active",

      acceptedAt: relationship.accepted_at,

      doctor: {
        fullName: null,
      },
    };
  }

  return {
    relationshipId: relationship.id,

    status: "active",

    acceptedAt: relationship.accepted_at,

    doctor: {
      fullName: doctorProfile?.full_name ?? null,
    },
  };
}
