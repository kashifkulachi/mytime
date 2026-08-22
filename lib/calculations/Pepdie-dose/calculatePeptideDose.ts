// import type {
//   PeptideDoseCalculationResult,
//   PeptideDoseInput,
//   TherapyDetails,
//   TherapyDoseUnit,
//   TherapyRecommendation,
// } from "@/types/calculations/peptide-dose-calculation";

// /**
//  * Source of truth:
//  * Enrique - VitaVoice-MyTIME-Platform 04.xlsx
//  */
// export const PEPTIDE_DOSE_FORMULA_VERSION =
//   "vita-voice-therapy-recommendations-v4";

// /**
//  * ---------------------------------------------------------------------------
//  * WORKBOOK CONSTANTS
//  * ---------------------------------------------------------------------------
//  */

// const MAX_IFI_RANGE = 28;

// /**
//  * Copaxone®
//  *
//  * Workbook:
//  * MAX(0, MIN(120, IFIRange * 120 / 25))
//  */
// const COPAXONE_MAX_DOSE_MG = 120;

// /**
//  * Wegovy®
//  *
//  * Workbook scale:
//  *
//  * IFIRange 1  -> 0.25 mg
//  * IFIRange 25 -> 2.50 mg
//  *
//  * rounded to the nearest 0.25 mg.
//  */
// const WEGOVY_MIN_DOSE_MG = 0.25;
// const WEGOVY_MAX_FORMULA_DOSE_MG = 2.5;
// const WEGOVY_ROUNDING_INCREMENT_MG = 0.25;

// /**
//  * Lutathera®
//  *
//  * Workbook treatment-course maximum:
//  * 29.6 GBq
//  */
// const LUTATHERA_MAX_TREATMENT_GBQ = 20.6;

// /**
//  * Saxenda®
//  *
//  * Workbook:
//  *
//  * IFIRange 1  -> 0.6 mg
//  * IFIRange 25 -> 3.0 mg
//  */
// const SAXENDA_MIN_DOSE_MG = 0.6;
// const SAXENDA_MAX_DOSE_MG = 3;

// /**
//  * Gattex® labeled dose:
//  *
//  * 0.05 mg/kg
//  */
// const GATTEX_DOSE_PER_KG_MG = 0.05;

// /**
//  * ---------------------------------------------------------------------------
//  * STATIC WORKBOOK THERAPY DETAILS
//  * ---------------------------------------------------------------------------
//  */

// const COPAXONE_DETAILS: TherapyDetails = {
//   id: "copaxone",

//   group: "Neurological",

//   therapy: "Copaxone®",

//   activeIngredient: "Glatiramer acetate / synthetic polypeptide",

//   indication: "Relapsing forms of multiple sclerosis",

//   labeledDoseRegimen: "20 mg SC once daily OR 40 mg SC three times weekly",

//   maximumOrMaintenance: "Use labeled regimen; not IFI-scaled",
// };

// const WEGOVY_DETAILS: TherapyDetails = {
//   id: "wegovy",

//   group: "Cardiovascular",

//   therapy: "Wegovy®",

//   activeIngredient: "Semaglutide / GLP-1 receptor agonist",

//   indication:
//     "Reduction of major adverse cardiovascular events in indicated adults with established cardiovascular disease and overweight/obesity",

//   labeledDoseRegimen: "Dose escalation beginning at 0.25 mg once weekly",

//   maximumOrMaintenance:
//     "2.4 mg once weekly recommended maintenance injection dose; 1.7 mg may be used in some patients",
// };

// const LUTATHERA_DETAILS: TherapyDetails = {
//   id: "lutathera",

//   group: "Oncological",

//   therapy: "Lutathera®",

//   activeIngredient:
//     "Lutetium Lu 177 dotatate / radiolabeled somatostatin analog",

//   indication:
//     "Somatostatin receptor-positive gastroenteropancreatic neuroendocrine tumors",

//   labeledDoseRegimen:
//     "7.4 GBq (200 mCi) IV every 8 weeks for 4 doses in adults",

//   maximumOrMaintenance: "Fixed labeled treatment course; not a mg titration",
// };

// const SAXENDA_DETAILS: TherapyDetails = {
//   id: "saxenda",

//   group: "Endocrine-Metabolic",

//   therapy: "Saxenda®",

//   activeIngredient: "Liraglutide / GLP-1 receptor agonist",

//   indication: "Chronic weight management in indicated patients",

//   labeledDoseRegimen:
//     "0.6 mg SC daily; increase weekly through 1.2, 1.8, 2.4 mg",

//   maximumOrMaintenance: "3 mg SC once daily maintenance",
// };

// const GATTEX_DETAILS: TherapyDetails = {
//   id: "gattex",

//   group: "Gut-Brain Axis",

//   therapy: "Gattex®",

//   activeIngredient: "Teduglutide / GLP-2 analog",

//   indication:
//     "Short bowel syndrome in patients dependent on parenteral support",

//   labeledDoseRegimen: "0.05 mg/kg SC once daily",

//   maximumOrMaintenance: "Weight-based labeled dose; not IFI-scaled",
// };

// /**
//  * ---------------------------------------------------------------------------
//  * INTERNAL NUMERIC HELPERS
//  * ---------------------------------------------------------------------------
//  */

// function assertFiniteNumber(value: number, fieldName: string): void {
//   if (!Number.isFinite(value)) {
//     throw new Error(`${fieldName} must be a finite number.`);
//   }
// }

// function assertFinitePositive(value: number, fieldName: string): void {
//   if (!Number.isFinite(value) || value <= 0) {
//     throw new Error(`${fieldName} must be a finite number greater than 0.`);
//   }
// }

// /**
//  * Equivalent to Excel MROUND(value, multiple)
//  * for the positive numbers used in Workbook 04.
//  */
// function roundToIncrement(value: number, increment: number): number {
//   assertFiniteNumber(value, "value");
//   assertFinitePositive(increment, "increment");

//   const rounded = Math.round(value / increment) * increment;

//   /**
//    * Prevent floating-point artifacts such as:
//    * 1.5000000000000002
//    */
//   return Number(rounded.toFixed(10));
// }

// /**
//  * Builds a clean report-ready recommendation.
//  *
//  * No IFI/BMI calculation breakdown is duplicated here because
//  * calculation diagnostics already belong to the IFI result.
//  */
// function buildRecommendation(params: {
//   treatment: TherapyDetails;
//   recommendedDose: number;
//   unit: TherapyDoseUnit;
// }): TherapyRecommendation {
//   const { treatment, recommendedDose, unit } = params;

//   assertFiniteNumber(recommendedDose, `${treatment.therapy} recommendedDose`);

//   if (recommendedDose < 0) {
//     throw new Error(
//       `${treatment.therapy} recommendedDose must not be negative.`,
//     );
//   }

//   return {
//     treatment,
//     recommendedDose,
//     unit,
//   };
// }

// /**
//  * ---------------------------------------------------------------------------
//  * INDIVIDUAL WORKBOOK FORMULAS
//  * ---------------------------------------------------------------------------
//  */

// /**
//  * Copaxone®
//  *
//  * Workbook:
//  *
//  * =MAX(
//  *   0,
//  *   MIN(
//  *     120,
//  *     IFIRange * 120 / 25
//  *   )
//  * )
//  */
// export function calculateCopaxoneDose(ifiRange: number): number {
//   assertFiniteNumber(ifiRange, "ifiRange");

//   return Math.max(
//     0,
//     Math.min(
//       COPAXONE_MAX_DOSE_MG,
//       (ifiRange * COPAXONE_MAX_DOSE_MG) / MAX_IFI_RANGE,
//     ),
//   );
// }

// /**
//  * Wegovy®
//  *
//  * Workbook:
//  *
//  * =IF(
//  *   IFIRange = 0,
//  *   0,
//  *   MROUND(
//  *     0.25 +
//  *     (IFIRange - 1) *
//  *     (2.5 - 0.25) / 24,
//  *     0.25
//  *   )
//  * )
//  *
//  * Important:
//  *
//  * Workbook formula maximum = 2.5 mg.
//  *
//  * The workbook's FDA-labeled maintenance text separately states
//  * 2.4 mg once weekly.
//  *
//  * We preserve both rather than silently clamping the formula result
//  * to the labeled maintenance value.
//  */
// export function calculateWegovyDose(ifiRange: number): number {
//   assertFiniteNumber(ifiRange, "ifiRange");

//   if (ifiRange === 0) {
//     return 0;
//   }

//   const interpolatedDose =
//     WEGOVY_MIN_DOSE_MG +
//     ((ifiRange - 1) * (WEGOVY_MAX_FORMULA_DOSE_MG - WEGOVY_MIN_DOSE_MG)) /
//       (MAX_IFI_RANGE - 1);

//   return roundToIncrement(interpolatedDose, WEGOVY_ROUNDING_INCREMENT_MG);
// }

// /**
//  * Lutathera®
//  *
//  * Workbook 04 appears to intend:
//  *
//  * =MAX(
//  *   0,
//  *   MIN(
//  *     29.6,
//  *     IFIRange * 29.6 / 25
//  *   )
//  * )
//  *
//  * The uploaded cell currently contains:
//  *
//  * =MAX(0,MIN(29.6,G11*29,6/25))
//  *
//  * which appears to be a decimal-separator typo.
//  *
//  * This implementation uses the clinically and mathematically
//  * consistent 29.6 GBq interpretation.
//  */
// export function calculateLutatheraDose(ifiRange: number): number {
//   assertFiniteNumber(ifiRange, "ifiRange");

//   return Math.max(
//     0,
//     Math.min(
//       LUTATHERA_MAX_TREATMENT_GBQ,
//       (ifiRange * LUTATHERA_MAX_TREATMENT_GBQ) / MAX_IFI_RANGE,
//     ),
//   );
// }

// /**
//  * Saxenda®
//  *
//  * Workbook:
//  *
//  * =IF(
//  *   IFIRange <= 0,
//  *   0,
//  *   IF(
//  *     IFIRange >= 25,
//  *     3,
//  *     0.6 +
//  *     (IFIRange - 1) *
//  *     (3 - 0.6) / 24
//  *   )
//  * )
//  */
// export function calculateSaxendaDose(ifiRange: number): number {
//   assertFiniteNumber(ifiRange, "ifiRange");

//   if (ifiRange <= 0) {
//     return 0;
//   }

//   if (ifiRange >= MAX_IFI_RANGE) {
//     return SAXENDA_MAX_DOSE_MG;
//   }

//   return (
//     SAXENDA_MIN_DOSE_MG +
//     ((ifiRange - 1) * (SAXENDA_MAX_DOSE_MG - SAXENDA_MIN_DOSE_MG)) /
//       (MAX_IFI_RANGE - 1)
//   );
// }

// /**
//  * Gattex®
//  *
//  * Workbook:
//  *
//  * =IF(
//  *   IFIRange <= 0,
//  *   0,
//  *   MIN(IFIRange,25) / 25
//  *   *
//  *   (0.05 * WeightKg)
//  * )
//  *
//  * At IFI Range 25 this equals the labeled:
//  *
//  * 0.05 mg/kg × body weight.
//  */
// export function calculateGattexDose(
//   ifiRange: number,
//   weightKg: number,
// ): number {
//   assertFiniteNumber(ifiRange, "ifiRange");

//   assertFinitePositive(weightKg, "weightKg");

//   if (ifiRange <= 0) {
//     return 0;
//   }

//   const boundedIfiRange = Math.min(ifiRange, MAX_IFI_RANGE);

//   const labeledWeightBasedDose = GATTEX_DOSE_PER_KG_MG * weightKg;

//   return (boundedIfiRange / MAX_IFI_RANGE) * labeledWeightBasedDose;
// }

// /**
//  * ---------------------------------------------------------------------------
//  * COMPLETE WORKBOOK 04 THERAPY CALCULATION
//  * ---------------------------------------------------------------------------
//  *
//  * Runs all five therapy recommendations using the same IFI Range.
//  *
//  * Output order intentionally matches Workbook 04 and the future
//  * medical-report table:
//  *
//  * 1. Neurological        — Copaxone®
//  * 2. Cardiovascular      — Wegovy®
//  * 3. Oncological         — Lutathera®
//  * 4. Endocrine-Metabolic — Saxenda®
//  * 5. Gut-Brain Axis      — Gattex®
//  */
// export function calculatePeptideDose(
//   input: PeptideDoseInput,
// ): PeptideDoseCalculationResult {
//   if (!input) {
//     throw new Error("Therapy recommendation input is required.");
//   }

//   const { ifiRange, weightKg } = input;

//   /**
//    * Defensive validation.
//    *
//    * validatePeptideDoseInput.ts should normally be called before this
//    * function, but the calculation layer still protects itself when
//    * called independently.
//    */
//   assertFiniteNumber(ifiRange, "ifiRange");

//   if (!Number.isInteger(ifiRange)) {
//     throw new Error("ifiRange must be an integer.");
//   }

//   if (ifiRange < 0 || ifiRange > MAX_IFI_RANGE) {
//     throw new Error("ifiRange must be between 0 and 25.");
//   }

//   assertFinitePositive(weightKg, "weightKg");

//   /**
//    * Keep all calculations at full precision.
//    *
//    * Display formatting belongs to the final report component.
//    */
//   const copaxoneDose = calculateCopaxoneDose(ifiRange);

//   const wegovyDose = calculateWegovyDose(ifiRange);

//   const lutatheraDose = calculateLutatheraDose(ifiRange);

//   const saxendaDose = calculateSaxendaDose(ifiRange);

//   const gattexDose = calculateGattexDose(ifiRange, weightKg);

//   const copaxoneRecommendation = buildRecommendation({
//     treatment: COPAXONE_DETAILS,
//     recommendedDose: copaxoneDose,
//     unit: "mg",
//   });

//   const wegovyRecommendation = buildRecommendation({
//     treatment: WEGOVY_DETAILS,
//     recommendedDose: wegovyDose,
//     unit: "mg",
//   });

//   const lutatheraRecommendation = buildRecommendation({
//     treatment: LUTATHERA_DETAILS,
//     recommendedDose: lutatheraDose,
//     unit: "GBq",
//   });

//   const saxendaRecommendation = buildRecommendation({
//     treatment: SAXENDA_DETAILS,
//     recommendedDose: saxendaDose,
//     unit: "mg",
//   });

//   const gattexRecommendation = buildRecommendation({
//     treatment: GATTEX_DETAILS,
//     recommendedDose: gattexDose,
//     unit: "mg",
//   });

//   return {
//     /**
//      * Return the exact IFI Range used by all five formulas.
//      *
//      * This is intentionally top-level so the final report can display
//      * it once rather than repeating it in every therapy row.
//      */
//     ifiRange,

//     recommendations: [
//       copaxoneRecommendation,
//       wegovyRecommendation,
//       lutatheraRecommendation,
//       saxendaRecommendation,
//       gattexRecommendation,
//     ],

//     formulaVersion: PEPTIDE_DOSE_FORMULA_VERSION,

//     calculatedAt: new Date().toISOString(),
//   };
// }

import type {
  NeuronOliveMoringaResult,
  PeptideDoseCalculationResult,
  PeptideDoseInput,
  TherapyDetails,
  TherapyDoseUnit,
  TherapyRecommendation,
} from "@/types/calculations/peptide-dose-calculation";

/**
 * Source of truth:
 * Enrique - VitaVoice-MyTIME-Platform 04.xlsx
 *
 * Includes:
 *
 * - 5 therapy recommendations driven by IFI Range
 * - separate Neuron ON® Olive Oil + Moringa recommendation
 */
export const PEPTIDE_DOSE_FORMULA_VERSION =
  "vita-voice-therapy-recommendations-v4-neuron";

/**
 * ---------------------------------------------------------------------------
 * WORKBOOK CONSTANTS
 * ---------------------------------------------------------------------------
 */

const MAX_IFI_RANGE = 25;

/**
 * Copaxone®
 *
 * Workbook scaling maximum:
 * 120 mg
 */
const COPAXONE_MAX_DOSE_MG = 120;

/**
 * Wegovy®
 *
 * Workbook calculated range:
 *
 * IFI Range 1  -> 0.25 mg
 * IFI Range 25 -> 2.50 mg
 *
 * Workbook rounds to the nearest 0.25 mg.
 */
const WEGOVY_MIN_DOSE_MG = 0.25;
const WEGOVY_MAX_FORMULA_DOSE_MG = 2.5;
const WEGOVY_ROUNDING_INCREMENT_MG = 0.25;

/**
 * Lutathera® treatment-course maximum.
 */
const LUTATHERA_MAX_TREATMENT_GBQ = 20.6;

/**
 * Saxenda®
 *
 * Workbook calculated range:
 *
 * IFI Range 1  -> 0.6 mg
 * IFI Range 25 -> 3.0 mg
 */
const SAXENDA_MIN_DOSE_MG = 0.6;
const SAXENDA_MAX_DOSE_MG = 3;

/**
 * Gattex® labeled weight-based dose.
 */
const GATTEX_DOSE_PER_KG_MG = 0.05;

/**
 * Neuron ON®
 *
 * Olive Oil + Moringa formula:
 *
 * 0.15 × ABS(BMI / IFI) × 20
 */
const NEURON_OLIVE_MORINGA_COEFFICIENT = 0.15;
const NEURON_OLIVE_MORINGA_DROPS_MULTIPLIER = 20;

/**
 * ---------------------------------------------------------------------------
 * STATIC THERAPY DETAILS
 * ---------------------------------------------------------------------------
 */

const COPAXONE_DETAILS: TherapyDetails = {
  id: "copaxone",

  group: "Neurological",

  therapy: "Copaxone®",

  activeIngredient: "Glatiramer acetate / synthetic polypeptide",

  indication: "Relapsing forms of multiple sclerosis",

  labeledDoseRegimen: "20 mg SC once daily OR 40 mg SC three times weekly",

  maximumOrMaintenance: "Use labeled regimen; not IFI-scaled",
};

const WEGOVY_DETAILS: TherapyDetails = {
  id: "wegovy",

  group: "Cardiovascular",

  therapy: "Wegovy®",

  activeIngredient: "Semaglutide / GLP-1 receptor agonist",

  indication:
    "Reduction of major adverse cardiovascular events in indicated adults with established cardiovascular disease and overweight/obesity",

  labeledDoseRegimen: "Dose escalation beginning at 0.25 mg once weekly",

  maximumOrMaintenance:
    "2.4 mg once weekly recommended maintenance injection dose; 1.7 mg may be used in some patients",
};

const LUTATHERA_DETAILS: TherapyDetails = {
  id: "lutathera",

  group: "Oncological",

  therapy: "Lutathera®",

  activeIngredient:
    "Lutetium Lu 177 dotatate / radiolabeled somatostatin analog",

  indication:
    "Somatostatin receptor-positive gastroenteropancreatic neuroendocrine tumors",

  labeledDoseRegimen:
    "7.4 GBq (200 mCi) IV every 8 weeks for 4 doses in adults",

  maximumOrMaintenance: "Fixed labeled treatment course; not a mg titration",
};

const SAXENDA_DETAILS: TherapyDetails = {
  id: "saxenda",

  group: "Endocrine-Metabolic",

  therapy: "Saxenda®",

  activeIngredient: "Liraglutide / GLP-1 receptor agonist",

  indication: "Chronic weight management in indicated patients",

  labeledDoseRegimen:
    "0.6 mg SC daily; increase weekly through 1.2, 1.8, 2.4 mg",

  maximumOrMaintenance: "3 mg SC once daily maintenance",
};

const GATTEX_DETAILS: TherapyDetails = {
  id: "gattex",

  group: "Gut-Brain Axis",

  therapy: "Gattex®",

  activeIngredient: "Teduglutide / GLP-2 analog",

  indication:
    "Short bowel syndrome in patients dependent on parenteral support",

  labeledDoseRegimen: "0.05 mg/kg SC once daily",

  maximumOrMaintenance: "Weight-based labeled dose; not IFI-scaled",
};

/**
 * ---------------------------------------------------------------------------
 * INTERNAL HELPERS
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
 * Equivalent to Excel MROUND() for the positive dose values
 * used by the current workbook.
 */
function roundToIncrement(value: number, increment: number): number {
  assertFiniteNumber(value, "value");
  assertFinitePositive(increment, "increment");

  const rounded = Math.round(value / increment) * increment;

  /**
   * Remove normal JavaScript floating-point artifacts.
   *
   * Example:
   * 1.5000000000000002 -> 1.5
   */
  return Number(rounded.toFixed(10));
}

/**
 * Builds one clean report-ready therapy recommendation.
 *
 * Mathematical breakdown is intentionally not duplicated here because
 * IFI calculation diagnostics already live in the IFI result.
 */
function buildRecommendation(params: {
  treatment: TherapyDetails;
  recommendedDose: number;
  unit: TherapyDoseUnit;
}): TherapyRecommendation {
  const { treatment, recommendedDose, unit } = params;

  assertFiniteNumber(recommendedDose, `${treatment.therapy} recommendedDose`);

  if (recommendedDose < 0) {
    throw new Error(
      `${treatment.therapy} recommendedDose must not be negative.`,
    );
  }

  return {
    treatment,
    recommendedDose,
    unit,
  };
}

/**
 * ---------------------------------------------------------------------------
 * THERAPY CALCULATIONS
 * ---------------------------------------------------------------------------
 */

/**
 * Copaxone®
 *
 * Workbook:
 *
 * MAX(
 *   0,
 *   MIN(
 *     120,
 *     IFIRange × 120 / 25
 *   )
 * )
 */
export function calculateCopaxoneDose(ifiRange: number): number {
  assertFiniteNumber(ifiRange, "ifiRange");

  return Math.max(
    0,
    Math.min(
      COPAXONE_MAX_DOSE_MG,
      (ifiRange * COPAXONE_MAX_DOSE_MG) / MAX_IFI_RANGE,
    ),
  );
}

/**
 * Wegovy®
 *
 * Workbook:
 *
 * IF IFIRange = 0
 *   -> 0
 *
 * OTHERWISE:
 *
 * MROUND(
 *   0.25 +
 *   (IFIRange - 1) *
 *   (2.5 - 0.25) / 24,
 *   0.25
 * )
 */
export function calculateWegovyDose(ifiRange: number): number {
  assertFiniteNumber(ifiRange, "ifiRange");

  if (ifiRange <= 0) {
    return 0;
  }

  const interpolatedDose =
    WEGOVY_MIN_DOSE_MG +
    ((ifiRange - 1) * (WEGOVY_MAX_FORMULA_DOSE_MG - WEGOVY_MIN_DOSE_MG)) /
      (MAX_IFI_RANGE - 1);

  return roundToIncrement(interpolatedDose, WEGOVY_ROUNDING_INCREMENT_MG);
}

/**
 * Lutathera®
 *
 * Intended Workbook 04 calculation:
 *
 * MAX(
 *   0,
 *   MIN(
 *     29.6,
 *     IFIRange × 29.6 / 25
 *   )
 * )
 */
export function calculateLutatheraDose(ifiRange: number): number {
  assertFiniteNumber(ifiRange, "ifiRange");

  return Math.max(
    0,
    Math.min(
      LUTATHERA_MAX_TREATMENT_GBQ,
      (ifiRange * LUTATHERA_MAX_TREATMENT_GBQ) / 28,
    ),
  );
}

/**
 * Saxenda®
 *
 * Workbook:
 *
 * IF IFIRange <= 0
 *   -> 0
 *
 * IF IFIRange >= 25
 *   -> 3
 *
 * OTHERWISE:
 *
 * 0.6 +
 * (IFIRange - 1) *
 * (3 - 0.6) / 24
 */
export function calculateSaxendaDose(ifiRange: number): number {
  assertFiniteNumber(ifiRange, "ifiRange");

  if (ifiRange <= 0) {
    return 0;
  }

  if (ifiRange >= MAX_IFI_RANGE) {
    return SAXENDA_MAX_DOSE_MG;
  }

  return (
    SAXENDA_MIN_DOSE_MG +
    ((ifiRange - 1) * (SAXENDA_MAX_DOSE_MG - SAXENDA_MIN_DOSE_MG)) /
      (MAX_IFI_RANGE - 1)
  );
}

/**
 * Gattex®
 *
 * Workbook:
 *
 * IF IFIRange <= 0
 *   -> 0
 *
 * OTHERWISE:
 *
 * MIN(IFIRange, 25) / 25
 * ×
 * (0.05 × WeightKg)
 */
export function calculateGattexDose(
  ifiRange: number,
  weightKg: number,
): number {
  assertFiniteNumber(ifiRange, "ifiRange");

  assertFinitePositive(weightKg, "weightKg");

  if (ifiRange <= 0) {
    return 0;
  }

  const boundedIfiRange = Math.min(ifiRange, MAX_IFI_RANGE);

  const fullWeightBasedDose = GATTEX_DOSE_PER_KG_MG * weightKg;

  return (boundedIfiRange / MAX_IFI_RANGE) * fullWeightBasedDose;
}

/**
 * ---------------------------------------------------------------------------
 * NEURON ON® — OLIVE OIL + MORINGA
 * ---------------------------------------------------------------------------
 *
 * This is intentionally NOT part of the five-item therapy
 * recommendation array.
 */

/**
 * Calculates the Neuron ON® Olive Oil + Moringa recommendation.
 *
 * Formula:
 *
 * 0.15
 * × ABS(calculatedBmi / rawIfi)
 * × 20
 *
 * Result unit:
 * drops
 *
 * Important:
 *
 * - use full-precision rawIfi
 * - use workbook-calculated BMI
 * - do not use IFI Range here
 */
export function calculateNeuronOliveMoringaDrops(params: {
  rawIfi: number;
  calculatedBmi: number;
}): number {
  const { rawIfi, calculatedBmi } = params;

  assertFiniteNumber(rawIfi, "rawIfi");

  if (rawIfi === 0) {
    throw new Error(
      "rawIfi must not be 0 because the Neuron ON® formula divides by IFI.",
    );
  }

  assertFinitePositive(calculatedBmi, "calculatedBmi");

  const absoluteBmiIfiRatio = Math.abs(calculatedBmi / rawIfi);

  assertFinitePositive(absoluteBmiIfiRatio, "absoluteBmiIfiRatio");

  const recommendedDrops =
    NEURON_OLIVE_MORINGA_COEFFICIENT *
    absoluteBmiIfiRatio *
    NEURON_OLIVE_MORINGA_DROPS_MULTIPLIER;

  assertFinitePositive(recommendedDrops, "recommendedDrops");

  return recommendedDrops;
}

/**
 * Builds the separate Neuron ON® result.
 */
function buildNeuronOliveMoringaResult(
  recommendedDrops: number,
): NeuronOliveMoringaResult {
  assertFinitePositive(recommendedDrops, "recommendedDrops");

  return {
    id: "neuron-olive-oil-moringa",

    productName: "Neuron ON®",

    activeIngredients: "Olive oil and Moringa",

    category: "Nutritional Supplement",

    recommendedDrops,

    unit: "drops",
  };
}

/**
 * ---------------------------------------------------------------------------
 * COMPLETE CALCULATION
 * ---------------------------------------------------------------------------
 *
 * Produces:
 *
 * - IFI Range used by therapy recommendations
 * - 5 therapy recommendation rows
 * - separate Neuron ON® Olive Oil + Moringa result
 */
export function calculatePeptideDose(
  input: PeptideDoseInput,
): PeptideDoseCalculationResult {
  if (!input) {
    throw new Error("Therapy recommendation input is required.");
  }

  const { ifiRange, weightKg, rawIfi, calculatedBmi } = input;

  /**
   * ---------------------------------------------------------------
   * Defensive validation
   * ---------------------------------------------------------------
   *
   * validatePeptideDoseInput.ts should normally execute before this
   * function, but this calculation remains safe when called directly.
   */

  assertFiniteNumber(ifiRange, "ifiRange");

  if (!Number.isInteger(ifiRange)) {
    throw new Error("ifiRange must be an integer.");
  }

  if (ifiRange < 0 || ifiRange > MAX_IFI_RANGE) {
    throw new Error("ifiRange must be between 0 and 25.");
  }

  assertFinitePositive(weightKg, "weightKg");

  assertFiniteNumber(rawIfi, "rawIfi");

  if (rawIfi === 0) {
    throw new Error(
      "rawIfi must not be 0 because the Neuron ON® formula divides by IFI.",
    );
  }

  assertFinitePositive(calculatedBmi, "calculatedBmi");

  /**
   * ---------------------------------------------------------------
   * Five therapy recommendations
   * ---------------------------------------------------------------
   */

  const copaxoneDose = calculateCopaxoneDose(ifiRange);

  const wegovyDose = calculateWegovyDose(ifiRange);

  const lutatheraDose = calculateLutatheraDose(ifiRange);

  const saxendaDose = calculateSaxendaDose(ifiRange);

  const gattexDose = calculateGattexDose(ifiRange, weightKg);

  const recommendations: PeptideDoseCalculationResult["recommendations"] = [
    buildRecommendation({
      treatment: COPAXONE_DETAILS,
      recommendedDose: copaxoneDose,
      unit: "mg",
    }),

    buildRecommendation({
      treatment: WEGOVY_DETAILS,
      recommendedDose: wegovyDose,
      unit: "mg",
    }),

    buildRecommendation({
      treatment: LUTATHERA_DETAILS,
      recommendedDose: lutatheraDose,
      unit: "GBq",
    }),

    buildRecommendation({
      treatment: SAXENDA_DETAILS,
      recommendedDose: saxendaDose,
      unit: "mg",
    }),

    buildRecommendation({
      treatment: GATTEX_DETAILS,
      recommendedDose: gattexDose,
      unit: "mg",
    }),
  ];

  /**
   * ---------------------------------------------------------------
   * Separate Neuron ON® recommendation
   * ---------------------------------------------------------------
   *
   * This does not use IFI Range.
   */
  const neuronRecommendedDrops = calculateNeuronOliveMoringaDrops({
    rawIfi,
    calculatedBmi,
  });

  const neuronOliveMoringa = buildNeuronOliveMoringaResult(
    neuronRecommendedDrops,
  );

  return {
    /**
     * IFI Range used by the five therapy recommendations.
     *
     * The report can display this once above/beside the therapy table.
     */
    ifiRange,

    /**
     * Exactly five therapy rows.
     */
    recommendations,

    /**
     * Separate nutritional supplement result.
     */
    neuronOliveMoringa,

    formulaVersion: PEPTIDE_DOSE_FORMULA_VERSION,

    calculatedAt: new Date().toISOString(),
  };
}
