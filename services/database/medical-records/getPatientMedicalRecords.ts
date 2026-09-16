// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// import {
//   mapMedicalRecord,
//   type MedicalRecordDatabaseRow,
// } from "@/services/database/medical-records/mapMedicalRecord";

// /**
//  * ============================================================
//  * MEDICAL RECORD TYPES
//  * ============================================================
//  */

// export type MedicalRecordPdfStatus =
//   | "pending"
//   | "queued"
//   | "generating"
//   | "ready"
//   | "failed";

// export interface MedicalRecordIFIMetrics {
//   ifi: number | null;
//   rawIfi: number | null;
//   ifiRange: number | null;
//   riskLabel: string | null;

//   inflammationCoefficient: number | null;

//   inflammationCoefficientPercent: number | null;

//   classifications: {
//     gutBrainAxis: string | null;
//     neurological: string | null;
//     cardiovascular: string | null;
//     endocrineMetabolic: string | null;
//     tumoralProliferative: string | null;
//   } | null;
// }

// export interface MedicalRecordBiologicalAgeMetrics {
//   biologicalAgeYears: number | null;

//   displayBiologicalAgeYears: number | null;

//   chronologicalAgeYears: number | null;

//   agingCoefficient: number | null;

//   agingCoefficientPercent: number | null;
// }

// export interface MedicalRecordPeptideRecommendation {
//   treatmentId: string | null;
//   treatmentName: string | null;
//   treatmentGroup: string | null;
//   indication: string | null;
//   activeIngredient: string | null;
//   recommendedDose: number | null;
//   unit: string | null;
// }

// export interface MedicalRecordNeuronMetrics {
//   productName: string | null;

//   activeIngredients: string | null;

//   recommendedDrops: number | null;

//   unit: string | null;
// }

// export interface MedicalRecordPeptideMetrics {
//   ifiRange: number | null;

//   recommendations: MedicalRecordPeptideRecommendation[];

//   neuronOliveMoringa: MedicalRecordNeuronMetrics | null;
// }

// export interface MedicalRecordHBOTRecommendation {
//   protocolId: string | null;
//   protocolName: string | null;

//   pressureAta: number | null;

//   oxygenPercent: number | null;

//   durationMinutes: number | null;

//   calculatedSessions: number | null;
// }

// export interface MedicalRecordHBOTMetrics {
//   recommendations: MedicalRecordHBOTRecommendation[];
// }

// export interface MedicalRecordMetrics {
//   ifi: MedicalRecordIFIMetrics | null;

//   biologicalAge: MedicalRecordBiologicalAgeMetrics | null;

//   peptideDose: MedicalRecordPeptideMetrics | null;

//   hbotSessions: MedicalRecordHBOTMetrics | null;
// }

// export interface PatientMedicalRecord {
//   id: string;

//   patientName: string;

//   dateOfBirth: string;

//   evaluationDate: string;

//   gender: "male" | "female";

//   metrics: MedicalRecordMetrics;

//   ifiFunctionalProfileVersion: number | null;

//   pdf: {
//     status: MedicalRecordPdfStatus;

//     isAvailable: boolean;

//     generatedAt: string | null;

//     error: string | null;
//   };

//   createdAt: string;

//   updatedAt: string;
// }

// export interface PatientMedicalRecordsResult {
//   records: PatientMedicalRecord[];

//   pagination: {
//     page: number;

//     pageSize: number;

//     totalRecords: number;

//     totalPages: number;

//     hasNextPage: boolean;

//     hasPreviousPage: boolean;
//   };
// }

// /**
//  * ============================================================
//  * SERVICE INPUT
//  * ============================================================
//  */

// export interface GetPatientMedicalRecordsInput {
//   patientId: string;

//   page?: number;

//   pageSize?: number;
// }

// /**
//  * ============================================================
//  * GET PATIENT MEDICAL RECORDS
//  * ============================================================
//  *
//  * Important:
//  *
//  * This is a database/data service.
//  *
//  * It does NOT decide whether a user is authorized to access
//  * the supplied patientId.
//  *
//  * Authorization must happen before calling this service.
//  *
//  * Examples:
//  *
//  * Patient flow:
//  *   patientId = authenticated profile.id
//  *
//  * Doctor flow:
//  *   patientId = patient_id resolved from a verified active
//  *   doctor-patient relationship.
//  *
//  * The browser must never be trusted to choose patientId.
//  */
// // export async function getPatientMedicalRecords({
// //   patientId,
// //   page = 1,
// //   pageSize = 20,
// // }: GetPatientMedicalRecordsInput): Promise<PatientMedicalRecordsResult> {
// //   /**
// //    * ==========================================================
// //    * 1. VALIDATE INPUT
// //    * ==========================================================
// //    */

// //   const normalizedPatientId = patientId.trim();

// //   if (!normalizedPatientId) {
// //     throw new Error("Patient ID is required.");
// //   }

// //   if (!Number.isSafeInteger(page) || page < 1) {
// //     throw new Error("Page must be a positive integer.");
// //   }

// //   if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
// //     throw new Error("Page size must be between 1 and 100.");
// //   }

// //   /**
// //    * ==========================================================
// //    * 2. CALCULATE DATABASE RANGE
// //    * ==========================================================
// //    */

// //   const from = (page - 1) * pageSize;

// //   const to = from + pageSize - 1;

// //   /**
// //    * ==========================================================
// //    * 3. QUERY REPORTS
// //    * ==========================================================
// //    */

// //   const supabase = createSupabaseAdminClient();

// //   const { data, error, count } = await supabase
// //     .from("reports")
// //     .select(
// //       `
// //         id,
// //         patient_name,
// //         date_of_birth,
// //         evaluation_date,
// //         gender,
// //         calculation_results,
// //         pdf_status,
// //         pdf_path,
// //         pdf_generated_at,
// //         pdf_error,
// //         created_at,
// //         updated_at
// //       `,
// //       {
// //         count: "exact",
// //       },
// //     )
// //     .eq("patient_id", normalizedPatientId)
// //     .order("evaluation_date", {
// //       ascending: false,
// //     })
// //     .order("created_at", {
// //       ascending: false,
// //     })
// //     .range(from, to);

// //   if (error) {
// //     console.error(
// //       "[getPatientMedicalRecords] Failed to load patient medical records:",
// //       {
// //         code: error.code,

// //         message: error.message,
// //       },
// //     );

// //     throw new Error("Unable to load medical records.");
// //   }

// //   /**
// //    * ==========================================================
// //    * 4. MAP DATABASE ROWS
// //    * ==========================================================
// //    *
// //    * All report/calculation parsing now happens inside:
// //    *
// //    * services/database/medical-records/mapMedicalRecord.ts
// //    *
// //    * This keeps the list and detail services consistent.
// //    */

// //   const rows = (data ?? []) as MedicalRecordDatabaseRow[];

// //   const records = rows.map(mapMedicalRecord);

// //   /**
// //    * ==========================================================
// //    * 5. PAGINATION
// //    * ==========================================================
// //    */

// //   const totalRecords = count ?? 0;

// //   const totalPages =
// //     totalRecords === 0 ? 0 : Math.ceil(totalRecords / pageSize);

// //   return {
// //     records,

// //     pagination: {
// //       page,

// //       pageSize,

// //       totalRecords,

// //       totalPages,

// //       hasNextPage: page < totalPages,

// //       hasPreviousPage: page > 1 && totalPages > 0,
// //     },
// //   };
// // }

// export async function getPatientMedicalRecords({
//   patientId,
//   page = 1,
//   pageSize = 20,
// }: GetPatientMedicalRecordsInput): Promise<PatientMedicalRecordsResult> {
//   /**
//    * ==========================================================
//    * 1. VALIDATE INPUT
//    * ==========================================================
//    */

//   const normalizedPatientId = patientId.trim();

//   if (!normalizedPatientId) {
//     throw new Error("Patient ID is required.");
//   }

//   if (!Number.isSafeInteger(page) || page < 1) {
//     throw new Error("Page must be a positive integer.");
//   }

//   if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
//     throw new Error("Page size must be between 1 and 100.");
//   }

//   /**
//    * ==========================================================
//    * 2. CALCULATE DATABASE RANGE
//    * ==========================================================
//    */

//   const from = (page - 1) * pageSize;

//   const to = from + pageSize - 1;

//   /**
//    * ==========================================================
//    * 3. QUERY REPORTS
//    * ==========================================================
//    */

//   const supabase = createSupabaseAdminClient();

//   const { data, error, count } = await supabase
//     .from("reports")
//     .select(
//       `
//         id,
//         patient_name,
//         date_of_birth,
//         evaluation_date,
//         gender,
//         ifi_functional_profile_version,
//         calculation_results,
//         pdf_status,
//         pdf_path,
//         pdf_generated_at,
//         pdf_error,
//         created_at,
//         updated_at
//       `,
//       {
//         count: "exact",
//       },
//     )
//     .eq("patient_id", normalizedPatientId)
//     .order("evaluation_date", {
//       ascending: false,
//     })
//     .order("created_at", {
//       ascending: false,
//     })
//     .range(from, to);

//   if (error) {
//     console.error(
//       "[getPatientMedicalRecords] Failed to load patient medical records:",
//       {
//         code: error.code,
//         message: error.message,
//       },
//     );

//     throw new Error("Unable to load medical records.");
//   }

//   /**
//    * ==========================================================
//    * 4. MAP REPORT ROWS
//    * ==========================================================
//    */

//   const rows = (data ?? []) as MedicalRecordDatabaseRow[];

//   const records = rows.map(mapMedicalRecord);

//   type FunctionalProfileLookup = {
//     sex: "male" | "female" | "all";

//     ifiRange: number;

//     /**
//      * Exact historical version.
//      *
//      * null means this is a legacy report created before
//      * functional-profile version snapshotting was introduced.
//      */
//     version: number | null;
//   };

//   /**
//    * ==========================================================
//    * 5. LOAD FUNCTIONAL PROFILE RISK LABELS
//    * ==========================================================
//    *
//    * We intentionally do NOT call getIFIFunctionalProfile()
//    * once for every record.
//    *
//    * That would create an N+1 query:
//    *
//    *   1 reports query
//    *   + N functional-profile queries
//    *
//    * Instead, collect the ranges represented by this page and
//    * retrieve all relevant active profiles in ONE query.
//    */

//   const profileLookupInputs: FunctionalProfileLookup[] = records.flatMap(
//     (record) => {
//       const ifiRange = record.metrics.ifi?.ifiRange;

//       if (
//         ifiRange === null ||
//         ifiRange === undefined ||
//         !Number.isInteger(ifiRange) ||
//         ifiRange < 0 ||
//         ifiRange > 25
//       ) {
//         return [];
//       }

//       const lookupSex: FunctionalProfileLookup["sex"] =
//         ifiRange === 0 ? "all" : record.gender;

//       const version = record.ifiFunctionalProfileVersion;

//       return [
//         {
//           sex: lookupSex,
//           ifiRange,
//           version,
//         },
//       ];
//     },
//   );

//   /**
//    * Remove duplicate IFI ranges.
//    *
//    * Example:
//    *
//    * 10 reports may contain:
//    *
//    * male 12
//    * male 12
//    * male 12
//    * female 17
//    * female 17
//    *
//    * We don't need repeated lookup values.
//    */

//   const uniqueProfileKeys = new Map<
//     string,
//     {
//       sex: "male" | "female" | "all";
//       ifiRange: number;
//     }
//   >();

//   for (const input of profileLookupInputs) {
//     const key = [input.sex, input.ifiRange, input.version ?? "active"].join(
//       ":",
//     );

//     uniqueProfileKeys.set(key, input);
//   }

//   /**
//    * ==========================================================
//    * 6. BATCH QUERY ACTIVE FUNCTIONAL PROFILES
//    * ==========================================================
//    */

//   const uniqueInputs = Array.from(uniqueProfileKeys.values());

//   if (uniqueInputs.length > 0) {
//     /**
//      * We query only the IFI ranges represented on the current
//      * page.
//      *
//      * Sex matching happens below so male/female profiles remain
//      * correctly separated.
//      */

//     const uniqueRanges = Array.from(
//       new Set(uniqueInputs.map((input) => input.ifiRange)),
//     );

//     const { data: profileRows, error: profileError } = await supabase
//       .from("ifi_functional_profiles")
//       .select(
//         `
//           sex,
//           ifi_range,
//           risk_label,
//           version,
//           is_active
//         `,
//       )
//       .in("ifi_range", uniqueRanges)
//       .eq("is_active", true)
//       .order("version", {
//         ascending: false,
//       });

//     /**
//      * The functional risk label is supplementary information.
//      *
//      * A failure here should NOT make the patient's entire
//      * medical-record history unavailable.
//      */

//     if (profileError) {
//       console.error(
//         "[getPatientMedicalRecords] Failed to load IFI functional profile risk labels:",
//         {
//           code: profileError.code,

//           message: profileError.message,
//         },
//       );
//     } else {
//       /**
//        * ======================================================
//        * 7. BUILD PROFILE LOOKUP MAP
//        * ======================================================
//        *
//        * Key format:
//        *
//        * male:12
//        * female:17
//        * all:0
//        */

//       const riskLabelMap = new Map<string, string>();

//       for (const row of profileRows ?? []) {
//         if (
//           typeof row.sex !== "string" ||
//           typeof row.ifi_range !== "number" ||
//           typeof row.risk_label !== "string"
//         ) {
//           continue;
//         }

//         const key = `${row.sex}:${row.ifi_range}`;

//         /**
//          * Query is ordered newest version first.
//          *
//          * Therefore, if malformed database state ever contains
//          * multiple active versions for the same sex/range,
//          * preserve the first/newest one.
//          */

//         if (!riskLabelMap.has(key)) {
//           riskLabelMap.set(key, row.risk_label);
//         }
//       }

//       /**
//        * ======================================================
//        * 8. ATTACH REAL RISK LABEL TO RECORD DTO
//        * ======================================================
//        */

//       for (const record of records) {
//         const ifi = record.metrics.ifi;

//         if (!ifi) {
//           continue;
//         }

//         const ifiRange = ifi.ifiRange;

//         if (ifiRange === null || !Number.isInteger(ifiRange)) {
//           continue;
//         }

//         const lookupSex = ifiRange === 0 ? "all" : record.gender;

//         const key = `${lookupSex}:${ifiRange}`;

//         ifi.riskLabel = riskLabelMap.get(key) ?? null;
//       }
//     }
//   }

//   /**
//    * ==========================================================
//    * 9. PAGINATION
//    * ==========================================================
//    */

//   const totalRecords = count ?? 0;

//   const totalPages =
//     totalRecords === 0 ? 0 : Math.ceil(totalRecords / pageSize);

//   return {
//     records,

//     pagination: {
//       page,

//       pageSize,

//       totalRecords,

//       totalPages,

//       hasNextPage: page < totalPages,

//       hasPreviousPage: page > 1 && totalPages > 0,
//     },
//   };
// }
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  mapMedicalRecord,
  type MedicalRecordDatabaseRow,
} from "@/services/database/medical-records/mapMedicalRecord";

/**
 * ============================================================
 * MEDICAL RECORD TYPES
 * ============================================================
 */

export type MedicalRecordPdfStatus =
  | "pending"
  | "queued"
  | "generating"
  | "ready"
  | "failed";

export interface MedicalRecordIFIMetrics {
  ifi: number | null;
  rawIfi: number | null;
  ifiRange: number | null;
  riskLabel: string | null;

  inflammationCoefficient: number | null;
  inflammationCoefficientPercent: number | null;

  classifications: {
    gutBrainAxis: string | null;
    neurological: string | null;
    cardiovascular: string | null;
    endocrineMetabolic: string | null;
    tumoralProliferative: string | null;
  } | null;
}

export interface MedicalRecordBiologicalAgeMetrics {
  biologicalAgeYears: number | null;
  displayBiologicalAgeYears: number | null;
  chronologicalAgeYears: number | null;
  agingCoefficient: number | null;
  agingCoefficientPercent: number | null;
}

export interface MedicalRecordPeptideRecommendation {
  treatmentId: string | null;
  treatmentName: string | null;
  treatmentGroup: string | null;
  indication: string | null;
  activeIngredient: string | null;
  recommendedDose: number | null;
  unit: string | null;
}

export interface MedicalRecordNeuronMetrics {
  productName: string | null;
  activeIngredients: string | null;
  recommendedDrops: number | null;
  unit: string | null;
}

export interface MedicalRecordPeptideMetrics {
  ifiRange: number | null;
  recommendations: MedicalRecordPeptideRecommendation[];
  neuronOliveMoringa: MedicalRecordNeuronMetrics | null;
}

export interface MedicalRecordHBOTRecommendation {
  protocolId: string | null;
  protocolName: string | null;
  pressureAta: number | null;
  oxygenPercent: number | null;
  durationMinutes: number | null;
  calculatedSessions: number | null;
}

export interface MedicalRecordHBOTMetrics {
  recommendations: MedicalRecordHBOTRecommendation[];
}

export interface MedicalRecordMetrics {
  ifi: MedicalRecordIFIMetrics | null;
  biologicalAge: MedicalRecordBiologicalAgeMetrics | null;
  peptideDose: MedicalRecordPeptideMetrics | null;
  hbotSessions: MedicalRecordHBOTMetrics | null;
}

export interface PatientMedicalRecord {
  id: string;

  patientName: string;
  dateOfBirth: string;
  evaluationDate: string;

  gender: "male" | "female";

  /**
   * Exact IFI functional-profile version captured when the
   * report was created.
   *
   * null means the report predates profile-version snapshotting.
   */
  ifiFunctionalProfileVersion: number | null;

  metrics: MedicalRecordMetrics;

  pdf: {
    status: MedicalRecordPdfStatus;
    isAvailable: boolean;
    generatedAt: string | null;
    error: string | null;
  };

  createdAt: string;
  updatedAt: string;
}

export interface PatientMedicalRecordsResult {
  records: PatientMedicalRecord[];

  pagination: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * ============================================================
 * SERVICE INPUT
 * ============================================================
 */

export interface GetPatientMedicalRecordsInput {
  patientId: string;
  page?: number;
  pageSize?: number;
}

/**
 * Used internally to identify the exact functional profile
 * needed by a medical record.
 *
 * version:
 *   number -> exact historical profile
 *   null   -> legacy report, use current active profile
 */
type FunctionalProfileLookup = {
  sex: "male" | "female" | "all";
  ifiRange: number;
  version: number | null;
};

/**
 * ============================================================
 * GET PATIENT MEDICAL RECORDS
 * ============================================================
 *
 * Important:
 *
 * This is a database/data service.
 *
 * It does NOT decide whether a user is authorized to access
 * the supplied patientId.
 *
 * Authorization must happen before calling this service.
 *
 * Patient:
 *   patientId = authenticated profile.id
 *
 * Doctor:
 *   patientId = patient_id resolved from a verified active
 *   doctor-patient relationship.
 *
 * The browser must never be trusted to choose patientId.
 */
export async function getPatientMedicalRecords({
  patientId,
  page = 1,
  pageSize = 20,
}: GetPatientMedicalRecordsInput): Promise<PatientMedicalRecordsResult> {
  /**
   * ==========================================================
   * 1. VALIDATE INPUT
   * ==========================================================
   */

  const normalizedPatientId = patientId.trim();

  if (!normalizedPatientId) {
    throw new Error("Patient ID is required.");
  }

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error("Page must be a positive integer.");
  }

  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("Page size must be between 1 and 100.");
  }

  /**
   * ==========================================================
   * 2. CALCULATE DATABASE RANGE
   * ==========================================================
   */

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  /**
   * ==========================================================
   * 3. QUERY REPORTS
   * ==========================================================
   */

  const supabase = createSupabaseAdminClient();

  const { data, error, count } = await supabase
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
      {
        count: "exact",
      },
    )
    .eq("patient_id", normalizedPatientId)
    .order("evaluation_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .range(from, to);

  if (error) {
    console.error(
      "[getPatientMedicalRecords] Failed to load patient medical records:",
      {
        code: error.code,
        message: error.message,
      },
    );

    throw new Error("Unable to load medical records.");
  }

  /**
   * ==========================================================
   * 4. MAP REPORT ROWS
   * ==========================================================
   */

  const rows = (data ?? []) as MedicalRecordDatabaseRow[];

  const records = rows.map(mapMedicalRecord);

  /**
   * ==========================================================
   * 5. BUILD REQUIRED FUNCTIONAL-PROFILE LOOKUPS
   * ==========================================================
   *
   * We intentionally avoid calling getIFIFunctionalProfile()
   * once per record because that would create an N+1 query.
   *
   * Every record is represented by:
   *
   *   sex + IFI Range + version
   *
   * Examples:
   *
   *   male:17:2
   *   female:12:4
   *   all:0:1
   *
   * Legacy:
   *
   *   male:17:active
   */

  const profileLookupInputs: FunctionalProfileLookup[] = records.flatMap(
    (record) => {
      const ifiRange = record.metrics.ifi?.ifiRange;

      if (
        ifiRange === null ||
        ifiRange === undefined ||
        !Number.isInteger(ifiRange) ||
        ifiRange < 0 ||
        ifiRange > 25
      ) {
        return [];
      }

      const lookupSex: FunctionalProfileLookup["sex"] =
        ifiRange === 0 ? "all" : record.gender;

      return [
        {
          sex: lookupSex,
          ifiRange,
          version: record.ifiFunctionalProfileVersion,
        },
      ];
    },
  );

  /**
   * Remove duplicate exact lookups.
   *
   * Version is part of the key because:
   *
   *   male:17:1
   *   male:17:2
   *
   * represent two different historical clinical profiles.
   */

  const uniqueProfileKeys = new Map<string, FunctionalProfileLookup>();

  for (const input of profileLookupInputs) {
    const key = [input.sex, input.ifiRange, input.version ?? "active"].join(
      ":",
    );

    uniqueProfileKeys.set(key, input);
  }

  const uniqueInputs = Array.from(uniqueProfileKeys.values());

  /**
   * ==========================================================
   * 6. LOAD FUNCTIONAL PROFILE RISK LABELS
   * ==========================================================
   */

  if (uniqueInputs.length > 0) {
    const riskLabelMap = new Map<string, string>();

    /**
     * ----------------------------------------------------------
     * 6A. HISTORICAL VERSIONED REPORTS
     * ----------------------------------------------------------
     *
     * New reports contain the exact profile version that was
     * active when the report was created.
     *
     * IMPORTANT:
     *
     * We deliberately do NOT filter these rows by is_active.
     *
     * An old report may legitimately reference version 1 even
     * though version 2 is now active.
     */

    const versionedInputs = uniqueInputs.filter(
      (
        input,
      ): input is FunctionalProfileLookup & {
        version: number;
      } => input.version !== null,
    );

    if (versionedInputs.length > 0) {
      const versionedRanges = Array.from(
        new Set(versionedInputs.map((input) => input.ifiRange)),
      );

      const versionNumbers = Array.from(
        new Set(versionedInputs.map((input) => input.version)),
      );

      const { data: historicalProfileRows, error: historicalProfileError } =
        await supabase
          .from("ifi_functional_profiles")
          .select(
            `
            sex,
            ifi_range,
            risk_label,
            version
          `,
          )
          .in("ifi_range", versionedRanges)
          .in("version", versionNumbers);

      /**
       * Functional risk information is supplementary.
       *
       * Failure to retrieve it should not make the entire
       * medical-record history unavailable.
       */
      if (historicalProfileError) {
        console.error(
          "[getPatientMedicalRecords] Failed to load historical IFI functional profile risk labels:",
          {
            code: historicalProfileError.code,
            message: historicalProfileError.message,
          },
        );
      } else {
        for (const row of historicalProfileRows ?? []) {
          if (
            typeof row.sex !== "string" ||
            typeof row.ifi_range !== "number" ||
            typeof row.risk_label !== "string" ||
            typeof row.version !== "number"
          ) {
            continue;
          }

          const key = [row.sex, row.ifi_range, row.version].join(":");

          /**
           * Separate IN filters can return combinations we did
           * not explicitly request.
           *
           * Example:
           *
           * requested:
           *   male:10:1
           *   male:20:2
           *
           * query may also encounter:
           *   male:10:2
           *
           * Only retain exact tuples represented by records on
           * this page.
           */
          if (!uniqueProfileKeys.has(key)) {
            continue;
          }

          riskLabelMap.set(key, row.risk_label);
        }
      }
    }

    /**
     * ----------------------------------------------------------
     * 6B. LEGACY REPORTS
     * ----------------------------------------------------------
     *
     * Reports created before functional-profile version
     * snapshotting have:
     *
     *   ifiFunctionalProfileVersion = null
     *
     * We cannot safely guess which historical version they used.
     *
     * Therefore legacy records fall back to the current active
     * profile.
     */

    const legacyInputs = uniqueInputs.filter((input) => input.version === null);

    if (legacyInputs.length > 0) {
      const legacyRanges = Array.from(
        new Set(legacyInputs.map((input) => input.ifiRange)),
      );

      const { data: activeProfileRows, error: activeProfileError } =
        await supabase
          .from("ifi_functional_profiles")
          .select(
            `
            sex,
            ifi_range,
            risk_label
          `,
          )
          .in("ifi_range", legacyRanges)
          .eq("is_active", true);

      if (activeProfileError) {
        console.error(
          "[getPatientMedicalRecords] Failed to load active IFI functional profile risk labels for legacy reports:",
          {
            code: activeProfileError.code,
            message: activeProfileError.message,
          },
        );
      } else {
        for (const row of activeProfileRows ?? []) {
          if (
            typeof row.sex !== "string" ||
            typeof row.ifi_range !== "number" ||
            typeof row.risk_label !== "string"
          ) {
            continue;
          }

          const key = [row.sex, row.ifi_range, "active"].join(":");

          if (!uniqueProfileKeys.has(key)) {
            continue;
          }

          riskLabelMap.set(key, row.risk_label);
        }
      }
    }

    /**
     * ==========================================================
     * 7. ATTACH RISK LABELS TO RECORD DTOs
     * ==========================================================
     */

    for (const record of records) {
      const ifi = record.metrics.ifi;

      if (!ifi) {
        continue;
      }

      const ifiRange = ifi.ifiRange;

      if (
        ifiRange === null ||
        !Number.isInteger(ifiRange) ||
        ifiRange < 0 ||
        ifiRange > 25
      ) {
        continue;
      }

      const lookupSex: FunctionalProfileLookup["sex"] =
        ifiRange === 0 ? "all" : record.gender;

      const key = [
        lookupSex,
        ifiRange,
        record.ifiFunctionalProfileVersion ?? "active",
      ].join(":");

      ifi.riskLabel = riskLabelMap.get(key) ?? null;
    }
  }

  /**
   * ==========================================================
   * 8. PAGINATION
   * ==========================================================
   */

  const totalRecords = count ?? 0;

  const totalPages =
    totalRecords === 0 ? 0 : Math.ceil(totalRecords / pageSize);

  return {
    records,

    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages,

      hasNextPage: page < totalPages,

      hasPreviousPage: page > 1 && totalPages > 0,
    },
  };
}
