// src/lib/bluetooth/dataViewToUint8Array.ts

/**
 * Converts a DataView into a Uint8Array containing
 * only the bytes that belong to that DataView.
 *
 * This is safer than using:
 *
 * new Uint8Array(value.buffer)
 *
 * because the underlying ArrayBuffer may contain
 * extra bytes before or after the DataView.
 */
export function dataViewToUint8Array(value: DataView): Uint8Array {
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}
