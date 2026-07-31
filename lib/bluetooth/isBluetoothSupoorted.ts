// src/lib/bluetooth/isBluetoothSupported.ts

/**
 * Checks whether the current browser provides
 * access to the Web Bluetooth API.
 *
 * This function must only be used in the browser.
 */
export function isBluetoothSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  return "bluetooth" in navigator;
}
