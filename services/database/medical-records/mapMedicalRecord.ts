import type {
  MedicalRecordBiologicalAgeMetrics,
  MedicalRecordHBOTMetrics,
  MedicalRecordHBOTRecommendation,
  MedicalRecordIFIMetrics,
  MedicalRecordNeuronMetrics,
  MedicalRecordPdfStatus,
  MedicalRecordPeptideMetrics,
  MedicalRecordPeptideRecommendation,
  PatientMedicalRecord,
} from "@/services/database/medical-records/getPatientMedicalRecords";

/**
 * Database shape required by the medical record mapper.
 *
 * This is intentionally private to the database/service layer.
 */
export interface MedicalRecordDatabaseRow {
  id: string;

  patient_name: string;
  date_of_birth: string;
  evaluation_date: string;
  ifi_functional_profile_version: number | null;
  gender: string | null;

  calculation_results: unknown;

  pdf_status: string | null;
  pdf_path: string | null;
  pdf_generated_at: string | null;
  pdf_error: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Convert a reports database row into the safe DTO used by
 * Medical Records pages.
 *
 * Important:
 * - patient_id is not exposed.
 * - created_by_user_id is not exposed.
 * - pdf_path is not exposed.
 * - queue/internal PDF fields are not exposed.
 */
export function mapMedicalRecord(
  row: MedicalRecordDatabaseRow,
): PatientMedicalRecord {
  const calculationResults = asObject(row.calculation_results);

  return {
    id: row.id,

    patientName: row.patient_name,

    dateOfBirth: row.date_of_birth,

    evaluationDate: row.evaluation_date,

    gender: normalizeGender(row.gender),
    ifiFunctionalProfileVersion: row.ifi_functional_profile_version,

    metrics: {
      ifi: parseIFIMetrics(calculationResults),

      biologicalAge: parseBiologicalAgeMetrics(calculationResults),

      peptideDose: parsePeptideDoseMetrics(calculationResults),

      hbotSessions: parseHBOTMetrics(calculationResults),
    },

    pdf: {
      status: normalizePdfStatus(row.pdf_status),

      isAvailable: row.pdf_status === "ready" && Boolean(row.pdf_path),

      generatedAt: row.pdf_generated_at,

      error: row.pdf_error,
    },

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}

/**
 * ============================================================
 * IFI
 * ============================================================
 */

function parseIFIMetrics(
  results: Record<string, unknown>,
): MedicalRecordIFIMetrics | null {
  const value = getResultSection(results, ["IFI", "ifi"]);

  if (!value) {
    return null;
  }

  const classificationsObject = asObject(value.classifications);

  const classifications =
    Object.keys(classificationsObject).length > 0
      ? {
          gutBrainAxis: getString(classificationsObject, ["gutBrainAxis"]),

          neurological: getString(classificationsObject, ["neurological"]),

          cardiovascular: getString(classificationsObject, ["cardiovascular"]),

          endocrineMetabolic: getString(classificationsObject, [
            "endocrineMetabolic",
          ]),

          tumoralProliferative: getString(classificationsObject, [
            "tumoralProliferative",
          ]),
        }
      : null;

  return {
    ifi: getNumber(value, ["IFI", "ifi"]),

    rawIfi: getNumber(value, ["rawIfi", "rawIFI"]),

    ifiRange: getNumber(value, ["IFIRange", "ifiRange"]),

    inflammationCoefficient: getNumber(value, ["inflammationCoefficient"]),

    inflammationCoefficientPercent: getNumber(value, [
      "inflammationCoefficientPercent",
    ]),
    riskLabel: null,

    classifications,
  };
}

/**
 * ============================================================
 * BIOLOGICAL AGE
 * ============================================================
 */

function parseBiologicalAgeMetrics(
  results: Record<string, unknown>,
): MedicalRecordBiologicalAgeMetrics | null {
  const value = getResultSection(results, ["BiologicalAge", "biologicalAge"]);

  if (!value) {
    return null;
  }

  return {
    biologicalAgeYears: getNumber(value, ["biologicalAgeYears"]),

    displayBiologicalAgeYears: getNumber(value, ["displayBiologicalAgeYears"]),

    chronologicalAgeYears: getNumber(value, ["chronologicalAgeYears"]),

    agingCoefficient: getNumber(value, ["agingCoefficient"]),

    agingCoefficientPercent: getNumber(value, ["agingCoefficientPercent"]),
  };
}

/**
 * ============================================================
 * PEPTIDE DOSE
 * ============================================================
 */

function parsePeptideDoseMetrics(
  results: Record<string, unknown>,
): MedicalRecordPeptideMetrics | null {
  const value = getResultSection(results, ["PeptideDose", "peptideDose"]);

  if (!value) {
    return null;
  }

  const rawRecommendations = Array.isArray(value.recommendations)
    ? value.recommendations
    : [];

  const recommendations = rawRecommendations
    .map(parsePeptideRecommendation)
    .filter(
      (recommendation): recommendation is MedicalRecordPeptideRecommendation =>
        recommendation !== null,
    );

  const neuron = parseNeuronMetrics(value);

  return {
    ifiRange: getNumber(value, ["ifiRange", "IFIRange"]),

    recommendations,

    neuronOliveMoringa: neuron,
  };
}

function parsePeptideRecommendation(
  input: unknown,
): MedicalRecordPeptideRecommendation | null {
  const value = asObject(input);

  if (Object.keys(value).length === 0) {
    return null;
  }

  return {
    treatmentId: getString(value, ["treatmentId", "id"]),

    treatmentName: getString(value, ["treatmentName", "name"]),

    treatmentGroup: getString(value, ["treatmentGroup", "group"]),

    indication: getString(value, ["indication"]),

    activeIngredient: getString(value, [
      "activeIngredient",
      "activeIngredients",
    ]),

    recommendedDose: getNumber(value, ["recommendedDose", "dose"]),

    unit: getString(value, ["unit"]),
  };
}

/**
 * ============================================================
 * NEURON ON
 * ============================================================
 */

function parseNeuronMetrics(
  peptideResult: Record<string, unknown>,
): MedicalRecordNeuronMetrics | null {
  const candidates = [
    peptideResult.neuronOliveMoringa,

    peptideResult.neuronOliveOilMoringa,

    peptideResult.neuron,
  ];

  for (const candidate of candidates) {
    const value = asObject(candidate);

    if (Object.keys(value).length === 0) {
      continue;
    }

    return {
      productName: getString(value, ["productName"]),

      activeIngredients: getString(value, [
        "activeIngredients",
        "activeIngredient",
      ]),

      recommendedDrops: getNumber(value, ["recommendedDrops"]),

      unit: getString(value, ["unit"]),
    };
  }

  return null;
}

/**
 * ============================================================
 * HBOT
 * ============================================================
 */

function parseHBOTMetrics(
  results: Record<string, unknown>,
): MedicalRecordHBOTMetrics | null {
  const value = getResultSection(results, ["HBOTSessions", "hbotSessions"]);

  if (!value) {
    return null;
  }

  const rawRecommendations = Array.isArray(value.recommendations)
    ? value.recommendations
    : [];

  const recommendations = rawRecommendations
    .map(parseHBOTRecommendation)
    .filter(
      (recommendation): recommendation is MedicalRecordHBOTRecommendation =>
        recommendation !== null,
    );

  return {
    recommendations,
  };
}

function parseHBOTRecommendation(
  input: unknown,
): MedicalRecordHBOTRecommendation | null {
  const value = asObject(input);

  if (Object.keys(value).length === 0) {
    return null;
  }

  const protocol = asObject(value.protocol);

  return {
    protocolId: getString(protocol, ["id"]) ?? getString(value, ["protocolId"]),

    protocolName:
      getString(protocol, ["name"]) ?? getString(value, ["protocolName"]),

    pressureAta:
      getNumber(protocol, ["pressureAta"]) ?? getNumber(value, ["pressureAta"]),

    oxygenPercent:
      getNumber(protocol, ["oxygenPercent"]) ??
      getNumber(value, ["oxygenPercent"]),

    durationMinutes:
      getNumber(protocol, ["durationMinutes"]) ??
      getNumber(value, ["durationMinutes"]),

    calculatedSessions: getNumber(value, ["calculatedSessions"]),
  };
}

/**
 * ============================================================
 * GENERAL HELPERS
 * ============================================================
 */

function getResultSection(
  results: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | null {
  for (const key of keys) {
    const value = asObject(results[key]);

    if (Object.keys(value).length > 0) {
      return value;
    }
  }

  return null;
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getNumber(
  object: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getString(
  object: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function normalizeGender(value: string | null): "male" | "female" {
  return value === "female" ? "female" : "male";
}

function normalizePdfStatus(value: string | null): MedicalRecordPdfStatus {
  switch (value) {
    case "queued":
    case "generating":
    case "ready":
    case "failed":
      return value;

    case "pending":
    default:
      return "pending";
  }
}
