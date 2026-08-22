// import type { PeptideDoseInput } from "@/types/calculations/peptide-dose-calculation";

// /**
//  * Validates formula-ready input for the current Workbook 04
//  * therapy recommendation calculations.
//  *
//  * Current inputs:
//  *
//  * - ifiRange
//  * - weightKg
//  *
//  * Workbook domain:
//  *
//  * IFI Range:
//  *   integer from 0 through 25
//  *
//  * Weight:
//  *   finite number greater than 0
//  */
// export function validatePeptideDoseInput(input: PeptideDoseInput): void {
//   if (!input) {
//     throw new Error("Therapy recommendation input is required.");
//   }

//   const { ifiRange, weightKg } = input;

//   /**
//    * ---------------------------------------------------------------
//    * IFI Range
//    * ---------------------------------------------------------------
//    *
//    * Workbook 04 uses IFI Range as the primary driver for the
//    * therapy recommendation formulas.
//    *
//    * It must match the domain produced by calculateIFI():
//    *
//    * 0–25
//    */
//   if (!Number.isFinite(ifiRange)) {
//     throw new Error("ifiRange must be a finite number.");
//   }

//   if (!Number.isInteger(ifiRange)) {
//     throw new Error("ifiRange must be an integer.");
//   }

//   if (ifiRange < 0 || ifiRange > 25) {
//     throw new Error("ifiRange must be between 0 and 25.");
//   }

//   /**
//    * ---------------------------------------------------------------
//    * Patient weight
//    * ---------------------------------------------------------------
//    *
//    * Gattex® uses patient body weight as part of its current
//    * Workbook 04 recommendation formula.
//    */
//   if (!Number.isFinite(weightKg)) {
//     throw new Error("weightKg must be a finite number.");
//   }

//   if (weightKg <= 0) {
//     throw new Error("weightKg must be greater than 0.");
//   }
// }

import type { PeptideDoseInput } from "@/types/calculations/peptide-dose-calculation";

/**
 * Validates formula-ready input for:
 *
 * 1. The five Workbook 04 therapy recommendations
 * 2. The separate Neuron ON® Olive Oil + Moringa recommendation
 *
 * Current required inputs:
 *
 * - ifiRange
 * - weightKg
 * - rawIfi
 * - calculatedBmi
 */
export function validatePeptideDoseInput(input: PeptideDoseInput): void {
  if (!input) {
    throw new Error("Therapy recommendation input is required.");
  }

  const { ifiRange, weightKg, rawIfi, calculatedBmi } = input;

  /**
   * ---------------------------------------------------------------
   * IFI Range
   * ---------------------------------------------------------------
   *
   * Used by the five Workbook 04 therapy recommendation formulas.
   *
   * Expected domain:
   *
   * 0–25
   */
  if (!Number.isFinite(ifiRange)) {
    throw new Error("ifiRange must be a finite number.");
  }

  if (!Number.isInteger(ifiRange)) {
    throw new Error("ifiRange must be an integer.");
  }

  if (ifiRange < 0 || ifiRange > 25) {
    throw new Error("ifiRange must be between 0 and 25.");
  }

  /**
   * ---------------------------------------------------------------
   * Patient weight
   * ---------------------------------------------------------------
   *
   * Required by Gattex®.
   */
  if (!Number.isFinite(weightKg)) {
    throw new Error("weightKg must be a finite number.");
  }

  if (weightKg <= 0) {
    throw new Error("weightKg must be greater than 0.");
  }

  /**
   * ---------------------------------------------------------------
   * Full-precision IFI
   * ---------------------------------------------------------------
   *
   * Required by the separate Neuron ON® formula:
   *
   * 0.15 × ABS(calculatedBmi / rawIfi) × 20
   *
   * rawIfi may be positive or negative because ABS() is used.
   *
   * It must not be 0 because it is the denominator.
   */
  if (!Number.isFinite(rawIfi)) {
    throw new Error("rawIfi must be a finite number.");
  }

  if (rawIfi === 0) {
    throw new Error(
      "rawIfi must not be 0 because the Neuron ON® formula divides by IFI.",
    );
  }

  /**
   * ---------------------------------------------------------------
   * Workbook-calculated BMI
   * ---------------------------------------------------------------
   *
   * Required by Neuron ON®.
   *
   * Use IFI.breakdown.calculatedBmi rather than the
   * PatientInfo submitted BMI.
   */
  if (!Number.isFinite(calculatedBmi)) {
    throw new Error("calculatedBmi must be a finite number.");
  }

  if (calculatedBmi <= 0) {
    throw new Error("calculatedBmi must be greater than 0.");
  }

  /**
   * ---------------------------------------------------------------
   * Neuron ON® shared ratio check
   * ---------------------------------------------------------------
   *
   * Formula foundation:
   *
   * ABS(calculatedBmi / rawIfi)
   */
  const absoluteBmiIfiRatio = Math.abs(calculatedBmi / rawIfi);

  if (!Number.isFinite(absoluteBmiIfiRatio)) {
    throw new Error(
      "ABS(calculatedBmi / rawIfi) must produce a finite number.",
    );
  }

  if (absoluteBmiIfiRatio <= 0) {
    throw new Error("ABS(calculatedBmi / rawIfi) must be greater than 0.");
  }
}
