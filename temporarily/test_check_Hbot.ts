import {
  calculateHBOT,
  prepareHBOTInput,
  validateHBOTInput,
} from "@/lib/calculations/Hbot";
import { calculateIFI } from "@/lib/calculations/IFI/calculateIFI";
import { validateFormulaInput } from "@/lib/calculations/IFI/validateFormulaInput";
import { IFIFormulaInput } from "@/types/calculations/ifi-calculation";

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

const hbotInput = prepareHBOTInput(IFI);

validateHBOTInput(hbotInput);

const HBOT = calculateHBOT(hbotInput);

console.log("P001 HBOT: ", HBOT);
