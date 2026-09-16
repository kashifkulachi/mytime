// /**
//  * MyTime IFI Monitoring
//  *
//  * Production monitoring is based on REAL IFI observations taken
//  * from completed patient reports.
//  *
//  * The Excel workbook uses a modeled -11 -> -5 curve as an example.
//  * Those values MUST NOT be treated as application constants.
//  */

// /**
//  * ------------------------------------------------------------
//  * MONITORING WINDOW
//  * ------------------------------------------------------------
//  *
//  * Day 0 through Day 30 = 31 calendar positions.
//  */
// export const IFI_MONITORING_FINAL_DAY = 30;

// export const IFI_MONITORING_TOTAL_DAYS = IFI_MONITORING_FINAL_DAY + 1;

// /**
//  * The workbook explicitly uses Day 18 as the phase checkpoint:
//  *
//  * - slope from Day 0 -> Day 18
//  * - slope from Day 18 -> Day 30
//  */
// export const IFI_MONITORING_PHASE_BREAK_DAY = 18;

// /**
//  * ------------------------------------------------------------
//  * OBSERVATION SOURCE
//  * ------------------------------------------------------------
//  *
//  * A day's IFI must come from an actual report.
//  *
//  * If there are multiple reports on one calendar day, the data
//  * preparation layer will select one canonical observation
//  * (currently planned as the latest successfully completed report).
//  *
//  * This calculation layer does NOT make that database decision.
//  */
// export interface IFIMonitoringObservation {
//   /**
//    * Day relative to the monitoring cycle.
//    *
//    * 0 <= day <= 30
//    */
//   day: number;

//   /**
//    * Calendar date represented by this monitoring position.
//    *
//    * ISO date only:
//    * YYYY-MM-DD
//    */
//   date: string;

//   /**
//    * Actual IFI value from:
//    *
//    * reports.calculation_results.IFI
//    *
//    * null means the patient had no qualifying assessment on
//    * this monitoring day.
//    */
//   ifi: number | null;

//   /**
//    * Report used as the canonical observation for this day.
//    *
//    * Remains useful internally for traceability.
//    */
//   reportId: string | null;

//   /**
//    * How many qualifying assessments existed on this calendar day.
//    *
//    * Example:
//    *
//    * assessmentCount = 3
//    *
//    * but only the selected canonical report contributes the day's
//    * IFI observation.
//    */
//   assessmentCount: number;

//   /**
//    * Timestamp of the report selected for this day's IFI.
//    *
//    * null when no observation exists.
//    */
//   observedAt: string | null;
// }

// /**
//  * ------------------------------------------------------------
//  * FORMULA INPUT
//  * ------------------------------------------------------------
//  *
//  * This is deliberately independent of Supabase and React.
//  *
//  * The database/service layer prepares this structure first.
//  */
// export interface IFIMonitoringInput {
//   /**
//    * Monitoring cycle identifier.
//    *
//    * Optional at calculation level so formulas can also be tested
//    * independently from database persistence.
//    */
//   cycleId?: string;

//   /**
//    * Day 0 calendar date.
//    */
//   startDate: string;

//   /**
//    * Day 30 calendar date.
//    */
//   endDate: string;

//   /**
//    * Exactly 31 chronological monitoring positions are expected:
//    *
//    * Day 0 ... Day 30
//    *
//    * Missing assessments remain represented with ifi = null.
//    */
//   observations: IFIMonitoringObservation[];

//   /**
//    * Optional target IFI.
//    *
//    * IMPORTANT:
//    *
//    * Do NOT automatically use -5 from the workbook.
//    *
//    * This field remains optional until the doctor confirms whether
//    * an active cycle has a patient-specific target IFI.
//    *
//    * If absent, live target-normalized recovery cannot be computed.
//    */
//   targetIfi?: number | null;
// }

// /**
//  * ------------------------------------------------------------
//  * DAILY CALCULATED RESULT
//  * ------------------------------------------------------------
//  */
// export interface IFIMonitoringDayResult {
//   day: number;

//   date: string;

//   /**
//    * Real IFI observation from the canonical report.
//    */
//   ifi: number | null;

//   reportId: string | null;

//   assessmentCount: number;

//   observedAt: string | null;

//   /**
//    * Difference from the previous OBSERVED IFI.
//    *
//    * Workbook equivalent:
//    *
//    * current IFI - previous IFI
//    *
//    * Example:
//    * -10.1055 - (-11) = +0.8945
//    *
//    * null when this day or a usable previous observation is absent.
//    */
//   dailyChange: number | null;

//   /**
//    * Difference from the Day-0 baseline.
//    *
//    * current IFI - baseline IFI
//    */
//   changeFromBaseline: number | null;

//   /**
//    * Recovery normalized against a known target.
//    *
//    * target mode:
//    *
//    * (currentIfi - baselineIfi)
//    * -------------------------------- * 100
//    * (targetIfi - baselineIfi)
//    *
//    * null while no target has been clinically defined.
//    *
//    * We intentionally DO NOT hardcode the workbook's -11 / -5.
//    */
//   recoveryPercent: number | null;

//   /**
//    * True when an actual report contributed this day's IFI.
//    */
//   hasObservation: boolean;
// }

// /**
//  * ------------------------------------------------------------
//  * PHASE / SLOPE RESULT
//  * ------------------------------------------------------------
//  *
//  * Workbook uses Excel SLOPE() across all available points in each
//  * stated interval.
//  *
//  * Units:
//  * IFI points per monitoring day.
//  */
// export interface IFIMonitoringSlopeResult {
//   /**
//    * Number of real observations contributing to the regression.
//    */
//   observationCount: number;

//   /**
//    * Linear regression slope.
//    *
//    * null when there are insufficient observations to calculate it.
//    */
//   slopeIfiPerDay: number | null;
// }

// /**
//  * ------------------------------------------------------------
//  * DAY 18 CHECKPOINT
//  * ------------------------------------------------------------
//  */
// export interface IFIMonitoringDay18Result {
//   day: typeof IFI_MONITORING_PHASE_BREAK_DAY;

//   date: string;

//   /**
//    * Actual Day-18 IFI if a report exists on that calendar day.
//    *
//    * We do not fabricate/interpolate a value when Day 18 is missing.
//    */
//   ifi: number | null;

//   reportId: string | null;

//   hasObservation: boolean;
// }

// /**
//  * ------------------------------------------------------------
//  * LONGITUDINAL SUMMARY
//  * ------------------------------------------------------------
//  *
//  * This corresponds conceptually to the workbook's
//  * "Longitudinal Results" block.
//  */
// export interface IFIMonitoringSummary {
//   /**
//    * Day-0 IFI.
//    *
//    * A valid monitoring cycle should have a real baseline report.
//    */
//   baselineIfi: number;

//   baselineDate: string;

//   baselineReportId: string;

//   /**
//    * Most recent real observation currently available in the cycle.
//    *
//    * During an active cycle this may be Day 4, Day 17, etc.
//    */
//   latestIfi: number;

//   latestDate: string;

//   latestReportId: string;

//   latestMonitoringDay: number;

//   /**
//    * Difference:
//    *
//    * latestIfi - baselineIfi
//    */
//   latestChangeFromBaseline: number;

//   /**
//    * Actual Day-18 observation if available.
//    */
//   day18: IFIMonitoringDay18Result;

//   /**
//    * Day-30 observation.
//    *
//    * null until a real Day-30 qualifying report exists.
//    */
//   finalIfi: number | null;

//   finalReportId: string | null;

//   /**
//    * Recovery at the latest observed point when a target is known.
//    */
//   latestRecoveryPercent: number | null;

//   /**
//    * Maximum computed recovery across observed days.
//    *
//    * null if recovery cannot currently be calculated.
//    */
//   maximumRecoveryPercent: number | null;

//   /**
//    * Workbook equivalent of "Final Recovery".
//    *
//    * Only meaningful when Day 30 is observed and recovery can be
//    * calculated.
//    */
//   finalRecoveryPercent: number | null;

//   /**
//    * Number of calendar positions containing actual assessments.
//    */
//   observedDays: number;

//   /**
//    * Number of calendar positions with no qualifying report.
//    *
//    * For a full 31-day result:
//    *
//    * observedDays + missingDays = 31
//    */
//   missingDays: number;

//   /**
//    * Total number of qualifying reports during the cycle.
//    *
//    * Can be greater than observedDays because a patient may take
//    * more than one assessment in a day.
//    */
//   totalAssessments: number;

//   /**
//    * Excel:
//    *
//    * SLOPE(C5:C35, A5:A35)
//    */
//   overallSlope: IFIMonitoringSlopeResult;

//   /**
//    * Excel:
//    *
//    * SLOPE(C5:C23, A5:A23)
//    *
//    * Day 0 through Day 18.
//    */
//   slopeToDay18: IFIMonitoringSlopeResult;

//   /**
//    * Excel:
//    *
//    * SLOPE(C23:C35, A23:A35)
//    *
//    * Day 18 through Day 30.
//    */
//   slopeDay18To30: IFIMonitoringSlopeResult;
// }

// /**
//  * ------------------------------------------------------------
//  * COMPLETE CALCULATION RESULT
//  * ------------------------------------------------------------
//  */
// export interface IFIMonitoringCalculationResult {
//   cycleId?: string;

//   startDate: string;

//   endDate: string;

//   /**
//    * Target used for normalized recovery.
//    *
//    * null until the clinical target rule is confirmed.
//    */
//   targetIfi: number | null;

//   /**
//    * All 31 monitoring positions.
//    *
//    * Missing days are retained rather than discarded.
//    */
//   days: IFIMonitoringDayResult[];

//   summary: IFIMonitoringSummary;

//   /**
//    * Formula/version identifier allows us to reproduce historical
//    * monitoring calculations after future formula revisions.
//    */
//   formulaVersion: string;

//   calculatedAt: string;
// }

// /**
//  * ------------------------------------------------------------
//  * CYCLE STATUS
//  * ------------------------------------------------------------
//  *
//  * This type will later be reused by the Supabase monitoring-cycle
//  * table and API DTOs.
//  */
// export type IFIMonitoringCycleStatus = "active" | "completed" | "cancelled";
/**
 * MyTime IFI Monitoring
 *
 * Production monitoring is based entirely on REAL IFI
 * observations taken from patient reports.
 *
 * Recovery formula:
 *
 *   ((actual IFI + 11) / 6) * 100
 *
 * IMPORTANT:
 *
 * +11 and /6 are fixed constants in the confirmed Recovery
 * formula.
 *
 * Base IFI and Final IFI are longitudinal summary values.
 * They are NOT inputs to the Recovery formula.
 */

/**
 * ============================================================
 * MONITORING WINDOW
 * ============================================================
 *
 * Day 0 through Day 30 = 31 calendar positions.
 */
export const IFI_MONITORING_FINAL_DAY = 30;

export const IFI_MONITORING_TOTAL_DAYS = IFI_MONITORING_FINAL_DAY + 1;

/**
 * The workbook explicitly uses Day 18 as a longitudinal
 * checkpoint.
 */
export const IFI_MONITORING_PHASE_BREAK_DAY = 18;

/**
 * ============================================================
 * RECOVERY FORMULA CONSTANTS
 * ============================================================
 *
 * Confirmed formula:
 *
 * ((actual IFI + 11) / 6) * 100
 *
 * Keeping the constants named makes the formula explicit and
 * prevents them from being confused with patient-specific
 * baseline/target values.
 */
export const IFI_RECOVERY_OFFSET = 11;

export const IFI_RECOVERY_DIVISOR = 6;

export const IFI_RECOVERY_PERCENT_MULTIPLIER = 100;

/**
 * ============================================================
 * OBSERVATION SOURCE
 * ============================================================
 *
 * Every IFI observation must originate from an actual report.
 *
 * The database/service layer decides which report represents a
 * calendar day when multiple assessments exist.
 *
 * The calculation layer does not make that database decision.
 */
export interface IFIMonitoringObservation {
  /**
   * Monitoring day.
   *
   * 0 <= day <= 30
   */
  day: number;

  /**
   * Calendar date represented by this monitoring position.
   *
   * YYYY-MM-DD
   */
  date: string;

  /**
   * Actual raw IFI from the selected patient report.
   *
   * null means there was no qualifying assessment for this
   * monitoring day.
   */
  ifi: number | null;

  /**
   * Report selected as the canonical observation.
   */
  reportId: string | null;

  /**
   * Number of qualifying assessments that existed on this
   * calendar day.
   *
   * Only one canonical report contributes the day's IFI.
   */
  assessmentCount: number;

  /**
   * created_at timestamp of the selected report.
   *
   * null when the day has no observation.
   */
  observedAt: string | null;
}

/**
 * ============================================================
 * FORMULA INPUT
 * ============================================================
 *
 * Deliberately independent from Supabase and React.
 *
 * Notice what is NOT present:
 *
 * - baselineIfi
 * - targetIfi
 *
 * Neither is required to calculate Recovery.
 */
export interface IFIMonitoringInput {
  /**
   * Monitoring cycle identifier.
   *
   * Optional so the calculation engine can also be unit-tested
   * without database persistence.
   */
  cycleId?: string;

  /**
   * Day 0 calendar date.
   */
  startDate: string;

  /**
   * Day 30 calendar date.
   */
  endDate: string;

  /**
   * Exactly 31 chronological positions:
   *
   * Day 0 ... Day 30
   *
   * Missing assessments remain represented by ifi = null.
   */
  observations: IFIMonitoringObservation[];
}

/**
 * ============================================================
 * DAILY CALCULATED RESULT
 * ============================================================
 */
export interface IFIMonitoringDayResult {
  day: number;

  date: string;

  /**
   * Actual IFI from the canonical patient report.
   */
  ifi: number | null;

  reportId: string | null;

  assessmentCount: number;

  observedAt: string | null;

  /**
   * Difference from the previous OBSERVED IFI.
   *
   * current actual IFI - previous observed actual IFI
   *
   * Missing calendar days do not create artificial values.
   *
   * null when:
   *
   * - this day has no observation, or
   * - there is no previous observed IFI yet.
   */
  dailyChange: number | null;

  /**
   * Difference from the actual Day 0 / Base IFI.
   *
   * current IFI - Base IFI
   *
   * This is useful for longitudinal presentation but is NOT
   * involved in Recovery.
   */
  changeFromBaseline: number | null;

  /**
   * Confirmed Recovery formula:
   *
   * ((actual IFI + 11) / 6) * 100
   *
   * null only when this day has no actual IFI observation.
   */
  recoveryPercent: number | null;

  /**
   * True only when an actual report contributed this day's IFI.
   */
  hasObservation: boolean;
}

/**
 * ============================================================
 * PHASE / SLOPE RESULT
 * ============================================================
 *
 * Workbook uses Excel SLOPE() over available points.
 *
 * Units:
 *
 * IFI points per monitoring day.
 */
export interface IFIMonitoringSlopeResult {
  /**
   * Number of real observations contributing to the regression.
   */
  observationCount: number;

  /**
   * Linear-regression slope.
   *
   * null when fewer than two usable observations exist.
   */
  slopeIfiPerDay: number | null;
}

/**
 * ============================================================
 * DAY 18 CHECKPOINT
 * ============================================================
 */
export interface IFIMonitoringDay18Result {
  day: typeof IFI_MONITORING_PHASE_BREAK_DAY;

  date: string;

  /**
   * Actual IFI specifically on Day 18.
   *
   * null if there was no Day 18 assessment.
   *
   * We do NOT interpolate or substitute a nearby day.
   */
  ifi: number | null;

  reportId: string | null;

  /**
   * Recovery calculated from the Day 18 actual IFI:
   *
   * ((IFI + 11) / 6) * 100
   *
   * null when Day 18 has no observation.
   */
  recoveryPercent: number | null;

  hasObservation: boolean;
}

/**
 * ============================================================
 * LONGITUDINAL SUMMARY
 * ============================================================
 *
 * This provides the data required for the workbook-style
 * longitudinal results area and the patient/doctor dashboard.
 */
export interface IFIMonitoringSummary {
  /**
   * ----------------------------------------------------------
   * BASE / INITIAL IFI
   * ----------------------------------------------------------
   *
   * Actual IFI from the report that established Day 0.
   *
   * This is a DISPLAY / longitudinal value.
   *
   * It is NOT an input to Recovery.
   */
  baselineIfi: number;

  baselineDate: string;

  baselineReportId: string;

  /**
   * Recovery of the Base IFI itself.
   *
   * ((baselineIfi + 11) / 6) * 100
   */
  baselineRecoveryPercent: number;

  /**
   * ----------------------------------------------------------
   * LATEST OBSERVATION
   * ----------------------------------------------------------
   *
   * Most recent actual observation currently available.
   *
   * During an active cycle this could be Day 4, Day 12,
   * Day 21, etc.
   */
  latestIfi: number;

  latestDate: string;

  latestReportId: string;

  latestMonitoringDay: number;

  /**
   * latestIfi - baselineIfi
   *
   * Useful for longitudinal display only.
   */
  latestChangeFromBaseline: number;

  /**
   * Recovery of the latest actual IFI.
   */
  latestRecoveryPercent: number;

  /**
   * ----------------------------------------------------------
   * DAY 18
   * ----------------------------------------------------------
   */
  day18: IFIMonitoringDay18Result;

  /**
   * ----------------------------------------------------------
   * FINAL / DAY 30
   * ----------------------------------------------------------
   *
   * "Final IFI" means the actual Day 30 IFI.
   *
   * It does NOT mean "latest available IFI".
   *
   * null until an actual Day 30 observation exists.
   */
  finalIfi: number | null;

  finalReportId: string | null;

  finalRecoveryPercent: number | null;

  /**
   * ----------------------------------------------------------
   * MAXIMUM RECOVERY
   * ----------------------------------------------------------
   *
   * Highest Recovery % among actual observed monitoring days.
   *
   * Missing days are ignored.
   */
  maximumRecoveryPercent: number;

  /**
   * Number of Day 0 ... Day 30 calendar positions containing
   * an actual canonical assessment.
   */
  observedDays: number;

  /**
   * Number of calendar positions without an assessment.
   *
   * observedDays + missingDays = 31
   */
  missingDays: number;

  /**
   * Total qualifying report count.
   *
   * This may exceed observedDays when multiple assessments were
   * performed on the same calendar date.
   */
  totalAssessments: number;

  /**
   * Overall regression slope using actual observed IFIs.
   */
  overallSlope: IFIMonitoringSlopeResult;

  /**
   * Day 0 through Day 18.
   */
  slopeToDay18: IFIMonitoringSlopeResult;

  /**
   * Day 18 through Day 30.
   */
  slopeDay18To30: IFIMonitoringSlopeResult;
}

/**
 * ============================================================
 * COMPLETE CALCULATION RESULT
 * ============================================================
 */
export interface IFIMonitoringCalculationResult {
  cycleId?: string;

  startDate: string;

  endDate: string;

  /**
   * All 31 monitoring positions.
   *
   * Missing days remain present.
   */
  days: IFIMonitoringDayResult[];

  /**
   * Workbook/dashboard longitudinal summary.
   */
  summary: IFIMonitoringSummary;

  /**
   * Formula/version identifier.
   *
   * This allows future formula revisions without making old
   * monitoring results conceptually ambiguous.
   */
  formulaVersion: string;

  calculatedAt: string;
}

/**
 * ============================================================
 * CYCLE STATUS
 * ============================================================
 */
export type IFIMonitoringCycleStatus = "active" | "completed" | "cancelled";
