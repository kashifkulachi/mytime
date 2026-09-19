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
