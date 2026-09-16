// import { notFound, redirect } from "next/navigation";

// import MedicalRecordDetails from "@/components/medical-records/MedicalRecordDetails";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

// import { getPatientMedicalRecordById } from "@/services/database/medical-records/getPatientMedicalRecordById";

// import { getIFIFunctionalProfile } from "@/services/database/reports/getIFIFunctionalProfile";

// import type { IFIFunctionalProfile } from "@/types/ifi-functional-profile";

// interface MedicalRecordDetailPageProps {
//   params: Promise<{
//     reportId: string;
//   }>;
// }

// export default async function MedicalRecordDetailPage({
//   params,
// }: MedicalRecordDetailPageProps) {
//   /**
//    * ============================================================
//    * 1. AUTHENTICATION
//    * ============================================================
//    */

//   const profile = await requireCurrentProfile();

//   /**
//    * This route belongs to the patient/self medical-record flow.
//    *
//    * Doctors use:
//    *
//    * /dashboard/patients/[relationshipId]/medical-records/[reportId]
//    */
//   if (profile.role !== "patient") {
//     redirect("/dashboard");
//   }

//   /**
//    * ============================================================
//    * 2. ROUTE PARAMS
//    * ============================================================
//    */

//   const { reportId } = await params;

//   const normalizedReportId = reportId?.trim();

//   if (!normalizedReportId) {
//     notFound();
//   }

//   /**
//    * ============================================================
//    * 3. LOAD PATIENT'S MEDICAL RECORD
//    * ============================================================
//    *
//    * Security:
//    *
//    * patientId comes from the authenticated profile.
//    *
//    * It does NOT come from:
//    * - query parameters
//    * - route parameters
//    * - browser state
//    * - localStorage
//    */

//   const record = await getPatientMedicalRecordById({
//     patientId: profile.id,

//     reportId: normalizedReportId,
//   });

//   if (!record) {
//     notFound();
//   }

//   /**
//    * ============================================================
//    * 4. LOAD IFI FUNCTIONAL PROFILE
//    * ============================================================
//    *
//    * The functional profile is determined from:
//    *
//    * - the report's stored gender
//    * - the report's calculated IFI Range
//    *
//    * For IFI Range 0, getIFIFunctionalProfile() automatically
//    * converts the lookup sex to "all".
//    *
//    * IMPORTANT:
//    *
//    * Failure to retrieve supplementary IFI profile content should
//    * not prevent the patient's actual medical record from loading.
//    */

//   let ifiFunctionalProfile: IFIFunctionalProfile | null = null;

//   const ifiRange = record.metrics.ifi?.ifiRange;

//   if (ifiRange !== null && ifiRange !== undefined) {
//     try {
//       ifiFunctionalProfile = await getIFIFunctionalProfile({
//         sex: record.gender,

//         ifiRange,
//       });
//     } catch (error) {
//       console.error(
//         "[MedicalRecordDetailPage] Failed to load IFI functional profile:",
//         {
//           reportId: record.id,

//           ifiRange,

//           error: error instanceof Error ? error.message : "Unknown error",
//         },
//       );

//       /**
//        * Do NOT throw here.
//        *
//        * The medical record itself still exists and should remain
//        * accessible even if its supplementary IFI profile cannot
//        * currently be retrieved.
//        */
//       ifiFunctionalProfile = null;
//     }
//   }

//   /**
//    * ============================================================
//    * 5. RENDER
//    * ============================================================
//    */

//   return (
//     <MedicalRecordDetails
//       record={record}
//       ifiFunctionalProfile={ifiFunctionalProfile}
//       backHref="/dashboard/medical-records"
//       backLabel="Back to Medical Records"
//       contextLabel="Medical Record"
//     />
//   );
// }
import { notFound, redirect } from "next/navigation";

import MedicalRecordDetails from "@/components/medical-records/MedicalRecordDetails";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

import { getPatientMedicalRecordById } from "@/services/database/medical-records/getPatientMedicalRecordById";

import { getIFIFunctionalProfile } from "@/services/database/reports/getIFIFunctionalProfile";

import type { IFIFunctionalProfile } from "@/types/ifi-functional-profile";

interface MedicalRecordDetailPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function MedicalRecordDetailPage({
  params,
}: MedicalRecordDetailPageProps) {
  /**
   * ============================================================
   * 1. AUTHENTICATION
   * ============================================================
   */

  const profile = await requireCurrentProfile();

  /**
   * This route belongs to the patient/self medical-record flow.
   *
   * Doctors use:
   *
   * /dashboard/patients/[relationshipId]/medical-records/[reportId]
   */

  if (profile.role !== "patient") {
    redirect("/dashboard");
  }

  /**
   * ============================================================
   * 2. ROUTE PARAMS
   * ============================================================
   */

  const { reportId } = await params;

  const normalizedReportId = reportId?.trim();

  if (!normalizedReportId) {
    notFound();
  }

  /**
   * ============================================================
   * 3. LOAD PATIENT'S MEDICAL RECORD
   * ============================================================
   *
   * Security:
   *
   * patientId comes from the authenticated profile.
   *
   * It does NOT come from:
   * - query parameters
   * - route parameters
   * - browser state
   * - localStorage
   */

  const record = await getPatientMedicalRecordById({
    patientId: profile.id,
    reportId: normalizedReportId,
  });

  if (!record) {
    notFound();
  }

  /**
   * ============================================================
   * 4. LOAD IFI FUNCTIONAL PROFILE
   * ============================================================
   *
   * The functional profile is determined from:
   *
   * - the report's stored gender
   * - the report's calculated IFI Range
   * - the report's stored functional-profile version
   *
   * NEW REPORTS
   * ------------------------------------------------------------
   *
   * Reports created after profile-version snapshotting contain:
   *
   *   ifiFunctionalProfileVersion = 1, 2, 3, ...
   *
   * We pass that exact version to getIFIFunctionalProfile().
   * This means the historical medical record continues to show
   * the clinical profile that belonged to the report when it was
   * created, even if a newer profile becomes active later.
   *
   * LEGACY REPORTS
   * ------------------------------------------------------------
   *
   * Older reports contain:
   *
   *   ifiFunctionalProfileVersion = null
   *
   * In that case we pass undefined.
   *
   * The existing getIFIFunctionalProfile() behavior then retrieves
   * the current active profile. This is our backward-compatible
   * fallback because we cannot safely guess which historical
   * version an old report originally used.
   *
   * RANGE 0
   * ------------------------------------------------------------
   *
   * For IFI Range 0, getIFIFunctionalProfile() automatically
   * converts the lookup sex to "all".
   *
   * FAILURE POLICY
   * ------------------------------------------------------------
   *
   * Failure to retrieve supplementary IFI profile content should
   * not prevent the patient's actual medical record from loading.
   */

  let ifiFunctionalProfile: IFIFunctionalProfile | null = null;

  const ifiRange = record.metrics.ifi?.ifiRange;

  if (ifiRange !== null && ifiRange !== undefined) {
    try {
      ifiFunctionalProfile = await getIFIFunctionalProfile({
        sex: record.gender,

        ifiRange,

        /**
         * Historical report:
         *   use its exact stored version.
         *
         * Legacy report:
         *   undefined tells the service to use the current
         *   active profile.
         */
        version: record.ifiFunctionalProfileVersion ?? undefined,
      });
    } catch (error) {
      console.error(
        "[MedicalRecordDetailPage] Failed to load IFI functional profile:",
        {
          reportId: record.id,

          ifiRange,

          ifiFunctionalProfileVersion: record.ifiFunctionalProfileVersion,

          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      /**
       * Do NOT throw here.
       *
       * The medical record itself still exists and should remain
       * accessible even if its supplementary IFI profile cannot
       * currently be retrieved.
       */

      ifiFunctionalProfile = null;
    }
  }

  /**
   * ============================================================
   * 5. RENDER
   * ============================================================
   */

  return (
    <MedicalRecordDetails
      record={record}
      ifiFunctionalProfile={ifiFunctionalProfile}
      backHref="/dashboard/medical-records"
      backLabel="Back to Medical Records"
      contextLabel="Medical Record"
    />
  );
}
