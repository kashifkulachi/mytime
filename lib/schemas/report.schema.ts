import { z } from "zod";

import {
  BiologicalAgeCalculationBreakdown,
  BiologicalAgeCalculationResult,
} from "@/types/calculations/biological-age-calculation";

import {
  IFIClassifications,
  IFICalculationBreakdown,
  IFICalculationResult,
  IFIRange,
} from "@/types/calculations/ifi-calculation";
import { PeptideDoseCalculationResult } from "@/types/calculations/peptide-dose-calculation";
import { HBOTCalculationResult } from "@/types/calculations/htbot-calculations";

/**
 * ------------------------------------------------------------
 * Patient
 * ------------------------------------------------------------
 */

export const genderSchema = z.enum(["male", "female"]);
export type Gender = z.infer<typeof genderSchema>;

export const reportPatientSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Patient name is required.",
  }),

  dateOfBirth: z.string().min(1, {
    message: "Date of birth is required.",
  }),

  evaluationDate: z.string().min(1, {
    message: "Evaluation date is required.",
  }),

  gender: genderSchema,
});

/**
 * ------------------------------------------------------------
 * IFI nested values
 * ------------------------------------------------------------
 *
 * We already know these are structured values from your
 * calculation layer, but we are not duplicating every nested
 * property into Zod yet.
 */

const ifiRangeSchema = z.custom<IFIRange>(
  (value) => value !== null && value !== undefined,
  {
    message: "IFI range is required.",
  },
);

const ifiClassificationsSchema = z.custom<IFIClassifications>(
  (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value),
  {
    message: "IFI classifications must be a valid object.",
  },
);

const ifiCalculationBreakdownSchema = z.custom<IFICalculationBreakdown>(
  (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value),
  {
    message: "IFI breakdown must be a valid object.",
  },
);

/**
 * ------------------------------------------------------------
 * IFI result
 * ------------------------------------------------------------
 */

export const ifiCalculationResultSchema = z.object({
  ifi: z.number().finite(),

  rawIfi: z.number().finite(),

  ifiRange: ifiRangeSchema,

  inflammationCoefficient: z.number().finite(),

  inflammationCoefficientPercent: z.number().finite(),

  classifications: ifiClassificationsSchema,

  breakdown: ifiCalculationBreakdownSchema,

  formulaVersion: z.string().min(1, {
    message: "IFI formula version is required.",
  }),

  evaluationDate: z.string().min(1, {
    message: "IFI evaluation date is required.",
  }),

  calculatedAt: z.string().min(1, {
    message: "IFI calculation timestamp is required.",
  }),
});

/**
 * ------------------------------------------------------------
 * Biological Age nested values
 * ------------------------------------------------------------
 */

const biologicalAgeCalculationBreakdownSchema =
  z.custom<BiologicalAgeCalculationBreakdown>(
    (value) =>
      typeof value === "object" && value !== null && !Array.isArray(value),
    {
      message: "Biological Age breakdown must be a valid object.",
    },
  );

/**
 * ------------------------------------------------------------
 * Biological Age result
 * ------------------------------------------------------------
 */

export const biologicalAgeCalculationResultSchema = z.object({
  biologicalAgeDays: z.number().finite(),

  biologicalAgeYears: z.number().finite(),

  displayBiologicalAgeYears: z.number().finite(),

  agingCoefficient: z.number().finite(),

  agingCoefficientPercent: z.number().finite(),

  breakdown: biologicalAgeCalculationBreakdownSchema,

  evaluationDate: z.string().min(1, {
    message: "Biological Age evaluation date is required.",
  }),

  formulaVersion: z.string().min(1, {
    message: "Biological Age formula version is required.",
  }),

  calculatedAt: z.string().min(1, {
    message: "Biological Age calculation timestamp is required.",
  }),
});

// Peptide Dose

export const peptideDoseInputSchema = z.object({
  ifiRange: z.number().finite().min(0).max(25),

  weightKg: z.number().finite().positive(),
});

/**
 * Clinical groups represented in Workbook 04.
 */
export const therapyGroupSchema = z.enum([
  "Neurological",
  "Cardiovascular",
  "Oncological",
  "Endocrine-Metabolic",
  "Gut-Brain Axis",
]);

/**
 * FDA-approved therapies represented in Workbook 04.
 */
export const therapyNameSchema = z.enum([
  "Copaxone®",
  "Wegovy®",
  "Lutathera®",
  "Saxenda®",
  "Gattex®",
]);

/**
 * Active ingredient / therapy-type descriptions.
 */
export const therapyActiveIngredientSchema = z.enum([
  "Glatiramer acetate / synthetic polypeptide",
  "Semaglutide / GLP-1 receptor agonist",
  "Lutetium Lu 177 dotatate / radiolabeled somatostatin analog",
  "Liraglutide / GLP-1 receptor agonist",
  "Teduglutide / GLP-2 analog",
]);

/**
 * Units returned by Workbook 04 recommendation formulas.
 */
export const therapyDoseUnitSchema = z.enum(["mg", "GBq"]);

/**
 * Stable application identifiers.
 */
export const therapyRecommendationIdSchema = z.enum([
  "copaxone",
  "wegovy",
  "lutathera",
  "saxenda",
  "gattex",
]);

/**
 * Static clinical/reference information for one therapy.
 */
export const therapyDetailsSchema = z.object({
  id: therapyRecommendationIdSchema,

  group: therapyGroupSchema,

  therapy: therapyNameSchema,

  activeIngredient: therapyActiveIngredientSchema,

  indication: z.string().min(1, {
    message: "Therapy indication is required.",
  }),

  labeledDoseRegimen: z.string().min(1, {
    message: "Labeled dose regimen is required.",
  }),

  maximumOrMaintenance: z.string().min(1, {
    message: "Maximum or maintenance guidance is required.",
  }),
});

/**
 * Complete recommendation for one therapy.
 */
export const therapyRecommendationSchema = z.object({
  treatment: therapyDetailsSchema,

  recommendedDose: z.number().finite(),

  unit: therapyDoseUnitSchema,
});

export const neuronOliveMoringaResultSchema = z.object({
  id: z.literal("neuron-olive-oil-moringa"),
  productName: z.literal("Neuron ON®"),

  activeIngredients: z.literal("Olive oil and Moringa"),

  category: z.literal("Nutritional Supplement"),

  recommendedDrops: z.number().finite().nonnegative(),

  unit: z.literal("drops"),
});

/**
 * Complete Workbook 04 therapy recommendation result.
 */
export const peptideDoseCalculationResultSchema = z.object({
  ifiRange: z.number().finite().min(0).max(25),

  recommendations: z.tuple([
    therapyRecommendationSchema,
    therapyRecommendationSchema,
    therapyRecommendationSchema,
    therapyRecommendationSchema,
    therapyRecommendationSchema,
  ]),

  formulaVersion: z.string().min(1, {
    message: "Peptide dose formula version is required.",
  }),

  neuronOliveMoringa: neuronOliveMoringaResultSchema,

  calculatedAt: z.string().min(1, {
    message: "Peptide dose calculation timestamp is required.",
  }),
});

/**
 * Formula-ready input for the HBOT session calculation.
 */
export const hbotCalculationInputSchema = z.object({
  rawIfi: z.number().finite(),

  calculatedBmi: z.number().finite().positive(),
});

/**
 * Stable identifiers for the three HBOT protocols.
 */
export const hbotProtocolIdSchema = z.enum([
  "high-pressure",
  "medium-pressure",
  "low-pressure",
]);

/**
 * Display names corresponding to the workbook HBOT rows.
 */
export const hbotProtocolNameSchema = z.enum([
  "High-Pressure HBOT — 2.5 ATA",
  "Medium-Pressure HBOT — 2.0 ATA",
  "Low-Pressure HBOT — 1.6 ATA",
]);

/**
 * Static treatment parameters used by one HBOT protocol.
 */
export const hbotProtocolDetailsSchema = z.object({
  id: hbotProtocolIdSchema,

  name: hbotProtocolNameSchema,

  pressureAta: z.number().finite(),

  durationMinutes: z.number().finite().positive(),

  oxygenPercent: z.number().finite().min(0).max(100),
});

/**
 * Complete calculated recommendation for one HBOT protocol.
 */
export const hbotSessionRecommendationSchema = z.object({
  protocol: hbotProtocolDetailsSchema,

  calculatedSessions: z.number().finite(),
});

/**
 * Complete result returned by the HBOT calculation.
 */
export const hbotCalculationResultSchema = z.object({
  recommendations: z.tuple([
    hbotSessionRecommendationSchema,
    hbotSessionRecommendationSchema,
    hbotSessionRecommendationSchema,
  ]),

  formulaVersion: z.string().min(1, {
    message: "HBOT formula version is required.",
  }),

  calculatedAt: z.string().datetime({
    message: "HBOT calculation timestamp must be a valid ISO datetime.",
  }),
});

/**
 * ------------------------------------------------------------
 * Create Report
 * ------------------------------------------------------------
 *
 * This is the payload accepted by:
 *
 * POST /api/reports
 *
 * We are intentionally storing only:
 *
 * - Patient name
 * - DOB
 * - Evaluation date
 * - IFI result
 * - Biological Age result
 *
 * Inflammation Index and Peptide Dose will be added later.
 */

export const createReportSchema = z.object({
  patient: reportPatientSchema,

  results: z.object({
    IFI: ifiCalculationResultSchema,

    BiologicalAge: biologicalAgeCalculationResultSchema,
    PeptideDose: peptideDoseCalculationResultSchema,
    HBOTSessions: hbotCalculationResultSchema,
  }),
});

/**
 * ------------------------------------------------------------
 * Inferred API types
 * ------------------------------------------------------------
 */

export type CreateReportInput = z.infer<typeof createReportSchema>;

export type ReportPatientInput = z.infer<typeof reportPatientSchema>;

/**
 * ------------------------------------------------------------
 * Compile-time schema checks
 * ------------------------------------------------------------
 *
 * These help us catch accidental drift between our Zod schemas
 * and calculation TypeScript interfaces.
 */

const _ifiTypeCheck: IFICalculationResult = {} as z.infer<
  typeof ifiCalculationResultSchema
>;

const _biologicalAgeTypeCheck: BiologicalAgeCalculationResult = {} as z.infer<
  typeof biologicalAgeCalculationResultSchema
>;
const _peptideDoseTypeCheck: PeptideDoseCalculationResult = {} as z.infer<
  typeof peptideDoseCalculationResultSchema
>;

const _hbotTypeCheck: HBOTCalculationResult = {} as z.infer<
  typeof hbotCalculationResultSchema
>;

void _peptideDoseTypeCheck;
void _hbotTypeCheck;

void _ifiTypeCheck;
void _biologicalAgeTypeCheck;
