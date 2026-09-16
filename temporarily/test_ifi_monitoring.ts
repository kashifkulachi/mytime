import { calculateIFIMonitoring } from "@/lib/calculations/ifi-monitoring";
import type { IFIMonitoringObservation } from "@/types/calculations/ifi-monitoring";

/**
 * Temporary manual test for IFI Monitoring.
 *
 * Purpose:
 *
 * 1. Verify the confirmed Recovery formula:
 *
 *    ((actual IFI + 11) / 6) * 100
 *
 * 2. Verify Base IFI.
 * 3. Verify Day 18 IFI.
 * 4. Verify Final / Day 30 IFI.
 * 5. Verify missing-day behavior.
 * 6. Verify Daily Change.
 * 7. Verify Maximum Recovery.
 * 8. Verify slope calculations execute successfully.
 * 9. Verify Recovery is NOT clamped to 100%.
 */

const START_DATE = "2026-09-01";

/**
 * Add calendar days using UTC so the test behaves the same
 * regardless of the machine timezone.
 */
function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/**
 * Create all 31 monitoring positions as missing first.
 */
const observations: IFIMonitoringObservation[] = Array.from(
  { length: 31 },
  (_, day): IFIMonitoringObservation => ({
    day,

    date: addDays(START_DATE, day),

    ifi: null,

    reportId: null,

    assessmentCount: 0,

    observedAt: null,
  }),
);

/**
 * Add a real observation to a monitoring day.
 */
function setObservation(day: number, ifi: number, assessmentCount = 1): void {
  observations[day] = {
    day,

    date: addDays(START_DATE, day),

    ifi,

    reportId: `test-report-day-${day}`,

    assessmentCount,

    observedAt: `${addDays(START_DATE, day)}T12:00:00.000Z`,
  };
}

/**
 * ------------------------------------------------------------
 * TEST DATA
 * ------------------------------------------------------------
 *
 * We intentionally leave several missing days.
 *
 * Expected Recovery examples:
 *
 * Day 0:
 * IFI = -11
 * Recovery = 0%
 *
 * Day 1:
 * IFI = -10.4
 * Recovery = 10%
 *
 * Day 5:
 * IFI = -9.8
 * Recovery = 20%
 *
 * Day 10:
 * IFI = -9.2
 * Recovery = 30%
 *
 * Day 18:
 * IFI = -8
 * Recovery = 50%
 *
 * Day 24:
 * IFI = -6.5
 * Recovery = 75%
 *
 * Day 30:
 * IFI = -5
 * Recovery = 100%
 */

setObservation(0, -11);

setObservation(1, -10.4);

/**
 * Day 2 deliberately missing.
 */
setObservation(3, -10.1);

setObservation(5, -9.8);

setObservation(10, -9.2);

/**
 * More than one assessment occurred on Day 10.
 *
 * The preparation/database layer would already have selected
 * the canonical report.
 *
 * Calculation receives one IFI but preserves assessmentCount.
 */
observations[10].assessmentCount = 3;

setObservation(14, -8.6);

setObservation(18, -8);

setObservation(21, -7.4);

setObservation(24, -6.5);

setObservation(27, -5.6);

setObservation(30, -5);

/**
 * ------------------------------------------------------------
 * CALCULATE
 * ------------------------------------------------------------
 */
const result = calculateIFIMonitoring({
  cycleId: "temporary-test-cycle",

  startDate: START_DATE,

  endDate: addDays(START_DATE, 30),

  observations,
});

/**
 * ------------------------------------------------------------
 * OUTPUT
 * ------------------------------------------------------------
 */
console.log("\n======================================");
console.log("MYTIME IFI MONITORING TEST");
console.log("======================================\n");

console.log("Formula version:");
console.log(result.formulaVersion);

console.log("\n--- LONGITUDINAL SUMMARY ---");

console.log({
  baseIfi: result.summary.baselineIfi,

  baseRecovery: result.summary.baselineRecoveryPercent,

  latestIfi: result.summary.latestIfi,

  latestDay: result.summary.latestMonitoringDay,

  latestRecovery: result.summary.latestRecoveryPercent,

  day18Ifi: result.summary.day18.ifi,

  day18Recovery: result.summary.day18.recoveryPercent,

  finalIfi: result.summary.finalIfi,

  finalRecovery: result.summary.finalRecoveryPercent,

  maximumRecovery: result.summary.maximumRecoveryPercent,

  observedDays: result.summary.observedDays,

  missingDays: result.summary.missingDays,

  totalAssessments: result.summary.totalAssessments,
});

console.log("\n--- SLOPES ---");

console.log({
  overall: result.summary.overallSlope,

  day0To18: result.summary.slopeToDay18,

  day18To30: result.summary.slopeDay18To30,
});

console.log("\n--- OBSERVED DAYS ---");

console.table(
  result.days
    .filter((day) => day.hasObservation)
    .map((day) => ({
      day: day.day,

      date: day.date,

      ifi: day.ifi,

      dailyChange: day.dailyChange,

      changeFromBaseline: day.changeFromBaseline,

      recoveryPercent: day.recoveryPercent,

      assessments: day.assessmentCount,
    })),
);

/**
 * ------------------------------------------------------------
 * SIMPLE ASSERTION HELPERS
 * ------------------------------------------------------------
 */

function assertEqual<T>(actual: T, expected: T, name: string): void {
  if (actual !== expected) {
    throw new Error(
      `${name} FAILED. Expected ${String(
        expected,
      )}, received ${String(actual)}.`,
    );
  }

  console.log(`✓ ${name}`);
}

function assertClose(
  actual: number | null,
  expected: number,
  name: string,
  tolerance = 0.000001,
): void {
  if (actual === null || Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `${name} FAILED. Expected approximately ${expected}, received ${String(
        actual,
      )}.`,
    );
  }

  console.log(`✓ ${name}`);
}

/**
 * ------------------------------------------------------------
 * ASSERTIONS
 * ------------------------------------------------------------
 */

console.log("\n--- ASSERTIONS ---");

/**
 * Base
 */
assertEqual(result.summary.baselineIfi, -11, "Base IFI");

assertClose(result.summary.baselineRecoveryPercent, 0, "Base Recovery = 0%");

/**
 * Day 1
 *
 * ((-10.4 + 11) / 6) * 100 = 10
 */
assertClose(result.days[1].recoveryPercent, 10, "Day 1 Recovery = 10%");

/**
 * Missing Day 2
 */
assertEqual(result.days[2].ifi, null, "Day 2 IFI is missing");

assertEqual(result.days[2].recoveryPercent, null, "Day 2 Recovery is missing");

assertEqual(result.days[2].dailyChange, null, "Day 2 Daily Change is missing");

/**
 * Day 3 compares against previous OBSERVED IFI,
 * which is Day 1.
 *
 * -10.1 - (-10.4) = +0.3
 */
assertClose(
  result.days[3].dailyChange,
  0.3,
  "Day 3 change uses previous observed IFI",
);

/**
 * Day 18
 */
assertEqual(result.summary.day18.ifi, -8, "Day 18 IFI");

assertClose(result.summary.day18.recoveryPercent, 50, "Day 18 Recovery = 50%");

/**
 * Final / Day 30
 */
assertEqual(result.summary.finalIfi, -5, "Final IFI = Day 30 IFI");

assertClose(result.summary.finalRecoveryPercent, 100, "Final Recovery = 100%");

assertClose(
  result.summary.maximumRecoveryPercent,
  100,
  "Maximum Recovery = 100%",
);

/**
 * Assessment counts.
 *
 * We have 11 observed days.
 *
 * Day 10 contains assessmentCount = 3, therefore:
 *
 * total assessments = 13
 */
assertEqual(result.summary.observedDays, 11, "Observed days = 11");

assertEqual(result.summary.missingDays, 20, "Missing days = 20");

assertEqual(result.summary.totalAssessments, 13, "Total assessments = 13");

/**
 * ------------------------------------------------------------
 * NON-CLAMPING TEST
 * ------------------------------------------------------------
 *
 * Create a second test where Day 30 = -4.
 *
 * ((-4 + 11) / 6) * 100
 *
 * = 116.666666...
 *
 * This proves the calculation does not silently cap Recovery
 * at 100%.
 */

const aboveTargetObservations = observations.map((observation) => ({
  ...observation,
}));

aboveTargetObservations[30] = {
  ...aboveTargetObservations[30],

  ifi: -4,
};

const above100Result = calculateIFIMonitoring({
  cycleId: "temporary-test-above-100",

  startDate: START_DATE,

  endDate: addDays(START_DATE, 30),

  observations: aboveTargetObservations,
});

assertClose(
  above100Result.summary.finalRecoveryPercent,
  116.66666666666667,
  "Recovery is not clamped at 100%",
);

assertClose(
  above100Result.summary.maximumRecoveryPercent,
  116.66666666666667,
  "Maximum Recovery can exceed 100%",
);

console.log("\n======================================");
console.log("ALL IFI MONITORING TESTS PASSED ✓");
console.log("======================================\n");
