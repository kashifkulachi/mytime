// src/lib/bluetooth/parseOximeterNotification.ts

import { dataViewToUint8Array } from "@/lib/bluetooth/dataViewToUint8Array";
import { parseOximeterMeasurement } from "@/lib/bluetooth/parseOximeterMeasurement";

import type { OximeterMeasurement } from "@/types/oximeter";

/**
 * Converts an incoming BLE notification value into
 * a readable oximeter measurement.
 *
 * Returns null when:
 * - the packet is not a live measurement packet
 * - SpO₂ is invalid
 * - heart rate is invalid
 */
export function parseOximeterNotification(
  value: DataView,
): OximeterMeasurement | null {
  const bytes = dataViewToUint8Array(value);

  return parseOximeterMeasurement(bytes);
}
