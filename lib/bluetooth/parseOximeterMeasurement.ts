import type { OximeterMeasurement } from "@/types/oximeter";

/**
 * Converts a raw BLE packet from the oximeter
 * into readable SpO₂ and heart-rate values.
 *
 * Expected packet format:
 *
 * Byte 0: 0xaa
 * Byte 1: 0x55
 * Byte 2: 0x0f
 * Byte 3: 0x08
 * Byte 4: 0x01
 * Byte 5: SpO₂
 * Byte 6: Heart rate
 */
export function parseOximeterMeasurement(
  bytes: Uint8Array,
): OximeterMeasurement | null {
  const isLiveMeasurementPacket =
    bytes.length === 12 &&
    bytes[0] === 0xaa &&
    bytes[1] === 0x55 &&
    bytes[2] === 0x0f &&
    bytes[3] === 0x08 &&
    bytes[4] === 0x01;

  if (!isLiveMeasurementPacket) {
    return null;
  }

  const spo2 = bytes[5];
  const heartRate = bytes[6];

  const isValidSpo2 = spo2 >= 70 && spo2 <= 100;

  const isValidHeartRate = heartRate >= 30 && heartRate <= 220;

  if (!isValidSpo2 || !isValidHeartRate) {
    return null;
  }

  return {
    spo2,
    heartRate,
    receivedAt: Date.now(),
  };
}
