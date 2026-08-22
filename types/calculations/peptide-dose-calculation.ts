// /**
//  * Formula-ready input for the current VitaVoice/MyTIME
//  * therapy recommendation module.
//  *
//  * Although the module retains the historical "peptide-dose" filename
//  * for application compatibility, Workbook 04 now contains multiple
//  * therapy types rather than peptide-only recommendations.
//  */
// export interface PeptideDoseInput {
//   /**
//    * IFI Range produced by the IFI calculation.
//    *
//    * Workbook domain:
//    * 0–25
//    *
//    * This is now the primary input used by the therapy recommendation
//    * formulas.
//    */
//   ifiRange: number;

//   /**
//    * Patient weight in kilograms.
//    *
//    * Currently required by Gattex®, whose workbook recommendation uses:
//    *
//    * 0.05 mg/kg × patient weight
//    *
//    * scaled according to IFI Range.
//    */
//   weightKg: number;
// }

// /**
//  * Clinical groups represented in Workbook 04.
//  */
// export type TherapyGroup =
//   | "Neurological"
//   | "Cardiovascular"
//   | "Oncological"
//   | "Endocrine-Metabolic"
//   | "Gut-Brain Axis";

// /**
//  * FDA-approved therapies represented in Workbook 04.
//  */
// export type TherapyName =
//   | "Copaxone®"
//   | "Wegovy®"
//   | "Lutathera®"
//   | "Saxenda®"
//   | "Gattex®";

// /**
//  * Active ingredient / therapy-type descriptions exactly corresponding
//  * to the current workbook rows.
//  */
// export type TherapyActiveIngredient =
//   | "Glatiramer acetate / synthetic polypeptide"
//   | "Semaglutide / GLP-1 receptor agonist"
//   | "Lutetium Lu 177 dotatate / radiolabeled somatostatin analog"
//   | "Liraglutide / GLP-1 receptor agonist"
//   | "Teduglutide / GLP-2 analog";

// /**
//  * Units returned by Workbook 04 recommendation formulas.
//  *
//  * Most current therapies use milligrams.
//  *
//  * Lutathera® is expressed in gigabecquerels rather than milligrams.
//  */
// export type TherapyDoseUnit = "mg" | "GBq";

// /**
//  * Stable application identifiers.
//  *
//  * These should be used as React keys, database identifiers,
//  * condition checks, etc., rather than comparing display labels.
//  */
// export type TherapyRecommendationId =
//   | "copaxone"
//   | "wegovy"
//   | "lutathera"
//   | "saxenda"
//   | "gattex";

// /**
//  * Static clinical/reference information for one therapy.
//  *
//  * These fields come directly from the Workbook 04 therapy table and
//  * are intentionally returned with the calculation result so the final
//  * medical-report component does not need to hardcode therapy content.
//  */
// export interface TherapyDetails {
//   /**
//    * Stable machine-readable identifier.
//    */
//   id: TherapyRecommendationId;

//   /**
//    * VitaVoice clinical group.
//    */
//   group: TherapyGroup;

//   /**
//    * FDA-approved therapy / product name.
//    */
//   therapy: TherapyName;

//   /**
//    * Active ingredient or therapy type.
//    */
//   activeIngredient: TherapyActiveIngredient;

//   /**
//    * Relevant FDA-labeled indication shown in Workbook 04.
//    */
//   indication: string;

//   /**
//    * FDA-labeled dose or regimen.
//    *
//    * Examples:
//    *
//    * "20 mg SC once daily OR 40 mg SC three times weekly"
//    *
//    * "Dose escalation beginning at 0.25 mg once weekly"
//    */
//   labeledDoseRegimen: string;

//   /**
//    * Maximum, maintenance, or treatment-course guidance shown
//    * in the workbook.
//    *
//    * This is deliberately a string because these therapies do not all
//    * have a simple numeric maximum dose.
//    */
//   maximumOrMaintenance: string;
// }

// /**
//  * Complete recommendation for one therapy.
//  *
//  * Only therapy-specific information is returned here.
//  *
//  * IFI Range is returned once at PeptideDoseCalculationResult level,
//  * because all five recommendations use the same patient's IFI Range.
//  */
// export interface TherapyRecommendation {
//   /**
//    * Therapy/reference information required by the final report.
//    */
//   treatment: TherapyDetails;

//   /**
//    * Numeric recommendation calculated from the current
//    * Workbook 04 formula.
//    *
//    * Keep full precision here.
//    *
//    * Formatting/rounding belongs in the final report component.
//    */
//   recommendedDose: number;

//   /**
//    * Unit associated with recommendedDose.
//    */
//   unit: TherapyDoseUnit;
// }

// export interface NeuronOliveMoringaResult {
//   productName: "Neuron ON®";

//   activeIngredients: "Olive oil and Moringa";

//   category: "Nutritional Supplement";

//   recommendedDrops: number;

//   unit: "drops";
// }
// /**
//  * Complete result returned by the current Workbook 04
//  * therapy recommendation calculation.
//  *
//  * The historical PeptideDoseCalculationResult name is retained to avoid
//  * unnecessarily breaking the existing assessment architecture.
//  */
// export interface PeptideDoseCalculationResult {
//   /**
//    * IFI Range actually used when generating these recommendations.
//    *
//    * Include this in the final medical report so the clinician can
//    * immediately see which IFI Range produced the displayed values.
//    */
//   ifiRange: number;

//   /**
//    * Ordered report-ready therapy rows.
//    *
//    * The order intentionally matches Workbook 04:
//    *
//    * 1. Neurological       — Copaxone®
//    * 2. Cardiovascular     — Wegovy®
//    * 3. Oncological        — Lutathera®
//    * 4. Endocrine-Metabolic— Saxenda®
//    * 5. Gut-Brain Axis     — Gattex®
//    */
//   recommendations: [
//     TherapyRecommendation,
//     TherapyRecommendation,
//     TherapyRecommendation,
//     TherapyRecommendation,
//     TherapyRecommendation,
//   ];

//   /**
//    * Version of the implemented Workbook 04 recommendation formulas.
//    */
//   formulaVersion: string;

//   neuronOliveMoringa: NeuronOliveMoringaResult;

//   /**
//    * ISO timestamp indicating when the application performed
//    * the calculation.
//    */
//   calculatedAt: string;
// }

/**
 * Formula-ready input for the current VitaVoice/MyTIME
 * therapy recommendation module.
 *
 * Workbook 04 therapy recommendations currently depend on:
 *
 * - IFI Range
 * - Patient weight in kilograms
 *
 * Neuron ON® will remain a separate nutritional-supplement result
 * rather than being included in the therapy recommendations array.
 */
export interface PeptideDoseInput {
  /**
   * IFI Range used by the five Workbook 04 therapy recommendations.
   */
  ifiRange: number;

  /**
   * Patient weight in kilograms.
   *
   * Required by Gattex®.
   */
  weightKg: number;

  /**
   * Full-precision IFI.
   *
   * Required by the separate Neuron ON®
   * Olive Oil + Moringa formula.
   *
   * Do not use rounded `ifi`.
   */
  rawIfi: number;

  /**
   * BMI recalculated by the IFI workbook calculation.
   *
   * Required by the separate Neuron ON®
   * Olive Oil + Moringa formula.
   */
  calculatedBmi: number;
}

/**
 * Clinical groups represented by the five Workbook 04
 * therapy recommendations.
 */
export type TherapyGroup =
  | "Neurological"
  | "Cardiovascular"
  | "Oncological"
  | "Endocrine-Metabolic"
  | "Gut-Brain Axis";

/**
 * FDA-approved therapies represented by the current
 * Workbook 04 recommendation table.
 */
export type TherapyName =
  | "Copaxone®"
  | "Wegovy®"
  | "Lutathera®"
  | "Saxenda®"
  | "Gattex®";

/**
 * Active ingredient / treatment descriptions corresponding
 * to the current therapy rows.
 */
export type TherapyActiveIngredient =
  | "Glatiramer acetate / synthetic polypeptide"
  | "Semaglutide / GLP-1 receptor agonist"
  | "Lutetium Lu 177 dotatate / radiolabeled somatostatin analog"
  | "Liraglutide / GLP-1 receptor agonist"
  | "Teduglutide / GLP-2 analog";

/**
 * Units returned by the five therapy formulas.
 *
 * Lutathera® is expressed in GBq.
 * The remaining current therapies are expressed in mg.
 */
export type TherapyDoseUnit = "mg" | "GBq";

/**
 * Stable machine-readable identifiers for the five
 * therapy recommendations.
 */
export type TherapyRecommendationId =
  | "copaxone"
  | "wegovy"
  | "lutathera"
  | "saxenda"
  | "gattex";

/**
 * Static clinical/reference information associated with
 * one therapy recommendation.
 *
 * These fields are returned with the calculated recommendation so
 * the final medical report can render the table without hardcoding
 * therapy descriptions inside the React/PDF component.
 */
export interface TherapyDetails {
  /**
   * Stable application identifier.
   */
  id: TherapyRecommendationId;

  /**
   * VitaVoice clinical classification group.
   */
  group: TherapyGroup;

  /**
   * Therapy/product name.
   */
  therapy: TherapyName;

  /**
   * Active ingredient or therapy type.
   */
  activeIngredient: TherapyActiveIngredient;

  /**
   * Relevant indication described by the workbook.
   */
  indication: string;

  /**
   * Labeled starting/treatment regimen shown in the workbook.
   *
   * Kept as text because the five therapies have substantially
   * different dosing structures.
   */
  labeledDoseRegimen: string;

  /**
   * Maximum, maintenance, or treatment-course guidance.
   *
   * Kept separate from the calculated recommendation.
   */
  maximumOrMaintenance: string;
}

/**
 * Complete calculated recommendation for one therapy.
 */
export interface TherapyRecommendation {
  /**
   * Static therapy information required by the report.
   */
  treatment: TherapyDetails;

  /**
   * Formula-calculated recommendation.
   *
   * Keep full precision in the calculation layer.
   * Display rounding belongs in the report/UI layer.
   */
  recommendedDose: number;

  /**
   * Unit associated with recommendedDose.
   */
  unit: TherapyDoseUnit;
}

/**
 * Stable product identifier for the separate nutritional
 * supplement recommendation.
 */
export type NeuronSupplementId = "neuron-olive-oil-moringa";

/**
 * Product name returned for the nutritional supplement section.
 */
export type NeuronSupplementName = "Neuron ON®";

/**
 * Active ingredients associated with Neuron ON®.
 */
export type NeuronSupplementActiveIngredients = "Olive oil and Moringa";

/**
 * Neuron ON® recommendation unit.
 */
export type NeuronSupplementUnit = "drops";

/**
 * Separate Neuron ON® nutritional-supplement result.
 *
 * This intentionally does NOT extend TherapyRecommendation and is
 * not included in the `recommendations` array.
 *
 * The final report can therefore render:
 *
 * - Therapy Recommendations table
 * - Neuron ON® supplement section/card
 *
 * independently.
 */
export interface NeuronOliveMoringaResult {
  /**
   * Stable machine-readable identifier.
   */
  id: NeuronSupplementId;

  /**
   * Commercial/product name.
   */
  productName: NeuronSupplementName;

  /**
   * Main ingredients.
   */
  activeIngredients: NeuronSupplementActiveIngredients;

  /**
   * Product category shown in the report.
   */
  category: "Nutritional Supplement";

  /**
   * Formula-calculated number of drops.
   *
   * Keep full precision in the calculation layer.
   */
  recommendedDrops: number;

  /**
   * Unit associated with recommendedDrops.
   */
  unit: NeuronSupplementUnit;
}

/**
 * Complete result returned by the current therapy recommendation
 * calculation module.
 *
 * Historical naming is retained as `PeptideDoseCalculationResult`
 * to avoid unnecessary changes throughout the existing assessment
 * architecture.
 */
export interface PeptideDoseCalculationResult {
  /**
   * IFI Range used to generate the therapy recommendations.
   *
   * This is returned once at the top level so the final medical
   * report can display the clinical range alongside the table.
   */
  ifiRange: number;

  /**
   * Ordered five-row therapy recommendation table.
   *
   * Order intentionally follows Workbook 04:
   *
   * 1. Neurological        — Copaxone®
   * 2. Cardiovascular      — Wegovy®
   * 3. Oncological         — Lutathera®
   * 4. Endocrine-Metabolic — Saxenda®
   * 5. Gut-Brain Axis      — Gattex®
   *
   * Neuron ON® is deliberately NOT part of this array.
   */
  recommendations: [
    TherapyRecommendation,
    TherapyRecommendation,
    TherapyRecommendation,
    TherapyRecommendation,
    TherapyRecommendation,
  ];

  /**
   * Separate Olive Oil + Moringa nutritional-supplement result.
   */
  neuronOliveMoringa: NeuronOliveMoringaResult;

  /**
   * Version of the implemented recommendation formulas.
   */
  formulaVersion: string;

  /**
   * ISO timestamp indicating when the calculation was performed.
   */
  calculatedAt: string;
}
