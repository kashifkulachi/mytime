// import type {
//   IFIMonitoringCalculationResult,
//   IFIMonitoringDay18Result,
//   IFIMonitoringDayResult,
//   IFIMonitoringInput,
//   IFIMonitoringObservation,
//   IFIMonitoringSlopeResult,
// } from "@/types/calculations/ifi-monitoring";

// import {
//   IFI_MONITORING_FINAL_DAY,
//   IFI_MONITORING_PHASE_BREAK_DAY,
//   IFI_MONITORING_TOTAL_DAYS,
// } from "@/types/calculations/ifi-monitoring";

// import { validateIFIMonitoringInput } from "./validateIFIMonitoringInput";

// const IFI_MONITORING_FORMULA_VERSION = "ifi-monitoring-v1.0.0";

// /**
//  * Calculates longitudinal IFI monitoring metrics from REAL patient
//  * report observations.
//  *
//  * IMPORTANT:
//  *
//  * This function does NOT generate IFI values.
//  *
//  * Every non-null IFI supplied here must already come from an actual
//  * report/assessment.
//  *
//  * The Excel workbook's -11 -> -5 modeled curve is therefore NOT
//  * reproduced as patient data.
//  */
// export function calculateIFIMonitoring(
//   input: IFIMonitoringInput,
// ): IFIMonitoringCalculationResult {
//   /**
//    * ----------------------------------------------------------
//    * 1. VALIDATE INPUT
//    * ----------------------------------------------------------
//    */
//   validateIFIMonitoringInput(input);

//   /**
//    * Sort defensively.
//    *
//    * The validator guarantees unique Day 0 -> Day 30 entries, but
//    * calculation should not depend on the caller's array ordering.
//    */
//   const observations = [...input.observations].sort((a, b) => a.day - b.day);

//   const baseline = getRequiredBaseline(observations);

//   /**
//    * Day 0 is guaranteed by validation to contain a real IFI,
//    * reportId and observedAt.
//    */
//   const baselineIfi = baseline.ifi as number;

//   const baselineReportId = baseline.reportId as string;

//   /**
//    * ----------------------------------------------------------
//    * 2. DAILY MONITORING RESULTS
//    * ----------------------------------------------------------
//    *
//    * Daily Change:
//    *
//    * current observed IFI - previous OBSERVED IFI
//    *
//    * Missing days do not manufacture changes.
//    *
//    * Example:
//    *
//    * Day 2 = -9
//    * Day 3 = missing
//    * Day 4 = -8
//    *
//    * Day 4 dailyChange = -8 - (-9) = +1
//    *
//    * This measures change between actual clinical observations.
//    */
//   const days: IFIMonitoringDayResult[] = [];

//   let previousObservedIfi: number | null = null;

//   for (const observation of observations) {
//     if (observation.ifi === null) {
//       days.push({
//         day: observation.day,
//         date: observation.date,

//         ifi: null,

//         reportId: null,

//         assessmentCount: observation.assessmentCount,

//         observedAt: null,

//         dailyChange: null,

//         changeFromBaseline: null,

//         recoveryPercent: null,

//         hasObservation: false,
//       });

//       continue;
//     }

//     const currentIfi = observation.ifi;

//     const dailyChange =
//       previousObservedIfi === null
//         ? null
//         : ensureFiniteResult(
//             currentIfi - previousObservedIfi,
//             `Day ${observation.day} daily change`,
//           );

//     const changeFromBaseline = ensureFiniteResult(
//       currentIfi - baselineIfi,
//       `Day ${observation.day} change from baseline`,
//     );

//     const recoveryPercent = calculateRecoveryPercent({
//       currentIfi,
//       baselineIfi,
//       targetIfi: input.targetIfi ?? null,
//     });

//     days.push({
//       day: observation.day,

//       date: observation.date,

//       ifi: currentIfi,

//       reportId: observation.reportId,

//       assessmentCount: observation.assessmentCount,

//       observedAt: observation.observedAt,

//       dailyChange,

//       changeFromBaseline,

//       recoveryPercent,

//       hasObservation: true,
//     });

//     previousObservedIfi = currentIfi;
//   }

//   /**
//    * ----------------------------------------------------------
//    * 3. OBSERVED POINTS
//    * ----------------------------------------------------------
//    */
//   const observedDays = days.filter(
//     (
//       day,
//     ): day is IFIMonitoringDayResult & {
//       ifi: number;
//       reportId: string;
//       observedAt: string;
//     } =>
//       day.hasObservation &&
//       day.ifi !== null &&
//       day.reportId !== null &&
//       day.observedAt !== null,
//   );

//   /**
//    * Day 0 guarantees this is never actually empty after validation,
//    * but this keeps the calculation defensive.
//    */
//   if (observedDays.length === 0) {
//     throw new Error("IFI monitoring contains no observed IFI values.");
//   }

//   const latestObservation = observedDays[observedDays.length - 1];

//   /**
//    * ----------------------------------------------------------
//    * 4. DAY 18 CHECKPOINT
//    * ----------------------------------------------------------
//    *
//    * We use only an actual Day-18 observation.
//    *
//    * We do NOT interpolate it from Day 17 / Day 19.
//    */
//   const day18 = buildDay18Result(days);

//   /**
//    * ----------------------------------------------------------
//    * 5. FINAL DAY
//    * ----------------------------------------------------------
//    *
//    * "Final IFI" means the actual Day-30 observation.
//    *
//    * During an active cycle this will commonly still be null.
//    */
//   const finalDay = days.find((day) => day.day === IFI_MONITORING_FINAL_DAY);

//   if (!finalDay) {
//     /**
//      * Should be impossible after validation, but remain defensive.
//      */
//     throw new Error(
//       `IFI monitoring Day ${IFI_MONITORING_FINAL_DAY} is missing.`,
//     );
//   }

//   const finalIfi = finalDay.ifi;

//   const finalReportId = finalDay.reportId;

//   /**
//    * ----------------------------------------------------------
//    * 6. RECOVERY SUMMARY
//    * ----------------------------------------------------------
//    */
//   const recoveryValues = days
//     .map((day) => day.recoveryPercent)
//     .filter((recovery): recovery is number => recovery !== null);

//   const maximumRecoveryPercent =
//     recoveryValues.length > 0 ? Math.max(...recoveryValues) : null;

//   const latestRecoveryPercent = latestObservation.recoveryPercent;

//   const finalRecoveryPercent = finalDay.recoveryPercent;

//   /**
//    * ----------------------------------------------------------
//    * 7. LINEAR REGRESSION SLOPES
//    * ----------------------------------------------------------
//    *
//    * Excel equivalent:
//    *
//    * SLOPE(known_y's, known_x's)
//    *
//    * X = monitoring day
//    * Y = observed IFI
//    *
//    * Missing IFI days are excluded.
//    */
//   const overallSlope = calculateSlope(
//     observedDays.map((day) => ({
//       x: day.day,
//       y: day.ifi,
//     })),
//   );

//   /**
//    * Workbook phase:
//    *
//    * Day 0 through Day 18 inclusive.
//    */
//   const slopeToDay18 = calculateSlope(
//     observedDays
//       .filter((day) => day.day <= IFI_MONITORING_PHASE_BREAK_DAY)
//       .map((day) => ({
//         x: day.day,
//         y: day.ifi,
//       })),
//   );

//   /**
//    * Workbook phase:
//    *
//    * Day 18 through Day 30 inclusive.
//    */
//   const slopeDay18To30 = calculateSlope(
//     observedDays
//       .filter((day) => day.day >= IFI_MONITORING_PHASE_BREAK_DAY)
//       .map((day) => ({
//         x: day.day,
//         y: day.ifi,
//       })),
//   );

//   /**
//    * ----------------------------------------------------------
//    * 8. ASSESSMENT COUNTS
//    * ----------------------------------------------------------
//    */
//   const totalAssessments = observations.reduce(
//     (total, observation) => total + observation.assessmentCount,
//     0,
//   );

//   const observedDayCount = observedDays.length;

//   const missingDays = IFI_MONITORING_TOTAL_DAYS - observedDayCount;

//   /**
//    * ----------------------------------------------------------
//    * 9. COMPLETE RESULT
//    * ----------------------------------------------------------
//    */
//   return {
//     cycleId: input.cycleId,

//     startDate: input.startDate,

//     endDate: input.endDate,

//     targetIfi: input.targetIfi ?? null,

//     days,

//     summary: {
//       baselineIfi,

//       baselineDate: baseline.date,

//       baselineReportId,

//       latestIfi: latestObservation.ifi,

//       latestDate: latestObservation.date,

//       latestReportId: latestObservation.reportId,

//       latestMonitoringDay: latestObservation.day,

//       latestChangeFromBaseline: ensureFiniteResult(
//         latestObservation.ifi - baselineIfi,
//         "Latest change from baseline",
//       ),

//       day18,

//       finalIfi,

//       finalReportId,

//       latestRecoveryPercent,

//       maximumRecoveryPercent,

//       finalRecoveryPercent,

//       observedDays: observedDayCount,

//       missingDays,

//       totalAssessments,

//       overallSlope,

//       slopeToDay18,

//       slopeDay18To30,
//     },

//     formulaVersion: IFI_MONITORING_FORMULA_VERSION,

//     calculatedAt: new Date().toISOString(),
//   };
// }

// /**
//  * ------------------------------------------------------------
//  * RECOVERY
//  * ------------------------------------------------------------
//  *
//  * Workbook concept:
//  *
//  *                    current IFI - baseline IFI
//  * Recovery % = ----------------------------------------- × 100
//  *                     target IFI - baseline IFI
//  *
//  *
//  * Workbook example:
//  *
//  * baseline = -11
//  * target   = -5
//  *
//  * current = -10.1055
//  *
//  * (-10.1055 - -11)
//  * ------------------ × 100
//  * (-5 - -11)
//  *
//  * = 14.91%
//  *
//  *
//  * PRODUCTION:
//  *
//  * baseline and target must both be dynamic.
//  *
//  * We currently return null when there is no clinically confirmed
//  * target.
//  */
// function calculateRecoveryPercent({
//   currentIfi,
//   baselineIfi,
//   targetIfi,
// }: {
//   currentIfi: number;
//   baselineIfi: number;
//   targetIfi: number | null;
// }): number | null {
//   if (targetIfi === null) {
//     return null;
//   }

//   const denominator = targetIfi - baselineIfi;

//   if (!Number.isFinite(denominator) || denominator === 0) {
//     throw new Error(
//       "IFI monitoring recovery denominator must be a non-zero finite number.",
//     );
//   }

//   const recovery = ((currentIfi - baselineIfi) / denominator) * 100;

//   return ensureFiniteResult(recovery, "IFI monitoring recovery");
// }

// /**
//  * ------------------------------------------------------------
//  * EXCEL-EQUIVALENT SLOPE
//  * ------------------------------------------------------------
//  *
//  * Excel:
//  *
//  * SLOPE(known_y's, known_x's)
//  *
//  * Mathematical form:
//  *
//  * Σ((x - x̄)(y - ȳ))
//  * -------------------
//  * Σ((x - x̄)²)
//  *
//  * We use only real observed IFIs.
//  */
// function calculateSlope(
//   points: Array<{
//     x: number;
//     y: number;
//   }>,
// ): IFIMonitoringSlopeResult {
//   /**
//    * Two points are the minimum required for a meaningful linear
//    * slope.
//    */
//   if (points.length < 2) {
//     return {
//       observationCount: points.length,

//       slopeIfiPerDay: null,
//     };
//   }

//   for (const point of points) {
//     ensureFiniteResult(point.x, "Slope X value");

//     ensureFiniteResult(point.y, "Slope Y value");
//   }

//   const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length;

//   const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length;

//   let numerator = 0;
//   let denominator = 0;

//   for (const point of points) {
//     const xDeviation = point.x - xMean;

//     const yDeviation = point.y - yMean;

//     numerator += xDeviation * yDeviation;

//     denominator += xDeviation * xDeviation;
//   }

//   /**
//    * This should not happen because monitoring days are unique.
//    * Still guard against division by zero.
//    */
//   if (denominator === 0) {
//     return {
//       observationCount: points.length,

//       slopeIfiPerDay: null,
//     };
//   }

//   const slope = numerator / denominator;

//   return {
//     observationCount: points.length,

//     slopeIfiPerDay: ensureFiniteResult(slope, "IFI monitoring slope"),
//   };
// }

// /**
//  * ------------------------------------------------------------
//  * DAY 18
//  * ------------------------------------------------------------
//  */
// function buildDay18Result(
//   days: IFIMonitoringDayResult[],
// ): IFIMonitoringDay18Result {
//   const day18 = days.find((day) => day.day === IFI_MONITORING_PHASE_BREAK_DAY);

//   if (!day18) {
//     throw new Error(
//       `IFI monitoring Day ${IFI_MONITORING_PHASE_BREAK_DAY} is missing.`,
//     );
//   }

//   return {
//     day: IFI_MONITORING_PHASE_BREAK_DAY,

//     date: day18.date,

//     ifi: day18.ifi,

//     reportId: day18.reportId,

//     hasObservation: day18.hasObservation,
//   };
// }

// /**
//  * ------------------------------------------------------------
//  * REQUIRED BASELINE
//  * ------------------------------------------------------------
//  */
// function getRequiredBaseline(
//   observations: IFIMonitoringObservation[],
// ): IFIMonitoringObservation {
//   const baseline = observations.find((observation) => observation.day === 0);

//   if (!baseline || baseline.ifi === null || !baseline.reportId) {
//     throw new Error("IFI monitoring requires a valid Day 0 baseline report.");
//   }

//   return baseline;
// }

// /**
//  * ------------------------------------------------------------
//  * FINITE RESULT GUARD
//  * ------------------------------------------------------------
//  */
// function ensureFiniteResult(value: number, fieldName: string): number {
//   if (!Number.isFinite(value)) {
//     throw new Error(`${fieldName} must be a finite number.`);
//   }

//   return value;
// }
import type {
  IFIMonitoringCalculationResult,
  IFIMonitoringDay18Result,
  IFIMonitoringDayResult,
  IFIMonitoringInput,
  IFIMonitoringObservation,
  IFIMonitoringSlopeResult,
} from "@/types/calculations/ifi-monitoring";

import {
  IFI_MONITORING_FINAL_DAY,
  IFI_MONITORING_PHASE_BREAK_DAY,
  IFI_MONITORING_TOTAL_DAYS,
  IFI_RECOVERY_DIVISOR,
  IFI_RECOVERY_OFFSET,
  IFI_RECOVERY_PERCENT_MULTIPLIER,
} from "@/types/calculations/ifi-monitoring";

import { validateIFIMonitoringInput } from "./validateIFIMonitoringInput";

/**
 * Increment this whenever the clinical monitoring calculation
 * itself changes.
 *
 * v2 introduces the confirmed fixed Recovery formula:
 *
 * ((actual IFI + 11) / 6) * 100
 */
const IFI_MONITORING_FORMULA_VERSION = "ifi-monitoring-v2.0.0";

/**
 * Calculates longitudinal IFI monitoring metrics exclusively
 * from REAL patient report observations.
 *
 * IMPORTANT:
 *
 * This function NEVER generates/model/interpolates an IFI.
 *
 * Every non-null IFI supplied here must already come from an
 * actual patient assessment/report.
 *
 * Recovery:
 *
 * ((actual IFI + 11) / 6) * 100
 *
 * Base IFI and Final IFI are longitudinal summary values.
 *
 * They do NOT participate in the Recovery formula.
 */
export function calculateIFIMonitoring(
  input: IFIMonitoringInput,
): IFIMonitoringCalculationResult {
  /**
   * ----------------------------------------------------------
   * 1. VALIDATE INPUT
   * ----------------------------------------------------------
   */
  validateIFIMonitoringInput(input);

  /**
   * Sort defensively.
   *
   * Validation guarantees unique Day 0 -> Day 30 positions,
   * but calculation should not depend on array ordering.
   */
  const observations = [...input.observations].sort(
    (left, right) => left.day - right.day,
  );

  /**
   * ----------------------------------------------------------
   * DAY 0 / BASE IFI
   * ----------------------------------------------------------
   *
   * Day 0 must contain a real report.
   *
   * We call this value Base IFI for longitudinal reporting.
   *
   * It is NOT an input to Recovery.
   */
  const baseline = getRequiredBaseline(observations);

  const baselineIfi = baseline.ifi as number;

  const baselineReportId = baseline.reportId as string;

  /**
   * ----------------------------------------------------------
   * 2. DAILY MONITORING RESULTS
   * ----------------------------------------------------------
   *
   * Daily Change:
   *
   * current observed IFI - previous OBSERVED IFI
   *
   * Example:
   *
   * Day 2 = -9
   * Day 3 = missing
   * Day 4 = -8
   *
   * Day 4 dailyChange:
   *
   * -8 - (-9) = +1
   *
   * We compare real observations only.
   */
  const days: IFIMonitoringDayResult[] = [];

  let previousObservedIfi: number | null = null;

  for (const observation of observations) {
    /**
     * --------------------------------------------------------
     * MISSING DAY
     * --------------------------------------------------------
     */
    if (observation.ifi === null) {
      days.push({
        day: observation.day,

        date: observation.date,

        ifi: null,

        reportId: null,

        assessmentCount: observation.assessmentCount,

        observedAt: null,

        dailyChange: null,

        changeFromBaseline: null,

        recoveryPercent: null,

        hasObservation: false,
      });

      continue;
    }

    /**
     * --------------------------------------------------------
     * OBSERVED DAY
     * --------------------------------------------------------
     */
    const currentIfi = observation.ifi;

    const dailyChange =
      previousObservedIfi === null
        ? null
        : ensureFiniteResult(
            currentIfi - previousObservedIfi,
            `Day ${observation.day} daily change`,
          );

    /**
     * Longitudinal comparison only.
     *
     * This is NOT part of Recovery.
     */
    const changeFromBaseline = ensureFiniteResult(
      currentIfi - baselineIfi,
      `Day ${observation.day} change from baseline`,
    );

    /**
     * Confirmed Recovery formula.
     */
    const recoveryPercent = calculateRecoveryPercent(currentIfi);

    days.push({
      day: observation.day,

      date: observation.date,

      ifi: currentIfi,

      reportId: observation.reportId,

      assessmentCount: observation.assessmentCount,

      observedAt: observation.observedAt,

      dailyChange,

      changeFromBaseline,

      recoveryPercent,

      hasObservation: true,
    });

    previousObservedIfi = currentIfi;
  }

  /**
   * ----------------------------------------------------------
   * 3. OBSERVED POINTS
   * ----------------------------------------------------------
   */
  const observedDays = days.filter(
    (
      day,
    ): day is IFIMonitoringDayResult & {
      ifi: number;
      reportId: string;
      observedAt: string;
      recoveryPercent: number;
    } =>
      day.hasObservation &&
      day.ifi !== null &&
      day.reportId !== null &&
      day.observedAt !== null &&
      day.recoveryPercent !== null,
  );

  /**
   * Day 0 validation should make this impossible, but keep the
   * calculation defensive.
   */
  if (observedDays.length === 0) {
    throw new Error("IFI monitoring contains no observed IFI values.");
  }

  /**
   * Since days are chronologically sorted, the last observed
   * entry is the latest actual assessment currently available
   * within this monitoring cycle.
   */
  const latestObservation = observedDays[observedDays.length - 1];

  /**
   * ----------------------------------------------------------
   * 4. BASE RECOVERY
   * ----------------------------------------------------------
   *
   * Recovery of Day 0 itself.
   *
   * Notice that baselineIfi is simply passed as the day's actual
   * IFI. It is NOT acting as a normalization baseline.
   */
  const baselineRecoveryPercent = calculateRecoveryPercent(baselineIfi);

  /**
   * ----------------------------------------------------------
   * 5. DAY 18 CHECKPOINT
   * ----------------------------------------------------------
   *
   * Only an actual Day-18 observation is accepted.
   *
   * No interpolation.
   * No Day-17 substitution.
   * No Day-19 substitution.
   */
  const day18 = buildDay18Result(days);

  /**
   * ----------------------------------------------------------
   * 6. FINAL DAY / DAY 30
   * ----------------------------------------------------------
   *
   * Final IFI specifically means the actual Day-30 IFI.
   *
   * It is intentionally different from latestIfi.
   *
   * During an active cycle:
   *
   * latestIfi may exist
   * finalIfi may still be null
   */
  const finalDay = days.find((day) => day.day === IFI_MONITORING_FINAL_DAY);

  if (!finalDay) {
    throw new Error(
      `IFI monitoring Day ${IFI_MONITORING_FINAL_DAY} is missing.`,
    );
  }

  const finalIfi = finalDay.ifi;

  const finalReportId = finalDay.reportId;

  const finalRecoveryPercent = finalDay.recoveryPercent;

  /**
   * ----------------------------------------------------------
   * 7. MAXIMUM / LATEST RECOVERY
   * ----------------------------------------------------------
   *
   * Recovery is calculated independently for every real IFI:
   *
   * ((IFI + 11) / 6) * 100
   *
   * Missing days are excluded.
   *
   * IMPORTANT:
   *
   * Recovery is NOT clamped to 0..100.
   */
  const recoveryValues = observedDays.map((day) => day.recoveryPercent);

  /**
   * Day 0 guarantees at least one real Recovery value.
   */
  const maximumRecoveryPercent = ensureFiniteResult(
    Math.max(...recoveryValues),
    "Maximum IFI monitoring recovery",
  );

  const latestRecoveryPercent = latestObservation.recoveryPercent;

  /**
   * ----------------------------------------------------------
   * 8. LINEAR REGRESSION SLOPES
   * ----------------------------------------------------------
   *
   * Excel equivalent:
   *
   * SLOPE(known_y's, known_x's)
   *
   * X = monitoring day
   * Y = actual observed IFI
   *
   * Missing IFI days are excluded.
   */
  const overallSlope = calculateSlope(
    observedDays.map((day) => ({
      x: day.day,
      y: day.ifi,
    })),
  );

  /**
   * Day 0 -> Day 18 inclusive.
   */
  const slopeToDay18 = calculateSlope(
    observedDays
      .filter((day) => day.day <= IFI_MONITORING_PHASE_BREAK_DAY)
      .map((day) => ({
        x: day.day,
        y: day.ifi,
      })),
  );

  /**
   * Day 18 -> Day 30 inclusive.
   *
   * If Day 18 itself is missing, regression still uses the real
   * observed points available after Day 18.
   *
   * We do NOT fabricate a Day-18 point.
   */
  const slopeDay18To30 = calculateSlope(
    observedDays
      .filter((day) => day.day >= IFI_MONITORING_PHASE_BREAK_DAY)
      .map((day) => ({
        x: day.day,
        y: day.ifi,
      })),
  );

  /**
   * ----------------------------------------------------------
   * 9. ASSESSMENT COUNTS
   * ----------------------------------------------------------
   */
  const totalAssessments = observations.reduce(
    (total, observation) => total + observation.assessmentCount,
    0,
  );

  const observedDayCount = observedDays.length;

  const missingDays = IFI_MONITORING_TOTAL_DAYS - observedDayCount;

  /**
   * ----------------------------------------------------------
   * 10. COMPLETE RESULT
   * ----------------------------------------------------------
   */
  return {
    cycleId: input.cycleId,

    startDate: input.startDate,

    endDate: input.endDate,

    days,

    summary: {
      /**
       * Base / Initial IFI
       */
      baselineIfi,

      baselineDate: baseline.date,

      baselineReportId,

      baselineRecoveryPercent,

      /**
       * Latest actual observation
       */
      latestIfi: latestObservation.ifi,

      latestDate: latestObservation.date,

      latestReportId: latestObservation.reportId,

      latestMonitoringDay: latestObservation.day,

      latestChangeFromBaseline: ensureFiniteResult(
        latestObservation.ifi - baselineIfi,
        "Latest change from baseline",
      ),

      latestRecoveryPercent,

      /**
       * Day 18
       */
      day18,

      /**
       * Final / Day 30
       */
      finalIfi,

      finalReportId,

      finalRecoveryPercent,

      /**
       * Maximum observed Recovery
       */
      maximumRecoveryPercent,

      /**
       * Counts
       */
      observedDays: observedDayCount,

      missingDays,

      totalAssessments,

      /**
       * Trends
       */
      overallSlope,

      slopeToDay18,

      slopeDay18To30,
    },

    formulaVersion: IFI_MONITORING_FORMULA_VERSION,

    calculatedAt: new Date().toISOString(),
  };
}

/**
 * ============================================================
 * RECOVERY
 * ============================================================
 *
 * CONFIRMED FORMULA:
 *
 *                actual IFI + 11
 * Recovery % = ------------------- × 100
 *                       6
 *
 *
 * Examples:
 *
 * IFI = -11
 *
 * (-11 + 11) / 6 * 100
 * = 0%
 *
 *
 * IFI = -8
 *
 * (-8 + 11) / 6 * 100
 * = 50%
 *
 *
 * IFI = -5
 *
 * (-5 + 11) / 6 * 100
 * = 100%
 *
 *
 * IMPORTANT:
 *
 * 11 and 6 are fixed formula constants.
 *
 * They are NOT:
 *
 * - the patient's Base IFI
 * - a target IFI
 *
 * Recovery is intentionally NOT clamped.
 */
function calculateRecoveryPercent(actualIfi: number): number {
  const recovery =
    ((actualIfi + IFI_RECOVERY_OFFSET) / IFI_RECOVERY_DIVISOR) *
    IFI_RECOVERY_PERCENT_MULTIPLIER;

  return ensureFiniteResult(recovery, "IFI monitoring recovery");
}

/**
 * ============================================================
 * EXCEL-EQUIVALENT SLOPE
 * ============================================================
 *
 * Excel:
 *
 * SLOPE(known_y's, known_x's)
 *
 * Mathematical form:
 *
 * Σ((x - x̄)(y - ȳ))
 * -------------------
 * Σ((x - x̄)²)
 *
 * Only real observed IFIs participate.
 */
function calculateSlope(
  points: Array<{
    x: number;
    y: number;
  }>,
): IFIMonitoringSlopeResult {
  /**
   * At least two observations are required.
   */
  if (points.length < 2) {
    return {
      observationCount: points.length,

      slopeIfiPerDay: null,
    };
  }

  for (const point of points) {
    ensureFiniteResult(point.x, "Slope X value");

    ensureFiniteResult(point.y, "Slope Y value");
  }

  const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length;

  const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length;

  let numerator = 0;
  let denominator = 0;

  for (const point of points) {
    const xDeviation = point.x - xMean;

    const yDeviation = point.y - yMean;

    numerator += xDeviation * yDeviation;

    denominator += xDeviation * xDeviation;
  }

  /**
   * Monitoring days should be unique, therefore this should
   * never happen, but keep the mathematical guard.
   */
  if (denominator === 0) {
    return {
      observationCount: points.length,

      slopeIfiPerDay: null,
    };
  }

  const slope = numerator / denominator;

  return {
    observationCount: points.length,

    slopeIfiPerDay: ensureFiniteResult(slope, "IFI monitoring slope"),
  };
}

/**
 * ============================================================
 * DAY 18
 * ============================================================
 */
function buildDay18Result(
  days: IFIMonitoringDayResult[],
): IFIMonitoringDay18Result {
  const day18 = days.find((day) => day.day === IFI_MONITORING_PHASE_BREAK_DAY);

  if (!day18) {
    throw new Error(
      `IFI monitoring Day ${IFI_MONITORING_PHASE_BREAK_DAY} is missing.`,
    );
  }

  return {
    day: IFI_MONITORING_PHASE_BREAK_DAY,

    date: day18.date,

    ifi: day18.ifi,

    reportId: day18.reportId,

    recoveryPercent: day18.recoveryPercent,

    hasObservation: day18.hasObservation,
  };
}

/**
 * ============================================================
 * REQUIRED DAY 0 / BASE REPORT
 * ============================================================
 */
function getRequiredBaseline(
  observations: IFIMonitoringObservation[],
): IFIMonitoringObservation {
  const baseline = observations.find((observation) => observation.day === 0);

  if (
    !baseline ||
    baseline.ifi === null ||
    !baseline.reportId ||
    !baseline.observedAt
  ) {
    throw new Error("IFI monitoring requires a valid Day 0 report.");
  }

  return baseline;
}

/**
 * ============================================================
 * FINITE RESULT GUARD
 * ============================================================
 */
function ensureFiniteResult(value: number, fieldName: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }

  return value;
}
