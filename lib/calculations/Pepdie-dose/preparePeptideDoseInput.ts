import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
import type { PeptideDoseInput } from "@/types/calculations/peptide-dose-calculation";

/**
 * Minimal patient data required by the current Workbook 04
 * therapy recommendation formulas.
 */
interface PreparePeptideDosePatientInput {
  /**
   * Patient weight in kilograms.
   *
   * Required by the Gattex® recommendation formula.
   */
  weightKg: number;
}

/**
 * Prepares all formula-ready inputs required by:
 *
 * 1. The five Workbook 04 therapy recommendations
 * 2. The separate Neuron ON® Olive Oil + Moringa calculation
 *
 * Current dependencies:
 *
 * Therapy recommendations:
 * - IFI Range
 * - patient weight
 *
 * Neuron ON®:
 * - full-precision raw IFI
 * - workbook-calculated BMI
 */
export function preparePeptideDoseInput(params: {
  ifiResult: IFICalculationResult;
  patient: PreparePeptideDosePatientInput;
}): PeptideDoseInput {
  const { ifiResult, patient } = params;

  if (!ifiResult) {
    throw new Error(
      "IFI calculation result is required to prepare therapy recommendation input.",
    );
  }

  if (!patient) {
    throw new Error(
      "Patient information is required to prepare therapy recommendation input.",
    );
  }

  /**
   * ---------------------------------------------------------------
   * Workbook 04 therapy recommendation inputs
   * ---------------------------------------------------------------
   */

  const ifiRange = ifiResult.ifiRange;
  const weightKg = patient.weightKg;

  /**
   * ---------------------------------------------------------------
   * Neuron ON® Olive Oil + Moringa inputs
   * ---------------------------------------------------------------
   *
   * Formula:
   *
   * 0.15 × ABS(calculatedBmi / rawIfi) × 20
   */
  const rawIfi = ifiResult.rawIfi;

  const calculatedBmi = ifiResult.breakdown?.calculatedBmi;

  /**
   * ---------------------------------------------------------------
   * Structural checks
   * ---------------------------------------------------------------
   *
   * Keep this function focused on mapping/extracting values.
   *
   * Mathematical and domain validation belongs in:
   *
   * validatePeptideDoseInput.ts
   */

  if (typeof ifiRange !== "number") {
    throw new Error(
      "IFI result is missing ifiRange required for therapy recommendations.",
    );
  }

  if (typeof weightKg !== "number") {
    throw new Error(
      "Patient information is missing weightKg required for therapy recommendations.",
    );
  }

  if (typeof rawIfi !== "number") {
    throw new Error(
      "IFI result is missing rawIfi required for the Neuron ON® recommendation.",
    );
  }

  if (typeof calculatedBmi !== "number") {
    throw new Error(
      "IFI result is missing breakdown.calculatedBmi required for the Neuron ON® recommendation.",
    );
  }

  return {
    ifiRange,
    weightKg,
    rawIfi,
    calculatedBmi,
  };
}
