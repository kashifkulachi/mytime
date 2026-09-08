import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface RevokeDoctorPatientRelationshipInput {
  relationshipId: string;
  patientId: string;
}

export interface RevokedDoctorPatientRelationship {
  relationshipId: string;
  status: "revoked";
  revokedAt: string;
}

/**
 * Rejects a pending doctor request OR revokes an active doctor
 * relationship for the authenticated patient.
 *
 * Security:
 *
 * - patientId must come from requireCurrentProfile()
 * - browser may provide only relationshipId
 * - update requires relationship ownership by this patient
 * - already-revoked relationships are not modified again
 *
 * Allowed transitions:
 *
 * pending -> revoked
 * active  -> revoked
 *
 * revoked -> no-op / unavailable
 */
export async function revokeDoctorPatientRelationship({
  relationshipId,
  patientId,
}: RevokeDoctorPatientRelationshipInput): Promise<RevokedDoctorPatientRelationship> {
  const normalizedRelationshipId = relationshipId.trim();

  const normalizedPatientId = patientId.trim();

  if (!normalizedRelationshipId) {
    throw new Error("RELATIONSHIP_ID_REQUIRED");
  }

  if (!normalizedPatientId) {
    throw new Error("PATIENT_ID_REQUIRED");
  }

  const supabase = createSupabaseAdminClient();

  const revokedAt = new Date().toISOString();

  /**
   * ----------------------------------------------------------
   * ATOMIC OWNERSHIP + STATE CHECK
   * ----------------------------------------------------------
   *
   * The relationship must:
   *
   * - match this relationship ID
   * - belong to the authenticated patient
   * - currently be pending OR active
   *
   * Therefore another patient's relationship cannot be revoked
   * merely by knowing its UUID.
   */
  const { data, error } = await supabase
    .from("doctor_patient_relationships")
    .update({
      status: "revoked",

      revoked_at: revokedAt,

      updated_at: revokedAt,
    })
    .eq("id", normalizedRelationshipId)
    .eq("patient_id", normalizedPatientId)
    .in("status", ["pending", "active"])
    .select(
      `
        id,
        status,
        revoked_at
      `,
    )
    .maybeSingle();

  if (error) {
    console.error(
      `[Patient Connection] Failed to revoke relationship ${normalizedRelationshipId}:`,
      error,
    );

    throw new Error("DOCTOR_PATIENT_RELATIONSHIP_REVOKE_FAILED");
  }

  /**
   * No row means one of:
   *
   * - relationship doesn't exist
   * - relationship belongs to another patient
   * - relationship is already revoked
   *
   * We intentionally return the same error so relationship state
   * is not leaked.
   */
  if (!data) {
    throw new Error("DOCTOR_PATIENT_RELATIONSHIP_NOT_AVAILABLE");
  }

  if (data.status !== "revoked" || !data.revoked_at) {
    console.error(
      "[Patient Connection] Relationship returned unexpected state after revoke:",
      {
        relationshipId: data.id,

        status: data.status,
      },
    );

    throw new Error("DOCTOR_PATIENT_RELATIONSHIP_REVOKE_FAILED");
  }

  return {
    relationshipId: data.id,

    status: "revoked",

    revokedAt: data.revoked_at,
  };
}
