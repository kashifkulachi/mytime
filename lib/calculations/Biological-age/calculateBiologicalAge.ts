import type {
  BiologicalAgeCalculationResult,
  BiologicalAgeFormulaInput,
} from "@/types/calculations/biological-age-calculation";

/**
 * Fixed values used by the Biological Age workbook.
 */
const PI_SIX_CONSTANT = Math.PI ** 6;
const DAYS_PER_YEAR = 365.25;
const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Increase this version whenever the doctor's Biological Age
 * workbook formula changes.
 */
const BIOLOGICAL_AGE_FORMULA_VERSION = "1.0.0";

/**
 * Number of decimal places used only for the UI display value.
 *
 * Full-precision values remain available in:
 * - biologicalAgeDays
 * - biologicalAgeYears
 */
const DISPLAY_DECIMAL_PLACES = 2;

/**
 * Ensures that an intermediate or final calculation produced
 * a valid finite number.
 */
function ensureFiniteResult(value: number, calculationName: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${calculationName} produced an invalid numeric result.`);
  }

  return value;
}

/**
 * Rounds a value only for display.
 *
 * Do not use the rounded value as input for later workbook calculations.
 */
function roundToDecimals(value: number, decimalPlaces: number): number {
  const multiplier = 10 ** decimalPlaces;

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * Converts an ISO date into a UTC timestamp at the beginning
 * of that calendar day.
 *
 * Accepted examples:
 * - "1966-03-25"
 * - "2026-07-10"
 * - "2026-07-10T12:30:00.000Z"
 *
 * Only the YYYY-MM-DD portion is used.
 */
function parseDateAsUtcDay(value: string, fieldName: string): number {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} is required to calculate Biological Age.`);
  }

  const dateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!dateMatch) {
    throw new Error(
      `${fieldName} must use a valid ISO date such as 2026-07-10.`,
    );
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  const utcTimestamp = Date.UTC(year, month - 1, day);

  const parsedDate = new Date(utcTimestamp);

  /**
   * Date.UTC normalizes invalid dates, so verify that the date
   * components did not change.
   *
   * Example:
   * 2026-02-31 must not be silently converted into March.
   */
  const isValidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day;

  if (!isValidDate) {
    throw new Error(`${fieldName} is not a valid calendar date.`);
  }

  return utcTimestamp;
}

/**
 * Calculates the number of whole calendar days between the
 * date of birth and evaluation date.
 *
 * Excel equivalent:
 *
 * EvaluationDate - DateOfBirth
 */
function calculateChronologicalAgeDays(
  dateOfBirth: string,
  evaluationDate: string,
): number {
  const birthTimestamp = parseDateAsUtcDay(dateOfBirth, "Date of birth");

  const evaluationTimestamp = parseDateAsUtcDay(
    evaluationDate,
    "Evaluation date",
  );

  const chronologicalAgeDays =
    (evaluationTimestamp - birthTimestamp) / MILLISECONDS_PER_DAY;

  if (!Number.isInteger(chronologicalAgeDays)) {
    throw new Error(
      "Chronological age could not be calculated in whole calendar days.",
    );
  }

  if (chronologicalAgeDays <= 0) {
    throw new Error("Evaluation date must be later than the date of birth.");
  }

  return chronologicalAgeDays;
}

/**
 * Calculates the Aging Coefficient from Biological Age
 * and Chronological Age.
 *
 * Workbook formula:
 *
 * (Biological Age - Chronological Age)
 * ------------------------------------
 *           Biological Age
 *
 * Excel:
 *
 * =((B6-B4)/B6)
 *
 * Important:
 *
 * - Both ages must be full-precision values.
 * - Do not use display-rounded Biological Age.
 * - The returned value is a decimal.
 * - Excel displays this decimal using percentage formatting.
 *
 * Example:
 *
 * chronologicalAge = 48.0027378508
 * biologicalAge    = 60.8293886897
 *
 * result ≈ 0.21086272795
 *
 * Excel display ≈ 21.0863%
 */
export function calculateAgingCoefficient(params: {
  biologicalAgeYears: number;
  chronologicalAgeYears: number;
}): number {
  const { biologicalAgeYears, chronologicalAgeYears } = params;

  if (!Number.isFinite(biologicalAgeYears) || biologicalAgeYears <= 0) {
    throw new Error(
      "biologicalAgeYears must be a finite number greater than 0.",
    );
  }

  if (!Number.isFinite(chronologicalAgeYears) || chronologicalAgeYears < 0) {
    throw new Error(
      "chronologicalAgeYears must be a finite number greater than or equal to 0.",
    );
  }

  const agingCoefficient =
    (biologicalAgeYears - chronologicalAgeYears) / biologicalAgeYears;

  if (!Number.isFinite(agingCoefficient)) {
    throw new Error(
      "Aging Coefficient calculation produced a non-finite result.",
    );
  }

  return agingCoefficient;
}

/**
 * Calculates Biological Age using the exact workbook formula.
 *
 * Workbook sequence:
 *
 * 1. ChronologicalAgeDays =
 *    EvaluationDate - DateOfBirth
 *
 * 2. PiSixConstant =
 *    PI()^6
 *
 * 3. BiologicalAgeDays =
 *    ChronologicalAgeDays - (PI()^6 * IFI)
 *
 * 4. BiologicalAgeYears =
 *    BiologicalAgeDays / 365.25
 *
 * Important:
 * Pass IFICalculationResult.rawIfi into this function.
 * Never pass the rounded display IFI.
 */
export function calculateBiologicalAge(
  input: BiologicalAgeFormulaInput,
): BiologicalAgeCalculationResult {
  /**
   * Runtime protection remains here even though the input should already
   * have passed validateBiologicalAgeInput().
   */
  if (!Number.isFinite(input.rawIfi)) {
    throw new Error(
      "Raw IFI must be a valid finite number to calculate Biological Age.",
    );
  }

  const chronologicalAgeDays = calculateChronologicalAgeDays(
    input.dateOfBirth,
    input.evaluationDate,
  );

  const chronologicalAgeYears = ensureFiniteResult(
    chronologicalAgeDays / DAYS_PER_YEAR,
    "Chronological age in years calculation",
  );

  /**
   * Workbook shift:
   *
   * -(PI()^6 * IFI)
   *
   * Negative IFI:
   * produces a positive shift and increases Biological Age.
   *
   * Positive IFI:
   * produces a negative shift and decreases Biological Age.
   */
  const biologicalAgeShiftDays = ensureFiniteResult(
    -(PI_SIX_CONSTANT * input.rawIfi),
    "Biological Age shift in days calculation",
  );

  const biologicalAgeShiftYears = ensureFiniteResult(
    biologicalAgeShiftDays / DAYS_PER_YEAR,
    "Biological Age shift in years calculation",
  );

  /**
   * Exact workbook formula:
   *
   * BiologicalAgeDays =
   * ChronologicalAgeDays - (PI()^6 * IFI)
   *
   * Since biologicalAgeShiftDays already contains:
   *
   * -(PI()^6 * IFI)
   *
   * the equivalent operation is:
   *
   * ChronologicalAgeDays + biologicalAgeShiftDays
   */
  const biologicalAgeDays = ensureFiniteResult(
    chronologicalAgeDays + biologicalAgeShiftDays,
    "Biological Age in days calculation",
  );

  if (biologicalAgeDays <= 0) {
    throw new Error(
      "Biological Age calculation produced a value less than or equal to zero days.",
    );
  }

  const biologicalAgeYears = ensureFiniteResult(
    biologicalAgeDays / DAYS_PER_YEAR,
    "Biological Age in years calculation",
  );

  /**
   * Aging Coefficient.
   *
   * Use the full-precision ages here.
   */
  const agingCoefficient = calculateAgingCoefficient({
    biologicalAgeYears: biologicalAgeYears,

    chronologicalAgeYears,
  });

  /**
   * Excel stores the coefficient as a decimal and
   * displays it using percentage formatting.
   *
   * Example:
   *
   * 0.21086 -> 21.086%
   */
  const agingCoefficientPercent = agingCoefficient * 100;

  return {
    /**
     * Full-precision results used for auditing and later formulas.
     */
    biologicalAgeDays,
    biologicalAgeYears,
    agingCoefficient,
    agingCoefficientPercent: Number(agingCoefficientPercent.toFixed(2)),

    /**
     * Rounded only for UI display.
     */
    displayBiologicalAgeYears: roundToDecimals(
      biologicalAgeYears,
      DISPLAY_DECIMAL_PLACES,
    ),

    breakdown: {
      chronologicalAgeDays,
      chronologicalAgeYears,
      piSixConstant: PI_SIX_CONSTANT,
      rawIfiUsed: input.rawIfi,
      biologicalAgeShiftDays,
      biologicalAgeShiftYears,
    },

    evaluationDate: input.evaluationDate,
    formulaVersion: BIOLOGICAL_AGE_FORMULA_VERSION,
    calculatedAt: new Date().toISOString(),
  };
}
