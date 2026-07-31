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

  amplitude: 12.489613279076472,
  frequency: 230,
  intensity: 68,
};

validateFormulaInput(testInput);

const testResult = calculateIFI(testInput);

console.log("IFI test result:", testResult);
