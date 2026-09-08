/**
 * Describes WHO the current assessment belongs to.
 *
 * IMPORTANT:
 *
 * This type intentionally does NOT contain patientId.
 *
 * Internal auth/database UUIDs remain server-side.
 *
 * The client may know:
 *
 * - self assessment
 *
 * OR
 *
 * - doctor assessment identified by an opaque relationshipId
 */
export type AssessmentSubject =
  | PatientSelfAssessmentSubject
  | DoctorPatientAssessmentSubject;

/**
 * ------------------------------------------------------------
 * PATIENT SELF-ASSESSMENT
 * ------------------------------------------------------------
 *
 * Current authenticated patient is automatically the subject.
 */
export interface PatientSelfAssessmentSubject {
  mode: "patient-self";
}

/**
 * ------------------------------------------------------------
 * DOCTOR-CREATED ASSESSMENT
 * ------------------------------------------------------------
 *
 * The browser knows only relationshipId.
 *
 * Server later resolves:
 *
 * relationshipId
 * + authenticated doctor
 * + status = active
 *
 * into the internal patient ID.
 */
export interface DoctorPatientAssessmentSubject {
  mode: "doctor-patient";

  relationshipId: string;

  /**
   * Safe display metadata only.
   *
   * Useful for showing:
   *
   * "Assessment for John Smith"
   *
   * throughout the stepper.
   */
  patient: {
    fullName: string | null;
  };
}

/**
 * Convenient helper for narrowing the subject.
 */
export function isDoctorPatientAssessment(
  subject: AssessmentSubject,
): subject is DoctorPatientAssessmentSubject {
  return subject.mode === "doctor-patient";
}

/**
 * Convenient helper for patient self-assessment.
 */
export function isPatientSelfAssessment(
  subject: AssessmentSubject,
): subject is PatientSelfAssessmentSubject {
  return subject.mode === "patient-self";
}
