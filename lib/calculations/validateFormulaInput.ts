import type { IFIFormulaInput } from "@/types/assessment-calculation";

/**
 * Checks whether a value is a valid, finite number.
 *
 * This rejects:
 * - NaN
 * - Infinity
 * - -Infinity
 */
function isValidNumber(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Throws a readable error when a required numeric value is invalid.
 */
function validateRequiredNumber(value: number, fieldName: string): void {
  if (!isValidNumber(value)) {
    throw new Error(
      `${fieldName} must be a valid number before calculating IFI.`,
    );
  }
}

/**
 * Validates the complete flat formula input before any doctor's
 * formula is executed.
 *
 * This function does not calculate or modify any values.
 * It only prevents missing or invalid data from reaching the formula.
 */
export function validateFormulaInput(input: IFIFormulaInput): void {
  /*
   * Patient validation
   */
  if (!input.dateOfBirth.trim()) {
    throw new Error("Date of birth is required before calculating IFI.");
  }

  if (input.sex !== "male" && input.sex !== "female") {
    throw new Error("Patient sex must be either male or female.");
  }

  validateRequiredNumber(input.age, "Age");
  validateRequiredNumber(input.heightCm, "Height");
  validateRequiredNumber(input.weightKg, "Weight");
  validateRequiredNumber(input.bmi, "BMI");

  if (input.age <= 0) {
    throw new Error("Age must be greater than zero.");
  }

  if (input.heightCm <= 0) {
    throw new Error("Height must be greater than zero.");
  }

  if (input.weightKg <= 0) {
    throw new Error("Weight must be greater than zero.");
  }

  if (input.bmi <= 0) {
    throw new Error("BMI must be greater than zero.");
  }

  /*
   * Voice metric validation
   */
  validateRequiredNumber(input.rmsAmplitude, "Voice RMS amplitude");

  validateRequiredNumber(input.meanFrequency, "Voice mean frequency");

  validateRequiredNumber(input.meanIntensity, "Voice mean intensity");
  if (input.rmsAmplitude <= 0) {
    throw new Error("Voice RMS amplitude must be greater than zero.");
  }

  if (input.meanFrequency <= 0) {
    throw new Error("Voice mean frequency must be greater than zero.");
  }

  if (input.meanIntensity <= 0) {
    throw new Error("Voice mean intensity must be greater than zero.");
  }

  /*
   * Oximeter validation
   */
  validateRequiredNumber(input.spo2, "SpO₂");
  validateRequiredNumber(input.heartRate, "Heart rate");

  if (input.spo2 < 0 || input.spo2 > 100) {
    throw new Error("SpO₂ must be between 0 and 100.");
  }

  if (input.heartRate <= 0) {
    throw new Error("Heart rate must be greater than zero.");
  }
}
