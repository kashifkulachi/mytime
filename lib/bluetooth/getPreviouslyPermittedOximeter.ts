// Remove in production

import type { OximeterBleProfile } from "@/lib/bluetooth/buildOximeterProfile";
import { isBluetoothSupported } from "@/lib/bluetooth/isBluetoothSupoorted";
import { loadOximeterProfile } from "@/lib/bluetooth/oximeterProfileStorage";

export interface PreviouslyPermittedOximeter {
  device: BluetoothDevice;
  profile: OximeterBleProfile;
}

export interface PreviouslyPermittedOximeterResult {
  permittedOximeter: PreviouslyPermittedOximeter | null;

  supportsPreviouslyPermittedDevices: boolean;

  savedProfile: OximeterBleProfile | null;
}

/**
 * Checks whether the current browser runtime
 * implements navigator.bluetooth.getDevices().
 *
 * A TypeScript declaration does not guarantee
 * runtime browser support.
 */
function supportsBluetoothGetDevices(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "bluetooth" in navigator &&
    typeof navigator.bluetooth?.getDevices === "function"
  );
}

/**
 * Retrieves a previously authorized oximeter when
 * the browser supports Bluetooth.getDevices().
 *
 * Unsupported browsers return a structured fallback
 * result instead of throwing an error.
 */
export async function getPreviouslyPermittedOximeter(): Promise<PreviouslyPermittedOximeterResult> {
  const savedProfile = loadOximeterProfile();

  if (!savedProfile) {
    return {
      permittedOximeter: null,
      supportsPreviouslyPermittedDevices: supportsBluetoothGetDevices(),
      savedProfile: null,
    };
  }

  if (!isBluetoothSupported()) {
    return {
      permittedOximeter: null,
      supportsPreviouslyPermittedDevices: false,
      savedProfile,
    };
  }

  if (!supportsBluetoothGetDevices()) {
    return {
      permittedOximeter: null,
      supportsPreviouslyPermittedDevices: false,
      savedProfile,
    };
  }

  // const permittedDevices = await navigator.bluetooth.getDevices();

  // const matchingDevice = permittedDevices.find(
  //   (device) => device.id === savedProfile.deviceId,
  // );

  let permittedDevices: BluetoothDevice[];

  try {
    permittedDevices = await navigator.bluetooth.getDevices();
  } catch (error) {
    throw new Error(
      "The browser failed to retrieve previously permitted Bluetooth devices.",
      {
        cause: error,
      },
    );
  }

  const matchingDevice = permittedDevices.find(
    (device) => device.id === savedProfile.deviceId,
  );

  if (!matchingDevice) {
    return {
      permittedOximeter: null,
      supportsPreviouslyPermittedDevices: true,
      savedProfile,
    };
  }

  return {
    permittedOximeter: {
      device: matchingDevice,
      profile: savedProfile,
    },

    supportsPreviouslyPermittedDevices: true,

    savedProfile,
  };
}
