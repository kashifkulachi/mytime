import type {
  InflammationClassification,
  InflammationIndexCalculationResult,
  InflammationIndexFormulaInput,
  InflammationRecoveryProfile,
} from "@/types/calculations/inflammation-index-calculation";

/**
 * Fixed sex factors used by the workbook.
 */
const FEMALE_SEX_FACTOR = 1;
const MALE_SEX_FACTOR = 1.75;

/**
 * Increase this version whenever the doctor's workbook formula
 * or interpretation ranges change.
 */
const INFLAMMATION_INDEX_FORMULA_VERSION = "1.0.0";

/**
 * Number of decimal places used only for the UI display value.
 *
 * The full-precision result remains available in inflammationIndex.
 */
const DISPLAY_DECIMAL_PLACES = 2;

/**
 * Ensures an intermediate or final result is a valid finite number.
 */
function ensureFiniteResult(value: number, calculationName: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${calculationName} produced an invalid numeric result.`);
  }

  return value;
}

/**
 * Rounds a value only for UI display.
 *
 * Later formulas must use the full-precision inflammationIndex value.
 */
function roundToDecimals(value: number, decimalPlaces: number): number {
  const multiplier = 10 ** decimalPlaces;

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * Maps patient sex to the factor used by the workbook.
 *
 * Female = 1
 * Male = 1.75
 */
function getSexFactor(sex: InflammationIndexFormulaInput["sex"]): number {
  if (sex === "female") {
    return FEMALE_SEX_FACTOR;
  }

  if (sex === "male") {
    return MALE_SEX_FACTOR;
  }

  throw new Error(
    "Patient sex must be either male or female to calculate the Inflammation Index.",
  );
}

/**
 * Classifies the final clamped inflammation index using the
 * workbook ranges.
 *
 * Ranges:
 *
 * 0 <= II < 1
 * Minimal functional inflammation
 *
 * 1 <= II < 3
 * Mild functional inflammation
 *
 * 3 <= II < 6
 * Moderate functional inflammation
 *
 * 6 <= II < 10
 * High functional inflammation
 *
 * II >= 10
 * Very high functional inflammation
 */
function classifyInflammationIndex(
  inflammationIndex: number,
): InflammationClassification {
  if (inflammationIndex < 1) {
    return "Minimal functional inflammation";
  }

  if (inflammationIndex < 3) {
    return "Mild functional inflammation";
  }

  if (inflammationIndex < 6) {
    return "Moderate functional inflammation";
  }

  if (inflammationIndex < 10) {
    return "High functional inflammation";
  }

  return "Very high functional inflammation";
}

/**
 * Determines whether the pre-clamp expression represents the workbook's
 * recovery / non-inflammatory interpretation.
 *
 * The final workbook formula applies MAX(0, ...), so the final II cannot
 * be negative. We preserve the negative pre-clamp value separately.
 */
function getRecoveryProfile(
  rawInflammationExpression: number,
): InflammationRecoveryProfile {
  if (rawInflammationExpression < 0) {
    return "Functional recovery / non-inflammatory profile";
  }

  return null;
}

/**
 * Calculates the Functional Inflammation Index using the exact
 * workbook formula.
 *
 * Workbook formula:
 *
 * MAX(
 *   0,
 *   (-IFI) *
 *   (BMI / SexFactor) *
 *   (HeartRate / 60) *
 *   (1 - SpO2 / 100)
 * )
 *
 * Important:
 * - Pass the full-precision raw IFI.
 * - Pass the same full-precision BMI used by IFI.
 * - Run validateInflammationIndexInput(input) before this function.
 */
export function calculateInflammationIndex(
  input: InflammationIndexFormulaInput,
): InflammationIndexCalculationResult {
  /**
   * Runtime safety checks remain here even though validation should
   * already have run before this function.
   */
  if (!Number.isFinite(input.rawIfi)) {
    throw new Error("Raw IFI must be a valid finite number.");
  }

  if (!Number.isFinite(input.bmi) || input.bmi <= 0) {
    throw new Error("BMI must be a positive finite number.");
  }

  if (!Number.isFinite(input.heartRate) || input.heartRate <= 0) {
    throw new Error("Heart rate must be a positive finite number.");
  }

  if (!Number.isFinite(input.spo2) || input.spo2 <= 0 || input.spo2 > 100) {
    throw new Error("SpO₂ must be greater than zero and no more than 100.");
  }

  const sexFactor = getSexFactor(input.sex);

  /**
   * Workbook heart-rate normalization:
   *
   * HeartRate / 60
   */
  const heartRateFactor = ensureFiniteResult(
    input.heartRate / 60,
    "Heart-rate factor calculation",
  );

  /**
   * Workbook oxygen deficit:
   *
   * 1 - SpO2 / 100
   */
  const oxygenDeficitFactor = ensureFiniteResult(
    1 - input.spo2 / 100,
    "Oxygen-deficit factor calculation",
  );

  /**
   * Pre-clamp workbook expression:
   *
   * (-IFI) *
   * (BMI / SexFactor) *
   * (HeartRate / 60) *
   * (1 - SpO2 / 100)
   */
  const rawInflammationExpression = ensureFiniteResult(
    -input.rawIfi *
      (input.bmi / sexFactor) *
      heartRateFactor *
      oxygenDeficitFactor,
    "Raw Inflammation Index calculation",
  );

  /**
   * Exact workbook final formula:
   *
   * MAX(0, raw expression)
   */
  const inflammationIndex = ensureFiniteResult(
    Math.max(0, rawInflammationExpression),
    "Final Inflammation Index calculation",
  );

  const hasRecoveryProfile = rawInflammationExpression < 0;

  const classification = classifyInflammationIndex(inflammationIndex);

  const recoveryProfile = getRecoveryProfile(rawInflammationExpression);

  return {
    /**
     * Full-precision workbook result.
     */
    inflammationIndex,

    /**
     * Rounded only for UI display.
     */
    displayInflammationIndex: roundToDecimals(
      inflammationIndex,
      DISPLAY_DECIMAL_PLACES,
    ),

    classification,
    recoveryProfile,

    breakdown: {
      sexFactor,
      rawIfiUsed: input.rawIfi,
      bmiUsed: input.bmi,
      heartRateFactor,
      oxygenDeficitFactor,
      rawInflammationExpression,
      hasRecoveryProfile,
    },

    formulaVersion: INFLAMMATION_INDEX_FORMULA_VERSION,

    calculatedAt: new Date().toISOString(),
  };
}
