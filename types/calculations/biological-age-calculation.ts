/**
 * Flat input required by the Biological Age formula.
 *
 * This calculation runs after IFI because it depends on the full-precision
 * raw IFI result.
 */
export interface BiologicalAgeFormulaInput {
  /**
   * Patient date of birth in ISO date format.
   *
   * Example:
   * "1966-03-25"
   */
  dateOfBirth: string;

  /**
   * The date on which the assessment was evaluated.
   *
   * This must be the same evaluation date used by the IFI calculation so
   * every calculation in the assessment uses the same age in days.
   *
   * Example:
   * "2026-07-10"
   */
  evaluationDate: string;

  /**
   * Full-precision IFI result.
   *
   * Always use IFICalculationResult.rawIfi here. Do not use the rounded
   * display IFI because that would change the Biological Age result.
   */
  rawIfi: number;
}

/**
 * Intermediate values used by the Biological Age workbook formula.
 *
 * These values are retained for workbook comparison, debugging, auditing,
 * and eventual database storage.
 */
export interface BiologicalAgeCalculationBreakdown {
  /**
   * Number of whole calendar days between the patient's date of birth and
   * the assessment evaluation date.
   *
   * Excel equivalent:
   * EvaluationDate - DateOfBirth
   */
  chronologicalAgeDays: number;

  /**
   * Chronological age converted from days into years.
   *
   * Formula:
   * chronologicalAgeDays / 365.25
   */
  chronologicalAgeYears: number;

  /**
   * Excel constant calculated using PI raised to the sixth power.
   *
   * Formula:
   * Math.PI ** 6
   *
   * Approximate value:
   * 961.3891935753043
   */
  piSixConstant: number;

  /**
   * Full-precision IFI value used by the formula.
   */
  rawIfiUsed: number;

  /**
   * Number of days added to or subtracted from chronological age due to IFI.
   *
   * Formula:
   * -(piSixConstant * rawIfi)
   *
   * Negative IFI produces a positive shift, meaning an older biological age.
   * Positive IFI produces a negative shift, meaning a younger biological age.
   */
  biologicalAgeShiftDays: number;

  /**
   * Biological age shift converted into years.
   *
   * Formula:
   * biologicalAgeShiftDays / 365.25
   */
  biologicalAgeShiftYears: number;
}

/**
 * Complete result returned by the Biological Age calculation.
 */
export interface BiologicalAgeCalculationResult {
  /**
   * Full-precision biological age in days.
   *
   * Excel formula:
   * ChronologicalAgeDays - (PI()^6 * IFI)
   */
  biologicalAgeDays: number;

  /**
   * Full-precision biological age in years.
   *
   * Excel formula:
   * BiologicalAgeDays / 365.25
   */
  biologicalAgeYears: number;

  /**
   * Biological age rounded for UI display.
   *
   * This value must not be passed into later calculations. Later formulas
   * should use biologicalAgeYears or biologicalAgeDays at full precision.
   */
  displayBiologicalAgeYears: number;

  /**
   * Full-precision Aging Coefficient.
   *
   * Workbook formula:
   *
   * (Biological Age - Chronological Age)
   * ------------------------------------
   *           Biological Age
   *
   * Excel stores this value as a decimal and formats the cell
   * as a percentage.
   *
   * Example:
   *
   * 0.2108627 = 21.08627%
   */
  agingCoefficient: number;

  /**
   * Aging Coefficient expressed as percentage points
   * for UI/PDF display.
   *
   * Example:
   *
   * agingCoefficient = 0.2108627
   * agingCoefficientPercent = 21.08627
   */
  agingCoefficientPercent: number;

  /**
   * Intermediate values used to produce the result.
   */
  breakdown: BiologicalAgeCalculationBreakdown;

  /**
   * Evaluation date used for chronological age calculations.
   */
  evaluationDate: string;

  /**
   * Formula implementation version.
   *
   * Increase this when the doctor changes the workbook formula.
   */
  formulaVersion: string;

  /**
   * ISO timestamp indicating when the application ran this calculation.
   */
  calculatedAt: string;
}

export interface BiologicalAgeCalculationResult {
  biologicalAgeDays: number;

  biologicalAgeYears: number;
  displayBiologicalAgeYears: number;

  agingCoefficient: number;
  agingCoefficientPercent: number;
  breakdown: BiologicalAgeCalculationBreakdown;
  evaluationDate: string;
  formulaVersion: string;
  calculatedAt: string;
}
