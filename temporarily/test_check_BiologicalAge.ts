import {
  calculateBiologicalAge,
  validateBiologicalAgeInput,
} from "@/lib/calculations/Biological-age";
import { BiologicalAgeFormulaInput } from "@/types/calculations/biological-age-calculation";

// const p011BiologicalAgeInput: BiologicalAgeFormulaInput = {
//   dateOfBirth: "1966-03-25",
//   evaluationDate: "2026-07-10",
//   rawIfi: -3,
// };

// validateBiologicalAgeInput(p011BiologicalAgeInput);

// const p011BiologicalAge = calculateBiologicalAge(p011BiologicalAgeInput);

// console.log("P-011 Biological Age:", p011BiologicalAge);

const p01BiologicalAgeInput: BiologicalAgeFormulaInput = {
  dateOfBirth: "1978-11-07",
  evaluationDate: "2026-08-05",
  rawIfi: -1.5,
};

validateBiologicalAgeInput(p01BiologicalAgeInput);

const p01BiologicalAge = calculateBiologicalAge(p01BiologicalAgeInput);

console.log("P-011 Biological Age:", p01BiologicalAge);

const p03BiologicalAgeInput: BiologicalAgeFormulaInput = {
  dateOfBirth: "1978-11-07",
  evaluationDate: "2026-08-05",
  rawIfi: 1,
};

validateBiologicalAgeInput(p03BiologicalAgeInput);

const p03BiologicalAge = calculateBiologicalAge(p03BiologicalAgeInput);

console.log("P-011 Biological Age:", p03BiologicalAge);
