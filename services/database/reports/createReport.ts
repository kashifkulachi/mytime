// Before the getOrCreateIFIMonitoringCycle() function implemented after report creation
// import "server-only";

// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
// import type { BiologicalAgeCalculationResult } from "@/types/calculations/biological-age-calculation";
// import type { PeptideDoseCalculationResult } from "@/types/calculations/peptide-dose-calculation";
// import type { HBOTCalculationResult } from "@/types/calculations/htbot-calculations";

// export interface CreateReportInput {
//   patientId: string;

//   createdByUserId: string;

//   patientName: string;

//   dateOfBirth: string;

//   evaluationDate: string;

//   gender: "male" | "female";

//   /**
//    * Exact IFI functional-profile version used for this report.
//    *
//    * This allows historical reports to continue using the same
//    * clinical profile even if a newer version becomes active
//    * later.
//    *
//    * null is allowed for legacy/backward-compatible workflows.
//    */
//   ifiFunctionalProfileVersion: number | null;

//   results: {
//     IFI: IFICalculationResult;

//     BiologicalAge: BiologicalAgeCalculationResult;

//     PeptideDose: PeptideDoseCalculationResult;

//     HBOTSessions: HBOTCalculationResult;
//   };
// }

// export interface CreatedReport {
//   id: string;

//   patientId: string;

//   createdByUserId: string;

//   patientName: string;

//   dateOfBirth: string;

//   evaluationDate: string;

//   gender: "male" | "female";

//   ifiFunctionalProfileVersion: number | null;

//   results: {
//     IFI: IFICalculationResult;

//     BiologicalAge: BiologicalAgeCalculationResult;

//     PeptideDose: PeptideDoseCalculationResult;

//     HBOTSessions: HBOTCalculationResult;
//   };

//   pdfStatus: "pending" | "queued" | "generating" | "ready" | "failed";

//   pdfPath: string | null;

//   pdfGeneratedAt: string | null;

//   pdfError: string | null;

//   createdAt: string;

//   updatedAt: string;
// }

// export async function createReport(
//   input: CreateReportInput,
// ): Promise<CreatedReport> {
//   const normalizedPatientId = input.patientId.trim();

//   const normalizedCreatedByUserId = input.createdByUserId.trim();

//   const normalizedPatientName = input.patientName.trim();

//   if (!normalizedPatientId) {
//     throw new Error("Patient ID is required.");
//   }

//   if (!normalizedCreatedByUserId) {
//     throw new Error("Created-by user ID is required.");
//   }

//   if (!normalizedPatientName) {
//     throw new Error("Patient name is required.");
//   }

//   /**
//    * Validate the profile version when one is supplied.
//    *
//    * Legacy/backward-compatible callers may still provide null.
//    */
//   if (
//     input.ifiFunctionalProfileVersion !== null &&
//     (!Number.isSafeInteger(input.ifiFunctionalProfileVersion) ||
//       input.ifiFunctionalProfileVersion < 1)
//   ) {
//     throw new Error(
//       "IFI functional profile version must be a positive integer.",
//     );
//   }

//   const supabase = createSupabaseAdminClient();

//   const { data, error } = await supabase
//     .from("reports")
//     .insert({
//       patient_id: normalizedPatientId,

//       created_by_user_id: normalizedCreatedByUserId,

//       patient_name: normalizedPatientName,

//       date_of_birth: input.dateOfBirth,

//       evaluation_date: input.evaluationDate,

//       gender: input.gender,

//       ifi_functional_profile_version: input.ifiFunctionalProfileVersion,

//       calculation_results: {
//         IFI: input.results.IFI,

//         BiologicalAge: input.results.BiologicalAge,

//         PeptideDose: input.results.PeptideDose,

//         HBOTSessions: input.results.HBOTSessions,
//       },
//     })
//     .select(
//       `
//           id,
//           patient_id,
//           created_by_user_id,
//           patient_name,
//           gender,
//           date_of_birth,
//           evaluation_date,
//           ifi_functional_profile_version,
//           calculation_results,
//           pdf_status,
//           pdf_path,
//           pdf_generated_at,
//           pdf_error,
//           created_at,
//           updated_at
//         `,
//     )
//     .single();

//   if (error) {
//     console.error("Failed to create report:", error);

//     throw new Error(`Failed to create report: ${error.message}`);
//   }

//   if (!data) {
//     throw new Error(
//       "Report was created, but Supabase returned no report data.",
//     );
//   }

//   if (!data.patient_id) {
//     throw new Error("Report was created without a patient owner.");
//   }

//   if (!data.created_by_user_id) {
//     throw new Error("Report was created without a creator.");
//   }

//   const calculationResults = data.calculation_results as {
//     IFI: IFICalculationResult;

//     BiologicalAge: BiologicalAgeCalculationResult;

//     PeptideDose: PeptideDoseCalculationResult;

//     HBOTSessions: HBOTCalculationResult;
//   };

//   return {
//     id: data.id,

//     patientId: data.patient_id,

//     createdByUserId: data.created_by_user_id,

//     patientName: data.patient_name,

//     dateOfBirth: data.date_of_birth,

//     evaluationDate: data.evaluation_date,

//     gender: data.gender,

//     ifiFunctionalProfileVersion: data.ifi_functional_profile_version,

//     results: calculationResults,

//     pdfStatus: data.pdf_status as CreatedReport["pdfStatus"],

//     pdfPath: data.pdf_path,

//     pdfGeneratedAt: data.pdf_generated_at,

//     pdfError: data.pdf_error,

//     createdAt: data.created_at,

//     updatedAt: data.updated_at,
//   };
// }

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateIFIMonitoringCycle } from "@/services/database/ifi-monitoring/getOrCreateIFIMonitoringCycle";
import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
import type { BiologicalAgeCalculationResult } from "@/types/calculations/biological-age-calculation";
import type { PeptideDoseCalculationResult } from "@/types/calculations/peptide-dose-calculation";
import type { HBOTCalculationResult } from "@/types/calculations/htbot-calculations";

export interface CreateReportInput {
  patientId: string;

  createdByUserId: string;

  patientName: string;

  dateOfBirth: string;

  evaluationDate: string;

  gender: "male" | "female";

  /**
   * Exact IFI functional-profile version used for this report.
   *
   * This allows historical reports to continue using the same
   * clinical profile even if a newer version becomes active
   * later.
   *
   * null is allowed for legacy/backward-compatible workflows.
   */
  ifiFunctionalProfileVersion: number | null;

  results: {
    IFI: IFICalculationResult;

    BiologicalAge: BiologicalAgeCalculationResult;

    PeptideDose: PeptideDoseCalculationResult;

    HBOTSessions: HBOTCalculationResult;
  };
}

export interface CreatedReport {
  id: string;

  patientId: string;

  createdByUserId: string;

  patientName: string;

  dateOfBirth: string;

  evaluationDate: string;

  gender: "male" | "female";

  ifiFunctionalProfileVersion: number | null;

  results: {
    IFI: IFICalculationResult;

    BiologicalAge: BiologicalAgeCalculationResult;

    PeptideDose: PeptideDoseCalculationResult;

    HBOTSessions: HBOTCalculationResult;
  };

  pdfStatus: "pending" | "queued" | "generating" | "ready" | "failed";

  pdfPath: string | null;

  pdfGeneratedAt: string | null;

  pdfError: string | null;

  createdAt: string;

  updatedAt: string;
}

export async function createReport(
  input: CreateReportInput,
): Promise<CreatedReport> {
  const normalizedPatientId = input.patientId.trim();

  const normalizedCreatedByUserId = input.createdByUserId.trim();

  const normalizedPatientName = input.patientName.trim();

  if (!normalizedPatientId) {
    throw new Error("Patient ID is required.");
  }

  if (!normalizedCreatedByUserId) {
    throw new Error("Created-by user ID is required.");
  }

  if (!normalizedPatientName) {
    throw new Error("Patient name is required.");
  }

  /**
   * Validate the profile version when one is supplied.
   *
   * Legacy/backward-compatible callers may still provide null.
   */
  if (
    input.ifiFunctionalProfileVersion !== null &&
    (!Number.isSafeInteger(input.ifiFunctionalProfileVersion) ||
      input.ifiFunctionalProfileVersion < 1)
  ) {
    throw new Error(
      "IFI functional profile version must be a positive integer.",
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("reports")
    .insert({
      patient_id: normalizedPatientId,

      created_by_user_id: normalizedCreatedByUserId,

      patient_name: normalizedPatientName,

      date_of_birth: input.dateOfBirth,

      evaluation_date: input.evaluationDate,

      gender: input.gender,

      ifi_functional_profile_version: input.ifiFunctionalProfileVersion,

      calculation_results: {
        IFI: input.results.IFI,

        BiologicalAge: input.results.BiologicalAge,

        PeptideDose: input.results.PeptideDose,

        HBOTSessions: input.results.HBOTSessions,
      },
    })
    .select(
      `
          id,
          patient_id,
          created_by_user_id,
          patient_name,
          gender,
          date_of_birth,
          evaluation_date,
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
    .single();

  if (error) {
    console.error("Failed to create report:", error);

    throw new Error(`Failed to create report: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "Report was created, but Supabase returned no report data.",
    );
  }

  if (!data.patient_id) {
    throw new Error("Report was created without a patient owner.");
  }

  if (!data.created_by_user_id) {
    throw new Error("Report was created without a creator.");
  }

  /**
   * ============================================================
   * IFI MONITORING CYCLE
   * ============================================================
   *
   * Every successfully persisted clinical report participates in
   * the patient's longitudinal IFI monitoring.
   *
   * The cycle service determines whether this report:
   *
   * - establishes Day 0 of a new cycle,
   * - belongs to the patient's existing Day 0 -> Day 30 cycle,
   * - or starts a new cycle after the previous cycle has ended.
   *
   * IMPORTANT:
   *
   * The report must exist before this runs because the monitoring
   * service resolves the report using its database ID.
   *
   * Monitoring is independent from PDF generation, so cycle
   * assignment happens immediately after clinical persistence.
   */
  try {
    const monitoringCycle = await getOrCreateIFIMonitoringCycle({
      reportId: data.id,
    });

    console.info("[Create Report] IFI monitoring cycle resolved:", {
      reportId: data.id,
      patientId: data.patient_id,
      cycleId: monitoringCycle.id,
      cycleStartDate: monitoringCycle.startDate,
      cycleEndDate: monitoringCycle.endDate,
      cycleStatus: monitoringCycle.status,
    });
  } catch (monitoringError) {
    console.error("[Create Report] Failed to resolve IFI monitoring cycle:", {
      reportId: data.id,
      patientId: data.patient_id,
      error: monitoringError,
    });

    throw new Error(
      monitoringError instanceof Error
        ? `Report was created, but IFI monitoring setup failed: ${monitoringError.message}`
        : "Report was created, but IFI monitoring setup failed.",
    );
  }

  const calculationResults = data.calculation_results as {
    IFI: IFICalculationResult;

    BiologicalAge: BiologicalAgeCalculationResult;

    PeptideDose: PeptideDoseCalculationResult;

    HBOTSessions: HBOTCalculationResult;
  };

  return {
    id: data.id,

    patientId: data.patient_id,

    createdByUserId: data.created_by_user_id,

    patientName: data.patient_name,

    dateOfBirth: data.date_of_birth,

    evaluationDate: data.evaluation_date,

    gender: data.gender,

    ifiFunctionalProfileVersion: data.ifi_functional_profile_version,

    results: calculationResults,

    pdfStatus: data.pdf_status as CreatedReport["pdfStatus"],

    pdfPath: data.pdf_path,

    pdfGeneratedAt: data.pdf_generated_at,

    pdfError: data.pdf_error,

    createdAt: data.created_at,

    updatedAt: data.updated_at,
  };
}
