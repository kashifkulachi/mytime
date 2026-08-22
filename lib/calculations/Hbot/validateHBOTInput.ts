import type { HBOTCalculationInput } from "@/types/calculations/htbot-calculations";

/**
 * Validates formula-ready input for the Workbook 04 HBOT
 * session calculations.
 *
 * Current workbook formulas depend on:
 *
 * ABS(rawIfi / calculatedBmi)
 *
 * Therefore:
 *
 * - rawIfi must be finite
 * - calculatedBmi must be finite
 * - calculatedBmi must be greater than 0
 */
export function validateHBOTInput(input: HBOTCalculationInput): void {
  if (!input) {
    throw new Error("HBOT calculation input is required.");
  }

  const { rawIfi, calculatedBmi } = input;

  /**
   * ---------------------------------------------------------------
   * Full-precision IFI
   * ---------------------------------------------------------------
   *
   * Positive, negative, and zero IFI values are mathematically valid
   * for the current HBOT formulas because the workbook applies ABS()
   * after dividing IFI by BMI.
   */
  if (!Number.isFinite(rawIfi)) {
    throw new Error("rawIfi must be a finite number.");
  }

  /**
   * ---------------------------------------------------------------
   * Workbook-calculated BMI
   * ---------------------------------------------------------------
   *
   * BMI is used as the denominator:
   *
   * ABS(rawIfi / calculatedBmi)
   *
   * Therefore BMI must be strictly greater than 0.
   */
  if (!Number.isFinite(calculatedBmi)) {
    throw new Error("calculatedBmi must be a finite number.");
  }

  if (calculatedBmi <= 0) {
    throw new Error("calculatedBmi must be greater than 0.");
  }

  /**
   * Validate the shared mathematical base used by all three
   * HBOT protocol formulas.
   */
  const absoluteIfiBmiRatio = Math.abs(rawIfi / calculatedBmi);

  if (!Number.isFinite(absoluteIfiBmiRatio)) {
    throw new Error(
      "ABS(rawIfi / calculatedBmi) must produce a finite number.",
    );
  }

  if (absoluteIfiBmiRatio < 0) {
    throw new Error("ABS(rawIfi / calculatedBmi) must not be negative.");
  }
}
