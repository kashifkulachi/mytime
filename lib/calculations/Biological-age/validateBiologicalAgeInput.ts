import type { BiologicalAgeFormulaInput } from "@/types/calculations/biological-age-calculation";

/**
 * Ensures a number is finite.
 *
 * Rejects:
 * - NaN
 * - Infinity
 * - -Infinity
 */
function validateFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a valid finite number.`);
  }
}

/**
 * Parses and validates a date-only ISO value.
 *
 * Supported examples:
 * - "1966-03-25"
 * - "2026-07-10"
 *
 * ISO date-time strings are also accepted because only the date portion
 * is used:
 * - "2026-07-10T12:30:00.000Z"
 */
function parseDateAsUtcDay(value: string, fieldName: string): number {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  const dateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!dateMatch) {
    throw new Error(
      `${fieldName} must use ISO date format, such as 2026-07-10.`,
    );
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  const utcTimestamp = Date.UTC(year, month - 1, day);

  const parsedDate = new Date(utcTimestamp);

  /**
   * Date.UTC normalizes invalid dates.
   *
   * Example:
   * 2026-02-31 could become a date in March.
   *
   * These checks make sure the original date was valid.
   */
  const isValidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day;

  if (!isValidDate) {
    throw new Error(`${fieldName} is not a valid calendar date.`);
  }

  return utcTimestamp;
}

/**
 * Validates the complete Biological Age input before the workbook formula
 * is executed.
 *
 * This function does not calculate or modify any values.
 */
export function validateBiologicalAgeInput(
  input: BiologicalAgeFormulaInput,
): void {
  const birthTimestamp = parseDateAsUtcDay(input.dateOfBirth, "Date of birth");

  const evaluationTimestamp = parseDateAsUtcDay(
    input.evaluationDate,
    "Evaluation date",
  );

  if (evaluationTimestamp <= birthTimestamp) {
    throw new Error("Evaluation date must be later than the date of birth.");
  }

  validateFiniteNumber(input.rawIfi, "Raw IFI");
}
