import type { InflammationIndexFormulaInput } from "@/types/calculations/inflammation-index-calculation";

/**
 * Ensures a numeric value is finite.
 *
 * Rejects:
 * - NaN
 * - Infinity
 * - -Infinity
 */
function validateFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a valid finite number.`);
  }
}

/**
 * Validates the flat Functional Inflammation Index input before
 * the workbook formula is executed.
 *
 * This function does not modify values and does not perform calculations.
 */
export function validateInflammationIndexInput(
  input: InflammationIndexFormulaInput,
): void {
  /**
   * Raw IFI can be:
   * - negative
   * - zero
   * - positive
   *
   * Therefore, it must not be validated using a truthy check.
   */
  validateFiniteNumber(input.rawIfi, "Raw IFI");

  validateFiniteNumber(input.bmi, "BMI");

  validateFiniteNumber(input.heartRate, "Heart rate");

  validateFiniteNumber(input.spo2, "SpO₂");

  if (input.sex !== "male" && input.sex !== "female") {
    throw new Error("Patient sex must be either male or female.");
  }

  if (input.bmi <= 0) {
    throw new Error("BMI must be greater than zero.");
  }

  if (input.heartRate <= 0) {
    throw new Error("Heart rate must be greater than zero.");
  }

  if (input.spo2 <= 0 || input.spo2 > 100) {
    throw new Error("SpO₂ must be greater than zero and no more than 100.");
  }
}
