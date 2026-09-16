// import type {
//   IFIMonitoringInput,
//   IFIMonitoringObservation,
// } from "@/types/calculations/ifi-monitoring";

// import {
//   IFI_MONITORING_FINAL_DAY,
//   IFI_MONITORING_TOTAL_DAYS,
// } from "@/types/calculations/ifi-monitoring";

// /**
//  * Validates a fully prepared 31-day IFI monitoring input.
//  *
//  * Expected structure:
//  *
//  * Day 0  -> real baseline report
//  * Day 1  -> report or explicit missing day
//  * ...
//  * Day 30 -> report or explicit missing day
//  *
//  * Missing days must remain explicit:
//  *
//  * {
//  *   ifi: null,
//  *   reportId: null,
//  *   observedAt: null,
//  *   assessmentCount: 0
//  * }
//  *
//  * This validator does NOT fetch reports or choose which report
//  * should represent a day.
//  *
//  * That responsibility belongs to the future database/input
//  * preparation service.
//  */
// export function validateIFIMonitoringInput(input: IFIMonitoringInput): void {
//   /**
//    * ----------------------------------------------------------
//    * 1. BASIC INPUT
//    * ----------------------------------------------------------
//    */
//   if (!input) {
//     throw new Error("IFI monitoring input is required.");
//   }

//   validateIsoDate(input.startDate, "Monitoring start date");

//   validateIsoDate(input.endDate, "Monitoring end date");

//   /**
//    * ----------------------------------------------------------
//    * 2. CYCLE MUST BE EXACTLY DAY 0 -> DAY 30
//    * ----------------------------------------------------------
//    */
//   const expectedEndDate = addDaysToIsoDate(
//     input.startDate,
//     IFI_MONITORING_FINAL_DAY,
//   );

//   if (input.endDate !== expectedEndDate) {
//     throw new Error(
//       `IFI monitoring end date must be exactly ${IFI_MONITORING_FINAL_DAY} days after the start date.`,
//     );
//   }

//   /**
//    * ----------------------------------------------------------
//    * 3. EXACTLY 31 MONITORING POSITIONS
//    * ----------------------------------------------------------
//    *
//    * Day 0 through Day 30.
//    *
//    * Missing assessment days must still be represented.
//    */
//   if (!Array.isArray(input.observations)) {
//     throw new Error("IFI monitoring observations are required.");
//   }

//   if (input.observations.length !== IFI_MONITORING_TOTAL_DAYS) {
//     throw new Error(
//       `IFI monitoring requires exactly ${IFI_MONITORING_TOTAL_DAYS} daily positions from Day 0 through Day ${IFI_MONITORING_FINAL_DAY}.`,
//     );
//   }

//   /**
//    * ----------------------------------------------------------
//    * 4. VALIDATE EVERY DAY
//    * ----------------------------------------------------------
//    */
//   const encounteredDays = new Set<number>();

//   const encounteredDates = new Set<string>();

//   for (const observation of input.observations) {
//     validateObservation(observation, input.startDate);

//     if (encounteredDays.has(observation.day)) {
//       throw new Error(
//         `Duplicate IFI monitoring day found: Day ${observation.day}.`,
//       );
//     }

//     encounteredDays.add(observation.day);

//     if (encounteredDates.has(observation.date)) {
//       throw new Error(
//         `Duplicate IFI monitoring date found: ${observation.date}.`,
//       );
//     }

//     encounteredDates.add(observation.date);
//   }

//   /**
//    * ----------------------------------------------------------
//    * 5. REQUIRE EVERY DAY NUMBER
//    * ----------------------------------------------------------
//    *
//    * This prevents structures such as:
//    *
//    * Day 0
//    * Day 1
//    * Day 3
//    * ...
//    *
//    * even if there are still 31 array entries.
//    */
//   for (let day = 0; day <= IFI_MONITORING_FINAL_DAY; day += 1) {
//     if (!encounteredDays.has(day)) {
//       throw new Error(`IFI monitoring is missing Day ${day}.`);
//     }
//   }

//   /**
//    * ----------------------------------------------------------
//    * 6. DAY 0 MUST BE A REAL BASELINE
//    * ----------------------------------------------------------
//    *
//    * A monitoring cycle cannot exist without a real baseline
//    * report.
//    */
//   const baseline = input.observations.find(
//     (observation) => observation.day === 0,
//   );

//   if (!baseline) {
//     throw new Error("IFI monitoring baseline Day 0 is missing.");
//   }

//   if (baseline.ifi === null) {
//     throw new Error(
//       "IFI monitoring Day 0 must contain a real baseline IFI value.",
//     );
//   }

//   if (!baseline.reportId) {
//     throw new Error("IFI monitoring Day 0 must reference the baseline report.");
//   }

//   if (!baseline.observedAt) {
//     throw new Error(
//       "IFI monitoring Day 0 must contain the baseline observation timestamp.",
//     );
//   }

//   /**
//    * ----------------------------------------------------------
//    * 7. OPTIONAL TARGET IFI
//    * ----------------------------------------------------------
//    *
//    * The workbook example used -5.
//    *
//    * That is NOT a production constant.
//    *
//    * If a clinically defined target is eventually provided, it
//    * must be a finite number and must differ from the baseline,
//    * otherwise the recovery denominator becomes zero.
//    */
//   if (input.targetIfi !== undefined && input.targetIfi !== null) {
//     validateFiniteNumber(input.targetIfi, "Target IFI");

//     if (input.targetIfi === baseline.ifi) {
//       throw new Error("Target IFI must differ from the baseline IFI.");
//     }
//   }
// }

// /**
//  * ------------------------------------------------------------
//  * INDIVIDUAL OBSERVATION
//  * ------------------------------------------------------------
//  */
// function validateObservation(
//   observation: IFIMonitoringObservation,
//   cycleStartDate: string,
// ): void {
//   if (typeof observation !== "object" || observation === null) {
//     throw new Error("Each IFI monitoring observation must be an object.");
//   }

//   /**
//    * DAY
//    */
//   if (!Number.isInteger(observation.day)) {
//     throw new Error("IFI monitoring day must be an integer.");
//   }

//   if (observation.day < 0 || observation.day > IFI_MONITORING_FINAL_DAY) {
//     throw new Error(
//       `IFI monitoring day must be between 0 and ${IFI_MONITORING_FINAL_DAY}.`,
//     );
//   }

//   /**
//    * DATE
//    */
//   validateIsoDate(observation.date, `Day ${observation.day} date`);

//   const expectedDate = addDaysToIsoDate(cycleStartDate, observation.day);

//   if (observation.date !== expectedDate) {
//     throw new Error(
//       `IFI monitoring Day ${observation.day} must use date ${expectedDate}, but received ${observation.date}.`,
//     );
//   }

//   /**
//    * ASSESSMENT COUNT
//    */
//   if (
//     !Number.isInteger(observation.assessmentCount) ||
//     observation.assessmentCount < 0
//   ) {
//     throw new Error(
//       `Day ${observation.day} assessment count must be a non-negative integer.`,
//     );
//   }

//   /**
//    * ----------------------------------------------------------
//    * MISSING DAY
//    * ----------------------------------------------------------
//    *
//    * Missing means ALL clinical observation fields are empty.
//    */
//   if (observation.ifi === null) {
//     if (observation.reportId !== null) {
//       throw new Error(
//         `Day ${observation.day} cannot contain a report ID when IFI is missing.`,
//       );
//     }

//     if (observation.observedAt !== null) {
//       throw new Error(
//         `Day ${observation.day} cannot contain an observation timestamp when IFI is missing.`,
//       );
//     }

//     if (observation.assessmentCount !== 0) {
//       throw new Error(
//         `Day ${observation.day} must have assessmentCount = 0 when no IFI observation exists.`,
//       );
//     }

//     return;
//   }

//   /**
//    * ----------------------------------------------------------
//    * OBSERVED DAY
//    * ----------------------------------------------------------
//    */
//   validateFiniteNumber(observation.ifi, `Day ${observation.day} IFI`);

//   if (!observation.reportId || !observation.reportId.trim()) {
//     throw new Error(
//       `Day ${observation.day} must reference the report used for its IFI observation.`,
//     );
//   }

//   if (observation.assessmentCount < 1) {
//     throw new Error(
//       `Day ${observation.day} must have at least one assessment when an IFI value exists.`,
//     );
//   }

//   if (!observation.observedAt) {
//     throw new Error(
//       `Day ${observation.day} must contain an observation timestamp when an IFI value exists.`,
//     );
//   }

//   validateIsoDateTime(
//     observation.observedAt,
//     `Day ${observation.day} observation timestamp`,
//   );

//   /**
//    * The selected report must belong to the same calendar
//    * monitoring date.
//    *
//    * We compare using the ISO date prefix because observedAt is
//    * expected to be a database timestamp.
//    */
//   // const observedDate = observation.observedAt.slice(0, 10);

//   // if (observedDate !== observation.date) {
//   //   throw new Error(
//   //     `Day ${observation.day} observation timestamp does not match its monitoring date.`,
//   //   );
//   // }
// }

// /**
//  * ------------------------------------------------------------
//  * FINITE NUMBER
//  * ------------------------------------------------------------
//  */
// function validateFiniteNumber(value: number, fieldName: string): void {
//   if (typeof value !== "number" || !Number.isFinite(value)) {
//     throw new Error(`${fieldName} must be a finite number.`);
//   }
// }

// /**
//  * ------------------------------------------------------------
//  * ISO DATE
//  * ------------------------------------------------------------
//  *
//  * Requires exactly:
//  *
//  * YYYY-MM-DD
//  *
//  * and rejects impossible dates such as:
//  *
//  * 2026-02-31
//  */
// function validateIsoDate(value: string, fieldName: string): void {
//   if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
//   }

//   const parsed = parseIsoDateUtc(value);

//   const normalized = formatUtcIsoDate(parsed);

//   if (normalized !== value) {
//     throw new Error(`${fieldName} is not a valid calendar date.`);
//   }
// }

// /**
//  * ------------------------------------------------------------
//  * ISO TIMESTAMP
//  * ------------------------------------------------------------
//  */
// function validateIsoDateTime(value: string, fieldName: string): void {
//   if (typeof value !== "string" || !value.trim()) {
//     throw new Error(`${fieldName} is required.`);
//   }

//   const timestamp = new Date(value);

//   if (Number.isNaN(timestamp.getTime())) {
//     throw new Error(`${fieldName} must be a valid ISO date-time.`);
//   }
// }

// /**
//  * ------------------------------------------------------------
//  * DATE HELPERS
//  * ------------------------------------------------------------
//  *
//  * UTC is intentionally used here.
//  *
//  * These are date-only clinical monitoring positions.
//  * Local timezone/DST should not change which monitoring day a
//  * calendar date represents.
//  */
// function addDaysToIsoDate(date: string, days: number): string {
//   const parsed = parseIsoDateUtc(date);

//   parsed.setUTCDate(parsed.getUTCDate() + days);

//   return formatUtcIsoDate(parsed);
// }

// function parseIsoDateUtc(value: string): Date {
//   const [year, month, day] = value.split("-").map(Number);

//   return new Date(Date.UTC(year, month - 1, day));
// }

// function formatUtcIsoDate(date: Date): string {
//   const year = date.getUTCFullYear();

//   const month = String(date.getUTCMonth() + 1).padStart(2, "0");

//   const day = String(date.getUTCDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }
import type {
  IFIMonitoringInput,
  IFIMonitoringObservation,
} from "@/types/calculations/ifi-monitoring";

import {
  IFI_MONITORING_FINAL_DAY,
  IFI_MONITORING_TOTAL_DAYS,
} from "@/types/calculations/ifi-monitoring";

/**
 * Validates a fully prepared 31-day IFI monitoring input.
 *
 * Expected structure:
 *
 * Day 0  -> real report / Base IFI
 * Day 1  -> report or explicit missing day
 * ...
 * Day 18 -> report or explicit missing day
 * ...
 * Day 30 -> report or explicit missing day
 *
 * Missing days remain explicit:
 *
 * {
 *   ifi: null,
 *   reportId: null,
 *   observedAt: null,
 *   assessmentCount: 0
 * }
 *
 * IMPORTANT:
 *
 * Base IFI is the actual Day-0 IFI used for longitudinal
 * presentation.
 *
 * It is NOT an input to the Recovery formula.
 *
 * Recovery is calculated separately as:
 *
 * ((actual IFI + 11) / 6) * 100
 *
 * This validator does NOT:
 *
 * - calculate Recovery
 * - fetch reports
 * - select the canonical report for a day
 * - interpolate missing IFI values
 */
export function validateIFIMonitoringInput(input: IFIMonitoringInput): void {
  /**
   * ----------------------------------------------------------
   * 1. BASIC INPUT
   * ----------------------------------------------------------
   */
  if (!input) {
    throw new Error("IFI monitoring input is required.");
  }

  validateIsoDate(input.startDate, "Monitoring start date");

  validateIsoDate(input.endDate, "Monitoring end date");

  /**
   * ----------------------------------------------------------
   * 2. CYCLE MUST BE EXACTLY DAY 0 -> DAY 30
   * ----------------------------------------------------------
   */
  const expectedEndDate = addDaysToIsoDate(
    input.startDate,
    IFI_MONITORING_FINAL_DAY,
  );

  if (input.endDate !== expectedEndDate) {
    throw new Error(
      `IFI monitoring end date must be exactly ${IFI_MONITORING_FINAL_DAY} days after the start date.`,
    );
  }

  /**
   * ----------------------------------------------------------
   * 3. EXACTLY 31 MONITORING POSITIONS
   * ----------------------------------------------------------
   *
   * Missing assessment days must still exist in the array.
   */
  if (!Array.isArray(input.observations)) {
    throw new Error("IFI monitoring observations are required.");
  }

  if (input.observations.length !== IFI_MONITORING_TOTAL_DAYS) {
    throw new Error(
      `IFI monitoring requires exactly ${IFI_MONITORING_TOTAL_DAYS} daily positions from Day 0 through Day ${IFI_MONITORING_FINAL_DAY}.`,
    );
  }

  /**
   * ----------------------------------------------------------
   * 4. VALIDATE EVERY MONITORING POSITION
   * ----------------------------------------------------------
   */
  const encounteredDays = new Set<number>();
  const encounteredDates = new Set<string>();

  for (const observation of input.observations) {
    validateObservation(observation, input.startDate);

    if (encounteredDays.has(observation.day)) {
      throw new Error(
        `Duplicate IFI monitoring day found: Day ${observation.day}.`,
      );
    }

    encounteredDays.add(observation.day);

    if (encounteredDates.has(observation.date)) {
      throw new Error(
        `Duplicate IFI monitoring date found: ${observation.date}.`,
      );
    }

    encounteredDates.add(observation.date);
  }

  /**
   * ----------------------------------------------------------
   * 5. REQUIRE EVERY DAY NUMBER
   * ----------------------------------------------------------
   *
   * Prevents malformed structures such as:
   *
   * Day 0
   * Day 1
   * Day 3
   * ...
   *
   * even if the array happens to contain 31 elements.
   */
  for (let day = 0; day <= IFI_MONITORING_FINAL_DAY; day += 1) {
    if (!encounteredDays.has(day)) {
      throw new Error(`IFI monitoring is missing Day ${day}.`);
    }
  }

  /**
   * ----------------------------------------------------------
   * 6. DAY 0 MUST BE A REAL OBSERVATION
   * ----------------------------------------------------------
   *
   * Day 0 establishes the monitoring cycle and provides the
   * value displayed as Base IFI.
   *
   * Base IFI is NOT used in the Recovery formula.
   */
  const dayZero = input.observations.find(
    (observation) => observation.day === 0,
  );

  if (!dayZero) {
    throw new Error("IFI monitoring Day 0 is missing.");
  }

  if (dayZero.ifi === null) {
    throw new Error("IFI monitoring Day 0 must contain a real IFI value.");
  }

  if (!dayZero.reportId) {
    throw new Error("IFI monitoring Day 0 must reference its source report.");
  }

  if (!dayZero.observedAt) {
    throw new Error(
      "IFI monitoring Day 0 must contain its observation timestamp.",
    );
  }

  /**
   * There is intentionally NO target IFI validation here.
   *
   * Recovery does not use a patient-specific baseline/target:
   *
   * ((actual IFI + 11) / 6) * 100
   */
}

/**
 * ============================================================
 * INDIVIDUAL OBSERVATION
 * ============================================================
 */
function validateObservation(
  observation: IFIMonitoringObservation,
  cycleStartDate: string,
): void {
  if (typeof observation !== "object" || observation === null) {
    throw new Error("Each IFI monitoring observation must be an object.");
  }

  /**
   * ----------------------------------------------------------
   * DAY
   * ----------------------------------------------------------
   */
  if (!Number.isInteger(observation.day)) {
    throw new Error("IFI monitoring day must be an integer.");
  }

  if (observation.day < 0 || observation.day > IFI_MONITORING_FINAL_DAY) {
    throw new Error(
      `IFI monitoring day must be between 0 and ${IFI_MONITORING_FINAL_DAY}.`,
    );
  }

  /**
   * ----------------------------------------------------------
   * DATE
   * ----------------------------------------------------------
   */
  validateIsoDate(observation.date, `Day ${observation.day} date`);

  const expectedDate = addDaysToIsoDate(cycleStartDate, observation.day);

  if (observation.date !== expectedDate) {
    throw new Error(
      `IFI monitoring Day ${observation.day} must use date ${expectedDate}, but received ${observation.date}.`,
    );
  }

  /**
   * ----------------------------------------------------------
   * ASSESSMENT COUNT
   * ----------------------------------------------------------
   */
  if (
    !Number.isInteger(observation.assessmentCount) ||
    observation.assessmentCount < 0
  ) {
    throw new Error(
      `Day ${observation.day} assessment count must be a non-negative integer.`,
    );
  }

  /**
   * ----------------------------------------------------------
   * MISSING DAY
   * ----------------------------------------------------------
   *
   * A missing monitoring day must contain no clinical
   * observation data.
   */
  if (observation.ifi === null) {
    if (observation.reportId !== null) {
      throw new Error(
        `Day ${observation.day} cannot contain a report ID when IFI is missing.`,
      );
    }

    if (observation.observedAt !== null) {
      throw new Error(
        `Day ${observation.day} cannot contain an observation timestamp when IFI is missing.`,
      );
    }

    if (observation.assessmentCount !== 0) {
      throw new Error(
        `Day ${observation.day} must have assessmentCount = 0 when no IFI observation exists.`,
      );
    }

    return;
  }

  /**
   * ----------------------------------------------------------
   * OBSERVED DAY
   * ----------------------------------------------------------
   */
  validateFiniteNumber(observation.ifi, `Day ${observation.day} IFI`);

  if (!observation.reportId || !observation.reportId.trim()) {
    throw new Error(
      `Day ${observation.day} must reference the report used for its IFI observation.`,
    );
  }

  if (observation.assessmentCount < 1) {
    throw new Error(
      `Day ${observation.day} must have at least one assessment when an IFI value exists.`,
    );
  }

  if (!observation.observedAt) {
    throw new Error(
      `Day ${observation.day} must contain an observation timestamp when an IFI value exists.`,
    );
  }

  validateIsoDateTime(
    observation.observedAt,
    `Day ${observation.day} observation timestamp`,
  );

  /**
   * We intentionally do NOT require the UTC date portion of
   * created_at to equal evaluation_date.
   *
   * evaluation_date is the clinical monitoring date.
   *
   * created_at is a database timestamp and can cross a UTC
   * boundary depending on timezone and when the record was
   * persisted.
   */
}

/**
 * ============================================================
 * FINITE NUMBER
 * ============================================================
 */
function validateFiniteNumber(value: number, fieldName: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
}

/**
 * ============================================================
 * ISO DATE
 * ============================================================
 */
function validateIsoDate(value: string, fieldName: string): void {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const parsed = parseIsoDateUtc(value);

  const normalized = formatUtcIsoDate(parsed);

  if (normalized !== value) {
    throw new Error(`${fieldName} is not a valid calendar date.`);
  }
}

/**
 * ============================================================
 * ISO TIMESTAMP
 * ============================================================
 */
function validateIsoDateTime(value: string, fieldName: string): void {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date-time.`);
  }
}

/**
 * ============================================================
 * DATE HELPERS
 * ============================================================
 *
 * UTC is intentionally used because these are date-only
 * clinical monitoring positions.
 *
 * Local timezone/DST must not change which monitoring day a
 * YYYY-MM-DD value represents.
 */
function addDaysToIsoDate(date: string, days: number): string {
  const parsed = parseIsoDateUtc(date);

  parsed.setUTCDate(parsed.getUTCDate() + days);

  return formatUtcIsoDate(parsed);
}

function parseIsoDateUtc(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcIsoDate(date: Date): string {
  const year = date.getUTCFullYear();

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
