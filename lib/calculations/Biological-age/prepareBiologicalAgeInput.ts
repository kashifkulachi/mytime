import type { Assessment } from "@/types/assessments";
import type { BiologicalAgeFormulaInput } from "@/types/calculations/biological-age-calculation";
import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";

interface PrepareBiologicalAgeInputParams {
  assessment: Assessment;
  ifiResult: IFICalculationResult;
}

/**
 * Creates the flat input required by the Biological Age formula.
 *
 * This function does not perform validation or calculations.
 * It only maps values from the completed assessment and IFI result.
 */
export function prepareBiologicalAgeInput({
  assessment,
  ifiResult,
}: PrepareBiologicalAgeInputParams): BiologicalAgeFormulaInput {
  const { patient } = assessment;

  if (!patient) {
    throw new Error(
      "Patient information is required before preparing Biological Age input.",
    );
  }

  return {
    dateOfBirth: patient.dateOfBirth,

    /**
     * Reuse the exact evaluation date used by IFI.
     *
     * This ensures IFI and Biological Age calculate the patient's age
     * from the same assessment date.
     */
    evaluationDate: ifiResult.evaluationDate,

    /**
     * Use the full-precision IFI result.
     *
     * Do not use ifiResult.ifi because that value is rounded for display.
     */
    rawIfi: ifiResult.rawIfi,
  };
}
