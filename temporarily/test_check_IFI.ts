import { calculateIFI } from "@/lib/calculations/calculateIFI";
import { validateFormulaInput } from "@/lib/calculations/validateFormulaInput";
import type { IFIFormulaInput } from "@/types/assessment-calculation";

const testInput: IFIFormulaInput = {
  evaluationDate: "2026-07-10",
  dateOfBirth: "2014-03-15",
  age: 12,
  sex: "female",
  heightCm: 148,
  weightKg: 42,
  bmi: 42 / 1.48 ** 2,

  spo2: 98,
  heartRate: 78,

  rmsAmplitude: 12.489613279076472,
  meanFrequency: 230,
  meanIntensity: 68,
};

validateFormulaInput(testInput);

const testResult = calculateIFI(testInput);

console.log("IFI test result:", testResult);

const testInput3: IFIFormulaInput = {
  evaluationDate: "2026-07-10",
  dateOfBirth: "1962-06-20",
  age: 64.1,
  sex: "female",
  heightCm: 160,
  weightKg: 74,
  bmi: 28.91,
  spo2: 95,
  heartRate: 84,
  rmsAmplitude: 107.84,
  meanFrequency: 195,
  meanIntensity: 71,
};

validateFormulaInput(testInput3);

const testResult_3 = calculateIFI(testInput3);

console.log("IFI test result 3:", testResult_3);
