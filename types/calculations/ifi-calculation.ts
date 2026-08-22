// /**
//  * Flat, formula-ready assessment data.
//  *
//  * Calculation functions receive this object instead of accessing deeply
//  * nested Assessment Context properties.
//  */
// export interface IFIFormulaInput {
//   /**
//    * Assessment date.
//    *
//    * Use a date-only ISO value whenever possible:
//    * "2026-07-29"
//    *
//    * Keeping this value in the input makes calculations reproducible and
//    * allows us to compare a web result against the Excel workbook.
//    */
//   evaluationDate: string;

//   /**
//    * Patient information.
//    */
//   dateOfBirth: string;
//   age: number;
//   sex: "male" | "female";
//   heightCm: number;
//   weightKg: number;

//   /**
//    * BMI saved by the Patient Info form.
//    *
//    * The IFI formula recalculates BMI from height and weight because that
//    * is what the Excel workbook does.
//    *
//    * This submitted value is retained so we can compare it against the
//    * workbook-derived BMI during validation and debugging.
//    */
//   bmi: number;

//   /**
//    * Processed voice metrics returned by the Praat API.
//    *
//    * These values must represent summary measurements from the complete
//    * voice recording, not individual audio-frame measurements.
//    */
//   rmsAmplitude: number;
//   meanFrequency: number;
//   meanIntensity: number;

//   /**
//    * Oximeter measurements.
//    */
//   spo2: number;
//   heartRate: number;
// }

// /**
//  * Clinical classification categories produced from IFI Range.
//  *
//  * One patient can receive one classification from every category for the
//  * same IFI Range value.
//  */
// export interface IFIClassifications {
//   /**
//    * Gut-Brain Axis classification.
//    */
//   gutBrainAxis: string;

//   /**
//    * Endocrine-Metabolic classification.
//    */
//   endocrineMetabolic: string;

//   /**
//    * Tumoral-Proliferative classification.
//    */
//   tumoralProliferative: string;

//   /**
//    * Neurological classification.
//    */
//   neurological: string;

//   /**
//    * Cardiovascular classification.
//    */
//   cardiovascular: string;
// }

// /**
//  * Every intermediate value used to calculate the final IFI.
//  *
//  * Keeping these values makes it possible to compare the TypeScript result
//  * against every corresponding Excel column.
//  */
// export interface IFICalculationBreakdown {
//   /**
//    * Sex factor used by the workbook.
//    *
//    * Female = 1
//    * Male = 1.75
//    */
//   sexFactor: number;

//   /**
//    * Height converted from centimetres to metres.
//    */
//   heightMeters: number;

//   /**
//    * BMI recalculated using the workbook formula:
//    *
//    * weightKg / heightMeters²
//    */
//   calculatedBmi: number;

//   /**
//    * BMI received from PatientInfo.
//    */
//   submittedBmi: number;

//   /**
//    * Absolute difference between submitted and recalculated BMI.
//    */
//   bmiDifference: number;

//   /**
//    * Number of calendar days from date of birth to evaluation date.
//    */
//   ageInDays: number;

//   /**
//    * Age represented as a fraction of the workbook's fixed
//    * 74-year life expectancy.
//    */
//   ageRatio: number;

//   /**
//    * Voice-derived PV value.
//    *
//    * This value must remain full precision because IFI Range depends on
//    * PV + raw IFI.
//    */
//   pv: number;

//   /**
//    * Fixed workbook constant used by the PV calculation.
//    */
//   k: number;

//   /**
//    * Fixed workbook life expectancy.
//    */
//   lifeExpectancyYears: number;
// }

// /**
//  * Complete result returned by the IFI calculation.
//  */
// export interface IFICalculationResult {
//   /**
//    * Final IFI value rounded for application display.
//    *
//    * Do not use this rounded value for downstream mathematical formulas.
//    */
//   ifi: number;

//   /**
//    * Full-precision IFI result before display rounding.
//    *
//    * This value should continue to be used by calculations such as
//    * Biological Age, Inflammation Index, and IFI Range.
//    */
//   rawIfi: number;

//   /**
//    * Clinical IFI Range derived from full-precision PV and IFI.
//    *
//    * Workbook logic:
//    *
//    * IF rawIfi >= 0:
//    *   ifiRange = 0
//    *
//    * OTHERWISE:
//    *   ROUND(SQRT(ABS(PV + IFI) * 100), 0)
//    *
//    * The negative-IFI result is then clamped to the inclusive range 1–25.
//    *
//    * Therefore the final application value can be:
//    *
//    * 0, or an integer from 1 through 25.
//    */
//   ifiRange: number;

//   /**
//    * Independent clinical classifications derived from IFI Range.
//    *
//    * Unlike the previous IFI implementation, classification is no longer
//    * a single functional condition determined directly from raw IFI.
//    *
//    * The same IFI Range produces one result for each clinical category.
//    */
//   classifications: IFIClassifications;

//   /**
//    * Intermediate values used during the calculation.
//    */
//   breakdown: IFICalculationBreakdown;

//   /**
//    * Version of the implemented workbook formula.
//    *
//    * Increment this whenever workbook calculation or classification
//    * behavior changes.
//    */
//   formulaVersion: string;

//   /**
//    * Date used to calculate age-related values.
//    */
//   evaluationDate: string;

//   /**
//    * ISO timestamp indicating when the application performed
//    * the calculation.
//    */
//   calculatedAt: string;
// }

/**
 * Flat, formula-ready assessment data.
 *
 * Calculation functions receive this object instead of accessing deeply
 * nested Assessment Context properties.
 */
export interface IFIFormulaInput {
  /**
   * Assessment date.
   *
   * Use a date-only ISO value whenever possible:
   * "2026-07-29"
   *
   * Keeping this value in the input makes calculations reproducible and
   * allows us to compare a web result against the Excel workbook.
   */
  evaluationDate: string;

  /**
   * Patient information.
   */
  dateOfBirth: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;

  /**
   * BMI saved by the Patient Info form.
   *
   * The IFI calculation recalculates BMI from height and weight because
   * that is what the Excel workbook does.
   *
   * This submitted value is retained for comparison and validation.
   */
  bmi: number;

  /**
   * Processed voice metrics returned by the Praat API.
   *
   * These values must represent summary measurements from the complete
   * voice recording, not individual audio-frame measurements.
   */
  rmsAmplitude: number;
  meanFrequency: number;
  meanIntensity: number;

  /**
   * Oximeter measurements.
   */
  spo2: number;
  heartRate: number;
}

/**
 * IFI Range returned by the workbook.
 *
 * 0 means Normal.
 *
 * Negative IFI values are transformed into an integer range from 1–25.
 */
export type IFIRange =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25;

/**
 * Gut-Brain Axis classifications.
 *
 * These values follow the IFI Dashboard CHOOSE() formula exactly.
 *
 * IFI Range:
 * 0  -> Normal
 * 1–25 -> corresponding classification below.
 */
export type IFIGutBrainAxisClassification =
  | "Normal"
  | "Irritable Bowel Syndrome (IBS)"
  | "Inflammatory Bowel Disease (Crohn's & Ulcerative Colitis)"
  | "Gut Dysbiosis"
  | "Increased Intestinal Permeability (Leaky Gut)"
  | "Depression"
  | "Generalized Anxiety Disorder"
  | "Autism Spectrum Disorder (ASD)"
  | "Parkinson's Disease"
  | "Alzheimer's Disease"
  | "Multiple Sclerosis"
  | "Fibromyalgia"
  | "Chronic Fatigue Syndrome (CFS/ME)"
  | "Migraine"
  | "Bipolar Disorder"
  | "Schizophrenia"
  | "Attention-Deficit/Hyperactivity Disorder (ADHD)"
  | "Sleep Disorders (Insomnia)"
  | "Epilepsy"
  | "Eating Disorders (Anorexia/Bulimia)"
  | "Tourette Syndrome"
  | "Neuropathic Pain"
  | "Obsessive-Compulsive Disorder (OCD)"
  | "Seasonal Affective Disorder"
  | "Chronic Systemic Inflammation"
  | "Multiple Chemical Sensitivity (MCS)";

/**
 * Endocrine-Metabolic classifications.
 *
 * These values follow the IFI Dashboard CHOOSE() formula exactly.
 */
export type IFIEndocrineMetabolicClassification =
  | "Normal"
  | "Overweight"
  | "Obesity Class I"
  | "Obesity Class II"
  | "Obesity Class III"
  | "Insulin Resistance"
  | "Hyperinsulinemia"
  | "Prediabetes"
  | "Type 2 Diabetes Mellitus"
  | "Metabolic Syndrome"
  | "Dyslipidemia"
  | "Hypertriglyceridemia"
  | "Non-Alcoholic Fatty Liver Disease (NAFLD)"
  | "Hypercholesterolemia"
  | "Hypothyroidism"
  | "Hyperthyroidism"
  | "Hashimoto's Thyroiditis"
  | "Polycystic Ovary Syndrome (PCOS)"
  | "Hyperuricemia"
  | "Gout"
  | "Vitamin D Deficiency"
  | "Osteopenia"
  | "Osteoporosis"
  | "Hypogonadism"
  | "Hyperparathyroidism"
  | "Severe Endocrine-Metabolic Dysfunction";

/**
 * Neurological classifications.
 *
 * Unlike some other workbook categories, the Dashboard already includes
 * the "Predisposition -" prefix in each neurological result.
 */
export type IFINeurologicalClassification =
  | "Normal"
  | "Predisposition - Migraine"
  | "Predisposition - Peripheral Neuropathy"
  | "Predisposition - Epilepsy"
  | "Predisposition - Mild Cognitive Impairment"
  | "Predisposition - Vascular Cognitive Impairment"
  | "Predisposition - Multiple Sclerosis"
  | "Predisposition - Parkinson's Disease"
  | "Predisposition - Essential Tremor"
  | "Predisposition - Alzheimer's Disease"
  | "Predisposition - Frontotemporal Dementia"
  | "Predisposition - Lewy Body Dementia"
  | "Predisposition - Amyotrophic Lateral Sclerosis (ALS)"
  | "Predisposition - Huntington's Disease"
  | "Predisposition - Cerebral Small Vessel Disease"
  | "Predisposition - Chronic Cerebral Ischemia"
  | "Predisposition - Transient Ischemic Attack (TIA)"
  | "Predisposition - Ischemic Stroke"
  | "Predisposition - Hemorrhagic Stroke"
  | "Predisposition - Cerebellar Degeneration"
  | "Predisposition - Autonomic Neuropathy"
  | "Predisposition - Optic Neuropathy"
  | "Predisposition - Hypoxic-Ischemic Encephalopathy"
  | "Predisposition - Neurodegenerative Disorder"
  | "Predisposition - Severe Neurological Dysfunction"
  | "Predisposition - Advanced Neurodegenerative Syndrome";

/**
 * Cardiovascular classifications.
 *
 * The Dashboard includes the "Predisposition -" prefix directly in
 * each cardiovascular classification value.
 */
export type IFICardiovascularClassification =
  | "Normal"
  | "Predisposition - Overweight-related Cardiovascular Risk"
  | "Predisposition - Essential Hypertension"
  | "Predisposition - Dyslipidemic Cardiovascular Risk"
  | "Predisposition - Atherosclerosis"
  | "Predisposition - Stable Angina"
  | "Predisposition - Coronary Artery Disease"
  | "Predisposition - Peripheral Artery Disease"
  | "Predisposition - Carotid Artery Disease"
  | "Predisposition - Atrial Fibrillation"
  | "Predisposition - Supraventricular Tachycardia"
  | "Predisposition - Ventricular Arrhythmia"
  | "Predisposition - Heart Failure with Preserved Ejection Fraction"
  | "Predisposition - Heart Failure with Reduced Ejection Fraction"
  | "Predisposition - Left Ventricular Hypertrophy"
  | "Predisposition - Cardiomyopathy"
  | "Predisposition - Valvular Heart Disease"
  | "Predisposition - Pulmonary Hypertension"
  | "Predisposition - Chronic Ischemic Heart Disease"
  | "Predisposition - Acute Coronary Syndrome"
  | "Predisposition - Myocardial Infarction"
  | "Predisposition - Aortic Aneurysm"
  | "Predisposition - Aortic Dissection"
  | "Predisposition - Cardiogenic Shock"
  | "Predisposition - Severe Ischemic Cardiovascular Disease"
  | "Predisposition - Advanced Cardiovascular Dysfunction";

/**
 * Tumoral-Proliferative classifications shared by both sexes.
 */
export type IFITumoralProliferativeCommonClassification =
  | "Normal"
  | "Colorectal Adenoma"
  | "Colorectal Cancer"
  | "Lung Cancer"
  | "Liver Cancer (Hepatocellular Carcinoma)"
  | "Pancreatic Cancer"
  | "Gastric Cancer"
  | "Esophageal Cancer"
  | "Bladder Cancer"
  | "Kidney Cancer"
  | "Thyroid Cancer"
  | "Melanoma"
  | "Non-Hodgkin Lymphoma"
  | "Hodgkin Lymphoma"
  | "Multiple Myeloma"
  | "Chronic Lymphocytic Leukemia"
  | "Acute Myeloid Leukemia"
  | "Glioblastoma"
  | "Sarcoma"
  | "Metastatic Malignant Neoplasm"
  | "Severe Tumoral-Proliferative Dysfunction";

/**
 * Male-specific Tumoral-Proliferative classifications.
 *
 * The Excel Dashboard uses a separate CHOOSE() list when Sex = Male.
 */
export type IFIMaleTumoralProliferativeClassification =
  | IFITumoralProliferativeCommonClassification
  | "Prostate Cancer"
  | "Testicular Cancer"
  | "Penile Cancer"
  | "Laryngeal Cancer"
  | "Oral Squamous Cell Carcinoma";

/**
 * Female-specific Tumoral-Proliferative classifications.
 *
 * The Excel Dashboard uses a separate CHOOSE() list for female patients.
 */
export type IFIFemaleTumoralProliferativeClassification =
  | IFITumoralProliferativeCommonClassification
  | "Breast Cancer"
  | "Ovarian Cancer"
  | "Endometrial Cancer"
  | "Cervical Cancer"
  | "Vulvar Cancer";

/**
 * Every possible Tumoral-Proliferative classification returned by
 * the IFI calculation.
 *
 * The actual value returned at runtime depends on both:
 *
 * - IFI Range
 * - Patient sex
 */
export type IFITumoralProliferativeClassification =
  | IFIMaleTumoralProliferativeClassification
  | IFIFemaleTumoralProliferativeClassification;

/**
 * Complete set of independent classifications generated from one
 * IFI Range.
 *
 * A patient receives one classification in every category.
 */
export interface IFIClassifications {
  gutBrainAxis: IFIGutBrainAxisClassification;

  endocrineMetabolic: IFIEndocrineMetabolicClassification;

  tumoralProliferative: IFITumoralProliferativeClassification;

  neurological: IFINeurologicalClassification;

  cardiovascular: IFICardiovascularClassification;
}

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
   *
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
   * Age represented as a fraction of the workbook life expectancy.
   */
  ageRatio: number;

  /**
   * Voice-derived PV value.
   *
   * Keep this at full precision because IFI Range depends on:
   *
   * PV + rawIfi
   */
  pv: number;

  /**
   * Fixed workbook constant.
   */
  k: number;

  /**
   * Life expectancy used by the IFI workbook calculation.
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
   * Full-precision IFI before display rounding.
   *
   * Downstream formulas must use this value rather than the
   * display-rounded `ifi`.
   */
  rawIfi: number;

  /**
   * Clinical IFI Range.
   *
   * Intended formula:
   *
   * IF rawIfi >= 0
   *   -> 0
   *
   * ELSE
   *   -> MAX(
   *        1,
   *        MIN(
   *          25,
   *          ROUND(
   *            SQRT(ABS(PV + rawIfi) * 100),
   *            0
   *          )
   *        )
   *      )
   *
   * The resulting value is always an integer from 0 through 25.
   */
  ifiRange: IFIRange;

  /**
   * Full-precision Inflammation Coefficient.
   *
   * Workbook formula:
   *
   * (-IFI × BMI × (HeartRate / 60) × (1 - SpO₂ / 100))
   * ----------------------------------------------------
   *                  10 × SexFactor
   *
   * This is the underlying decimal value stored by Excel.
   *
   * Example:
   * 0.125 = 12.5%
   */
  inflammationCoefficient: number;

  /**
   * Inflammation Coefficient converted to percentage points
   * for application/PDF display.
   *
   * Example:
   *
   * inflammationCoefficient = 0.125
   * inflammationCoefficientPercent = 12.5
   */
  inflammationCoefficientPercent: number;

  /**
   * Clinical classifications derived from IFI Range.
   *
   * All five categories are calculated for the same patient.
   *
   * Tumoral-Proliferative classification additionally depends on sex.
   */
  classifications: IFIClassifications;

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
   * ISO timestamp indicating when the application performed
   * the calculation.
   */
  calculatedAt: string;
}
