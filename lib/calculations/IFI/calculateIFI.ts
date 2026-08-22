import type {
  IFICalculationResult,
  IFICardiovascularClassification,
  IFIClassifications,
  IFIEndocrineMetabolicClassification,
  IFIGutBrainAxisClassification,
  IFINeurologicalClassification,
  IFIRange,
  IFIFormulaInput,
  IFITumoralProliferativeClassification,
} from "@/types/calculations/ifi-calculation";

/**
 * Current IFI workbook implementation version.
 *
 * Change this whenever the underlying workbook formula or
 * clinical classification tables change.
 */
export const IFI_FORMULA_VERSION = "vita-voice-ifi-range-0-25-v1";

/**
 * Workbook constants.
 *
 * Excel:
 *
 * Q2 = 2 * (2 * PI()) ^ (2 * EXP(1))
 *
 * This is intentionally calculated rather than hardcoded so the
 * TypeScript implementation follows the workbook formula itself.
 */
export const IFI_K_CONSTANT = 2 * (2 * Math.PI) ** (2 * Math.E);

/**
 * The current workbook uses 76 years.
 * 77 Later Changed
 */
export const IFI_LIFE_EXPECTANCY_YEARS = 77;

/**
 * Excel uses 365.25 when converting life expectancy
 * from years to days.
 */
export const DAYS_PER_YEAR = 365.25;

/**
 * The current PV formula multiplies RMS amplitude by 150.
 *
 * Excel:
 *
 * LN(
 *   (K * (Amplitude * 150))
 *   /
 *   (Frequency * Intensity * SexFactor)
 * )
 */
export const IFI_AMPLITUDE_MULTIPLIER = 150;

const FEMALE_SEX_FACTOR = 1;
const MALE_SEX_FACTOR = 1.75;

const MILLISECONDS_PER_DAY = 86_400_000;

const DISPLAY_DECIMAL_PLACES = 6;

/**
 * ---------------------------------------------------------------------------
 * CLINICAL CLASSIFICATION TABLES
 * ---------------------------------------------------------------------------
 *
 * These arrays reproduce the CHOOSE(T2, ...) formulas from the
 * IFI Dashboard.
 *
 * Important:
 *
 * Array index 0 corresponds to IFI Range 1.
 * Array index 24 corresponds to IFI Range 25.
 *
 * IFI Range 0 is handled separately and always returns "Normal".
 */

/**
 * Gut-Brain Axis
 *
 * Excel Dashboard column U.
 */
const GUT_BRAIN_AXIS_CLASSIFICATIONS = [
  "Irritable Bowel Syndrome (IBS)",
  "Inflammatory Bowel Disease (Crohn's & Ulcerative Colitis)",
  "Gut Dysbiosis",
  "Increased Intestinal Permeability (Leaky Gut)",
  "Depression",
  "Generalized Anxiety Disorder",
  "Autism Spectrum Disorder (ASD)",
  "Parkinson's Disease",
  "Alzheimer's Disease",
  "Multiple Sclerosis",
  "Fibromyalgia",
  "Chronic Fatigue Syndrome (CFS/ME)",
  "Migraine",
  "Bipolar Disorder",
  "Schizophrenia",
  "Attention-Deficit/Hyperactivity Disorder (ADHD)",
  "Sleep Disorders (Insomnia)",
  "Epilepsy",
  "Eating Disorders (Anorexia/Bulimia)",
  "Tourette Syndrome",
  "Neuropathic Pain",
  "Obsessive-Compulsive Disorder (OCD)",
  "Seasonal Affective Disorder",
  "Chronic Systemic Inflammation",
  "Multiple Chemical Sensitivity (MCS)",
] as const satisfies readonly IFIGutBrainAxisClassification[];

/**
 * Endocrine-Metabolic
 *
 * Excel Dashboard column V.
 */
const ENDOCRINE_METABOLIC_CLASSIFICATIONS = [
  "Overweight",
  "Obesity Class I",
  "Obesity Class II",
  "Obesity Class III",
  "Insulin Resistance",
  "Hyperinsulinemia",
  "Prediabetes",
  "Type 2 Diabetes Mellitus",
  "Metabolic Syndrome",
  "Dyslipidemia",
  "Hypertriglyceridemia",
  "Non-Alcoholic Fatty Liver Disease (NAFLD)",
  "Hypercholesterolemia",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Hashimoto's Thyroiditis",
  "Polycystic Ovary Syndrome (PCOS)",
  "Hyperuricemia",
  "Gout",
  "Vitamin D Deficiency",
  "Osteopenia",
  "Osteoporosis",
  "Hypogonadism",
  "Hyperparathyroidism",
  "Severe Endocrine-Metabolic Dysfunction",
] as const satisfies readonly IFIEndocrineMetabolicClassification[];

/**
 * Tumoral-Proliferative — Male
 *
 * Excel Dashboard column W:
 *
 * IF Sex = "Male"
 *   -> use this CHOOSE() table.
 */
const MALE_TUMORAL_PROLIFERATIVE_CLASSIFICATIONS = [
  "Colorectal Adenoma",
  "Colorectal Cancer",
  "Prostate Cancer",
  "Lung Cancer",
  "Liver Cancer (Hepatocellular Carcinoma)",
  "Pancreatic Cancer",
  "Gastric Cancer",
  "Esophageal Cancer",
  "Bladder Cancer",
  "Kidney Cancer",
  "Thyroid Cancer",
  "Melanoma",
  "Non-Hodgkin Lymphoma",
  "Hodgkin Lymphoma",
  "Multiple Myeloma",
  "Chronic Lymphocytic Leukemia",
  "Acute Myeloid Leukemia",
  "Glioblastoma",
  "Sarcoma",
  "Testicular Cancer",
  "Penile Cancer",
  "Laryngeal Cancer",
  "Oral Squamous Cell Carcinoma",
  "Metastatic Malignant Neoplasm",
  "Severe Tumoral-Proliferative Dysfunction",
] as const satisfies readonly IFITumoralProliferativeClassification[];

/**
 * Tumoral-Proliferative — Female
 *
 * Excel Dashboard column W:
 *
 * otherwise -> use this CHOOSE() table.
 *
 * Because our PatientInfo type restricts sex to male | female,
 * this represents the female branch explicitly.
 */
const FEMALE_TUMORAL_PROLIFERATIVE_CLASSIFICATIONS = [
  "Colorectal Adenoma",
  "Colorectal Cancer",
  "Breast Cancer",
  "Ovarian Cancer",
  "Endometrial Cancer",
  "Cervical Cancer",
  "Lung Cancer",
  "Liver Cancer (Hepatocellular Carcinoma)",
  "Pancreatic Cancer",
  "Gastric Cancer",
  "Esophageal Cancer",
  "Bladder Cancer",
  "Kidney Cancer",
  "Thyroid Cancer",
  "Melanoma",
  "Non-Hodgkin Lymphoma",
  "Hodgkin Lymphoma",
  "Multiple Myeloma",
  "Chronic Lymphocytic Leukemia",
  "Acute Myeloid Leukemia",
  "Glioblastoma",
  "Sarcoma",
  "Vulvar Cancer",
  "Metastatic Malignant Neoplasm",
  "Severe Tumoral-Proliferative Dysfunction",
] as const satisfies readonly IFITumoralProliferativeClassification[];

/**
 * Neurological
 *
 * Excel Dashboard column X.
 */
const NEUROLOGICAL_CLASSIFICATIONS = [
  "Predisposition - Migraine",
  "Predisposition - Peripheral Neuropathy",
  "Predisposition - Epilepsy",
  "Predisposition - Mild Cognitive Impairment",
  "Predisposition - Vascular Cognitive Impairment",
  "Predisposition - Multiple Sclerosis",
  "Predisposition - Parkinson's Disease",
  "Predisposition - Essential Tremor",
  "Predisposition - Alzheimer's Disease",
  "Predisposition - Frontotemporal Dementia",
  "Predisposition - Lewy Body Dementia",
  "Predisposition - Amyotrophic Lateral Sclerosis (ALS)",
  "Predisposition - Huntington's Disease",
  "Predisposition - Cerebral Small Vessel Disease",
  "Predisposition - Chronic Cerebral Ischemia",
  "Predisposition - Transient Ischemic Attack (TIA)",
  "Predisposition - Ischemic Stroke",
  "Predisposition - Hemorrhagic Stroke",
  "Predisposition - Cerebellar Degeneration",
  "Predisposition - Autonomic Neuropathy",
  "Predisposition - Optic Neuropathy",
  "Predisposition - Hypoxic-Ischemic Encephalopathy",
  "Predisposition - Neurodegenerative Disorder",
  "Predisposition - Severe Neurological Dysfunction",
  "Predisposition - Advanced Neurodegenerative Syndrome",
] as const satisfies readonly IFINeurologicalClassification[];

/**
 * Cardiovascular
 *
 * Excel Dashboard column Y.
 */
const CARDIOVASCULAR_CLASSIFICATIONS = [
  "Predisposition - Overweight-related Cardiovascular Risk",
  "Predisposition - Essential Hypertension",
  "Predisposition - Dyslipidemic Cardiovascular Risk",
  "Predisposition - Atherosclerosis",
  "Predisposition - Stable Angina",
  "Predisposition - Coronary Artery Disease",
  "Predisposition - Peripheral Artery Disease",
  "Predisposition - Carotid Artery Disease",
  "Predisposition - Atrial Fibrillation",
  "Predisposition - Supraventricular Tachycardia",
  "Predisposition - Ventricular Arrhythmia",
  "Predisposition - Heart Failure with Preserved Ejection Fraction",
  "Predisposition - Heart Failure with Reduced Ejection Fraction",
  "Predisposition - Left Ventricular Hypertrophy",
  "Predisposition - Cardiomyopathy",
  "Predisposition - Valvular Heart Disease",
  "Predisposition - Pulmonary Hypertension",
  "Predisposition - Chronic Ischemic Heart Disease",
  "Predisposition - Acute Coronary Syndrome",
  "Predisposition - Myocardial Infarction",
  "Predisposition - Aortic Aneurysm",
  "Predisposition - Aortic Dissection",
  "Predisposition - Cardiogenic Shock",
  "Predisposition - Severe Ischemic Cardiovascular Disease",
  "Predisposition - Advanced Cardiovascular Dysfunction",
] as const satisfies readonly IFICardiovascularClassification[];

/**
 * ---------------------------------------------------------------------------
 * INTERNAL VALIDATION HELPERS
 * ---------------------------------------------------------------------------
 */

function assertFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
}

function assertFinitePositive(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a finite number greater than 0.`);
  }
}

/**
 * Parses YYYY-MM-DD safely at UTC midnight.
 *
 * Using UTC avoids date differences caused by browser/server timezone.
 */
function parseIsoDateAtUtcMidnight(value: string, fieldName: string): Date {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDatePattern.test(value)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = value.split("-").map(Number);

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  const isExactDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day;

  if (!isExactDate) {
    throw new Error(`${fieldName} is not a valid calendar date.`);
  }

  return parsedDate;
}

/**
 * Rounding is only used for display values.
 *
 * Mathematical dependencies continue to use full precision.
 */
function roundForDisplay(
  value: number,
  decimalPlaces = DISPLAY_DECIMAL_PLACES,
): number {
  assertFiniteNumber(value, "value");

  const multiplier = 10 ** decimalPlaces;

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

/**
 * ---------------------------------------------------------------------------
 * CORE IFI FORMULAS
 * ---------------------------------------------------------------------------
 */

/**
 * Excel:
 *
 * IF Sex = "Female" -> 1
 * otherwise         -> 1.75
 */
export function calculateIFISexFactor(sex: IFIFormulaInput["sex"]): number {
  switch (sex) {
    case "female":
      return FEMALE_SEX_FACTOR;

    case "male":
      return MALE_SEX_FACTOR;

    default: {
      const exhaustiveCheck: never = sex;

      throw new Error(`Unsupported sex value: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * Height:
 *
 * cm -> metres
 */
export function calculateIFIHeightMeters(heightCm: number): number {
  assertFinitePositive(heightCm, "heightCm");

  return heightCm / 100;
}

/**
 * Excel:
 *
 * BMI = WeightKg / HeightMeters²
 */
export function calculateIFIBmi(heightCm: number, weightKg: number): number {
  assertFinitePositive(heightCm, "heightCm");
  assertFinitePositive(weightKg, "weightKg");

  const heightMeters = calculateIFIHeightMeters(heightCm);

  const bmi = weightKg / heightMeters ** 2;

  assertFinitePositive(bmi, "calculatedBmi");

  return bmi;
}

/**
 * Excel:
 *
 * Age Days = Evaluation Date - Date of Birth
 */
export function calculateIFIAgeInDays(
  dateOfBirth: string,
  evaluationDate: string,
): number {
  const dob = parseIsoDateAtUtcMidnight(dateOfBirth, "dateOfBirth");

  const assessmentDate = parseIsoDateAtUtcMidnight(
    evaluationDate,
    "evaluationDate",
  );

  const differenceMilliseconds = assessmentDate.getTime() - dob.getTime();

  if (differenceMilliseconds <= 0) {
    throw new Error("evaluationDate must be later than dateOfBirth.");
  }

  const ageInDays = differenceMilliseconds / MILLISECONDS_PER_DAY;

  assertFinitePositive(ageInDays, "ageInDays");

  return ageInDays;
}

/**
 * Excel:
 *
 * Age Ratio =
 * AgeDays / (76 * 365.25)
 */
export function calculateIFIAgeRatio(ageInDays: number): number {
  assertFinitePositive(ageInDays, "ageInDays");

  const lifeExpectancyDays = IFI_LIFE_EXPECTANCY_YEARS * DAYS_PER_YEAR;

  const ageRatio = ageInDays / lifeExpectancyDays;

  assertFinitePositive(ageRatio, "ageRatio");

  return ageRatio;
}

/**
 * Current workbook PV formula.
 *
 * Excel:
 *
 * =LN(
 *   (Q2 * (I2 * 150))
 *   /
 *   (J2 * K2 * M2)
 * )
 *
 * Q2 = IFI K constant
 * I2 = RMS amplitude
 * J2 = mean frequency
 * K2 = mean intensity
 * M2 = sex factor
 */
export function calculateIFIPV(params: {
  rmsAmplitude: number;
  meanFrequency: number;
  meanIntensity: number;
  sexFactor: number;
}): number {
  const { rmsAmplitude, meanFrequency, meanIntensity, sexFactor } = params;

  assertFinitePositive(rmsAmplitude, "rmsAmplitude");

  assertFinitePositive(meanFrequency, "meanFrequency");

  assertFinitePositive(meanIntensity, "meanIntensity");

  assertFinitePositive(sexFactor, "sexFactor");

  const scaledAmplitude = rmsAmplitude * IFI_AMPLITUDE_MULTIPLIER;

  const numerator = IFI_K_CONSTANT * scaledAmplitude;

  const denominator = meanFrequency * meanIntensity * sexFactor;

  const logarithmInput = numerator / denominator;

  assertFinitePositive(logarithmInput, "PV logarithm input");

  const pv = Math.log(logarithmInput);

  assertFiniteNumber(pv, "PV");

  return pv;
}

/**
 * Current workbook IFI formula.
 *
 * Excel:
 *
 * =PV + LN(
 *   (
 *     SpO2 *
 *     (
 *       AgeDays /
 *       (LifeExpectancyYears * 365.25)
 *     ) ^ 0.25
 *   )
 *   /
 *   (
 *     HeartRate² *
 *     BMI
 *   )
 * )
 */
export function calculateRawIFI(params: {
  pv: number;
  spo2: number;
  ageRatio: number;
  heartRate: number;
  calculatedBmi: number;
}): number {
  const { pv, spo2, ageRatio, heartRate, calculatedBmi } = params;

  assertFiniteNumber(pv, "pv");

  assertFinitePositive(spo2, "spo2");

  assertFinitePositive(ageRatio, "ageRatio");

  assertFinitePositive(heartRate, "heartRate");

  assertFinitePositive(calculatedBmi, "calculatedBmi");

  const numerator = spo2 * ageRatio ** 0.25;

  const denominator = heartRate ** 2 * calculatedBmi;

  const logarithmInput = numerator / denominator;

  assertFinitePositive(logarithmInput, "IFI logarithm input");

  const rawIfi = pv + Math.log(logarithmInput);

  assertFiniteNumber(rawIfi, "rawIfi");

  return rawIfi;
}

/**
 * Calculates the Inflammation Coefficient from the current IFI workbook.
 *
 * Excel formula:
 *
 * =(
 *   -IFI
 *   * BMI
 *   * (HeartRate / 60)
 *   * (1 - SpO2 / 100)
 * )
 * /
 * (
 *   10 * SexFactor
 * )
 *
 * Excel cell:
 * B9
 *
 * Workbook references:
 *
 * S2 = IFI
 * N2 = calculated BMI
 * M2 = sex factor
 * H2 = heart rate
 * G2 = SpO₂
 *
 * Important:
 *
 * - Uses the full-precision IFI (`rawIfi`).
 * - Uses the recalculated workbook BMI, not submitted BMI.
 * - The returned value is the raw decimal coefficient.
 * - Excel formats this value as a percentage.
 * - No MAX(0, ...) clamp is present in the current workbook.
 */
// export function calculateInflammationCoefficient(params: {
//   rawIfi: number;
//   calculatedBmi: number;
//   sexFactor: number;
//   heartRate: number;
//   spo2: number;
// }): number {
//   const { rawIfi, calculatedBmi, sexFactor, heartRate, spo2 } = params;

//   assertFiniteNumber(rawIfi, "rawIfi");

//   assertFinitePositive(calculatedBmi, "calculatedBmi");

//   assertFinitePositive(sexFactor, "sexFactor");

//   assertFinitePositive(heartRate, "heartRate");

//   assertFinitePositive(spo2, "spo2");

//   /**
//    * Equivalent to:
//    *
//    * H2 / 60
//    */
//   const heartRateFactor = heartRate / 60;

//   /**
//    * Equivalent to:
//    *
//    * 1 - G2 / 100
//    */
//   const oxygenDeficitFactor = 1 - spo2 / 100;

//   /**
//    * Equivalent to:
//    *
//    * -S2 * N2 * (H2 / 60) * (1 - G2 / 100)
//    */
//   const numerator =
//     -rawIfi * calculatedBmi * heartRateFactor * oxygenDeficitFactor;

//   /**
//    * Equivalent to:
//    *
//    * 10 * M2
//    */
//   const denominator = 10 * sexFactor;

//   const inflammationCoefficient = numerator / denominator;

//   assertFiniteNumber(inflammationCoefficient, "inflammationCoefficient");

//   return inflammationCoefficient;
// }

export function calculateInflammationCoefficient(params: {
  rawIfi: number;
  calculatedBmi: number;
  heartRate: number;
  spo2: number;
  sexFactor: number;
}): number {
  const { rawIfi, calculatedBmi, heartRate, spo2, sexFactor } = params;

  if (!Number.isFinite(rawIfi)) {
    throw new Error("rawIfi must be a finite number.");
  }

  if (!Number.isFinite(calculatedBmi) || calculatedBmi <= 0) {
    throw new Error("calculatedBmi must be a finite number greater than 0.");
  }

  if (!Number.isFinite(heartRate) || heartRate <= 0) {
    throw new Error("heartRate must be a finite number greater than 0.");
  }

  if (!Number.isFinite(spo2) || spo2 <= 0) {
    throw new Error("spo2 must be a finite number greater than 0.");
  }

  if (!Number.isFinite(sexFactor) || sexFactor <= 0) {
    throw new Error("sexFactor must be a finite number greater than 0.");
  }

  const oxygenDeficit = Math.max(0, 98 - spo2) / 100;

  const oxygenAdjustment = 1 + oxygenDeficit;

  const inflammationCoefficient = Math.abs(
    (rawIfi * calculatedBmi * (heartRate / 60) * oxygenAdjustment) /
      (10 * sexFactor),
  );

  if (!Number.isFinite(inflammationCoefficient)) {
    throw new Error(
      "Inflammation Coefficient calculation produced an invalid result.",
    );
  }

  return inflammationCoefficient;
}

/**
 * Calculates the clinical IFI Range.
 *
 * The user-confirmed formula is:
 *
 * =IF(
 *   IFI >= 0,
 *   0,
 *   MAX(
 *     1,
 *     MIN(
 *       25,
 *       ROUND(
 *         SQRT(
 *           ABS(PV + IFI) * 100
 *         ),
 *         0
 *       )
 *     )
 *   )
 * )
 *
 * Important:
 *
 * - `pv` must be full precision.
 * - `rawIfi` must be full precision.
 * - Do NOT use the display-rounded IFI.
 */
export function calculateIFIRange(pv: number, rawIfi: number): IFIRange {
  assertFiniteNumber(pv, "pv");
  assertFiniteNumber(rawIfi, "rawIfi");

  /**
   * Explicit user-confirmed behavior.
   *
   * The uploaded workbook's current T2 formula omits this outer IF,
   * but this is the intended updated formula supplied for the platform.
   */
  if (rawIfi >= 0) {
    return 0;
  }

  const unboundedRange = Math.round(Math.sqrt(Math.abs(pv + rawIfi) * 100));

  const boundedRange = Math.max(1, Math.min(25, unboundedRange));

  /**
   * boundedRange is mathematically guaranteed to be an integer
   * between 1 and 25.
   */
  return boundedRange as IFIRange;
}

/**
 * ---------------------------------------------------------------------------
 * CLASSIFICATION HELPERS
 * ---------------------------------------------------------------------------
 */

/**
 * Reproduces Excel CHOOSE(ifiRange, ...).
 *
 * Excel CHOOSE is 1-based.
 * JavaScript arrays are 0-based.
 *
 * Therefore:
 *
 * classificationIndex = ifiRange - 1
 */
function getClassificationFromRange<T extends string>(
  ifiRange: Exclude<IFIRange, 0>,
  values: readonly T[],
  categoryName: string,
): T {
  const index = ifiRange - 1;

  const result = values[index];

  if (result === undefined) {
    throw new Error(
      `${categoryName} classification is missing for IFI Range ${ifiRange}.`,
    );
  }

  return result;
}

/**
 * Gut-Brain Axis classification.
 */
export function classifyIFIGutBrainAxis(
  ifiRange: IFIRange,
): IFIGutBrainAxisClassification {
  if (ifiRange === 0) {
    return "Normal";
  }

  return getClassificationFromRange(
    ifiRange,
    GUT_BRAIN_AXIS_CLASSIFICATIONS,
    "Gut-Brain Axis",
  );
}

/**
 * Endocrine-Metabolic classification.
 */
export function classifyIFIEndocrineMetabolic(
  ifiRange: IFIRange,
): IFIEndocrineMetabolicClassification {
  if (ifiRange === 0) {
    return "Normal";
  }

  return getClassificationFromRange(
    ifiRange,
    ENDOCRINE_METABOLIC_CLASSIFICATIONS,
    "Endocrine-Metabolic",
  );
}

/**
 * Tumoral-Proliferative classification.
 *
 * This is the only category in the dashboard whose classification
 * list also depends on patient sex.
 */
export function classifyIFITumoralProliferative(
  ifiRange: IFIRange,
  sex: IFIFormulaInput["sex"],
): IFITumoralProliferativeClassification {
  if (ifiRange === 0) {
    return "Normal";
  }

  const classifications =
    sex === "male"
      ? MALE_TUMORAL_PROLIFERATIVE_CLASSIFICATIONS
      : FEMALE_TUMORAL_PROLIFERATIVE_CLASSIFICATIONS;

  return getClassificationFromRange(
    ifiRange,
    classifications,
    "Tumoral-Proliferative",
  );
}

/**
 * Neurological classification.
 */
export function classifyIFINeurological(
  ifiRange: IFIRange,
): IFINeurologicalClassification {
  if (ifiRange === 0) {
    return "Normal";
  }

  return getClassificationFromRange(
    ifiRange,
    NEUROLOGICAL_CLASSIFICATIONS,
    "Neurological",
  );
}

/**
 * Cardiovascular classification.
 */
export function classifyIFICardiovascular(
  ifiRange: IFIRange,
): IFICardiovascularClassification {
  if (ifiRange === 0) {
    return "Normal";
  }

  return getClassificationFromRange(
    ifiRange,
    CARDIOVASCULAR_CLASSIFICATIONS,
    "Cardiovascular",
  );
}

/**
 * Calculates every clinical classification for one IFI Range.
 *
 * Unlike the old implementation, the patient is not assigned
 * to one single clinical category.
 *
 * The same IFI Range generates one result in every category.
 */
export function classifyIFI(
  ifiRange: IFIRange,
  sex: IFIFormulaInput["sex"],
): IFIClassifications {
  return {
    gutBrainAxis: classifyIFIGutBrainAxis(ifiRange),

    endocrineMetabolic: classifyIFIEndocrineMetabolic(ifiRange),

    tumoralProliferative: classifyIFITumoralProliferative(ifiRange, sex),

    neurological: classifyIFINeurological(ifiRange),

    cardiovascular: classifyIFICardiovascular(ifiRange),
  };
}

/**
 * ---------------------------------------------------------------------------
 * COMPLETE IFI CALCULATION
 * ---------------------------------------------------------------------------
 */

/**
 * Runs the complete IFI calculation in dependency order.
 *
 * Flow:
 *
 * Patient / Voice / Oximeter values
 *           ↓
 *      Sex Factor
 *           ↓
 *          BMI
 *           ↓
 *      Age in Days
 *           ↓
 *      Age Ratio
 *           ↓
 *           PV
 *           ↓
 *      Full precision IFI
 *           ↓
 *       IFI Range
 *           ↓
 *  Five clinical classifications
 *
 * Full-precision values are preserved internally.
 *
 * Only `ifi` is rounded for application/display use.
 */
export function calculateIFI(input: IFIFormulaInput): IFICalculationResult {
  /**
   * Basic defensive validation.
   *
   * More user-facing/domain validation can still live in
   * validateFormulaInput.ts.
   */
  assertFinitePositive(input.heightCm, "heightCm");

  assertFinitePositive(input.weightKg, "weightKg");

  assertFinitePositive(input.bmi, "bmi");

  assertFinitePositive(input.spo2, "spo2");

  assertFinitePositive(input.heartRate, "heartRate");

  assertFinitePositive(input.rmsAmplitude, "rmsAmplitude");

  assertFinitePositive(input.meanFrequency, "meanFrequency");

  assertFinitePositive(input.meanIntensity, "meanIntensity");

  /**
   * Height conversion.
   */
  const heightMeters = calculateIFIHeightMeters(input.heightCm);

  /**
   * Workbook BMI.
   *
   * The submitted PatientInfo BMI is intentionally not used
   * as the mathematical BMI input.
   */
  const calculatedBmi = calculateIFIBmi(input.heightCm, input.weightKg);

  /**
   * Keep submitted BMI only for comparison/debugging.
   */
  const bmiDifference = Math.abs(input.bmi - calculatedBmi);

  /**
   * Patient sex factor.
   */
  const sexFactor = calculateIFISexFactor(input.sex);

  /**
   * Exact elapsed age in days.
   */
  const ageInDays = calculateIFIAgeInDays(
    input.dateOfBirth,
    input.evaluationDate,
  );

  /**
   * Age ratio using the workbook's current
   * 76-year life expectancy.
   */
  const ageRatio = calculateIFIAgeRatio(ageInDays);

  /**
   * Voice-derived PV.
   *
   * Keep full precision.
   */
  const pv = calculateIFIPV({
    rmsAmplitude: input.rmsAmplitude,

    meanFrequency: input.meanFrequency,

    meanIntensity: input.meanIntensity,

    sexFactor,
  });

  /**
   * Final mathematical IFI.
   *
   * Keep this value full precision.
   */
  const rawIfi = calculateRawIFI({
    pv,

    spo2: input.spo2,

    ageRatio,

    heartRate: input.heartRate,

    calculatedBmi,
  });

  /**
   * Inflammation Coefficient.
   *
   * This uses the full-precision IFI and the same workbook-derived
   * values used by the Excel B9 formula.
   */
  const inflammationCoefficient = calculateInflammationCoefficient({
    rawIfi,
    calculatedBmi,
    sexFactor,
    heartRate: input.heartRate,
    spo2: input.spo2,
  });

  /**
   * Excel stores the coefficient as a decimal and applies percentage
   * number formatting to the cell.
   *
   * Convert it to percentage points separately for application/PDF use.
   *
   * Example:
   *
   * 0.125 -> 12.5
   */
  const inflammationCoefficientPercent = Number(
    inflammationCoefficient.toFixed(2),
  );

  /**
   * Display-only IFI.
   *
   * Never feed this rounded number back into IFI Range or
   * downstream formulas.
   */
  const ifi = roundForDisplay(rawIfi);

  /**
   * New clinical range.
   *
   * Uses full-precision PV + raw IFI.
   */
  const ifiRange = calculateIFIRange(pv, rawIfi);

  /**
   * One clinical result for every category.
   */
  const classifications = classifyIFI(ifiRange, input.sex);

  return {
    ifi,

    rawIfi,

    ifiRange,

    classifications,

    inflammationCoefficient,

    inflammationCoefficientPercent,

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

      lifeExpectancyYears: IFI_LIFE_EXPECTANCY_YEARS,
    },

    formulaVersion: IFI_FORMULA_VERSION,

    evaluationDate: input.evaluationDate,

    calculatedAt: new Date().toISOString(),
  };
}
