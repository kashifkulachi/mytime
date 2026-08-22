import { calculateBiologicalAge } from "@/lib/calculations/Biological-age";
import { calculateIFI } from "@/lib/calculations/IFI/calculateIFI";
import { validateFormulaInput } from "@/lib/calculations/IFI/validateFormulaInput";
import {
  calculatePeptideDose,
  validatePeptideDoseInput,
} from "@/lib/calculations/Pepdie-dose";
import { preparePeptideDoseInput } from "@/lib/calculations/Pepdie-dose/preparePeptideDoseInput";
import type { IFIFormulaInput } from "@/types/calculations/ifi-calculation";

// const testInput: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "2014-03-15",
//   age: 12,
//   sex: "female",
//   heightCm: 148,
//   weightKg: 42,
//   bmi: 42 / 1.48 ** 2,

//   spo2: 98,
//   heartRate: 78,

//   rmsAmplitude: 12.489613279076472,
//   meanFrequency: 230,
//   meanIntensity: 68,
// };

// validateFormulaInput(testInput);

// const testResult = calculateIFI(testInput);

// console.log("IFI test result:", testResult);

// const testInput3: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "1962-06-20",
//   age: 64.1,
//   sex: "female",
//   heightCm: 160,
//   weightKg: 74,
//   bmi: 28.91,
//   spo2: 95,
//   heartRate: 84,
//   rmsAmplitude: 107.84,
//   meanFrequency: 195,
//   meanIntensity: 71,
// };

// validateFormulaInput(testInput3);

// const testResult_3 = calculateIFI(testInput3);

// console.log("IFI test result 3:", testResult_3);

// const testInput4: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "1966-03-25",
//   age: 60.3,
//   sex: "male",
//   heightCm: 156,
//   weightKg: 88.4505,
//   bmi: 36.46,
//   spo2: 98,
//   heartRate: 78,
//   rmsAmplitude: 900,
//   meanFrequency: 141.7,
//   meanIntensity: 72.77,
// };

// validateFormulaInput(testInput4);

// const testResult_4 = calculateIFI(testInput4);

// console.log("P002 Enrique: ", testResult_4);

// Old file P002
// const testInput_2: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "1948-11-02",
//   age: 77.7,
//   sex: "male",
//   heightCm: 170,
//   weightKg: 82,
//   bmi: 28.37370242,
//   spo2: 94,
//   heartRate: 88,
//   rmsAmplitude: 38.9773768788146,
//   meanFrequency: 115,
//   meanIntensity: 72,
// };

// validateFormulaInput(testInput_2);

// const testResult_Old_File = calculateIFI(testInput_2);

// console.log("P002 Old: ", testResult_Old_File);

// ///////////////////////////////////

// const testInput40: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "1980-01-05",
//   age: 60.3,
//   sex: "male",
//   heightCm: 176,
//   weightKg: 96,
//   bmi: 30.99,
//   spo2: 96,
//   heartRate: 82,
//   rmsAmplitude: 499.88,
//   meanFrequency: 125,
//   meanIntensity: 73,
// };

// validateFormulaInput(testInput40);

// const testResult_40 = calculateIFI(testInput40);

// console.log("P004: ", testResult_40);

// ///////////////////////////////////

// const testInput50: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "1992-09-12",
//   age: 33.38,
//   sex: "female",
//   heightCm: 166,
//   weightKg: 63,
//   bmi: 22.59,
//   spo2: 98,
//   heartRate: 72,
//   rmsAmplitude: 735,
//   meanFrequency: 210,
//   meanIntensity: 69,
// };

// validateFormulaInput(testInput50);

// const testResult_50 = calculateIFI(testInput50);

// console.log("P005: ", testResult_50);

// const p005Input: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "1992-09-12",

//   age: 33.82274718397998,
//   sex: "female",

//   heightCm: 167,
//   weightKg: 63,
//   bmi: 22.589551436050055,

//   spo2: 98,
//   heartRate: 72,

//   rmsAmplitude: 734.9962320676915,
//   meanFrequency: 210,
//   meanIntensity: 69,
// };

// validateFormulaInput(p005Input);

// const p005Result = calculateIFI(p005Input);

// console.log("P-005 IFI result:", p005Result);

////////////////////////////
// const testInput5: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "1998-12-08",
//   age: 27.6,
//   sex: "female",
//   heightCm: 172,
//   weightKg: 60,
//   bmi: 20.28,
//   spo2: 99,
//   heartRate: 58,
//   rmsAmplitude: 1024.9,
//   meanFrequency: 220,
//   meanIntensity: 68,
// };

// validateFormulaInput(testInput5);

// const testResult_5 = calculateIFI(testInput5);

// console.log("P007: ", testResult_5);

// const testInput6: IFIFormulaInput = {
//   evaluationDate: "2026-07-10",
//   dateOfBirth: "1975-10-30",
//   age: 50.7,
//   sex: "male",
//   heightCm: 180,
//   weightKg: 80,
//   bmi: 24.69,
//   spo2: 98,
//   heartRate: 60,
//   rmsAmplitude: 700.61,
//   meanFrequency: 128,
//   meanIntensity: 70,
// };

// validateFormulaInput(testInput6);

// const testResult_6 = calculateIFI(testInput6);

// console.log("P0010: ", testResult_6);

// CHecking the Category Classification Data
// const testInput6: IFIFormulaInput = {
//   evaluationDate: "2026-08-07",
//   dateOfBirth: "1978-08-06",
//   age: 50.7,
//   sex: "female",
//   heightCm: 178,
//   weightKg: 78,
//   bmi: 24.62,
//   spo2: 90,
//   heartRate: 77,
//   rmsAmplitude: 0.05,
//   meanFrequency: 230,
//   meanIntensity: 65,
// };

// validateFormulaInput(testInput6);

// const IFI = calculateIFI(testInput6);

// const biological = calculateBiologicalAge({
//   dateOfBirth: testInput6.dateOfBirth,
//   evaluationDate: testInput6.evaluationDate,
//   rawIfi: IFI.rawIfi,
// });

// console.log("P001 IFI: ", IFI);
// console.log("P001 Aging Coefficient: ", biological.agingCoefficientPercent);

// CHecking the Vita Vice data of 5 year old

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

console.log("P001 IFI: ", IFI);
const biological = calculateBiologicalAge({
  dateOfBirth: testInput.dateOfBirth,
  evaluationDate: testInput.evaluationDate,
  rawIfi: IFI.rawIfi,
});

console.log("P001 Biological: ", biological);
console.log("P001 Aging Coefficient %: ", biological.agingCoefficientPercent);
console.log("P001 Aging Coefficient: ", biological.agingCoefficient);
