// import { notFound, redirect } from "next/navigation";

// import MedicalRecordDetails from "@/components/medical-records/MedicalRecordDetails";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// import { getPatientMedicalRecordById } from "@/services/database/medical-records/getPatientMedicalRecordById";

// // IMPORTANT:
// // If your existing getIFIFunctionalProfile service lives at a
// // different path, keep its real existing import path.
// import { getIFIFunctionalProfile } from "@/services/database/reports/getIFIFunctionalProfile";

// import type { IFIFunctionalProfile } from "@/types/ifi-functional-profile";

// interface DoctorMedicalRecordDetailPageProps {
//   params: Promise<{
//     relationshipId: string;
//     reportId: string;
//   }>;
// }

// interface DoctorPatientRelationshipRow {
//   id: string;
//   doctor_id: string;
//   patient_id: string;
//   status: string;
// }

// export default async function DoctorMedicalRecordDetailPage({
//   params,
// }: DoctorMedicalRecordDetailPageProps) {
//   /**
//    * ============================================================
//    * 1. AUTHENTICATION
//    * ============================================================
//    */

//   const profile = await requireCurrentProfile();

//   /**
//    * This page belongs exclusively to the doctor workflow.
//    */
//   if (profile.role !== "doctor") {
//     redirect("/dashboard");
//   }

//   /**
//    * ============================================================
//    * 2. ROUTE PARAMS
//    * ============================================================
//    */

//   const { relationshipId, reportId } = await params;

//   const normalizedRelationshipId = relationshipId?.trim();

//   const normalizedReportId = reportId?.trim();

//   if (!normalizedRelationshipId || !normalizedReportId) {
//     notFound();
//   }

//   /**
//    * ============================================================
//    * 3. VERIFY ACTIVE DOCTOR-PATIENT RELATIONSHIP
//    * ============================================================
//    *
//    * Security:
//    *
//    * We do NOT trust a patient UUID from the browser.
//    *
//    * The patient ID is resolved server-side from:
//    *
//    * relationship ID
//    *      +
//    * authenticated doctor ID
//    *      +
//    * active status
//    */

//   const supabase = createSupabaseAdminClient();

//   const { data: relationshipData, error: relationshipError } = await supabase
//     .from("doctor_patient_relationships")
//     .select(
//       `
//         id,
//         doctor_id,
//         patient_id,
//         status
//       `,
//     )
//     .eq("id", normalizedRelationshipId)
//     .eq("doctor_id", profile.id)
//     .eq("status", "active")
//     .maybeSingle();

//   if (relationshipError) {
//     console.error(
//       "[DoctorMedicalRecordDetailPage] Failed to verify doctor-patient relationship:",
//       {
//         relationshipId: normalizedRelationshipId,

//         doctorId: profile.id,

//         code: relationshipError.code,

//         message: relationshipError.message,
//       },
//     );

//     throw new Error("Unable to verify patient access.");
//   }

//   if (!relationshipData) {
//     notFound();
//   }

//   const relationship = relationshipData as DoctorPatientRelationshipRow;

//   /**
//    * ============================================================
//    * 4. LOAD PATIENT'S MEDICAL RECORD
//    * ============================================================
//    *
//    * Notice that patientId comes from the verified relationship.
//    *
//    * It does NOT come from:
//    *
//    * - URL
//    * - query string
//    * - localStorage
//    * - browser state
//    */

//   const record = await getPatientMedicalRecordById({
//     patientId: relationship.patient_id,

//     reportId: normalizedReportId,
//   });

//   /**
//    * This also protects against a doctor trying to place another
//    * patient's report UUID into this patient's URL.
//    *
//    * getPatientMedicalRecordById() queries:
//    *
//    *   report.id = reportId
//    *   AND
//    *   report.patient_id = relationship.patient_id
//    */

//   if (!record) {
//     notFound();
//   }

//   /**
//    * ============================================================
//    * 5. LOAD IFI FUNCTIONAL PROFILE
//    * ============================================================
//    *
//    * Functional profile lookup uses data from the actual stored
//    * medical record:
//    *
//    *   gender
//    *      +
//    *   IFI Range
//    *
//    * We never accept either value from the browser for this
//    * lookup.
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
//       /**
//        * Functional-profile content is supplementary.
//        *
//        * A temporary problem retrieving it should NOT prevent
//        * the doctor from accessing the underlying medical record.
//        */

//       console.error(
//         "[DoctorMedicalRecordDetailPage] Failed to load IFI functional profile:",
//         {
//           reportId: record.id,

//           ifiRange,

//           error: error instanceof Error ? error.message : "Unknown error",
//         },
//       );

//       ifiFunctionalProfile = null;
//     }
//   }

//   /**
//    * ============================================================
//    * 6. RENDER
//    * ============================================================
//    */

//   return (
//     <MedicalRecordDetails
//       record={record}
//       ifiFunctionalProfile={ifiFunctionalProfile}
//       backHref={`/dashboard/patients/${encodeURIComponent(
//         normalizedRelationshipId,
//       )}/medical-records`}
//       backLabel="Back to Medical Records"
//       contextLabel="Patient Medical Record"
//     />
//   );
// }
import { notFound, redirect } from "next/navigation";

import MedicalRecordDetails from "@/components/medical-records/MedicalRecordDetails";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getPatientMedicalRecordById } from "@/services/database/medical-records/getPatientMedicalRecordById";

import { getIFIFunctionalProfile } from "@/services/database/reports/getIFIFunctionalProfile";

import type { IFIFunctionalProfile } from "@/types/ifi-functional-profile";

interface DoctorMedicalRecordDetailPageProps {
  params: Promise<{
    relationshipId: string;
    reportId: string;
  }>;
}

interface DoctorPatientRelationshipRow {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: string;
}

export default async function DoctorMedicalRecordDetailPage({
  params,
}: DoctorMedicalRecordDetailPageProps) {
  /**
   * ============================================================
   * 1. AUTHENTICATION
   * ============================================================
   */

  const profile = await requireCurrentProfile();

  /**
   * This page belongs exclusively to the doctor workflow.
   */

  if (profile.role !== "doctor") {
    redirect("/dashboard");
  }

  /**
   * ============================================================
   * 2. ROUTE PARAMS
   * ============================================================
   */

  const { relationshipId, reportId } = await params;

  const normalizedRelationshipId = relationshipId?.trim();

  const normalizedReportId = reportId?.trim();

  if (!normalizedRelationshipId || !normalizedReportId) {
    notFound();
  }

  /**
   * ============================================================
   * 3. VERIFY ACTIVE DOCTOR-PATIENT RELATIONSHIP
   * ============================================================
   *
   * Security:
   *
   * We do NOT trust a patient UUID from the browser.
   *
   * The patient ID is resolved server-side from:
   *
   * relationship ID
   *      +
   * authenticated doctor ID
   *      +
   * active status
   */

  const supabase = createSupabaseAdminClient();

  const { data: relationshipData, error: relationshipError } = await supabase
    .from("doctor_patient_relationships")
    .select(
      `
        id,
        doctor_id,
        patient_id,
        status
      `,
    )
    .eq("id", normalizedRelationshipId)
    .eq("doctor_id", profile.id)
    .eq("status", "active")
    .maybeSingle();

  if (relationshipError) {
    console.error(
      "[DoctorMedicalRecordDetailPage] Failed to verify doctor-patient relationship:",
      {
        relationshipId: normalizedRelationshipId,

        doctorId: profile.id,

        code: relationshipError.code,

        message: relationshipError.message,
      },
    );

    throw new Error("Unable to verify patient access.");
  }

  if (!relationshipData) {
    notFound();
  }

  const relationship = relationshipData as DoctorPatientRelationshipRow;

  /**
   * ============================================================
   * 4. LOAD PATIENT'S MEDICAL RECORD
   * ============================================================
   *
   * patientId comes exclusively from the verified relationship.
   *
   * It does NOT come from:
   *
   * - URL
   * - query string
   * - localStorage
   * - browser state
   */

  const record = await getPatientMedicalRecordById({
    patientId: relationship.patient_id,

    reportId: normalizedReportId,
  });

  /**
   * This also protects against a doctor trying to place another
   * patient's report UUID into this patient's URL.
   *
   * getPatientMedicalRecordById() queries:
   *
   *   report.id = reportId
   *
   * AND
   *
   *   report.patient_id = relationship.patient_id
   */

  if (!record) {
    notFound();
  }

  /**
   * ============================================================
   * 5. LOAD IFI FUNCTIONAL PROFILE
   * ============================================================
   *
   * The lookup is based entirely on trusted data stored with
   * the medical record:
   *
   *   report gender
   *        +
   *   report IFI Range
   *        +
   *   stored functional-profile version
   *
   * ------------------------------------------------------------
   * NEW REPORTS
   * ------------------------------------------------------------
   *
   * New reports store:
   *
   *   ifiFunctionalProfileVersion = 1, 2, 3, ...
   *
   * We request that exact profile version.
   *
   * This means an old medical record does not silently change
   * when a newer clinical profile becomes active.
   *
   * ------------------------------------------------------------
   * LEGACY REPORTS
   * ------------------------------------------------------------
   *
   * Reports created before profile-version snapshotting have:
   *
   *   ifiFunctionalProfileVersion = null
   *
   * For those reports we pass undefined.
   *
   * getIFIFunctionalProfile() will then use its existing behavior
   * and retrieve the current active profile.
   *
   * We intentionally do not guess a historical version for a
   * legacy report.
   *
   * ------------------------------------------------------------
   * RANGE 0
   * ------------------------------------------------------------
   *
   * getIFIFunctionalProfile() already handles IFI Range 0 by
   * changing the lookup sex to "all".
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
         *   exact stored profile version.
         *
         * Legacy report:
         *   undefined -> current active profile.
         */
        version: record.ifiFunctionalProfileVersion ?? undefined,
      });
    } catch (error) {
      /**
       * Functional-profile content is supplementary.
       *
       * A temporary problem retrieving it should NOT prevent
       * the doctor from accessing the underlying medical record.
       */

      console.error(
        "[DoctorMedicalRecordDetailPage] Failed to load IFI functional profile:",
        {
          reportId: record.id,

          ifiRange,

          ifiFunctionalProfileVersion: record.ifiFunctionalProfileVersion,

          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      ifiFunctionalProfile = null;
    }
  }

  /**
   * ============================================================
   * 6. RENDER
   * ============================================================
   */

  return (
    <MedicalRecordDetails
      record={record}
      ifiFunctionalProfile={ifiFunctionalProfile}
      backHref={`/dashboard/patients/${encodeURIComponent(
        normalizedRelationshipId,
      )}/medical-records`}
      backLabel="Back to Medical Records"
      contextLabel="Patient Medical Record"
    />
  );
}
