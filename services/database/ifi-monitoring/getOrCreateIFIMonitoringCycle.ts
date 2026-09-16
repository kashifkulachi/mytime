// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// import type { IFIMonitoringCycleStatus } from "@/types/calculations/ifi-monitoring";

// const IFI_MONITORING_DURATION_DAYS = 30;

// export interface IFIMonitoringCycle {
//   id: string;

//   patientId: string;

//   baselineReportId: string;

//   baselineIfi: number;

//   targetIfi: number | null;

//   startDate: string;

//   endDate: string;

//   status: IFIMonitoringCycleStatus;

//   completedAt: string | null;

//   createdAt: string;

//   updatedAt: string;
// }

// interface GetOrCreateIFIMonitoringCycleInput {
//   /**
//    * The newly created report.
//    *
//    * Everything else is resolved from this report server-side.
//    */
//   reportId: string;
// }

// interface ReportForMonitoring {
//   id: string;

//   patient_id: string | null;

//   evaluation_date: string;

//   calculation_results: unknown;

//   created_at: string;
// }

// interface IFIMonitoringCycleRow {
//   id: string;

//   patient_id: string;

//   baseline_report_id: string;

//   baseline_ifi: number;

//   target_ifi: number | null;

//   start_date: string;

//   end_date: string;

//   status: IFIMonitoringCycleStatus;

//   completed_at: string | null;

//   created_at: string;

//   updated_at: string;
// }

// /**
//  * Finds the patient's active IFI monitoring cycle or starts a
//  * new 30-day cycle from the supplied report.
//  *
//  * Rules:
//  *
//  * 1. No active cycle
//  *    -> current report becomes Day 0.
//  *
//  * 2. Active cycle exists and report date is Day 0 ... Day 30
//  *    -> return existing cycle.
//  *
//  * 3. Active cycle exists but report date is after Day 30
//  *    -> complete old cycle.
//  *    -> current report becomes Day 0 of a new cycle.
//  *
//  * 4. Report date is earlier than the active cycle's Day 0
//  *    -> do not modify cycle history automatically.
//  *
//  * This service never trusts patient_id, evaluation_date or IFI
//  * from the browser.
//  */
// export async function getOrCreateIFIMonitoringCycle({
//   reportId,
// }: GetOrCreateIFIMonitoringCycleInput): Promise<IFIMonitoringCycle> {
//   const supabase = createSupabaseAdminClient();

//   /**
//    * ----------------------------------------------------------
//    * 1. LOAD THE ACTUAL REPORT
//    * ----------------------------------------------------------
//    */
//   const { data: reportData, error: reportError } = await supabase
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
//     .eq("id", reportId)
//     .maybeSingle();

//   if (reportError) {
//     throw new Error(
//       `Failed to load report for IFI monitoring: ${reportError.message}`,
//     );
//   }

//   if (!reportData) {
//     throw new Error(
//       "Cannot create IFI monitoring cycle because the report was not found.",
//     );
//   }

//   const report = reportData as ReportForMonitoring;

//   if (!report.patient_id) {
//     throw new Error(
//       "Cannot create IFI monitoring cycle because the report does not have a patient owner.",
//     );
//   }

//   validateIsoDate(report.evaluation_date, "Report evaluation date");

//   const reportIfi = extractIfiFromCalculationResults(
//     report.calculation_results,
//   );

//   /**
//    * ----------------------------------------------------------
//    * 2. LOOK FOR CURRENT ACTIVE CYCLE
//    * ----------------------------------------------------------
//    */
//   const { data: activeCycleData, error: activeCycleError } = await supabase
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
//     .eq("patient_id", report.patient_id)
//     .eq("status", "active")
//     .maybeSingle();

//   if (activeCycleError) {
//     throw new Error(
//       `Failed to read active IFI monitoring cycle: ${activeCycleError.message}`,
//     );
//   }

//   if (!activeCycleData) {
//     return createCycleFromReport({
//       patientId: report.patient_id,

//       reportId: report.id,

//       evaluationDate: report.evaluation_date,

//       baselineIfi: reportIfi,
//     });
//   }

//   const activeCycle = activeCycleData as IFIMonitoringCycleRow;

//   /**
//    * ----------------------------------------------------------
//    * 3. BACKDATED REPORT
//    * ----------------------------------------------------------
//    *
//    * Example:
//    *
//    * Active cycle:
//    * Sep 10 -> Oct 10
//    *
//    * Later a historical report dated Sep 5 is imported.
//    *
//    * We should NOT silently rewrite the patient's baseline and
//    * monitoring history.
//    */
//   if (compareIsoDates(report.evaluation_date, activeCycle.start_date) < 0) {
//     return mapCycleRow(activeCycle);
//   }

//   /**
//    * ----------------------------------------------------------
//    * 4. REPORT BELONGS TO CURRENT CYCLE
//    * ----------------------------------------------------------
//    *
//    * Day 0 through Day 30 inclusive.
//    */
//   if (compareIsoDates(report.evaluation_date, activeCycle.end_date) <= 0) {
//     return mapCycleRow(activeCycle);
//   }

//   /**
//    * ----------------------------------------------------------
//    * 5. ACTIVE CYCLE HAS EXPIRED
//    * ----------------------------------------------------------
//    *
//    * A later qualifying assessment starts the next cycle.
//    *
//    * Example:
//    *
//    * Cycle 1:
//    *
//    * Sep 10 -> Oct 10
//    *
//    * No report until Oct 15.
//    *
//    * The Oct 15 report becomes:
//    *
//    * Cycle 2 Day 0.
//    */
//   const completedAt = new Date().toISOString();

//   const { error: completeError } = await supabase
//     .from("ifi_monitoring_cycles")
//     .update({
//       status: "completed",
//       completed_at: completedAt,
//     })
//     .eq("id", activeCycle.id)
//     .eq("status", "active");

//   if (completeError) {
//     throw new Error(
//       `Failed to complete expired IFI monitoring cycle: ${completeError.message}`,
//     );
//   }

//   /**
//    * ----------------------------------------------------------
//    * 6. CURRENT REPORT BECOMES NEXT DAY 0
//    * ----------------------------------------------------------
//    */
//   return createCycleFromReport({
//     patientId: report.patient_id,

//     reportId: report.id,

//     evaluationDate: report.evaluation_date,

//     baselineIfi: reportIfi,
//   });
// }

// /**
//  * ------------------------------------------------------------
//  * CREATE NEW CYCLE
//  * ------------------------------------------------------------
//  */
// async function createCycleFromReport({
//   patientId,
//   reportId,
//   evaluationDate,
//   baselineIfi,
// }: {
//   patientId: string;
//   reportId: string;
//   evaluationDate: string;
//   baselineIfi: number;
// }): Promise<IFIMonitoringCycle> {
//   const supabase = createSupabaseAdminClient();

//   const endDate = addDaysToIsoDate(
//     evaluationDate,
//     IFI_MONITORING_DURATION_DAYS,
//   );

//   const { data, error } = await supabase
//     .from("ifi_monitoring_cycles")
//     .insert({
//       patient_id: patientId,

//       baseline_report_id: reportId,

//       baseline_ifi: baselineIfi,

//       /**
//        * We deliberately do NOT assign -5 or any other target.
//        *
//        * This remains null until the clinical target rule is
//        * confirmed.
//        */
//       target_ifi: null,

//       start_date: evaluationDate,

//       end_date: endDate,

//       status: "active",

//       completed_at: null,
//     })
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
//     .single();

//   /**
//    * ----------------------------------------------------------
//    * CONCURRENCY PROTECTION
//    * ----------------------------------------------------------
//    *
//    * The database has a partial unique index allowing only one
//    * active cycle per patient.
//    *
//    * If two report-processing requests race, one insert can win
//    * and the other can receive PostgreSQL 23505.
//    *
//    * In that case we simply read the cycle that won.
//    */
//   if (error?.code === "23505") {
//     const { data: existing, error: existingError } = await supabase
//       .from("ifi_monitoring_cycles")
//       .select(
//         `
//           id,
//           patient_id,
//           baseline_report_id,
//           baseline_ifi,
//           target_ifi,
//           start_date,
//           end_date,
//           status,
//           completed_at,
//           created_at,
//           updated_at
//         `,
//       )
//       .eq("patient_id", patientId)
//       .eq("status", "active")
//       .maybeSingle();

//     if (existingError || !existing) {
//       throw new Error(
//         "An IFI monitoring cycle was created concurrently, but it could not be reloaded.",
//       );
//     }

//     return mapCycleRow(existing as IFIMonitoringCycleRow);
//   }

//   if (error) {
//     throw new Error(`Failed to create IFI monitoring cycle: ${error.message}`);
//   }

//   if (!data) {
//     throw new Error("IFI monitoring cycle creation returned no data.");
//   }

//   return mapCycleRow(data as IFIMonitoringCycleRow);
// }

// /**
//  * ------------------------------------------------------------
//  * EXTRACT IFI FROM REPORT SNAPSHOT
//  * ------------------------------------------------------------
//  *
//  * Your report currently stores:
//  *
//  * calculation_results: {
//  *   IFI: IFICalculationResult,
//  *   BiologicalAge: ...,
//  *   PeptideDose: ...,
//  *   HBOTSessions: ...
//  * }
//  *
//  * We keep the JSON validation here defensive because data read
//  * from JSONB should not be blindly trusted at runtime.
//  */
// function extractIfiFromCalculationResults(calculationResults: unknown): number {
//   if (!isRecord(calculationResults)) {
//     throw new Error("Report calculation results are invalid.");
//   }

//   const ifiResult = calculationResults.IFI;

//   if (!isRecord(ifiResult)) {
//     throw new Error("Report does not contain a valid IFI calculation result.");
//   }

//   /**
//    * IMPORTANT
//    *
//    * This assumes your IFICalculationResult stores the raw
//    * calculated IFI under:
//    *
//    * calculation_results.IFI.IFI
//    *
//    * Example:
//    *
//    * {
//    *   "IFI": {
//    *     "IFI": -8.42,
//    *     ...
//    *   }
//    * }
//    *
//    * If your actual IFICalculationResult property is named
//    * `rawIfi` or `ifi` instead, change ONLY this line.
//    */
//   const ifi = ifiResult.rawIfi;

//   if (typeof ifi !== "number" || !Number.isFinite(ifi)) {
//     throw new Error("Report IFI value is missing or invalid.");
//   }

//   return ifi;
// }

// /**
//  * ------------------------------------------------------------
//  * DB ROW -> APPLICATION TYPE
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
//  * JSON RUNTIME GUARD
//  * ------------------------------------------------------------
//  */
// function isRecord(value: unknown): value is Record<string, unknown> {
//   return typeof value === "object" && value !== null && !Array.isArray(value);
// }

// /**
//  * ------------------------------------------------------------
//  * DATE COMPARISON
//  * ------------------------------------------------------------
//  *
//  * ISO date-only strings in YYYY-MM-DD format can safely be
//  * compared lexicographically once validated.
//  */
// function compareIsoDates(left: string, right: string): number {
//   validateIsoDate(left, "Left date");

//   validateIsoDate(right, "Right date");

//   if (left < right) {
//     return -1;
//   }

//   if (left > right) {
//     return 1;
//   }

//   return 0;
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
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { IFIMonitoringCycleStatus } from "@/types/calculations/ifi-monitoring";

const IFI_MONITORING_DURATION_DAYS = 30;

/**
 * ============================================================
 * APPLICATION TYPE
 * ============================================================
 *
 * IMPORTANT:
 *
 * The monitoring cycle only defines the patient's monitoring
 * window.
 *
 * Clinical IFI values are NOT duplicated into this table.
 *
 * Base IFI:
 *   Derived later from baselineReportId -> reports.
 *
 * Recovery:
 *   Derived later from every actual report IFI using:
 *
 *   ((actual IFI + 11) / 6) * 100
 *
 * There is no configurable target IFI.
 */
export interface IFIMonitoringCycle {
  id: string;

  patientId: string;

  /**
   * The report that started this cycle.
   *
   * This is the patient's Day 0 report and can later be used
   * to derive the displayed "Base IFI".
   */
  baselineReportId: string;

  startDate: string;

  endDate: string;

  status: IFIMonitoringCycleStatus;

  completedAt: string | null;

  createdAt: string;

  updatedAt: string;
}

interface GetOrCreateIFIMonitoringCycleInput {
  /**
   * The newly created report.
   *
   * Everything else is resolved from this report server-side.
   */
  reportId: string;
}

interface ReportForMonitoring {
  id: string;

  patient_id: string | null;

  evaluation_date: string;
}

interface IFIMonitoringCycleRow {
  id: string;

  patient_id: string;

  baseline_report_id: string;

  start_date: string;

  end_date: string;

  status: IFIMonitoringCycleStatus;

  completed_at: string | null;

  created_at: string;

  updated_at: string;
}

/**
 * ============================================================
 * GET OR CREATE IFI MONITORING CYCLE
 * ============================================================
 *
 * Finds the patient's active IFI monitoring cycle or starts a
 * new 30-day cycle from the supplied report.
 *
 * Rules:
 *
 * 1. No active cycle
 *    -> current report becomes Day 0.
 *
 * 2. Active cycle exists and report date is Day 0 ... Day 30
 *    -> return existing cycle.
 *
 * 3. Active cycle exists but report date is after Day 30
 *    -> complete old cycle.
 *    -> current report becomes Day 0 of a new cycle.
 *
 * 4. Report date is earlier than the active cycle's Day 0
 *    -> do not modify cycle history automatically.
 *
 * This service never trusts patient_id or evaluation_date from
 * the browser.
 *
 * IMPORTANT:
 *
 * This service does NOT calculate Recovery.
 * This service does NOT store Base IFI.
 * This service does NOT store a target IFI.
 *
 * It only manages the monitoring window.
 */
export async function getOrCreateIFIMonitoringCycle({
  reportId,
}: GetOrCreateIFIMonitoringCycleInput): Promise<IFIMonitoringCycle> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  /**
   * ----------------------------------------------------------
   * 1. LOAD THE ACTUAL REPORT
   * ----------------------------------------------------------
   *
   * We only need:
   *
   * - report ID
   * - patient owner
   * - evaluation date
   *
   * We no longer extract IFI here because the cycle table does
   * not store baseline_ifi.
   */
  const { data: reportData, error: reportError } = await supabase
    .from("reports")
    .select(
      `
        id,
        patient_id,
        evaluation_date
      `,
    )
    .eq("id", normalizedReportId)
    .maybeSingle();

  if (reportError) {
    throw new Error(
      `Failed to load report for IFI monitoring: ${reportError.message}`,
    );
  }

  if (!reportData) {
    throw new Error(
      "Cannot create IFI monitoring cycle because the report was not found.",
    );
  }

  const report = reportData as ReportForMonitoring;

  if (!report.patient_id) {
    throw new Error(
      "Cannot create IFI monitoring cycle because the report does not have a patient owner.",
    );
  }

  validateIsoDate(report.evaluation_date, "Report evaluation date");

  /**
   * ----------------------------------------------------------
   * 2. LOOK FOR CURRENT ACTIVE CYCLE
   * ----------------------------------------------------------
   */
  const { data: activeCycleData, error: activeCycleError } = await supabase
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
    .eq("patient_id", report.patient_id)
    .eq("status", "active")
    .maybeSingle();

  if (activeCycleError) {
    throw new Error(
      `Failed to read active IFI monitoring cycle: ${activeCycleError.message}`,
    );
  }

  /**
   * ----------------------------------------------------------
   * 3. NO ACTIVE CYCLE
   * ----------------------------------------------------------
   *
   * The current report becomes Day 0.
   */
  if (!activeCycleData) {
    return createCycleFromReport({
      patientId: report.patient_id,
      reportId: report.id,
      evaluationDate: report.evaluation_date,
    });
  }

  const activeCycle = activeCycleData as IFIMonitoringCycleRow;

  /**
   * ----------------------------------------------------------
   * 4. BACKDATED REPORT
   * ----------------------------------------------------------
   *
   * Example:
   *
   * Active cycle:
   * Sep 10 -> Oct 10
   *
   * Later a historical report dated Sep 5 is imported.
   *
   * We should NOT silently rewrite the patient's Day 0 report
   * or monitoring history.
   */
  if (compareIsoDates(report.evaluation_date, activeCycle.start_date) < 0) {
    return mapCycleRow(activeCycle);
  }

  /**
   * ----------------------------------------------------------
   * 5. REPORT BELONGS TO CURRENT CYCLE
   * ----------------------------------------------------------
   *
   * Day 0 through Day 30 inclusive.
   */
  if (compareIsoDates(report.evaluation_date, activeCycle.end_date) <= 0) {
    return mapCycleRow(activeCycle);
  }

  /**
   * ----------------------------------------------------------
   * 6. ACTIVE CYCLE HAS EXPIRED
   * ----------------------------------------------------------
   *
   * A later qualifying assessment starts the next cycle.
   *
   * Example:
   *
   * Cycle 1:
   * Sep 10 -> Oct 10
   *
   * No report until Oct 15.
   *
   * The Oct 15 report becomes Cycle 2 Day 0.
   */
  const completedAt = new Date().toISOString();

  const { error: completeError } = await supabase
    .from("ifi_monitoring_cycles")
    .update({
      status: "completed",
      completed_at: completedAt,
    })
    .eq("id", activeCycle.id)
    .eq("status", "active");

  if (completeError) {
    throw new Error(
      `Failed to complete expired IFI monitoring cycle: ${completeError.message}`,
    );
  }

  /**
   * ----------------------------------------------------------
   * 7. CURRENT REPORT BECOMES NEXT DAY 0
   * ----------------------------------------------------------
   */
  return createCycleFromReport({
    patientId: report.patient_id,
    reportId: report.id,
    evaluationDate: report.evaluation_date,
  });
}

/**
 * ============================================================
 * CREATE NEW CYCLE
 * ============================================================
 */
async function createCycleFromReport({
  patientId,
  reportId,
  evaluationDate,
}: {
  patientId: string;
  reportId: string;
  evaluationDate: string;
}): Promise<IFIMonitoringCycle> {
  const supabase = createSupabaseAdminClient();

  const endDate = addDaysToIsoDate(
    evaluationDate,
    IFI_MONITORING_DURATION_DAYS,
  );

  const { data, error } = await supabase
    .from("ifi_monitoring_cycles")
    .insert({
      patient_id: patientId,

      /**
       * This identifies Day 0.
       *
       * The Base IFI itself is derived later from this report.
       */
      baseline_report_id: reportId,

      start_date: evaluationDate,

      end_date: endDate,

      status: "active",

      completed_at: null,
    })
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
    .single();

  /**
   * ----------------------------------------------------------
   * CONCURRENCY PROTECTION
   * ----------------------------------------------------------
   *
   * The database has a partial unique index allowing only one
   * active cycle per patient.
   *
   * If two report-processing requests race, one insert can win
   * and the other can receive PostgreSQL 23505.
   *
   * In that case we simply read the cycle that won.
   */
  if (error?.code === "23505") {
    const { data: existing, error: existingError } = await supabase
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
      .eq("patient_id", patientId)
      .eq("status", "active")
      .maybeSingle();

    if (existingError || !existing) {
      throw new Error(
        "An IFI monitoring cycle was created concurrently, but it could not be reloaded.",
      );
    }

    return mapCycleRow(existing as IFIMonitoringCycleRow);
  }

  if (error) {
    throw new Error(`Failed to create IFI monitoring cycle: ${error.message}`);
  }

  if (!data) {
    throw new Error("IFI monitoring cycle creation returned no data.");
  }

  return mapCycleRow(data as IFIMonitoringCycleRow);
}

/**
 * ============================================================
 * DB ROW -> APPLICATION TYPE
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
 * DATE COMPARISON
 * ============================================================
 *
 * ISO date-only strings in YYYY-MM-DD format can safely be
 * compared lexicographically once validated.
 */
function compareIsoDates(left: string, right: string): number {
  validateIsoDate(left, "Left date");

  validateIsoDate(right, "Right date");

  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
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
