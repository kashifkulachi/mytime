/**
 * Flat input required by the Functional Inflammation Index formula.
 *
 * This calculation runs after IFI because it requires the full-precision
 * raw IFI result.
 */
export interface InflammationIndexFormulaInput {
  /**
   * Full-precision IFI result.
   *
   * Always use IFICalculationResult.rawIfi.
   * Do not pass the rounded display IFI.
   */
  rawIfi: number;

  /**
   * BMI used by the inflammation workbook.
   *
   * Prefer the same full-precision BMI calculated during the IFI step so
   * both calculations use identical values.
   */
  bmi: number;

  /**
   * Patient sex used to derive the workbook sex factor.
   */
  sex: "male" | "female";

  /**
   * Heart rate measured by the oximeter in beats per minute.
   */
  heartRate: number;

  /**
   * Oxygen saturation measured by the oximeter as a percentage.
   *
   * Example:
   * 98
   */
  spo2: number;
}

/**
 * Workbook interpretation ranges for the final clamped II value.
 */
export type InflammationClassification =
  | "Minimal functional inflammation"
  | "Mild functional inflammation"
  | "Moderate functional inflammation"
  | "High functional inflammation"
  | "Very high functional inflammation";

/**
 * Optional recovery interpretation derived from the pre-clamp expression.
 *
 * The workbook lists an II value below zero as a recovery profile, but its
 * MAX(0, ...) formula prevents the final II from becoming negative.
 */
export type InflammationRecoveryProfile =
  | "Functional recovery / non-inflammatory profile"
  | null;

/**
 * Intermediate values used to calculate the Functional Inflammation Index.
 *
 * These values are retained for workbook comparison, debugging, auditing,
 * and eventual database storage.
 */
export interface InflammationIndexCalculationBreakdown {
  /**
   * Female = 1
   * Male = 1.75
   */
  sexFactor: number;

  /**
   * Full-precision IFI value used by this calculation.
   */
  rawIfiUsed: number;

  /**
   * Full-precision BMI value used by this calculation.
   */
  bmiUsed: number;

  /**
   * Heart-rate normalization from the workbook:
   *
   * heartRate / 60
   */
  heartRateFactor: number;

  /**
   * Oxygen-deficit component from the workbook:
   *
   * 1 - spo2 / 100
   */
  oxygenDeficitFactor: number;

  /**
   * Result before applying MAX(0, ...).
   *
   * Formula:
   *
   * (-IFI) *
   * (BMI / SexFactor) *
   * (HeartRate / 60) *
   * (1 - SpO2 / 100)
   */
  rawInflammationExpression: number;

  /**
   * Indicates whether the pre-clamp expression was negative.
   *
   * This preserves the workbook's conceptual recovery classification even
   * though the final II value is clamped to zero.
   */
  hasRecoveryProfile: boolean;
}

/**
 * Complete result returned by the Functional Inflammation Index calculation.
 */
export interface InflammationIndexCalculationResult {
  /**
   * Full-precision final inflammation index after applying MAX(0, ...).
   */
  inflammationIndex: number;

  /**
   * Rounded inflammation index intended only for UI display.
   *
   * Later formulas should use inflammationIndex, not this rounded value.
   */
  displayInflammationIndex: number;

  /**
   * Classification based on the final clamped inflammation index.
   */
  classification: InflammationClassification;

  /**
   * Recovery interpretation derived from the negative pre-clamp expression.
   *
   * This is null when the raw expression is zero or positive.
   */
  recoveryProfile: InflammationRecoveryProfile;

  /**
   * Intermediate calculation values.
   */
  breakdown: InflammationIndexCalculationBreakdown;

  /**
   * Formula implementation version.
   */
  formulaVersion: string;

  /**
   * ISO timestamp indicating when the calculation ran.
   */
  calculatedAt: string;
}
