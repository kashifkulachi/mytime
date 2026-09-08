// import * as z from "zod";

// import type {
//   Assessment,
//   AssessmentResult,
//   PatientInfo,
// } from "@/types/assessments";
// import type { OximeterData, OximeterMeasurement } from "@/types/oximeter";
// import type { VoiceMetrics, VoiceProcessingResult } from "@/types/voice";

// /*
//  * Valid examples:
//  *
//  * 120/80
//  * 110/70
//  * 140/90
//  */
// const bloodPressurePattern = /^\d{2,3}\/\d{2,3}$/;

// /*
//  * -------------------------------------------------------
//  * Patient form
//  * -------------------------------------------------------
//  *
//  * This schema contains only fields entered by the user.
//  * BMI is not included because it is calculated afterward.
//  */

// const patientInfoFormBaseSchema = z.object({
//   heightCm: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Height is required."
//           : "Height must be a valid number.",
//     })
//     .min(50, {
//       error: "Height must be at least 50 cm.",
//     })
//     .max(250, {
//       error: "Height cannot exceed 250 cm.",
//     }),

//   weightKg: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Weight is required."
//           : "Weight must be a valid number.",
//     })
//     .min(2, {
//       error: "Weight must be at least 2 kg.",
//     })
//     .max(400, {
//       error: "Weight cannot exceed 400 kg.",
//     }),

//   age: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Age is required."
//           : "Age must be a valid number.",
//     })
//     .int({
//       error: "Age must be a whole number.",
//     })
//     .min(0, {
//       error: "Age cannot be negative.",
//     })
//     .max(120, {
//       error: "Age cannot exceed 120 years.",
//     }),

//   gender: z.enum(["male", "female", "intersex", "unknown"], {
//     error: "Please select a gender.",
//   }),

//   bloodPressure: z
//     .string({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Blood pressure is required."
//           : "Blood pressure must be text.",
//     })
//     .trim()
//     .min(1, {
//       error: "Blood pressure is required.",
//     })
//     .regex(bloodPressurePattern, {
//       error: "Use the systolic/diastolic format, for example 120/80.",
//     }),

//   bodyTemperatureC: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Body temperature is required."
//           : "Body temperature must be a valid number.",
//     })
//     .min(30, {
//       error: "Temperature must be at least 30°C.",
//     })
//     .max(45, {
//       error: "Temperature cannot exceed 45°C.",
//     }),

//   respiratoryRate: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Respiratory rate is required."
//           : "Respiratory rate must be a valid number.",
//     })
//     .int({
//       error: "Respiratory rate must be a whole number.",
//     })
//     .min(5, {
//       error: "Respiratory rate must be at least 5.",
//     })
//     .max(80, {
//       error: "Respiratory rate cannot exceed 80.",
//     }),

//   medicalNotes: z
//     .string({
//       error: "Medical notes must be text.",
//     })
//     .trim()
//     .max(2000, {
//       error: "Medical notes cannot exceed 2,000 characters.",
//     })
//     .optional(),
// });

// /*
//  * superRefine is appropriate here because blood pressure
//  * can produce several different validation issues.
//  */
// export const patientInfoFormSchema = patientInfoFormBaseSchema.superRefine(
//   ({ bloodPressure }, context) => {
//     /*
//      * The regex validation runs before this refinement.
//      * This guard prevents invalid text from producing
//      * misleading range errors.
//      */
//     if (!bloodPressurePattern.test(bloodPressure)) {
//       return;
//     }

//     const [systolicText, diastolicText] = bloodPressure.split("/");

//     const systolic = Number(systolicText);
//     const diastolic = Number(diastolicText);

//     if (systolic < 70 || systolic > 250) {
//       context.addIssue({
//         code: "custom",
//         path: ["bloodPressure"],
//         message: "Systolic pressure must be between 70 and 250 mmHg.",
//       });
//     }

//     if (diastolic < 40 || diastolic > 150) {
//       context.addIssue({
//         code: "custom",
//         path: ["bloodPressure"],
//         message: "Diastolic pressure must be between 40 and 150 mmHg.",
//       });
//     }

//     if (systolic <= diastolic) {
//       context.addIssue({
//         code: "custom",
//         path: ["bloodPressure"],
//         message: "Systolic pressure must be higher than diastolic pressure.",
//       });
//     }
//   },
// );

// /*
//  * The form has every PatientInfo property except BMI.
//  */
// export type PatientInfoFormValues = z.infer<typeof patientInfoFormSchema>;

// /*
//  * This compile-time check fails if the form schema stops
//  * matching PatientInfo without its calculated BMI field.
//  */
// type ExpectedPatientInfoFormValues = Omit<PatientInfo, "bmi">;

// const patientFormTypeCheck =
//   patientInfoFormSchema satisfies z.ZodType<ExpectedPatientInfoFormValues>;

// void patientFormTypeCheck;

// /*
//  * -------------------------------------------------------
//  * Complete patient
//  * -------------------------------------------------------
//  *
//  * This schema represents the patient object after BMI has
//  * been calculated.
//  *
//  * safeExtend preserves the blood-pressure refinements.
//  */

// export const patientInfoSchema = patientInfoFormSchema.safeExtend({
//   bmi: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "BMI is required."
//           : "BMI must be a valid number.",
//     })
//     .min(5, {
//       error: "BMI must be at least 5.",
//     })
//     .max(100, {
//       error: "BMI cannot exceed 100.",
//     }),
// });

// const patientInfoTypeCheck = patientInfoSchema satisfies z.ZodType<PatientInfo>;

// void patientInfoTypeCheck;

// /*
//  * -------------------------------------------------------
//  * Voice analysis
//  * -------------------------------------------------------
//  */

// export const voiceProcessingResultSchema = z.object({
//   frequency: z.number({
//     error: (issue) =>
//       issue.input === undefined
//         ? "Voice frequency is required."
//         : "Voice frequency must be a valid number.",
//   }),

//   intensity: z.number({
//     error: (issue) =>
//       issue.input === undefined
//         ? "Voice intensity is required."
//         : "Voice intensity must be a valid number.",
//   }),

//   amplitude: z.number({
//     error: (issue) =>
//       issue.input === undefined
//         ? "Voice amplitude is required."
//         : "Voice amplitude must be a valid number.",
//   }),
// });

// const voiceProcessingResultTypeCheck =
//   voiceProcessingResultSchema satisfies z.ZodType<VoiceProcessingResult>;

// void voiceProcessingResultTypeCheck;

// export const voiceMetricsSchema = z.object({
//   processedAt: z
//     .string({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Voice processing time is required."
//           : "Voice processing time must be text.",
//     })
//     .min(1, {
//       error: "Voice processing time is required.",
//     }),

//   metrics: voiceProcessingResultSchema,
// });

// const voiceMetricsTypeCheck =
//   voiceMetricsSchema satisfies z.ZodType<VoiceMetrics>;

// void voiceMetricsTypeCheck;

// /*
//  * -------------------------------------------------------
//  * Oximeter state
//  * -------------------------------------------------------
//  *
//  * This matches OximeterData exactly.
//  *
//  * null is allowed because the Bluetooth device may be
//  * connected before a complete reading has arrived.
//  */

// export const oximeterDataSchema = z.object({
//   spo2: z
//     .number({
//       error: "SpO₂ must be a valid number.",
//     })
//     .int({
//       error: "SpO₂ must be a whole number.",
//     })
//     .nullable(),

//   heartRate: z
//     .number({
//       error: "Heart rate must be a valid number.",
//     })
//     .int({
//       error: "Heart rate must be a whole number.",
//     })
//     .nullable(),
// });

// const oximeterDataTypeCheck =
//   oximeterDataSchema satisfies z.ZodType<OximeterData>;

// void oximeterDataTypeCheck;

// /*
//  * -------------------------------------------------------
//  * Complete oximeter measurement
//  * -------------------------------------------------------
//  *
//  * This is stricter than OximeterData.
//  *
//  * It rejects null because the final API should only run
//  * after both readings are available.
//  */

// export const oximeterMeasurementSchema = z.object({
//   spo2: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "SpO₂ is required."
//           : "SpO₂ must be a valid number.",
//     })
//     .int({
//       error: "SpO₂ must be a whole number.",
//     }),

//   heartRate: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Heart rate is required."
//           : "Heart rate must be a valid number.",
//     })
//     .int({
//       error: "Heart rate must be a whole number.",
//     }),
//   receivedAt: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Measurement time is required."
//           : "Measurement time must be valid.",
//     })
//     .int({
//       error: "Measurement time must be a whole number.",
//     })
//     .positive({
//       error: "Measurement time must be positive.",
//     }),
// });

// const oximeterMeasurementTypeCheck =
//   oximeterMeasurementSchema satisfies z.ZodType<OximeterMeasurement>;

// void oximeterMeasurementTypeCheck;

// /*
//  * -------------------------------------------------------
//  * Assessment result
//  * -------------------------------------------------------
//  */

// export const assessmentResultSchema = z.object({
//   healthScore: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Health score is required."
//           : "Health score must be a valid number.",
//     })
//     .min(0, {
//       error: "Health score cannot be below 0.",
//     })
//     .max(100, {
//       error: "Health score cannot exceed 100.",
//     }),

//   riskLevel: z
//     .string({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Risk level is required."
//           : "Risk level must be text.",
//     })
//     .trim()
//     .min(1, {
//       error: "Risk level is required.",
//     }),

//   recommendations: z.array(
//     z
//       .string({
//         error: "Each recommendation must be text.",
//       })
//       .trim()
//       .min(1, {
//         error: "Recommendations cannot be empty.",
//       }),
//   ),
// });

// const assessmentResultTypeCheck =
//   assessmentResultSchema satisfies z.ZodType<AssessmentResult>;

// void assessmentResultTypeCheck;

// /*
//  * -------------------------------------------------------
//  * Assessment context schema
//  * -------------------------------------------------------
//  *
//  * This mirrors your Assessment interface.
//  *
//  * null is allowed because the assessment is completed
//  * one step at a time.
//  */

// export const assessmentSchema = z.object({
//   voice: voiceMetricsSchema.nullable(),
//   patient: patientInfoSchema.nullable(),
//   oximeter: oximeterDataSchema.nullable(),
//   result: assessmentResultSchema.nullable(),
// });

// const assessmentTypeCheck = assessmentSchema satisfies z.ZodType<Assessment>;

// void assessmentTypeCheck;

// /*
//  * -------------------------------------------------------
//  * Final API submission
//  * -------------------------------------------------------
//  *
//  * The final API payload is deliberately stricter than the
//  * Assessment context.
//  *
//  * It requires:
//  * - completed voice metrics
//  * - completed patient information
//  * - non-null SpO₂
//  * - non-null heart rate
//  *
//  * result is omitted because the API will calculate and
//  * return the result.
//  */

// export const assessmentSubmissionSchema = z.object({
//   voice: voiceMetricsSchema,
//   patient: patientInfoSchema,

//   oximeter: z.object({
//     spo2: z
//       .number({
//         error: (issue) =>
//           issue.input === undefined || issue.input === null
//             ? "SpO₂ reading is required."
//             : "SpO₂ must be a valid number.",
//       })
//       .int({
//         error: "SpO₂ must be a whole number.",
//       })
//       .min(70, {
//         error: "SpO₂ must be at least 70%.",
//       })
//       .max(100, {
//         error: "SpO₂ cannot exceed 100%.",
//       }),

//     heartRate: z
//       .number({
//         error: (issue) =>
//           issue.input === undefined || issue.input === null
//             ? "Heart-rate reading is required."
//             : "Heart rate must be a valid number.",
//       })
//       .int({
//         error: "Heart rate must be a whole number.",
//       })
//       .min(30, {
//         error: "Heart rate must be at least 30 bpm.",
//       })
//       .max(220, {
//         error: "Heart rate cannot exceed 220 bpm.",
//       }),
//   }),
// });

// export type AssessmentSubmission = z.infer<typeof assessmentSubmissionSchema>;

import * as z from "zod";

import type { AssessmentResult } from "@/types/assessments";
import type { OximeterData, OximeterMeasurement } from "@/types/oximeter";
import type { VoiceMetrics, VoiceProcessingResult } from "@/types/voice";
import {
  biologicalAgeCalculationResultSchema,
  hbotCalculationResultSchema,
  ifiCalculationResultSchema,
  peptideDoseCalculationResultSchema,
} from "./report.schema";

/*
 * =======================================================
 * Reusable number schemas
 * =======================================================
 */

const heightCmSchema = z
  .number({
    error: (issue) =>
      issue.input === undefined
        ? "Height is required."
        : "Height must be a valid number.",
  })
  .min(50, {
    error: "Height must be at least 50 cm.",
  })
  .max(250, {
    error: "Height cannot exceed 250 cm.",
  });

const weightKgSchema = z
  .number({
    error: (issue) =>
      issue.input === undefined
        ? "Weight is required."
        : "Weight must be a valid number.",
  })
  .min(2, {
    error: "Weight must be at least 2 kg.",
  })
  .max(400, {
    error: "Weight cannot exceed 400 kg.",
  });

const ageSchema = z
  .number({
    error: (issue) =>
      issue.input === undefined
        ? "Age is required."
        : "Age must be a valid number.",
  })
  .int({
    error: "Age must be a whole number.",
  })
  .min(0, {
    error: "Age cannot be negative.",
  })
  .max(120, {
    error: "Age cannot exceed 120 years.",
  });

const bmiSchema = z
  .number({
    error: (issue) =>
      issue.input === undefined
        ? "BMI is required."
        : "BMI must be a valid number.",
  })
  .min(5, {
    error: "BMI must be at least 5 kg/m².",
  })
  .max(100, {
    error: "BMI cannot exceed 100 kg/m².",
  });

/*
 * =======================================================
 * Date helpers
 * =======================================================
 */

/**
 * Converts a YYYY-MM-DD string into a UTC Date.
 *
 * UTC is used to avoid a date changing because of the
 * user's local timezone.
 */
function parseDateOfBirth(value: string): Date | null {
  const [yearText, monthText, dayText] = value.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  /*
   * JavaScript automatically corrects invalid dates.
   *
   * For example:
   * 2026-02-31 could become a date in March.
   *
   * Therefore, we compare the resulting values again.
   */
  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValidDate ? date : null;
}

/**
 * Calculates a person's age from a YYYY-MM-DD date.
 */
function calculateAgeFromDateOfBirth(
  dateOfBirth: string,
  currentDate = new Date(),
): number | null {
  const birthDate = parseDateOfBirth(dateOfBirth);

  if (!birthDate) {
    return null;
  }

  const currentYear = currentDate.getUTCFullYear();
  const currentMonth = currentDate.getUTCMonth();
  const currentDay = currentDate.getUTCDate();

  const birthYear = birthDate.getUTCFullYear();
  const birthMonth = birthDate.getUTCMonth();
  const birthDay = birthDate.getUTCDate();

  let age = currentYear - birthYear;

  const birthdayHasNotOccurred =
    currentMonth < birthMonth ||
    (currentMonth === birthMonth && currentDay < birthDay);

  if (birthdayHasNotOccurred) {
    age -= 1;
  }

  return age;
}

/*
 * =======================================================
 * Patient information form
 * =======================================================
 *
 * BMI is excluded from the form schema because it should
 * be calculated automatically from height and weight.
 */

const patientInfoFormBaseSchema = z.object({
  dateOfBirth: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Date of birth is required."
          : "Date of birth must be valid text.",
    })
    .trim()
    .min(1, {
      error: "Date of birth is required.",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      error: "Date of birth must use the YYYY-MM-DD format.",
    }),

  age: ageSchema,

  sex: z.enum(["male", "female"], {
    error: "Please select male or female.",
  }),

  heightCm: heightCmSchema,

  weightKg: weightKgSchema,

  patientName: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "patient name is required."
          : "patient name must be valid text.",
    })
    .trim()
    .min(1, {
      error: "patient name is required.",
    }),
});

/**
 * Patient form validation.
 *
 * Checks:
 * 1. DOB is a real calendar date.
 * 2. DOB is not in the future.
 * 3. DOB is not more than 120 years ago.
 * 4. Entered age agrees with DOB.
 */
export const patientInfoFormSchema = patientInfoFormBaseSchema.superRefine(
  ({ dateOfBirth, age }, context) => {
    /*
     * Let the format validator handle incomplete or
     * incorrectly formatted values.
     */
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return;
    }

    const birthDate = parseDateOfBirth(dateOfBirth);

    if (!birthDate) {
      context.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "Please enter a real calendar date.",
      });

      return;
    }

    const today = new Date();

    const currentUtcDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    if (birthDate > currentUtcDate) {
      context.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "Date of birth cannot be in the future.",
      });

      return;
    }

    const calculatedAge = calculateAgeFromDateOfBirth(
      dateOfBirth,
      currentUtcDate,
    );

    if (calculatedAge === null) {
      return;
    }

    if (calculatedAge > 120) {
      context.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "Date of birth cannot be more than 120 years ago.",
      });

      return;
    }

    if (calculatedAge !== age) {
      context.addIssue({
        code: "custom",
        path: ["age"],
        message: `Age must be ${calculatedAge} based on the selected date of birth.`,
      });
    }
  },
);

/**
 * React Hook Form values.
 *
 * BMI is not included because it will be calculated when
 * the patient information is saved.
 */
export type PatientInfoFormValues = z.infer<typeof patientInfoFormSchema>;

/*
 * =======================================================
 * Complete patient information
 * =======================================================
 *
 * This represents the patient after BMI is calculated.
 */

export const patientInfoSchema = patientInfoFormSchema.safeExtend({
  bmi: bmiSchema,
});

export type PatientInfo = z.infer<typeof patientInfoSchema>;

/*
 * =======================================================
 * BMI calculation
 * =======================================================
 */

/**
 * Calculates BMI using:
 *
 * BMI = weight in kg / height in metres squared
 *
 * The result is rounded to two decimal places.
 */
export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightMetres = heightCm / 100;

  const bmi = weightKg / heightMetres ** 2;

  return Number(bmi.toFixed(2));
}

/*
 * =======================================================
 * Voice analysis
 * =======================================================
 */

export const voiceProcessingResultSchema = z.object({
  frequency: z.number({
    error: (issue) =>
      issue.input === undefined
        ? "Voice frequency is required."
        : "Voice frequency must be a valid number.",
  }),

  intensity: z.number({
    error: (issue) =>
      issue.input === undefined
        ? "Voice intensity is required."
        : "Voice intensity must be a valid number.",
  }),

  amplitude: z.number({
    error: (issue) =>
      issue.input === undefined
        ? "Voice amplitude is required."
        : "Voice amplitude must be a valid number.",
  }),
});

const voiceProcessingResultTypeCheck =
  voiceProcessingResultSchema satisfies z.ZodType<VoiceProcessingResult>;

void voiceProcessingResultTypeCheck;

export const voiceMetricsSchema = z.object({
  processedAt: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Voice processing time is required."
          : "Voice processing time must be valid text.",
    })
    .trim()
    .min(1, {
      error: "Voice processing time is required.",
    }),

  metrics: voiceProcessingResultSchema,
});

const voiceMetricsTypeCheck =
  voiceMetricsSchema satisfies z.ZodType<VoiceMetrics>;

void voiceMetricsTypeCheck;

/*
 * =======================================================
 * Oximeter context data
 * =======================================================
 *
 * null values are allowed because the oximeter may be
 * connected before a complete measurement arrives.
 */

export const oximeterDataSchema = z.object({
  spo2: z
    .number({
      error: "SpO₂ must be a valid number.",
    })
    .int({
      error: "SpO₂ must be a whole number.",
    }),

  heartRate: z
    .number({
      error: "Heart rate must be a valid number.",
    })
    .int({
      error: "Heart rate must be a whole number.",
    }),
});

const oximeterDataTypeCheck =
  oximeterDataSchema satisfies z.ZodType<OximeterData>;

void oximeterDataTypeCheck;

/*
 * =======================================================
 * Valid live oximeter measurement
 * =======================================================
 */

export const oximeterMeasurementSchema = z.object({
  spo2: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "SpO₂ is required."
          : "SpO₂ must be a valid number.",
    })
    .int({
      error: "SpO₂ must be a whole number.",
    }),
  heartRate: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Heart rate is required."
          : "Heart rate must be a valid number.",
    })
    .int({
      error: "Heart rate must be a whole number.",
    }),
  receivedAt: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Measurement time is required."
          : "Measurement time must be valid.",
    })
    .int({
      error: "Measurement time must be a whole number.",
    })
    .positive({
      error: "Measurement time must be positive.",
    }),
});

const oximeterMeasurementTypeCheck =
  oximeterMeasurementSchema satisfies z.ZodType<OximeterMeasurement>;

void oximeterMeasurementTypeCheck;

/*
 * =======================================================
 * Assessment result
 * =======================================================
 */

// export const assessmentResultSchema = z.object({
//   healthScore: z
//     .number({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Health score is required."
//           : "Health score must be a valid number.",
//     })
//     .min(0, {
//       error: "Health score cannot be below 0.",
//     })
//     .max(100, {
//       error: "Health score cannot exceed 100.",
//     }),

//   riskLevel: z
//     .string({
//       error: (issue) =>
//         issue.input === undefined
//           ? "Risk level is required."
//           : "Risk level must be valid text.",
//     })
//     .trim()
//     .min(1, {
//       error: "Risk level is required.",
//     }),

//   recommendations: z.array(
//     z
//       .string({
//         error: "Each recommendation must be valid text.",
//       })
//       .trim()
//       .min(1, {
//         error: "Recommendations cannot be empty.",
//       }),
//   ),
// });

export const AssessmentResultSchema = z.object({
  IFI: ifiCalculationResultSchema,
  BiologicalAge: biologicalAgeCalculationResultSchema,
  PeptideDose: peptideDoseCalculationResultSchema,
  HBOTSessions: hbotCalculationResultSchema,
});

export type AssessmentResults = z.infer<typeof AssessmentResultSchema>;
const assessmentResultTypeCheck =
  AssessmentResultSchema satisfies z.ZodType<AssessmentResult>;

void assessmentResultTypeCheck;

/*
 * =======================================================
 * Assessment context
 * =======================================================
 *
 * Each step can be null while the assessment is still
 * being completed.
 */

export const assessmentSchema = z.object({
  voice: voiceMetricsSchema.nullable(),
  patient: patientInfoSchema.nullable(),
  oximeter: oximeterDataSchema.nullable(),
  result: AssessmentResultSchema.nullable(),
});

export type Assessment = z.infer<typeof assessmentSchema>;

/*
 * =======================================================
 * Final assessment submission
 * =======================================================
 *
 * Unlike the context schema, the submission schema requires
 * completed voice, patient and oximeter information.
 *
 * The result is not submitted because it will be calculated
 * after all assessment values are available.
 */

export const assessmentSubmissionSchema = z.object({
  voice: voiceMetricsSchema,

  patient: patientInfoSchema,

  oximeter: z.object({
    spo2: z
      .number({
        error: (issue) =>
          issue.input === undefined || issue.input === null
            ? "SpO₂ reading is required."
            : "SpO₂ must be a valid number.",
      })
      .int({
        error: "SpO₂ must be a whole number.",
      })
      .min(70, {
        error: "SpO₂ must be at least 70%.",
      })
      .max(100, {
        error: "SpO₂ cannot exceed 100%.",
      }),

    heartRate: z
      .number({
        error: (issue) =>
          issue.input === undefined || issue.input === null
            ? "Heart-rate reading is required."
            : "Heart rate must be a valid number.",
      })
      .int({
        error: "Heart rate must be a whole number.",
      })
      .min(30, {
        error: "Heart rate must be at least 30 bpm.",
      })
      .max(220, {
        error: "Heart rate cannot exceed 220 bpm.",
      }),
  }),
});

export type AssessmentSubmission = z.infer<typeof assessmentSubmissionSchema>;
