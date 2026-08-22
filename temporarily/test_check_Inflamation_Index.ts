import {
  calculateInflammationIndex,
  validateInflammationIndexInput,
} from "@/lib/calculations/Inflammation-Index";
import type { InflammationIndexFormulaInput } from "@/types/calculations/inflammation-index-calculation";

// const p011InflammationInput: InflammationIndexFormulaInput = {
//   /**
//    * Full-precision IFI result from calculateIFI().
//    */
//   rawIfi: -1.5,

//   /**
//    * Full-precision BMI calculated from:
//    * 88.45 / 1.56²
//    */
//   bmi: 30,

//   sex: "male",

//   heartRate: 90,
//   spo2: 95,
// };

// validateInflammationIndexInput(p011InflammationInput);

// const p011InflammationResult = calculateInflammationIndex(
//   p011InflammationInput,
// );

// console.log("P-01 Inflammation Index: ", p011InflammationResult);

const p011InflammationInput3: InflammationIndexFormulaInput = {
  /**
   * Full-precision IFI result from calculateIFI().
   */
  rawIfi: 1,

  /**
   * Full-precision BMI calculated from:
   * 88.45 / 1.56²
   */
  bmi: 30,

  sex: "female",

  heartRate: 70,
  spo2: 98,
};

validateInflammationIndexInput(p011InflammationInput3);

const p011InflammationResult3 = calculateInflammationIndex(
  p011InflammationInput3,
);

console.log("P-03 Inflammation Index: ", p011InflammationResult3);
