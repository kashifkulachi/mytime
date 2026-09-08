// Before Autehntication Based Roles added Patient id and created by id
// import "server-only";

// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
// import type { BiologicalAgeCalculationResult } from "@/types/calculations/biological-age-calculation";
// import { PeptideDoseCalculationResult } from "@/types/calculations/peptide-dose-calculation";
// import { HBOTCalculationResult } from "@/types/calculations/htbot-calculations";

// export type ReportPdfStatus = "pending" | "generating" | "ready" | "failed";

// export interface ReportCalculationResults {
//   IFI: IFICalculationResult;
//   BiologicalAge: BiologicalAgeCalculationResult;
//   PeptideDose: PeptideDoseCalculationResult;
//   HBOTSessions: HBOTCalculationResult;
// }

// export interface ReportRecord {
//   id: string;

//   patientName: string;
//   dateOfBirth: string;
//   evaluationDate: string;
//   gender: "male" | "female";

//   results: ReportCalculationResults;

//   pdfStatus: ReportPdfStatus;
//   pdfPath: string | null;
//   pdfGeneratedAt: string | null;
//   pdfError: string | null;

//   createdAt: string;
//   updatedAt: string;
// }

// interface ReportDatabaseRow {
//   id: string;

//   patient_name: string;
//   date_of_birth: string;
//   evaluation_date: string;
//   gender: "male" | "female";

//   calculation_results: ReportCalculationResults;

//   pdf_status: ReportPdfStatus;
//   pdf_path: string | null;
//   pdf_generated_at: string | null;
//   pdf_error: string | null;

//   created_at: string;
//   updated_at: string;
// }

// export async function getReportById(
//   reportId: string,
// ): Promise<ReportRecord | null> {
//   const normalizedReportId = reportId.trim();

//   if (!normalizedReportId) {
//     throw new Error("Report ID is required.");
//   }

//   const supabase = createSupabaseAdminClient();

//   const { data, error } = await supabase
//     .from("reports")
//     .select(
//       `
//         id,
//         patient_name,
//         gender,
//         date_of_birth,
//         evaluation_date,
//         calculation_results,
//         pdf_status,
//         pdf_path,
//         pdf_generated_at,
//         pdf_error,
//         created_at,
//         updated_at
//       `,
//     )
//     .eq("id", normalizedReportId)
//     .maybeSingle();

//   if (error) {
//     console.error("Failed to retrieve report:", error);

//     // throw new Error(`Failed to retrieve report: ${error.message}`);
//   }

//   if (!data) {
//     return null;
//   }

//   const row = data as ReportDatabaseRow;

//   return {
//     id: row.id,

//     patientName: row.patient_name,
//     dateOfBirth: row.date_of_birth,
//     evaluationDate: row.evaluation_date,
//     gender: row.gender,
//     results: row.calculation_results,

//     pdfStatus: row.pdf_status,
//     pdfPath: row.pdf_path,
//     pdfGeneratedAt: row.pdf_generated_at,
//     pdfError: row.pdf_error,

//     createdAt: row.created_at,
//     updatedAt: row.updated_at,
//   };
// }

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
import type { BiologicalAgeCalculationResult } from "@/types/calculations/biological-age-calculation";
import type { PeptideDoseCalculationResult } from "@/types/calculations/peptide-dose-calculation";
import type { HBOTCalculationResult } from "@/types/calculations/htbot-calculations";

export type ReportPdfStatus =
  | "pending"
  | "queued"
  | "generating"
  | "ready"
  | "failed";

export interface ReportCalculationResults {
  IFI: IFICalculationResult;
  BiologicalAge: BiologicalAgeCalculationResult;
  PeptideDose: PeptideDoseCalculationResult;
  HBOTSessions: HBOTCalculationResult;
}

export interface ReportRecord {
  id: string;

  /**
   * Internal ownership identifiers.
   *
   * These are used for server-side authorization and should not
   * be exposed to the frontend unless there is a specific need.
   *
   * They are temporarily nullable only because old development
   * rows may not yet have ownership data.
   *
   * Before production, both DB columns will become NOT NULL.
   */
  patientId: string | null;
  createdByUserId: string | null;

  patientName: string;
  dateOfBirth: string;
  evaluationDate: string;
  gender: "male" | "female";

  results: ReportCalculationResults;

  pdfStatus: ReportPdfStatus;

  pdfPath: string | null;
  pdfGeneratedAt: string | null;
  pdfError: string | null;

  createdAt: string;
  updatedAt: string;
}

interface ReportDatabaseRow {
  id: string;

  patient_id: string | null;
  created_by_user_id: string | null;

  patient_name: string;
  date_of_birth: string;
  evaluation_date: string;
  gender: "male" | "female";

  calculation_results: ReportCalculationResults;

  pdf_status: ReportPdfStatus;

  pdf_path: string | null;
  pdf_generated_at: string | null;
  pdf_error: string | null;

  created_at: string;
  updated_at: string;
}

export async function getReportById(
  reportId: string,
): Promise<ReportRecord | null> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
        id,
        patient_id,
        created_by_user_id,
        patient_name,
        gender,
        date_of_birth,
        evaluation_date,
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
    .maybeSingle();

  if (error) {
    console.error(
      `[Reports] Failed to retrieve report ${normalizedReportId}:`,
      error,
    );

    throw new Error("Failed to retrieve report.");
  }

  if (!data) {
    return null;
  }

  const row = data as ReportDatabaseRow;

  return {
    id: row.id,

    patientId: row.patient_id,
    createdByUserId: row.created_by_user_id,

    patientName: row.patient_name,
    dateOfBirth: row.date_of_birth,
    evaluationDate: row.evaluation_date,
    gender: row.gender,

    results: row.calculation_results,

    pdfStatus: row.pdf_status,

    pdfPath: row.pdf_path,
    pdfGeneratedAt: row.pdf_generated_at,
    pdfError: row.pdf_error,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
