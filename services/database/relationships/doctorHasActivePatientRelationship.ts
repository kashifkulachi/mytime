import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface DoctorHasActivePatientRelationshipInput {
  doctorId: string;
  patientId: string;
}

/**
 * Returns true only when the supplied doctor/patient pair has
 * an ACTIVE relationship.
 *
 * This function is intentionally read-only and server-only.
 *
 * Security notes:
 * - doctorId and patientId are internal auth/profile UUIDs.
 * - The function does not establish trust merely because IDs exist.
 * - The database relationship row is the source of truth.
 * - Only status = "active" grants access.
 */
export async function doctorHasActivePatientRelationship({
  doctorId,
  patientId,
}: DoctorHasActivePatientRelationshipInput): Promise<boolean> {
  const normalizedDoctorId = doctorId.trim();
  const normalizedPatientId = patientId.trim();

  if (!normalizedDoctorId) {
    throw new Error("Doctor ID is required.");
  }

  if (!normalizedPatientId) {
    throw new Error("Patient ID is required.");
  }

  /**
   * Defensive check.
   *
   * A doctor should never be checking an authorization
   * relationship against themselves.
   */
  if (normalizedDoctorId === normalizedPatientId) {
    return false;
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("doctor_patient_relationships")
    .select("id")
    .eq("doctor_id", normalizedDoctorId)
    .eq("patient_id", normalizedPatientId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error(
      `[Doctor Patient Relationship] Failed to verify relationship. doctor=${normalizedDoctorId}, patient=${normalizedPatientId}`,
      error,
    );

    /**
     * Do not silently convert infrastructure/database errors into
     * "false".
     *
     * Authorization code must be able to distinguish:
     *
     * no relationship
     * vs
     * database lookup failed
     */
    throw new Error("Failed to verify doctor-patient relationship.");
  }

  return data !== null;
}
