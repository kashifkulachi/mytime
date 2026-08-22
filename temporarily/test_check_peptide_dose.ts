import { calculateIFI } from "@/lib/calculations/IFI/calculateIFI";
import { validateFormulaInput } from "@/lib/calculations/IFI/validateFormulaInput";
import {
  calculatePeptideDose,
  validatePeptideDoseInput,
} from "@/lib/calculations/Pepdie-dose";
import { preparePeptideDoseInput } from "@/lib/calculations/Pepdie-dose/preparePeptideDoseInput";
import type {
  IFICalculationResult,
  IFIFormulaInput,
} from "@/types/calculations/ifi-calculation";

/**
 * P-011
 *
 * DOB: 1966-03-25
 * Evaluation: 2026-07-10
 * Height: 156 cm
 * Weight: 88.45 kg
 * BMI (full precision): 36.34533201840894
 * Raw IFI: -0.08717983451007338
 */
// const p011IfiResult = {
//   rawIfi: -1,

//   breakdown: {
//     calculatedBmi: 28,
//   },
// } as IFICalculationResult;

// const peptideDoseResults = calculateAllPeptideDoses(p011IfiResult);

// console.log("Reference Model 1 (1 mg)", peptideDoseResults.oneMg);

// console.log("Reference Model 2 (2.5 mg)", peptideDoseResults.twoPointFiveMg);

const testInput: IFIFormulaInput = {
  evaluationDate: "2026-08-18",
  // dateOfBirth: "1978-08-06",
  dateOfBirth: "1991-02-21",
  age: 50.7,
  sex: "male",
  heightCm: 178,
  weightKg: 86,
  bmi: 27.14,
  spo2: 92,
  heartRate: 108,
  rmsAmplitude: 0.05,
  meanFrequency: 112,
  meanIntensity: 55,
};

validateFormulaInput(testInput);

const IFI = calculateIFI(testInput);

validatePeptideDoseInput({
  ifiRange: IFI.ifiRange,
  weightKg: testInput.weightKg,
  calculatedBmi: IFI.breakdown.calculatedBmi,
  rawIfi: IFI.rawIfi,
});
const peptide_Dosage = calculatePeptideDose({
  ifiRange: IFI.ifiRange,
  weightKg: testInput.weightKg,
  calculatedBmi: IFI.breakdown.calculatedBmi,
  rawIfi: IFI.rawIfi,
});

console.log(
  "P001 Peptide Dose 5 Recommendations and Moringa: ",
  peptide_Dosage,
);
