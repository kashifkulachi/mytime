import type { Assessment } from "@/types/assessments";
import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
import type { InflammationIndexFormulaInput } from "@/types/calculations/inflammation-index-calculation";

interface PrepareInflammationIndexInputParams {
  assessment: Assessment;
  ifiResult: IFICalculationResult;
}

/**
 * Creates the flat input required by the Functional Inflammation Index.
 *
 * This function does not validate values and does not perform calculations.
 * It only maps the required data from the completed assessment and IFI result.
 */
export function prepareInflammationIndexInput({
  assessment,
  ifiResult,
}: PrepareInflammationIndexInputParams): InflammationIndexFormulaInput {
  const { patient, oximeter } = assessment;

  if (!patient) {
    throw new Error(
      "Patient information is required before preparing the Inflammation Index input.",
    );
  }

  if (!oximeter) {
    throw new Error(
      "Oximeter measurements are required before preparing the Inflammation Index input.",
    );
  }

  if (oximeter.spo2 === null || oximeter.heartRate === null) {
    throw new Error(
      "Complete SpO₂ and heart-rate measurements are required before preparing the Inflammation Index input.",
    );
  }

  return {
    /**
     * Always use the full-precision IFI value.
     *
     * Do not use the rounded display IFI because that would alter the
     * inflammation calculation.
     */
    rawIfi: ifiResult.rawIfi,

    /**
     * Use the same full-precision BMI that was used by the IFI calculation.
     *
     * This avoids using a rounded BMI from the patient form.
     */
    bmi: ifiResult.breakdown.calculatedBmi,

    sex: patient.sex,

    heartRate: oximeter.heartRate,
    spo2: oximeter.spo2,
  };
}
