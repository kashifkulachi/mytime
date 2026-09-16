// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// import type {
//   MedicalRecordBiologicalAgeMetrics,
//   MedicalRecordHBOTMetrics,
//   MedicalRecordHBOTRecommendation,
//   MedicalRecordIFIMetrics,
//   MedicalRecordMetrics,
//   MedicalRecordNeuronMetrics,
//   MedicalRecordPdfStatus,
//   MedicalRecordPeptideMetrics,
//   MedicalRecordPeptideRecommendation,
//   PatientMedicalRecord,
// } from "@/services/database/medical-records/getPatientMedicalRecords";

// /**
//  * ============================================================
//  * INPUT
//  * ============================================================
//  */

// export interface GetPatientMedicalRecordByIdInput {
//   /**
//    * Must already be resolved and authorized server-side.
//    *
//    * Patient:
//    *   current authenticated profile.id
//    *
//    * Doctor:
//    *   patient_id resolved from an ACTIVE
//    *   doctor-patient relationship.
//    *
//    * Never trust a browser-provided patient UUID.
//    */
//   patientId: string;

//   /**
//    * The report the user is trying to view.
//    */
//   reportId: string;
// }

// /**
//  * ============================================================
//  * DATABASE ROW
//  * ============================================================
//  */

// interface MedicalRecordDatabaseRow {
//   id: string;

//   patient_name: string;

//   date_of_birth: string;

//   evaluation_date: string;

//   gender: "male" | "female";

//   calculation_results: unknown;

//   pdf_status: MedicalRecordPdfStatus;

//   pdf_path: string | null;

//   pdf_generated_at: string | null;

//   pdf_error: string | null;

//   created_at: string;

//   updated_at: string;
// }

// /**
//  * ============================================================
//  * SERVICE
//  * ============================================================
//  *
//  * Loads a single medical record belonging to one specific
//  * patient.
//  *
//  * IMPORTANT:
//  *
//  * This service does NOT decide whether the current user has
//  * permission to access the patient.
//  *
//  * Authorization happens before calling this service.
//  *
//  * Patient route:
//  *
//  *   authenticated patient
//  *        ↓
//  *   patientId = profile.id
//  *
//  * Doctor route:
//  *
//  *   authenticated doctor
//  *        ↓
//  *   verify ACTIVE relationship
//  *        ↓
//  *   patientId = relationship.patient_id
//  *
//  * Then this query additionally verifies:
//  *
//  *   reports.id = reportId
//  *   AND
//  *   reports.patient_id = patientId
//  */
// export async function getPatientMedicalRecordById({
//   patientId,
//   reportId,
// }: GetPatientMedicalRecordByIdInput): Promise<PatientMedicalRecord | null> {
//   validateInput({
//     patientId,
//     reportId,
//   });

//   const supabase = createSupabaseAdminClient();

//   const { data, error } = await supabase
//     .from("reports")
//     .select(
//       `
//         id,
//         patient_name,
//         date_of_birth,
//         evaluation_date,
//         gender,
//         calculation_results,
//         pdf_status,
//         pdf_path,
//         pdf_generated_at,
//         pdf_error,
//         created_at,
//         updated_at
//       `,
//     )
//     .eq("id", reportId)
//     .eq("patient_id", patientId)
//     .maybeSingle();

//   if (error) {
//     throw new Error(`Failed to load medical record: ${error.message}`);
//   }

//   /**
//    * Returning null is intentional.
//    *
//    * This covers both:
//    *
//    * - report does not exist
//    * - report does not belong to this patient
//    *
//    * The API can return the same 404 response for both.
//    */
//   if (!data) {
//     return null;
//   }

//   return mapMedicalRecord(data as MedicalRecordDatabaseRow);
// }

// /**
//  * ============================================================
//  * DATABASE ROW → MEDICAL RECORD DTO
//  * ============================================================
//  */

// function mapMedicalRecord(row: MedicalRecordDatabaseRow): PatientMedicalRecord {
//   return {
//     id: row.id,

//     patientName: row.patient_name,

//     dateOfBirth: row.date_of_birth,

//     evaluationDate: row.evaluation_date,

//     gender: row.gender,

//     metrics: extractMedicalMetrics(row.calculation_results),

//     pdf: {
//       status: row.pdf_status,

//       /**
//        * Never expose pdf_path to the browser.
//        *
//        * The private PDF will later be downloaded through the
//        * existing authorized report download endpoint.
//        */
//       isAvailable: row.pdf_status === "ready" && Boolean(row.pdf_path),

//       generatedAt: row.pdf_generated_at,

//       error: row.pdf_error,
//     },

//     createdAt: row.created_at,

//     updatedAt: row.updated_at,
//   };
// }

// /**
//  * ============================================================
//  * CALCULATION RESULTS
//  * ============================================================
//  */

// function extractMedicalMetrics(
//   calculationResults: unknown,
// ): MedicalRecordMetrics {
//   if (!isRecord(calculationResults)) {
//     return emptyMetrics();
//   }

//   return {
//     ifi: extractIFIMetrics(calculationResults.IFI),

//     biologicalAge: extractBiologicalAgeMetrics(
//       calculationResults.BiologicalAge,
//     ),

//     peptideDose: extractPeptideDoseMetrics(calculationResults.PeptideDose),

//     hbotSessions: extractHBOTMetrics(calculationResults.HBOTSessions),
//   };
// }

// /**
//  * ============================================================
//  * IFI
//  * ============================================================
//  */

// function extractIFIMetrics(value: unknown): MedicalRecordIFIMetrics | null {
//   if (!isRecord(value)) {
//     return null;
//   }

//   const classifications = isRecord(value.classifications)
//     ? {
//         gutBrainAxis: readString(value.classifications.gutBrainAxis),

//         neurological: readString(value.classifications.neurological),

//         cardiovascular: readString(value.classifications.cardiovascular),

//         endocrineMetabolic: readString(
//           value.classifications.endocrineMetabolic,
//         ),

//         tumoralProliferative: readString(
//           value.classifications.tumoralProliferative,
//         ),
//       }
//     : null;

//   return {
//     ifi: readNumber(value.ifi),

//     /**
//      * rawIfi is the full-precision IFI and remains useful for
//      * future calculations such as IFI Monitoring.
//      */
//     rawIfi: readNumber(value.rawIfi),

//     ifiRange: readNumber(value.ifiRange),

//     inflammationCoefficient: readNumber(value.inflammationCoefficient),

//     inflammationCoefficientPercent: readNumber(
//       value.inflammationCoefficientPercent,
//     ),

//     classifications,
//   };
// }

// /**
//  * ============================================================
//  * BIOLOGICAL AGE
//  * ============================================================
//  */

// function extractBiologicalAgeMetrics(
//   value: unknown,
// ): MedicalRecordBiologicalAgeMetrics | null {
//   if (!isRecord(value)) {
//     return null;
//   }

//   const breakdown = isRecord(value.breakdown) ? value.breakdown : null;

//   return {
//     biologicalAgeYears: readNumber(value.biologicalAgeYears),

//     displayBiologicalAgeYears: readNumber(value.displayBiologicalAgeYears),

//     chronologicalAgeYears: breakdown
//       ? readNumber(breakdown.chronologicalAgeYears)
//       : null,

//     agingCoefficient: readNumber(value.agingCoefficient),

//     agingCoefficientPercent: readNumber(value.agingCoefficientPercent),
//   };
// }

// /**
//  * ============================================================
//  * PEPTIDE DOSE
//  * ============================================================
//  */

// function extractPeptideDoseMetrics(
//   value: unknown,
// ): MedicalRecordPeptideMetrics | null {
//   if (!isRecord(value)) {
//     return null;
//   }

//   const recommendations = Array.isArray(value.recommendations)
//     ? value.recommendations
//         .map(extractPeptideRecommendation)
//         .filter(
//           (
//             recommendation,
//           ): recommendation is MedicalRecordPeptideRecommendation =>
//             recommendation !== null,
//         )
//     : [];

//   return {
//     ifiRange: readNumber(value.ifiRange),

//     recommendations,

//     neuronOliveMoringa: extractNeuronMetrics(value.neuronOliveMoringa),
//   };
// }

// function extractPeptideRecommendation(
//   value: unknown,
// ): MedicalRecordPeptideRecommendation | null {
//   if (!isRecord(value)) {
//     return null;
//   }

//   const treatment = isRecord(value.treatment) ? value.treatment : null;

//   return {
//     treatmentId: treatment ? readString(treatment.id) : null,

//     treatmentName: treatment ? readString(treatment.therapy) : null,

//     treatmentGroup: treatment ? readString(treatment.group) : null,

//     indication: treatment ? readString(treatment.indication) : null,

//     activeIngredient: treatment ? readString(treatment.activeIngredient) : null,

//     recommendedDose: readNumber(value.recommendedDose),

//     unit: readString(value.unit),
//   };
// }

// function extractNeuronMetrics(
//   value: unknown,
// ): MedicalRecordNeuronMetrics | null {
//   if (!isRecord(value)) {
//     return null;
//   }

//   return {
//     productName: readString(value.productName),

//     activeIngredients: readString(value.activeIngredients),

//     recommendedDrops: readNumber(value.recommendedDrops),

//     unit: readString(value.unit),
//   };
// }

// /**
//  * ============================================================
//  * HBOT
//  * ============================================================
//  */

// function extractHBOTMetrics(value: unknown): MedicalRecordHBOTMetrics | null {
//   if (!isRecord(value)) {
//     return null;
//   }

//   const recommendations = Array.isArray(value.recommendations)
//     ? value.recommendations
//         .map(extractHBOTRecommendation)
//         .filter(
//           (recommendation): recommendation is MedicalRecordHBOTRecommendation =>
//             recommendation !== null,
//         )
//     : [];

//   return {
//     recommendations,
//   };
// }

// function extractHBOTRecommendation(
//   value: unknown,
// ): MedicalRecordHBOTRecommendation | null {
//   if (!isRecord(value)) {
//     return null;
//   }

//   const protocol = isRecord(value.protocol) ? value.protocol : null;

//   return {
//     protocolId: protocol ? readString(protocol.id) : null,

//     protocolName: protocol ? readString(protocol.name) : null,

//     pressureAta: protocol ? readNumber(protocol.pressureAta) : null,

//     oxygenPercent: protocol ? readNumber(protocol.oxygenPercent) : null,

//     durationMinutes: protocol ? readNumber(protocol.durationMinutes) : null,

//     calculatedSessions: readNumber(value.calculatedSessions),
//   };
// }

// /**
//  * ============================================================
//  * EMPTY METRICS
//  * ============================================================
//  */

// function emptyMetrics(): MedicalRecordMetrics {
//   return {
//     ifi: null,

//     biologicalAge: null,

//     peptideDose: null,

//     hbotSessions: null,
//   };
// }

// /**
//  * ============================================================
//  * INPUT VALIDATION
//  * ============================================================
//  */

// function validateInput({
//   patientId,
//   reportId,
// }: GetPatientMedicalRecordByIdInput): void {
//   if (typeof patientId !== "string" || !patientId.trim()) {
//     throw new Error("Patient ID is required.");
//   }

//   if (typeof reportId !== "string" || !reportId.trim()) {
//     throw new Error("Report ID is required.");
//   }
// }

// /**
//  * ============================================================
//  * RUNTIME HELPERS
//  * ============================================================
//  */

// function isRecord(value: unknown): value is Record<string, unknown> {
//   return typeof value === "object" && value !== null && !Array.isArray(value);
// }

// function readNumber(value: unknown): number | null {
//   if (typeof value !== "number" || !Number.isFinite(value)) {
//     return null;
//   }

//   return value;
// }

// function readString(value: unknown): string | null {
//   if (typeof value !== "string") {
//     return null;
//   }

//   const normalized = value.trim();

//   return normalized ? normalized : null;
// }
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { PatientMedicalRecord } from "@/services/database/medical-records/getPatientMedicalRecords";

import {
  mapMedicalRecord,
  type MedicalRecordDatabaseRow,
} from "@/services/database/medical-records/mapMedicalRecord";

/**
 * ============================================================
 * INPUT
 * ============================================================
 */

export interface GetPatientMedicalRecordByIdInput {
  patientId: string;
  reportId: string;
}

/**
 * ============================================================
 * GET PATIENT MEDICAL RECORD BY ID
 * ============================================================
 *
 * This is a database/data service.
 *
 * IMPORTANT:
 *
 * This service does NOT decide whether the current authenticated
 * user is authorized to access the supplied patientId.
 *
 * Authorization must happen before calling this service.
 *
 * Patient flow:
 *
 *   patientId = authenticated profile.id
 *
 * Doctor flow:
 *
 *   patientId = patient_id resolved from a verified ACTIVE
 *   doctor-patient relationship.
 *
 * We query using BOTH:
 *
 *   reports.id = reportId
 *   reports.patient_id = patientId
 *
 * This prevents a report belonging to another patient from being
 * returned even if its report UUID is known.
 */
export async function getPatientMedicalRecordById({
  patientId,
  reportId,
}: GetPatientMedicalRecordByIdInput): Promise<PatientMedicalRecord | null> {
  /**
   * ==========================================================
   * 1. VALIDATE INPUT
   * ==========================================================
   */

  const normalizedPatientId = patientId.trim();

  const normalizedReportId = reportId.trim();

  if (!normalizedPatientId) {
    throw new Error("Patient ID is required.");
  }

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  /**
   * ==========================================================
   * 2. QUERY REPORT
   * ==========================================================
   */

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
        id,
        patient_name,
        date_of_birth,
        evaluation_date,
        gender,
        ifi_functional_profile_version,
        calculation_results,
        pdf_status,
        pdf_path,
        pdf_generated_at,
        pdf_error,
        created_at,
        updated_at
      `,
    )
    .eq("id", normalizedReportId)
    .eq("patient_id", normalizedPatientId)
    .maybeSingle();

  /**
   * ==========================================================
   * 3. DATABASE ERROR
   * ==========================================================
   */

  if (error) {
    console.error(
      "[getPatientMedicalRecordById] Failed to load medical record:",
      {
        code: error.code,

        message: error.message,
      },
    );

    throw new Error("Unable to load medical record.");
  }

  /**
   * ==========================================================
   * 4. NOT FOUND
   * ==========================================================
   */

  if (!data) {
    return null;
  }

  /**
   * ==========================================================
   * 5. MAP DATABASE ROW
   * ==========================================================
   *
   * The exact same mapper is now used by:
   *
   * - getPatientMedicalRecords()
   * - getPatientMedicalRecordById()
   *
   * Therefore IFI, Biological Age, Peptide Dose, HBOT,
   * gender and PDF information cannot drift between the
   * history and detail services.
   */

  return mapMedicalRecord(data as MedicalRecordDatabaseRow);
}
