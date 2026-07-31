/**
 * Flat, formula-ready assessment data.
 *
 * Calculation functions receive this object instead of accessing deeply
 * nested Assessment Context properties.
 */
export interface IFIFormulaInput {
  /*
   * Assessment date
   *
   * Use a date-only ISO value whenever possible:
   * "2026-07-29"
   *
   * Keeping this value in the input makes calculations reproducible and
   * allows us to compare a web result against the Excel workbook.
   */
  evaluationDate: string;

  /*
   * Patient information
   */
  dateOfBirth: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;

  /**
   * BMI saved by the Patient Info form.
   *
   * The IFI formula will recalculate BMI from height and weight because that
   * is what the Excel workbook does. This value will be retained so we can
   * compare the submitted BMI with the calculated BMI.
   */
  bmi: number;

  /*
   * Voice metrics returned by the Praat API
   */
  /*
   * Processed voice metrics returned by the Praat API.
   *
   * These must represent summary measurements from the complete
   * voice recording—not individual audio-frame measurements.
   */
  rmsAmplitude: number;
  meanFrequency: number;
  meanIntensity: number;

  /*
   * Oximeter measurements
   */
  spo2: number;
  heartRate: number;
}

/**
 * Functional condition returned by the Excel classification formula.
 */
export type IFIFunctionalCondition =
  | "Cardiovascular"
  | "Neurological"
  | "Tumor-Proliferative"
  | "Endocrine-Metabolic"
  | "Normal"
  | "Good Functional Performance"
  | "High Functional Performance / Athletic Potential";

/**
 * Main group returned by the Excel classification formula.
 */
export type IFIMainGroup =
  | "Clinical Alteration"
  | "Normal Functional Condition"
  | "Sports / Athletic Potential";

/**
 * Every intermediate value used to calculate the final IFI.
 *
 * Keeping these values makes it possible to compare the TypeScript result
 * against every corresponding Excel column.
 */
export interface IFICalculationBreakdown {
  /**
   * Female = 1
   * Male = 1.75
   */
  sexFactor: number;

  /**
   * Height converted from centimetres to metres.
   */
  heightMeters: number;

  /**
   * BMI recalculated using the workbook formula:
   * weightKg / heightMeters²
   */
  calculatedBmi: number;

  /**
   * BMI received from PatientInfo.
   */
  submittedBmi: number;

  /**
   * Absolute difference between submitted and recalculated BMI.
   */
  bmiDifference: number;

  /**
   * Number of calendar days from date of birth to evaluation date.
   */
  ageInDays: number;

  /**
   * Age represented as a fraction of a 74-year life expectancy.
   */
  ageRatio: number;

  /**
   * Voice-derived PV value.
   */
  pv: number;

  /**
   * Fixed workbook constant.
   */
  k: number;

  /**
   * Fixed workbook life expectancy.
   */
  lifeExpectancyYears: number;
}

/**
 * Complete result returned by the IFI calculation.
 */
export interface IFICalculationResult {
  /**
   * Final IFI value rounded for application display.
   */
  ifi: number;

  /**
   * Full-precision IFI result before display rounding.
   */
  rawIfi: number;

  /**
   * Classification produced from the unrounded IFI value.
   */
  functionalCondition: IFIFunctionalCondition;

  /**
   * High-level classification group.
   */
  mainGroup: IFIMainGroup;

  /**
   * Intermediate values used during the calculation.
   */
  breakdown: IFICalculationBreakdown;

  /**
   * Version of the implemented workbook formula.
   */
  formulaVersion: string;

  /**
   * Date used to calculate age-related values.
   */
  evaluationDate: string;

  /**
   * ISO timestamp indicating when the application performed the calculation.
   */
  calculatedAt: string;
}
