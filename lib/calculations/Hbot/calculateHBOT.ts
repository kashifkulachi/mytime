import type {
  HBOTCalculationInput,
  HBOTCalculationResult,
  HBOTProtocolDetails,
  HBOTSessionRecommendation,
} from "@/types/calculations/htbot-calculations";

/**
 * Source of truth:
 * Enrique - VitaVoice-MyTIME-Platform 04.xlsx
 */
export const HBOT_FORMULA_VERSION = "vita-voice-hbot-sessions-v4";

/**
 * ---------------------------------------------------------------------------
 * WORKBOOK CONSTANTS
 * ---------------------------------------------------------------------------
 *
 * All three HBOT formulas share this common base:
 *
 * ABS(rawIfi / calculatedBmi) * 20
 */
const HBOT_BASE_SESSIONS = 20;

/**
 * Workbook normalization values.
 */
const REFERENCE_PRESSURE_ATA = 2.5;
const REFERENCE_DURATION_MINUTES = 90;
const REFERENCE_OXYGEN_PERCENT = 100;

/**
 * ---------------------------------------------------------------------------
 * STATIC HBOT PROTOCOL DETAILS
 * ---------------------------------------------------------------------------
 */

const HIGH_PRESSURE_PROTOCOL: HBOTProtocolDetails = {
  id: "high-pressure",

  name: "High-Pressure HBOT — 2.5 ATA",

  pressureAta: 2.5,

  durationMinutes: 90,

  oxygenPercent: 100,
};

const MEDIUM_PRESSURE_PROTOCOL: HBOTProtocolDetails = {
  id: "medium-pressure",

  name: "Medium-Pressure HBOT — 2.0 ATA",

  pressureAta: 2.0,

  durationMinutes: 60,

  oxygenPercent: 100,
};

const LOW_PRESSURE_PROTOCOL: HBOTProtocolDetails = {
  id: "low-pressure",

  name: "Low-Pressure HBOT — 1.6 ATA",

  pressureAta: 1.6,

  durationMinutes: 60,

  oxygenPercent: 21,
};

/**
 * ---------------------------------------------------------------------------
 * INTERNAL HELPERS
 * ---------------------------------------------------------------------------
 */

function assertFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
}

function assertFinitePositive(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a finite number greater than 0.`);
  }
}

/**
 * Calculates the shared workbook ratio:
 *
 * ABS(rawIfi / calculatedBmi)
 */
export function calculateAbsoluteIfiBmiRatio(
  rawIfi: number,
  calculatedBmi: number,
): number {
  assertFiniteNumber(rawIfi, "rawIfi");

  assertFinitePositive(calculatedBmi, "calculatedBmi");

  const ratio = Math.abs(rawIfi / calculatedBmi);

  assertFiniteNumber(ratio, "absoluteIfiBmiRatio");

  return ratio;
}

/**
 * Generic HBOT session formula.
 *
 * Workbook structure:
 *
 * ABS(rawIfi / BMI)
 * × 20
 * × (2.5 / protocolPressure)
 * × (90 / protocolDuration)
 * × (100 / protocolOxygen)
 */
export function calculateHBOTSessions(params: {
  absoluteIfiBmiRatio: number;
  pressureAta: number;
  durationMinutes: number;
  oxygenPercent: number;
}): number {
  const { absoluteIfiBmiRatio, pressureAta, durationMinutes, oxygenPercent } =
    params;

  if (!Number.isFinite(absoluteIfiBmiRatio) || absoluteIfiBmiRatio < 0) {
    throw new Error(
      "absoluteIfiBmiRatio must be a finite number greater than or equal to 0.",
    );
  }

  assertFinitePositive(pressureAta, "pressureAta");

  assertFinitePositive(durationMinutes, "durationMinutes");

  assertFinitePositive(oxygenPercent, "oxygenPercent");

  const pressureFactor = REFERENCE_PRESSURE_ATA / pressureAta;

  const durationFactor = REFERENCE_DURATION_MINUTES / durationMinutes;

  const oxygenFactor = REFERENCE_OXYGEN_PERCENT / oxygenPercent;

  const calculatedSessions =
    absoluteIfiBmiRatio *
    HBOT_BASE_SESSIONS *
    pressureFactor *
    durationFactor *
    oxygenFactor;

  if (!Number.isFinite(calculatedSessions)) {
    throw new Error("HBOT session calculation produced an invalid result.");
  }

  if (calculatedSessions < 0) {
    throw new Error("HBOT calculated sessions must not be negative.");
  }

  return calculatedSessions;
}

/**
 * Builds one clean report-ready HBOT recommendation.
 */
function buildHBOTRecommendation(params: {
  protocol: HBOTProtocolDetails;
  calculatedSessions: number;
}): HBOTSessionRecommendation {
  const { protocol, calculatedSessions } = params;

  assertFiniteNumber(calculatedSessions, `${protocol.name} calculatedSessions`);

  if (calculatedSessions < 0) {
    throw new Error(
      `${protocol.name} calculatedSessions must not be negative.`,
    );
  }

  return {
    protocol,
    calculatedSessions,
  };
}

/**
 * ---------------------------------------------------------------------------
 * INDIVIDUAL WORKBOOK FORMULAS
 * ---------------------------------------------------------------------------
 */

/**
 * High-Pressure HBOT
 *
 * Workbook:
 *
 * ABS(rawIfi / BMI)
 * × 20
 * × (2.5 / 2.5)
 * × (90 / 90)
 * × (100 / 100)
 */
export function calculateHighPressureHBOTSessions(
  absoluteIfiBmiRatio: number,
): number {
  return calculateHBOTSessions({
    absoluteIfiBmiRatio,

    pressureAta: HIGH_PRESSURE_PROTOCOL.pressureAta,

    durationMinutes: HIGH_PRESSURE_PROTOCOL.durationMinutes,

    oxygenPercent: HIGH_PRESSURE_PROTOCOL.oxygenPercent,
  });
}

/**
 * Medium-Pressure HBOT
 *
 * Workbook:
 *
 * ABS(rawIfi / BMI)
 * × 20
 * × (2.5 / 2.0)
 * × (90 / 60)
 * × (100 / 100)
 */
export function calculateMediumPressureHBOTSessions(
  absoluteIfiBmiRatio: number,
): number {
  return calculateHBOTSessions({
    absoluteIfiBmiRatio,

    pressureAta: MEDIUM_PRESSURE_PROTOCOL.pressureAta,

    durationMinutes: MEDIUM_PRESSURE_PROTOCOL.durationMinutes,

    oxygenPercent: MEDIUM_PRESSURE_PROTOCOL.oxygenPercent,
  });
}

/**
 * Low-Pressure HBOT
 *
 * Workbook:
 *
 * ABS(rawIfi / BMI)
 * × 20
 * × (2.5 / 1.6)
 * × (60 / 60)
 * × (100 / 21)
 *
 * Important:
 *
 * Workbook 04 uses 60 / 60 for the duration term in the
 * low-pressure formula, NOT 90 / 60.
 *
 * Because that differs from the generic normalization used by
 * the first two rows, we preserve the workbook formula exactly
 * below rather than forcing it through the generic helper.
 */
export function calculateLowPressureHBOTSessions(
  absoluteIfiBmiRatio: number,
): number {
  if (!Number.isFinite(absoluteIfiBmiRatio) || absoluteIfiBmiRatio < 0) {
    throw new Error(
      "absoluteIfiBmiRatio must be a finite number greater than or equal to 0.",
    );
  }

  const pressureFactor =
    REFERENCE_PRESSURE_ATA / LOW_PRESSURE_PROTOCOL.pressureAta;

  const durationFactor =
    LOW_PRESSURE_PROTOCOL.durationMinutes /
    LOW_PRESSURE_PROTOCOL.durationMinutes;

  const oxygenFactor =
    REFERENCE_OXYGEN_PERCENT / LOW_PRESSURE_PROTOCOL.oxygenPercent;

  const calculatedSessions =
    absoluteIfiBmiRatio *
    HBOT_BASE_SESSIONS *
    pressureFactor *
    durationFactor *
    oxygenFactor;

  if (!Number.isFinite(calculatedSessions)) {
    throw new Error(
      "Low-pressure HBOT session calculation produced an invalid result.",
    );
  }

  if (calculatedSessions < 0) {
    throw new Error(
      "Low-pressure HBOT calculated sessions must not be negative.",
    );
  }

  return calculatedSessions;
}

/**
 * ---------------------------------------------------------------------------
 * COMPLETE HBOT CALCULATION
 * ---------------------------------------------------------------------------
 *
 * Calculates all three Workbook 04 HBOT recommendations:
 *
 * 1. High-Pressure  — 2.5 ATA / 90 min / 100% O₂
 * 2. Medium-Pressure — 2.0 ATA / 60 min / 100% O₂
 * 3. Low-Pressure   — 1.6 ATA / 60 min / 21% O₂
 *
 * Full-precision session counts are returned.
 *
 * Do not round to whole sessions in the formula layer unless the
 * doctor explicitly defines a rounding rule.
 */
export function calculateHBOT(
  input: HBOTCalculationInput,
): HBOTCalculationResult {
  if (!input) {
    throw new Error("HBOT calculation input is required.");
  }

  const { rawIfi, calculatedBmi } = input;

  /**
   * Defensive validation.
   *
   * validateHBOTInput.ts should normally run before this function,
   * but this function remains safe when called independently.
   */
  assertFiniteNumber(rawIfi, "rawIfi");

  assertFinitePositive(calculatedBmi, "calculatedBmi");

  /**
   * Shared full-precision base:
   *
   * ABS(rawIfi / calculatedBmi)
   */
  const absoluteIfiBmiRatio = calculateAbsoluteIfiBmiRatio(
    rawIfi,
    calculatedBmi,
  );

  const highPressureSessions =
    calculateHighPressureHBOTSessions(absoluteIfiBmiRatio);

  const mediumPressureSessions =
    calculateMediumPressureHBOTSessions(absoluteIfiBmiRatio);

  const lowPressureSessions =
    calculateLowPressureHBOTSessions(absoluteIfiBmiRatio);

  const highPressureRecommendation = buildHBOTRecommendation({
    protocol: HIGH_PRESSURE_PROTOCOL,

    calculatedSessions: highPressureSessions,
  });

  const mediumPressureRecommendation = buildHBOTRecommendation({
    protocol: MEDIUM_PRESSURE_PROTOCOL,

    calculatedSessions: mediumPressureSessions,
  });

  const lowPressureRecommendation = buildHBOTRecommendation({
    protocol: LOW_PRESSURE_PROTOCOL,

    calculatedSessions: lowPressureSessions,
  });

  return {
    recommendations: [
      highPressureRecommendation,
      mediumPressureRecommendation,
      lowPressureRecommendation,
    ],

    formulaVersion: HBOT_FORMULA_VERSION,

    calculatedAt: new Date().toISOString(),
  };
}
