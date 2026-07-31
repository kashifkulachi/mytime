/**
 * Standard Bluetooth Pulse Oximeter Service.
 *
 * Short UUID: 0x1822
 * Full UUID: 00001822-0000-1000-8000-00805f9b34fb
 */
export const STANDARD_PULSE_OXIMETER_SERVICE_UUID =
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

/**
 * Add verified proprietary oximeter service UUIDs here.
 *
 * Do not guess these UUIDs. We will discover the real service UUIDs
 * from your selected Viatom/Vibeat oximeter in a later step.
 */
export const PROPRIETARY_OXIMETER_SERVICE_UUIDS: string[] = [
  // Example:
  // "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
];

/**
 * These services will be passed to requestDevice()
 * through the optionalServices property.
 */
export const OXIMETER_OPTIONAL_SERVICE_UUIDS: string[] = [
  STANDARD_PULSE_OXIMETER_SERVICE_UUID,
  ...PROPRIETARY_OXIMETER_SERVICE_UUIDS,
];
