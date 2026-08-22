import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";
import type { HBOTCalculationInput } from "@/types/calculations/htbot-calculations";

/**
 * Prepares the minimal formula-ready input required by the
 * Workbook 04 HBOT session calculations.
 *
 * Current HBOT formulas depend on:
 *
 * ABS(rawIfi / calculatedBmi)
 *
 * Therefore this mapper extracts:
 *
 * - full-precision raw IFI
 * - workbook-calculated BMI
 *
 * Do NOT use:
 *
 * - display-rounded `ifi`
 * - `ifiRange`
 * - submitted PatientInfo BMI
 */
export function prepareHBOTInput(
  ifiResult: IFICalculationResult,
): HBOTCalculationInput {
  if (!ifiResult) {
    throw new Error(
      "IFI calculation result is required to prepare HBOT input.",
    );
  }

  const rawIfi = ifiResult.rawIfi;
  const calculatedBmi = ifiResult.breakdown?.calculatedBmi;

  /**
   * Keep this function focused on extracting and mapping data.
   *
   * Full mathematical/domain validation belongs in:
   *
   * validateHBOTInput.ts
   *
   * These checks only protect against structurally missing values.
   */
  if (typeof rawIfi !== "number") {
    throw new Error(
      "IFI result is missing the full-precision rawIfi value required for HBOT calculation.",
    );
  }

  if (typeof calculatedBmi !== "number") {
    throw new Error(
      "IFI result is missing breakdown.calculatedBmi required for HBOT calculation.",
    );
  }

  return {
    rawIfi,
    calculatedBmi,
  };
}
