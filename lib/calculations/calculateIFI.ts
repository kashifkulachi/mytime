import type {
  IFICalculationResult,
  IFIFormulaInput,
  IFIFunctionalCondition,
  IFIMainGroup,
} from "@/types/assessment-calculation";

/**
 * Fixed constant used in the doctor's Excel workbook.
 *
 * Excel column:
 * K = 43642.4487
 */
const IFI_K_CONSTANT = 43642.4487;

/**
 * Fixed life-expectancy value used in the workbook.
 */
const LIFE_EXPECTANCY_YEARS = 74;

/**
 * Average number of days per year used by the Excel formula.
 */
const DAYS_PER_YEAR = 365.25;

/**
 * Current implementation of the workbook formula.
 *
 * Increase this whenever the doctor changes the formula or constants.
 */
const IFI_FORMULA_VERSION = "1.0.0";

/**
 * Number of milliseconds in one day.
 */
const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Rounds a number for application display.
 *
 * Intermediate calculations remain unrounded so that the final calculation
 * follows the Excel workbook as closely as possible.
 */
function roundToDecimals(value: number, decimalPlaces: number): number {
  const multiplier = 10 ** decimalPlaces;

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * Parses a date into a UTC timestamp at the beginning of that calendar day.
 *
 * Using UTC prevents timezone differences from changing ageInDays.
 *
 * Supported examples:
 * - "2026-07-29"
 * - "2026-07-29T12:30:00.000Z"
 */
function parseDateAsUtcDay(value: string, fieldName: string): number {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} is required to calculate IFI.`);
  }

  const dateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!dateOnlyMatch) {
    throw new Error(
      `${fieldName} must use a valid ISO date such as 2026-07-29.`,
    );
  }

  const year = Number(dateOnlyMatch[1]);
  const month = Number(dateOnlyMatch[2]);
  const day = Number(dateOnlyMatch[3]);

  const utcTimestamp = Date.UTC(year, month - 1, day);

  const parsedDate = new Date(utcTimestamp);

  /**
   * Date.UTC normalizes invalid dates.
   *
   * For example, 2026-02-31 could become a date in March.
   * These checks ensure the original date was genuinely valid.
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
 * Calculates the exact number of calendar days between DOB and evaluation
 * date, matching the Excel subtraction:
 *
 * Evaluation Date - DOB
 */
function calculateAgeInDays(
  dateOfBirth: string,
  evaluationDate: string,
): number {
  const birthTimestamp = parseDateAsUtcDay(dateOfBirth, "Date of birth");

  const evaluationTimestamp = parseDateAsUtcDay(
    evaluationDate,
    "Evaluation date",
  );

  const ageInDays =
    (evaluationTimestamp - birthTimestamp) / MILLISECONDS_PER_DAY;

  if (!Number.isInteger(ageInDays)) {
    throw new Error("Unable to calculate age in whole calendar days.");
  }

  if (ageInDays <= 0) {
    throw new Error("Evaluation date must be later than the date of birth.");
  }

  return ageInDays;
}

/**
 * Excel workbook mapping:
 *
 * Female = 1
 * Male = 1.75
 */
function getSexFactor(sex: IFIFormulaInput["sex"]): number {
  if (sex === "female") {
    return 1;
  }

  if (sex === "male") {
    return 1.75;
  }

  /**
   * This protects runtime execution in case unvalidated external data reaches
   * this function despite the TypeScript union.
   */
  throw new Error(
    "Patient sex must be either male or female to calculate IFI.",
  );
}

/**
 * Classifies the unrounded IFI using the exact nested IF boundaries from
 * the Excel workbook.
 */
function classifyFunctionalCondition(rawIfi: number): IFIFunctionalCondition {
  if (rawIfi <= -3.78) {
    return "Cardiovascular";
  }

  if (rawIfi <= -2.46) {
    return "Neurological";
  }

  if (rawIfi <= -1.34) {
    return "Tumor-Proliferative";
  }

  if (rawIfi < 0) {
    return "Endocrine-Metabolic";
  }

  if (rawIfi <= 0.6) {
    return "Normal";
  }

  if (rawIfi <= 1.2) {
    return "Good Functional Performance";
  }

  return "High Functional Performance / Athletic Potential";
}

/**
 * Classifies the unrounded IFI into its main workbook group.
 */
function classifyMainGroup(rawIfi: number): IFIMainGroup {
  if (rawIfi < 0) {
    return "Clinical Alteration";
  }

  if (rawIfi <= 0.6) {
    return "Normal Functional Condition";
  }

  return "Sports / Athletic Potential";
}

/**
 * Ensures that an intermediate or final calculation is a finite number.
 */
function ensureFiniteResult(value: number, calculationName: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${calculationName} produced an invalid numeric result.`);
  }

  return value;
}

/**
 * Calculates the Integral Function Index using the exact formulas and
 * constants found in the doctor's Excel workbook.
 *
 * Important:
 * Run validateFormulaInput(input) before calling this function.
 *
 * This function still contains internal safety checks because assessment data
 * may later arrive from APIs or database records rather than the form.
 */
export function calculateIFI(input: IFIFormulaInput): IFICalculationResult {
  const sexFactor = getSexFactor(input.sex);

  /**
   * Workbook height values are expressed in metres.
   * PatientInfo stores height in centimetres.
   */
  const heightMeters = input.heightCm / 100;

  if (!Number.isFinite(heightMeters) || heightMeters <= 0) {
    throw new Error("Height must produce a positive value in metres.");
  }

  /**
   * Excel BMI formula:
   *
   * Weight / Height²
   *
   * The workbook calculates BMI directly instead of using a submitted BMI.
   */
  const calculatedBmi = ensureFiniteResult(
    input.weightKg / heightMeters ** 2,
    "BMI calculation",
  );

  if (calculatedBmi <= 0) {
    throw new Error("Calculated BMI must be greater than zero.");
  }

  const bmiDifference = ensureFiniteResult(
    Math.abs(input.bmi - calculatedBmi),
    "BMI comparison",
  );

  const ageInDays = calculateAgeInDays(input.dateOfBirth, input.evaluationDate);

  /**
   * Excel Age Ratio formula:
   *
   * Age in days / (Life expectancy × 365.25)
   */
  const ageRatio = ensureFiniteResult(
    ageInDays / (LIFE_EXPECTANCY_YEARS * DAYS_PER_YEAR),
    "Age ratio calculation",
  );

  if (ageRatio <= 0) {
    throw new Error("Age ratio must be greater than zero.");
  }

  /**
   * Excel PV formula:
   *
   * LN((K × Amplitude) / (Frequency × Intensity × Sex Factor))
   */
  const pvLogArgument =
    (IFI_K_CONSTANT * input.amplitude) /
    (input.frequency * input.intensity * sexFactor);

  if (!Number.isFinite(pvLogArgument) || pvLogArgument <= 0) {
    throw new Error("PV logarithm input must be a positive finite number.");
  }

  const pv = ensureFiniteResult(Math.log(pvLogArgument), "PV calculation");

  /**
   * Excel IFI logarithm argument:
   *
   * (
   *   SpO₂ × AgeRatio^0.25
   * )
   * /
   * (
   *   HeartRate² × BMI
   * )
   */
  const ifiLogArgument =
    (input.spo2 * ageRatio ** 0.25) / (input.heartRate ** 2 * calculatedBmi);

  if (!Number.isFinite(ifiLogArgument) || ifiLogArgument <= 0) {
    throw new Error("IFI logarithm input must be a positive finite number.");
  }

  /**
   * Final workbook formula:
   *
   * IFI = PV + LN(IFI logarithm argument)
   */
  const rawIfi = ensureFiniteResult(
    pv + Math.log(ifiLogArgument),
    "Final IFI calculation",
  );

  /**
   * Classification must use rawIfi rather than the rounded display value.
   *
   * Otherwise, a value such as 0.604 could incorrectly become 0.60 and be
   * classified as Normal.
   */
  const functionalCondition = classifyFunctionalCondition(rawIfi);

  const mainGroup = classifyMainGroup(rawIfi);

  return {
    /**
     * The workbook displays IFI to two decimal places.
     */
    ifi: roundToDecimals(rawIfi, 2),

    /**
     * Preserve the complete value for auditing and Excel comparison.
     */
    rawIfi,

    functionalCondition,
    mainGroup,

    breakdown: {
      sexFactor,
      heightMeters,
      calculatedBmi,
      submittedBmi: input.bmi,
      bmiDifference,
      ageInDays,
      ageRatio,
      pv,
      k: IFI_K_CONSTANT,
      lifeExpectancyYears: LIFE_EXPECTANCY_YEARS,
    },

    formulaVersion: IFI_FORMULA_VERSION,
    evaluationDate: input.evaluationDate,
    calculatedAt: new Date().toISOString(),
  };
}
