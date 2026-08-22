// import "server-only";

// import type { BiologicalAgeCalculationResult } from "@/types/calculations/biological-age-calculation";
// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// export interface SavedBiologicalAgeResult {
//   id: string;
//   result: BiologicalAgeCalculationResult;
//   createdAt: string;
// }

// export async function saveReportResult(
//   result: BiologicalAgeCalculationResult,
// ): Promise<SavedBiologicalAgeResult> {
//   const supabase = createSupabaseAdminClient();

//   const { data, error } = await supabase
//     .from("biological_age_results")
//     .insert({
//       result,
//     })
//     .select("id, result, created_at")
//     .single();

//   if (error) {
//     console.error("Failed to save biological age result:", error);

//     throw new Error(`Failed to save biological age result: ${error.message}`);
//   }

//   if (!data) {
//     throw new Error(
//       "Biological age result was inserted, but Supabase returned no data.",
//     );
//   }

//   return {
//     id: data.id,
//     result: data.result as BiologicalAgeCalculationResult,
//     createdAt: data.created_at,
//   };
// }
import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
import type { BiologicalAgeCalculationResult } from "@/types/calculations/biological-age-calculation";
import { PeptideDoseCalculationResult } from "@/types/calculations/peptide-dose-calculation";
import { HBOTCalculationResult } from "@/types/calculations/htbot-calculations";

export interface CreateReportInput {
  patientName: string;
  dateOfBirth: string;
  evaluationDate: string;
  gender: "male" | "female";
  results: {
    IFI: IFICalculationResult;
    BiologicalAge: BiologicalAgeCalculationResult;
    PeptideDose: PeptideDoseCalculationResult;
    HBOTSessions: HBOTCalculationResult;
  };
}

export interface CreatedReport {
  id: string;

  patientName: string;
  dateOfBirth: string;
  evaluationDate: string;
  gender: "male" | "female";

  results: {
    IFI: IFICalculationResult;
    BiologicalAge: BiologicalAgeCalculationResult;
    PeptideDose: PeptideDoseCalculationResult;
    HBOTSessions: HBOTCalculationResult;
  };

  pdfStatus: "pending" | "generating" | "ready" | "failed";
  pdfPath: string | null;
  pdfGeneratedAt: string | null;
  pdfError: string | null;

  createdAt: string;
  updatedAt: string;
}

export async function createReport(
  input: CreateReportInput,
): Promise<CreatedReport> {
  const supabase = createSupabaseAdminClient();

  console.log("Input: ", input);

  const { data, error } = await supabase
    .from("reports")
    .insert({
      patient_name: input.patientName.trim(),
      date_of_birth: input.dateOfBirth,
      evaluation_date: input.evaluationDate,
      gender: input.gender,

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

  const calculationResults = data.calculation_results as {
    IFI: IFICalculationResult;
    BiologicalAge: BiologicalAgeCalculationResult;
    PeptideDose: PeptideDoseCalculationResult;
    HBOTSessions: HBOTCalculationResult;
  };

  return {
    id: data.id,

    patientName: data.patient_name,
    dateOfBirth: data.date_of_birth,
    evaluationDate: data.evaluation_date,
    gender: data.gender,

    results: calculationResults,

    pdfStatus: data.pdf_status as CreatedReport["pdfStatus"],
    pdfPath: data.pdf_path,
    pdfGeneratedAt: data.pdf_generated_at,
    pdfError: data.pdf_error,

    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
