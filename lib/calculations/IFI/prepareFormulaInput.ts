import type { Assessment } from "@/types/assessments";
import type { IFIFormulaInput } from "@/types/calculations/ifi-calculation";

/**
 * Converts the nested Assessment Context data into one flat object
 * that can be passed directly to the IFI calculation functions.
 *
 * This function does not perform the actual IFI calculation.
 */
export function prepareFormulaInput(assessment: Assessment): IFIFormulaInput {
  const { patient, voice, oximeter } = assessment;

  if (!patient) {
    throw new Error("Patient information is required before calculating IFI.");
  }

  if (!voice) {
    throw new Error(
      "Voice analysis results are required before calculating IFI.",
    );
  }

  if (!oximeter) {
    throw new Error(
      "Oximeter measurements are required before calculating IFI.",
    );
  }

  function getLocalDateString(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return {
    // evaluationDate: new Date().toISOString().slice(0, 10),
    evaluationDate: getLocalDateString(),
    /*
     * Patient information
     */
    dateOfBirth: patient.dateOfBirth,
    age: patient.age,
    sex: patient.sex,
    heightCm: patient.heightCm,
    weightKg: patient.weightKg,
    bmi: patient.bmi,

    /*
     * Praat voice measurements
     */

    rmsAmplitude: voice.metrics.amplitude,
    meanFrequency: voice.metrics.frequency,
    meanIntensity: voice.metrics.intensity,

    /*
     * Oximeter measurements
     */
    spo2: oximeter.spo2,
    heartRate: oximeter.heartRate,
  };
}
