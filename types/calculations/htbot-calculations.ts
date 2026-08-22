/**
 * Formula-ready input for the HBOT session calculation.
 *
 * Workbook 04 uses:
 *
 * ABS(rawIfi / calculatedBmi)
 *
 * as the common mathematical foundation for all three HBOT
 * session calculations.
 */
export interface HBOTCalculationInput {
  /**
   * Full-precision IFI produced by calculateIFI().
   *
   * Use:
   *
   * IFICalculationResult.rawIfi
   *
   * Do NOT use:
   *
   * - display-rounded IFI
   * - IFI Range
   */
  rawIfi: number;

  /**
   * BMI recalculated by the IFI workbook.
   *
   * Use:
   *
   * IFICalculationResult.breakdown.calculatedBmi
   *
   * rather than PatientInfo's submitted BMI.
   */
  calculatedBmi: number;
}

/**
 * Stable identifiers for the three HBOT protocols currently
 * defined by Workbook 04.
 */
export type HBOTProtocolId =
  | "high-pressure"
  | "medium-pressure"
  | "low-pressure";

/**
 * Display names corresponding to the workbook HBOT rows.
 */
export type HBOTProtocolName =
  | "High-Pressure HBOT — 2.5 ATA"
  | "Medium-Pressure HBOT — 2.0 ATA"
  | "Low-Pressure HBOT — 1.6 ATA";

/**
 * Static treatment parameters used by one HBOT protocol.
 *
 * Returning these values with the calculated sessions will later
 * allow the medical report to show the complete HBOT recommendation
 * without duplicating protocol information inside the PDF component.
 */
export interface HBOTProtocolDetails {
  /**
   * Stable machine-readable identifier.
   */
  id: HBOTProtocolId;

  /**
   * Report-ready protocol name.
   */
  name: HBOTProtocolName;

  /**
   * Treatment pressure in ATA.
   *
   * Workbook values:
   *
   * High   = 2.5 ATA
   * Medium = 2.0 ATA
   * Low    = 1.6 ATA
   */
  pressureAta: number;

  /**
   * Treatment duration in minutes.
   *
   * Workbook values:
   *
   * High   = 90 minutes
   * Medium = 60 minutes
   * Low    = 60 minutes
   */
  durationMinutes: number;

  /**
   * Oxygen concentration percentage.
   *
   * Workbook values:
   *
   * High   = 100%
   * Medium = 100%
   * Low    = 21%
   */
  oxygenPercent: number;
}

/**
 * Complete calculated recommendation for one HBOT protocol.
 */
export interface HBOTSessionRecommendation {
  /**
   * Static protocol information.
   */
  protocol: HBOTProtocolDetails;

  /**
   * Full-precision number of calculated HBOT sessions.
   *
   * Keep this value unrounded in the calculation layer.
   *
   * Any whole-session rounding required for display or clinical use
   * should happen later only after the expected rounding behavior is
   * confirmed.
   */
  calculatedSessions: number;
}

/**
 * Complete result returned by the HBOT calculation.
 */
export interface HBOTCalculationResult {
  /**
   * Ordered HBOT recommendations matching Workbook 04:
   *
   * 1. High-Pressure  — 2.5 ATA
   * 2. Medium-Pressure — 2.0 ATA
   * 3. Low-Pressure   — 1.6 ATA
   */
  recommendations: [
    HBOTSessionRecommendation,
    HBOTSessionRecommendation,
    HBOTSessionRecommendation,
  ];

  /**
   * Version of the implemented Workbook 04 HBOT formulas.
   */
  formulaVersion: string;

  /**
   * ISO timestamp indicating when the HBOT calculation was performed.
   */
  calculatedAt: string;
}
