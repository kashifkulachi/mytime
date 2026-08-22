import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
import type { BiologicalAgeCalculationResult } from "@/types/calculations/biological-age-calculation";
import { PeptideDoseCalculationResult } from "@/types/calculations/peptide-dose-calculation";
import { HBOTCalculationResult } from "@/types/calculations/htbot-calculations";

export type ReportPdfStatus = "pending" | "generating" | "ready" | "failed";

export interface ReportCalculationResults {
  IFI: IFICalculationResult;
  BiologicalAge: BiologicalAgeCalculationResult;
  PeptideDose: PeptideDoseCalculationResult;
  HBOTSessions: HBOTCalculationResult;
}

export interface ReportRecord {
  id: string;

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
    console.error("Failed to retrieve report:", error);

    // throw new Error(`Failed to retrieve report: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as ReportDatabaseRow;

  return {
    id: row.id,

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

// {
//   "IFI": {
//     "ifi": 3.910583,
//     "rawIfi": 3.910583317768749,
//     "ifiRange": 0,
//     "breakdown": {
//       "k": 43690.36366565936,
//       "pv": 12.07763205107092,
//       "ageRatio": 0.6704534343138039,
//       "ageInDays": 18856,
//       "sexFactor": 1.75,
//       "heightMeters": 1.6,
//       "submittedBmi": 33.20312499999999,
//       "bmiDifference": 0,
//       "calculatedBmi": 33.20312499999999,
//       "lifeExpectancyYears": 77
//     },
//     "calculatedAt": "2026-08-18T21:28:05.481Z",
//     "evaluationDate": "2026-08-18",
//     "formulaVersion": "vita-voice-ifi-range-0-25-v1",
//     "classifications": {
//       "gutBrainAxis": "Normal",
//       "neurological": "Normal",
//       "cardiovascular": "Normal",
//       "endocrineMetabolic": "Normal",
//       "tumoralProliferative": "Normal"
//     },
//     "inflammationCoefficient": 11.995074202010167,
//     "inflammationCoefficientPercent": 12
//   },
//   "PeptideDose": {
//     "calculatedAt": "2026-08-18T21:28:05.482Z",
//     "formulaVersion": "vita-voice-treatment-dose-v3",
//     "recommendations": [
//       {
//         "treatment": {
//           "id": "semaglutide",
//           "notes": "Start at the approved starting dose and titrate according to the treatment protocol.",
//           "category": "peptide",
//           "frequency": "once-weekly",
//           "administration": "subcutaneous",
//           "commercialName": "Wegovy®, Ozempic®",
//           "activeIngredient": "Semaglutide",
//           "frequencyDisplay": "Once weekly",
//           "primaryIndication": "Chronic weight management",
//           "maximumApprovedDose": "2.4 mg",
//           "approvedStartingDose": "0.25 mg",
//           "administrationDisplay": "Subcutaneous",
//           "approvedTitrationSteps": "0.25 → 0.5 → 1.0 → 1.7 → 2.4 mg"
//         },
//         "recommendedMaximumDose": 2.122645287285722,
//         "recommendedMaximumDoseUnit": "mg"
//       },
//       {
//         "treatment": {
//           "id": "tirzepatide",
//           "notes": "Start at the approved starting dose and titrate according to the treatment protocol.",
//           "category": "peptide",
//           "frequency": "once-weekly",
//           "administration": "subcutaneous",
//           "commercialName": "Zepbound®, Mounjaro®",
//           "activeIngredient": "Tirzepatide",
//           "frequencyDisplay": "Once weekly",
//           "primaryIndication": "Chronic weight management",
//           "maximumApprovedDose": "15 mg",
//           "approvedStartingDose": "2.5 mg",
//           "administrationDisplay": "Subcutaneous",
//           "approvedTitrationSteps": "2.5 → 5 → 7.5 → 10 → 12.5 → 15 mg"
//         },
//         "recommendedMaximumDose": 1.698116229828578,
//         "recommendedMaximumDoseUnit": "mg"
//       },
//       {
//         "treatment": {
//           "id": "liraglutide",
//           "notes": "Start at the approved starting dose and titrate according to the treatment protocol.",
//           "category": "peptide",
//           "frequency": "once-daily",
//           "administration": "subcutaneous",
//           "commercialName": "Saxenda®, Victoza®",
//           "activeIngredient": "Liraglutide",
//           "frequencyDisplay": "Once daily",
//           "primaryIndication": "Chronic weight management",
//           "maximumApprovedDose": "3.0 mg",
//           "approvedStartingDose": "0.6 mg",
//           "administrationDisplay": "Subcutaneous",
//           "approvedTitrationSteps": "0.6 → 1.2 → 1.8 → 2.4 → 3.0 mg"
//         },
//         "recommendedMaximumDose": 3.8207615171143,
//         "recommendedMaximumDoseUnit": "mg"
//       },
//       {
//         "treatment": {
//           "id": "olive-oil-moringa",
//           "notes": "Nutritional supplement recommendation expressed in drops.",
//           "category": "nutritional-supplement",
//           "frequency": "once-daily",
//           "administration": "oral",
//           "commercialName": "Neuron ON®",
//           "activeIngredient": "Olive oil and Moringa",
//           "frequencyDisplay": "Once daily",
//           "primaryIndication": "Nutritional Supplement",
//           "maximumApprovedDose": "3 drops",
//           "approvedStartingDose": "1 drop",
//           "administrationDisplay": "Oral",
//           "approvedTitrationSteps": "1 → 2 → 3 drops"
//         },
//         "recommendedMaximumDose": 25.47174344742867,
//         "recommendedMaximumDoseUnit": "drops"
//       }
//     ]
//   },
//   "BiologicalAge": {
//     "breakdown": {
//       "rawIfiUsed": 3.910583317768749,
//       "piSixConstant": 961.3891935753043,
//       "chronologicalAgeDays": 18856,
//       "chronologicalAgeYears": 51.624914442162904,
//       "biologicalAgeShiftDays": -3759.5925422787354,
//       "biologicalAgeShiftYears": -10.293203401173814
//     },
//     "calculatedAt": "2026-08-18T21:28:05.482Z",
//     "evaluationDate": "2026-08-18",
//     "formulaVersion": "1.0.0",
//     "agingCoefficient": -0.2490388890739591,
//     "biologicalAgeDays": 15096.407457721265,
//     "biologicalAgeYears": 41.33171104098909,
//     "agingCoefficientPercent": -24.9,
//     "displayBiologicalAgeYears": 41.33
//   }
// }
