// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// import {
//   calculateIFIMonitoring,
//   IFI_MONITORING_FINAL_DAY,
//   type IFIMonitoringCalculationResult,
//   type IFIMonitoringInput,
//   type IFIMonitoringObservation,
// } from "@/lib/calculations/ifi-monitoring";

// // Its job is:

// // monitoring cycle
// //       ↓
// // find patient's reports inside Day 0–30
// //       ↓
// // group reports by evaluation_date
// //       ↓
// // if multiple reports exist on same date:
// // choose latest report by created_at
// //       ↓
// // build all 31 positions
// //       ↓
// // missing dates remain null
// //       ↓
// // calculateIFIMonitoring()

// import type { IFIMonitoringCycle } from "./getOrCreateIFIMonitoringCycle";

// /**
//  * ------------------------------------------------------------
//  * DATABASE ROW TYPES
//  * ------------------------------------------------------------
//  */

// interface IFIMonitoringCycleRow {
//   id: string;

//   patient_id: string;

//   baseline_report_id: string;

//   baseline_ifi: number;

//   target_ifi: number | null;

//   start_date: string;

//   end_date: string;

//   status: "active" | "completed" | "cancelled";

//   completed_at: string | null;

//   created_at: string;

//   updated_at: string;
// }

// interface MonitoringReportRow {
//   id: string;

//   patient_id: string | null;

//   evaluation_date: string;

//   calculation_results: unknown;

//   created_at: string;
// }

// /**
//  * A report after its IFI has been safely extracted.
//  */
// interface QualifyingMonitoringReport {
//   id: string;

//   patientId: string;

//   evaluationDate: string;

//   ifi: number;

//   createdAt: string;
// }

// /**
//  * ------------------------------------------------------------
//  * SERVICE INPUT / OUTPUT
//  * ------------------------------------------------------------
//  */

// export interface GetIFIMonitoringCycleDataInput {
//   cycleId: string;
// }

// export interface IFIMonitoringCycleData {
//   /**
//    * Database cycle metadata.
//    */
//   cycle: IFIMonitoringCycle;

//   /**
//    * The exact 31-day structure fed into the formula engine.
//    *
//    * Keeping this available is useful for debugging and future
//    * clinical auditing.
//    */
//   input: IFIMonitoringInput;

//   /**
//    * Final calculated monitoring result.
//    */
//   calculation: IFIMonitoringCalculationResult;
// }

// /**
//  * ------------------------------------------------------------
//  * GET MONITORING CYCLE DATA
//  * ------------------------------------------------------------
//  *
//  * Loads a cycle and transforms real reports into the 31-day
//  * monitoring structure expected by calculateIFIMonitoring().
//  *
//  * IMPORTANT:
//  *
//  * - IFI values always come from real reports.
//  * - Missing days remain null.
//  * - Multiple assessments are never averaged.
//  * - Latest report on the same evaluation date is selected.
//  * - All reports still contribute to assessmentCount.
//  * - No modeled IFI values are generated.
//  */
// export async function getIFIMonitoringCycleData({
//   cycleId,
// }: GetIFIMonitoringCycleDataInput): Promise<IFIMonitoringCycleData> {
//   const supabase = createSupabaseAdminClient();

//   /**
//    * ----------------------------------------------------------
//    * 1. LOAD CYCLE
//    * ----------------------------------------------------------
//    */

//   const { data: cycleData, error: cycleError } = await supabase
//     .from("ifi_monitoring_cycles")
//     .select(
//       `
//         id,
//         patient_id,
//         baseline_report_id,
//         baseline_ifi,
//         target_ifi,
//         start_date,
//         end_date,
//         status,
//         completed_at,
//         created_at,
//         updated_at
//       `,
//     )
//     .eq("id", cycleId)
//     .maybeSingle();

//   if (cycleError) {
//     throw new Error(
//       `Failed to load IFI monitoring cycle: ${cycleError.message}`,
//     );
//   }

//   if (!cycleData) {
//     throw new Error("IFI monitoring cycle was not found.");
//   }

//   const cycleRow = cycleData as IFIMonitoringCycleRow;

//   const cycle = mapCycleRow(cycleRow);

//   /**
//    * ----------------------------------------------------------
//    * 2. VALIDATE CYCLE WINDOW
//    * ----------------------------------------------------------
//    */

//   validateIsoDate(cycle.startDate, "IFI monitoring cycle start date");

//   validateIsoDate(cycle.endDate, "IFI monitoring cycle end date");

//   const expectedEndDate = addDaysToIsoDate(
//     cycle.startDate,
//     IFI_MONITORING_FINAL_DAY,
//   );

//   if (cycle.endDate !== expectedEndDate) {
//     throw new Error(
//       `IFI monitoring cycle ${cycle.id} has an invalid monitoring window.`,
//     );
//   }

//   /**
//    * ----------------------------------------------------------
//    * 3. LOAD ALL REPORTS INSIDE THIS CYCLE
//    * ----------------------------------------------------------
//    *
//    * We intentionally do NOT check pdf_status.
//    *
//    * The clinical assessment/report can contribute its IFI even
//    * when its derived PDF has not finished generating yet.
//    */

//   const { data: reportsData, error: reportsError } = await supabase
//     .from("reports")
//     .select(
//       `
//         id,
//         patient_id,
//         evaluation_date,
//         calculation_results,
//         created_at
//       `,
//     )
//     .eq("patient_id", cycle.patientId)
//     .gte("evaluation_date", cycle.startDate)
//     .lte("evaluation_date", cycle.endDate)
//     .order("evaluation_date", {
//       ascending: true,
//     })
//     .order("created_at", {
//       ascending: true,
//     });

//   if (reportsError) {
//     throw new Error(
//       `Failed to load reports for IFI monitoring: ${reportsError.message}`,
//     );
//   }

//   const reportRows = (reportsData ?? []) as MonitoringReportRow[];

//   /**
//    * ----------------------------------------------------------
//    * 4. VALIDATE + EXTRACT IFI FROM EACH REPORT
//    * ----------------------------------------------------------
//    */

//   const reports = reportRows.map((report): QualifyingMonitoringReport => {
//     if (!report.patient_id) {
//       throw new Error(`Report ${report.id} does not have a patient owner.`);
//     }

//     if (report.patient_id !== cycle.patientId) {
//       throw new Error(
//         `Report ${report.id} does not belong to the monitoring cycle patient.`,
//       );
//     }

//     validateIsoDate(
//       report.evaluation_date,
//       `Report ${report.id} evaluation date`,
//     );

//     validateIsoDateTime(report.created_at, `Report ${report.id} created_at`);

//     const ifi = extractIfiFromCalculationResults(
//       report.calculation_results,
//       report.id,
//     );

//     return {
//       id: report.id,

//       patientId: report.patient_id,

//       evaluationDate: report.evaluation_date,

//       ifi,

//       createdAt: report.created_at,
//     };
//   });

//   /**
//    * ----------------------------------------------------------
//    * 5. GROUP REPORTS BY CLINICAL EVALUATION DATE
//    * ----------------------------------------------------------
//    *
//    * Example:
//    *
//    * Sep 15:
//    *
//    * 09:00 report A  IFI -9.8
//    * 14:00 report B  IFI -9.5
//    * 18:00 report C  IFI -9.2
//    *
//    * assessmentCount = 3
//    *
//    * canonical monitoring observation:
//    *
//    * report C
//    * IFI -9.2
//    *
//    * We do NOT average the three IFIs.
//    */

//   const reportsByDate = new Map<string, QualifyingMonitoringReport[]>();

//   for (const report of reports) {
//     const existing = reportsByDate.get(report.evaluationDate);

//     if (existing) {
//       existing.push(report);
//     } else {
//       reportsByDate.set(report.evaluationDate, [report]);
//     }
//   }

//   /**
//    * ----------------------------------------------------------
//    * 6. BUILD ALL 31 MONITORING POSITIONS
//    * ----------------------------------------------------------
//    */

//   const observations: IFIMonitoringObservation[] = [];

//   for (let day = 0; day <= IFI_MONITORING_FINAL_DAY; day += 1) {
//     const date = addDaysToIsoDate(cycle.startDate, day);

//     const reportsForDate = reportsByDate.get(date) ?? [];

//     /**
//      * No report on this clinical date.
//      *
//      * Never interpolate.
//      * Never carry forward.
//      * Never insert zero.
//      */
//     if (reportsForDate.length === 0) {
//       observations.push({
//         day,

//         date,

//         ifi: null,

//         reportId: null,

//         assessmentCount: 0,

//         observedAt: null,
//       });

//       continue;
//     }

//     /**
//      * Sort deterministically so the newest database report wins.
//      *
//      * Normally created_at will be enough.
//      *
//      * id provides a deterministic tie-breaker in the extremely
//      * unlikely event that two rows share the exact timestamp.
//      */
//     const sortedReports = [...reportsForDate].sort((left, right) => {
//       const timeDifference =
//         new Date(left.createdAt).getTime() -
//         new Date(right.createdAt).getTime();

//       if (timeDifference !== 0) {
//         return timeDifference;
//       }

//       return left.id.localeCompare(right.id);
//     });

//     const canonicalReport = sortedReports[sortedReports.length - 1];

//     observations.push({
//       day,

//       date,

//       ifi: canonicalReport.ifi,

//       reportId: canonicalReport.id,

//       assessmentCount: reportsForDate.length,

//       /**
//        * Real timestamp of the report selected as the day's
//        * canonical IFI observation.
//        */
//       observedAt: canonicalReport.createdAt,
//     });
//   }

//   /**
//    * ----------------------------------------------------------
//    * 7. VERIFY DAY 0 IS THE STORED BASELINE REPORT
//    * ----------------------------------------------------------
//    *
//    * This is important.
//    *
//    * Suppose there were multiple reports on Day 0 and a newer one
//    * appeared later.
//    *
//    * The cycle has a specific baseline_report_id and baseline_ifi.
//    * We must preserve that historical baseline rather than silently
//    * changing Day 0 to another report.
//    */

//   const baselineReport = reports.find(
//     (report) => report.id === cycle.baselineReportId,
//   );

//   if (!baselineReport) {
//     throw new Error(
//       `The baseline report for IFI monitoring cycle ${cycle.id} could not be found inside the cycle window.`,
//     );
//   }

//   if (baselineReport.evaluationDate !== cycle.startDate) {
//     throw new Error(
//       `IFI monitoring cycle ${cycle.id} baseline report does not belong to Day 0.`,
//     );
//   }

//   /**
//    * Make Day 0 explicitly use the cycle's stored baseline report.
//    *
//    * Day 0 is different from later days because it defines the
//    * reference point for the entire cycle.
//    */
//   const dayZeroReports = reportsByDate.get(cycle.startDate) ?? [];

//   observations[0] = {
//     day: 0,

//     date: cycle.startDate,

//     ifi: cycle.baselineIfi,

//     reportId: cycle.baselineReportId,

//     assessmentCount: dayZeroReports.length,

//     observedAt: baselineReport.createdAt,
//   };

//   /**
//    * ----------------------------------------------------------
//    * 8. BASELINE SNAPSHOT INTEGRITY
//    * ----------------------------------------------------------
//    *
//    * The cycle stores baseline_ifi as a snapshot.
//    *
//    * Verify it still agrees with the original baseline report.
//    *
//    * We do not silently recalculate or rewrite it here.
//    */

//   if (!numbersAreApproximatelyEqual(baselineReport.ifi, cycle.baselineIfi)) {
//     throw new Error(
//       `IFI monitoring cycle ${cycle.id} baseline IFI does not match its baseline report.`,
//     );
//   }

//   /**
//    * ----------------------------------------------------------
//    * 9. PREPARE PURE FORMULA INPUT
//    * ----------------------------------------------------------
//    */

//   const input: IFIMonitoringInput = {
//     cycleId: cycle.id,

//     startDate: cycle.startDate,

//     endDate: cycle.endDate,

//     observations,

//     targetIfi: cycle.targetIfi,
//   };

//   /**
//    * ----------------------------------------------------------
//    * 10. RUN TESTED FORMULA ENGINE
//    * ----------------------------------------------------------
//    */

//   const calculation = calculateIFIMonitoring(input);

//   return {
//     cycle,

//     input,

//     calculation,
//   };
// }

// /**
//  * ------------------------------------------------------------
//  * EXTRACT IFI
//  * ------------------------------------------------------------
//  *
//  * Expected report JSON structure:
//  *
//  * calculation_results: {
//  *   IFI: {
//  *     IFI: -8.42,
//  *     ...
//  *   },
//  *   BiologicalAge: ...,
//  *   ...
//  * }
//  */
// function extractIfiFromCalculationResults(
//   calculationResults: unknown,
//   reportId: string,
// ): number {
//   if (!isRecord(calculationResults)) {
//     throw new Error(`Report ${reportId} has invalid calculation results.`);
//   }

//   const ifiResult = calculationResults.IFI;

//   if (!isRecord(ifiResult)) {
//     throw new Error(
//       `Report ${reportId} does not contain a valid IFI calculation result.`,
//     );
//   }

//   /**
//    * Keep this property aligned with the exact property used in:
//    *
//    * getOrCreateIFIMonitoringCycle.ts
//    */
//   const ifi = ifiResult.rawIfi;

//   if (typeof ifi !== "number" || !Number.isFinite(ifi)) {
//     throw new Error(`Report ${reportId} contains an invalid IFI value.`);
//   }

//   return ifi;
// }

// /**
//  * ------------------------------------------------------------
//  * CYCLE MAPPER
//  * ------------------------------------------------------------
//  */

// function mapCycleRow(row: IFIMonitoringCycleRow): IFIMonitoringCycle {
//   return {
//     id: row.id,

//     patientId: row.patient_id,

//     baselineReportId: row.baseline_report_id,

//     baselineIfi: row.baseline_ifi,

//     targetIfi: row.target_ifi,

//     startDate: row.start_date,

//     endDate: row.end_date,

//     status: row.status,

//     completedAt: row.completed_at,

//     createdAt: row.created_at,

//     updatedAt: row.updated_at,
//   };
// }

// /**
//  * ------------------------------------------------------------
//  * JSON GUARD
//  * ------------------------------------------------------------
//  */

// function isRecord(value: unknown): value is Record<string, unknown> {
//   return typeof value === "object" && value !== null && !Array.isArray(value);
// }

// /**
//  * ------------------------------------------------------------
//  * FLOAT COMPARISON
//  * ------------------------------------------------------------
//  *
//  * The stored baseline and original report should normally be
//  * identical.
//  *
//  * Tiny floating-point serialization differences should not cause
//  * a false integrity failure.
//  */

// function numbersAreApproximatelyEqual(left: number, right: number): boolean {
//   const tolerance = 1e-10;

//   return Math.abs(left - right) <= tolerance;
// }

// /**
//  * ------------------------------------------------------------
//  * DATE HELPERS
//  * ------------------------------------------------------------
//  */

// function addDaysToIsoDate(date: string, days: number): string {
//   validateIsoDate(date, "Date");

//   const [year, month, day] = date.split("-").map(Number);

//   const parsed = new Date(Date.UTC(year, month - 1, day));

//   parsed.setUTCDate(parsed.getUTCDate() + days);

//   return parsed.toISOString().slice(0, 10);
// }

// function validateIsoDate(value: string, fieldName: string): void {
//   if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
//   }

//   const [year, month, day] = value.split("-").map(Number);

//   const parsed = new Date(Date.UTC(year, month - 1, day));

//   const normalized = parsed.toISOString().slice(0, 10);

//   if (normalized !== value) {
//     throw new Error(`${fieldName} is not a valid calendar date.`);
//   }
// }

// function validateIsoDateTime(value: string, fieldName: string): void {
//   if (typeof value !== "string" || !value.trim()) {
//     throw new Error(`${fieldName} is required.`);
//   }

//   const parsed = new Date(value);

//   if (Number.isNaN(parsed.getTime())) {
//     throw new Error(`${fieldName} must be a valid date-time.`);
//   }
// }
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  calculateIFIMonitoring,
  IFI_MONITORING_FINAL_DAY,
  type IFIMonitoringCalculationResult,
  type IFIMonitoringInput,
  type IFIMonitoringObservation,
} from "@/lib/calculations/ifi-monitoring";

import type { IFIMonitoringCycle } from "./getOrCreateIFIMonitoringCycle";

/**
 * ============================================================
 * DATABASE ROW TYPES
 * ============================================================
 */

interface IFIMonitoringCycleRow {
  id: string;

  patient_id: string;

  /**
   * Report that established Day 0.
   *
   * We keep the report reference, but the IFI value itself is
   * always read from the actual report.
   */
  baseline_report_id: string;

  start_date: string;

  end_date: string;

  status: "active" | "completed" | "cancelled";

  completed_at: string | null;

  created_at: string;

  updated_at: string;
}

interface MonitoringReportRow {
  id: string;

  patient_id: string | null;

  evaluation_date: string;

  calculation_results: unknown;

  created_at: string;
}

/**
 * A report after its actual IFI has been safely extracted.
 */
interface QualifyingMonitoringReport {
  id: string;

  patientId: string;

  evaluationDate: string;

  ifi: number;

  createdAt: string;
}

/**
 * ============================================================
 * SERVICE INPUT / OUTPUT
 * ============================================================
 */

export interface GetIFIMonitoringCycleDataInput {
  cycleId: string;
}

export interface IFIMonitoringCycleData {
  /**
   * Database cycle metadata.
   */
  cycle: IFIMonitoringCycle;

  /**
   * Exact Day 0 -> Day 30 monitoring structure sent into the
   * pure calculation layer.
   */
  input: IFIMonitoringInput;

  /**
   * Calculated monitoring result.
   */
  calculation: IFIMonitoringCalculationResult;
}

/**
 * ============================================================
 * GET IFI MONITORING CYCLE DATA
 * ============================================================
 *
 * Loads a monitoring cycle and converts the patient's actual
 * reports into the Day 0 -> Day 30 monitoring structure.
 *
 * Rules:
 *
 * - IFI always comes from a real report.
 * - Recovery is calculated from each actual IFI.
 * - Missing days remain null.
 * - IFI values are never interpolated.
 * - IFI values are never carried forward.
 * - Multiple same-day assessments are never averaged.
 * - Latest created report on that evaluation date is selected.
 * - Day 0 is anchored to baseline_report_id.
 *
 * IMPORTANT:
 *
 * "Base IFI" is simply the actual IFI belonging to the report
 * that established Day 0.
 *
 * It is NOT an input to the Recovery formula.
 *
 * Recovery:
 *
 * ((actual IFI + 11) / 6) * 100
 */
export async function getIFIMonitoringCycleData({
  cycleId,
}: GetIFIMonitoringCycleDataInput): Promise<IFIMonitoringCycleData> {
  const normalizedCycleId = cycleId.trim();

  if (!normalizedCycleId) {
    throw new Error("IFI monitoring cycle ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  /**
   * ----------------------------------------------------------
   * 1. LOAD CYCLE
   * ----------------------------------------------------------
   */
  const { data: cycleData, error: cycleError } = await supabase
    .from("ifi_monitoring_cycles")
    .select(
      `
        id,
        patient_id,
        baseline_report_id,
        start_date,
        end_date,
        status,
        completed_at,
        created_at,
        updated_at
      `,
    )
    .eq("id", normalizedCycleId)
    .maybeSingle();

  if (cycleError) {
    throw new Error(
      `Failed to load IFI monitoring cycle: ${cycleError.message}`,
    );
  }

  if (!cycleData) {
    throw new Error("IFI monitoring cycle was not found.");
  }

  const cycleRow = cycleData as IFIMonitoringCycleRow;

  const cycle = mapCycleRow(cycleRow);

  /**
   * ----------------------------------------------------------
   * 2. VALIDATE CYCLE WINDOW
   * ----------------------------------------------------------
   */
  validateIsoDate(cycle.startDate, "IFI monitoring cycle start date");

  validateIsoDate(cycle.endDate, "IFI monitoring cycle end date");

  const expectedEndDate = addDaysToIsoDate(
    cycle.startDate,
    IFI_MONITORING_FINAL_DAY,
  );

  if (cycle.endDate !== expectedEndDate) {
    throw new Error(
      `IFI monitoring cycle ${cycle.id} has an invalid monitoring window.`,
    );
  }

  /**
   * ----------------------------------------------------------
   * 3. LOAD ALL REPORTS INSIDE THIS CYCLE
   * ----------------------------------------------------------
   *
   * We intentionally do NOT depend on pdf_status.
   *
   * The patient's clinical IFI exists independently from the
   * generated PDF.
   */
  const { data: reportsData, error: reportsError } = await supabase
    .from("reports")
    .select(
      `
        id,
        patient_id,
        evaluation_date,
        calculation_results,
        created_at
      `,
    )
    .eq("patient_id", cycle.patientId)
    .gte("evaluation_date", cycle.startDate)
    .lte("evaluation_date", cycle.endDate)
    .order("evaluation_date", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (reportsError) {
    throw new Error(
      `Failed to load reports for IFI monitoring: ${reportsError.message}`,
    );
  }

  const reportRows = (reportsData ?? []) as MonitoringReportRow[];

  /**
   * ----------------------------------------------------------
   * 4. VALIDATE + EXTRACT ACTUAL IFI
   * ----------------------------------------------------------
   */
  const reports = reportRows.map((report): QualifyingMonitoringReport => {
    if (!report.patient_id) {
      throw new Error(`Report ${report.id} does not have a patient owner.`);
    }

    if (report.patient_id !== cycle.patientId) {
      throw new Error(
        `Report ${report.id} does not belong to the monitoring cycle patient.`,
      );
    }

    validateIsoDate(
      report.evaluation_date,
      `Report ${report.id} evaluation date`,
    );

    validateIsoDateTime(report.created_at, `Report ${report.id} created_at`);

    const ifi = extractIfiFromCalculationResults(
      report.calculation_results,
      report.id,
    );

    return {
      id: report.id,
      patientId: report.patient_id,
      evaluationDate: report.evaluation_date,
      ifi,
      createdAt: report.created_at,
    };
  });

  /**
   * ----------------------------------------------------------
   * 5. GROUP REPORTS BY EVALUATION DATE
   * ----------------------------------------------------------
   *
   * Example:
   *
   * Day 7:
   *
   * 09:00 -> IFI -9.8
   * 14:00 -> IFI -9.5
   * 18:00 -> IFI -9.2
   *
   * assessmentCount = 3
   *
   * canonical observation = latest report = -9.2
   *
   * We do NOT average them.
   */
  const reportsByDate = new Map<string, QualifyingMonitoringReport[]>();

  for (const report of reports) {
    const existing = reportsByDate.get(report.evaluationDate);

    if (existing) {
      existing.push(report);
    } else {
      reportsByDate.set(report.evaluationDate, [report]);
    }
  }

  /**
   * ----------------------------------------------------------
   * 6. BUILD DAY 0 -> DAY 30
   * ----------------------------------------------------------
   */
  const observations: IFIMonitoringObservation[] = [];

  for (let day = 0; day <= IFI_MONITORING_FINAL_DAY; day += 1) {
    const date = addDaysToIsoDate(cycle.startDate, day);

    const reportsForDate = reportsByDate.get(date) ?? [];

    /**
     * Missing clinical observation.
     *
     * Do not:
     *
     * - interpolate
     * - carry forward
     * - insert zero
     * - generate a modeled IFI
     */
    if (reportsForDate.length === 0) {
      observations.push({
        day,
        date,
        ifi: null,
        reportId: null,
        assessmentCount: 0,
        observedAt: null,
      });

      continue;
    }

    /**
     * Latest report created on this evaluation date wins.
     *
     * ID is used only as a deterministic tie-breaker if two
     * reports somehow have exactly the same created_at.
     */
    const sortedReports = [...reportsForDate].sort((left, right) => {
      const timeDifference =
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime();

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return left.id.localeCompare(right.id);
    });

    const canonicalReport = sortedReports[sortedReports.length - 1];

    observations.push({
      day,
      date,
      ifi: canonicalReport.ifi,
      reportId: canonicalReport.id,
      assessmentCount: reportsForDate.length,
      observedAt: canonicalReport.createdAt,
    });
  }

  /**
   * ----------------------------------------------------------
   * 7. ESTABLISH THE REAL DAY 0 / BASE IFI REPORT
   * ----------------------------------------------------------
   *
   * Day 0 is special because the cycle explicitly stores which
   * report created the cycle.
   *
   * We therefore use baseline_report_id for Day 0 instead of
   * allowing a later same-day report to silently replace the
   * cycle's starting observation.
   *
   * Notice:
   *
   * We are NOT reading a stored baseline_ifi anymore.
   *
   * The Base IFI comes directly from this actual report.
   */
  const baselineReport = reports.find(
    (report) => report.id === cycle.baselineReportId,
  );

  if (!baselineReport) {
    throw new Error(
      `The Day 0 report for IFI monitoring cycle ${cycle.id} could not be found inside the cycle window.`,
    );
  }

  if (baselineReport.evaluationDate !== cycle.startDate) {
    throw new Error(
      `IFI monitoring cycle ${cycle.id} Day 0 report does not belong to the cycle start date.`,
    );
  }

  const dayZeroReports = reportsByDate.get(cycle.startDate) ?? [];

  observations[0] = {
    day: 0,

    date: cycle.startDate,

    /**
     * THIS is the Base IFI.
     *
     * It is the actual IFI from the actual Day 0 report.
     */
    ifi: baselineReport.ifi,

    reportId: baselineReport.id,

    assessmentCount: dayZeroReports.length,

    observedAt: baselineReport.createdAt,
  };

  /**
   * ----------------------------------------------------------
   * 8. PREPARE PURE FORMULA INPUT
   * ----------------------------------------------------------
   *
   * No baseline IFI.
   * No target IFI.
   *
   * Only actual observations.
   */
  const input: IFIMonitoringInput = {
    cycleId: cycle.id,

    startDate: cycle.startDate,

    endDate: cycle.endDate,

    observations,
  };

  /**
   * ----------------------------------------------------------
   * 9. RUN PURE CALCULATION ENGINE
   * ----------------------------------------------------------
   *
   * calculateIFIMonitoring() is responsible for deriving:
   *
   * Recovery = ((actual IFI + 11) / 6) * 100
   *
   * and the longitudinal summary metrics.
   */
  const calculation = calculateIFIMonitoring(input);

  return {
    cycle,
    input,
    calculation,
  };
}

/**
 * ============================================================
 * EXTRACT ACTUAL IFI
 * ============================================================
 *
 * Current report JSON:
 *
 * calculation_results: {
 *   IFI: {
 *     rawIfi: -8.42,
 *     ...
 *   },
 *   BiologicalAge: ...,
 *   ...
 * }
 */
function extractIfiFromCalculationResults(
  calculationResults: unknown,
  reportId: string,
): number {
  if (!isRecord(calculationResults)) {
    throw new Error(`Report ${reportId} has invalid calculation results.`);
  }

  const ifiResult = calculationResults.IFI;

  if (!isRecord(ifiResult)) {
    throw new Error(
      `Report ${reportId} does not contain a valid IFI calculation result.`,
    );
  }

  /**
   * This is the patient's actual raw IFI result.
   */
  const ifi = ifiResult.rawIfi;

  if (typeof ifi !== "number" || !Number.isFinite(ifi)) {
    throw new Error(`Report ${reportId} contains an invalid IFI value.`);
  }

  return ifi;
}

/**
 * ============================================================
 * CYCLE MAPPER
 * ============================================================
 */
function mapCycleRow(row: IFIMonitoringCycleRow): IFIMonitoringCycle {
  return {
    id: row.id,

    patientId: row.patient_id,

    baselineReportId: row.baseline_report_id,

    startDate: row.start_date,

    endDate: row.end_date,

    status: row.status,

    completedAt: row.completed_at,

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}

/**
 * ============================================================
 * JSON GUARD
 * ============================================================
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */
function addDaysToIsoDate(date: string, days: number): string {
  validateIsoDate(date, "Date");

  const [year, month, day] = date.split("-").map(Number);

  const parsed = new Date(Date.UTC(year, month - 1, day));

  parsed.setUTCDate(parsed.getUTCDate() + days);

  return parsed.toISOString().slice(0, 10);
}

function validateIsoDate(value: string, fieldName: string): void {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = value.split("-").map(Number);

  const parsed = new Date(Date.UTC(year, month - 1, day));

  const normalized = parsed.toISOString().slice(0, 10);

  if (normalized !== value) {
    throw new Error(`${fieldName} is not a valid calendar date.`);
  }
}

function validateIsoDateTime(value: string, fieldName: string): void {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid date-time.`);
  }
}
