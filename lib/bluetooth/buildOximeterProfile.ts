// src/lib/bluetooth/buildOximeterProfile.ts

import type { DiscoveredCharacteristic } from "@/types/oximeter";

export interface OximeterBleProfile {
  deviceId: string;
  deviceName: string;

  measurementServiceUuid: string;
  measurementCharacteristicUuid: string;

  commandServiceUuid: string | null;
  commandCharacteristicUuid: string | null;
}

/**
 * Builds a reusable BLE profile from the selected
 * measurement and command characteristics.
 *
 * The profile contains only serializable information.
 * It does not store live browser Bluetooth objects.
 */
export function buildOximeterProfile(
  device: BluetoothDevice,
  measurementCharacteristic: DiscoveredCharacteristic,
  commandCharacteristic?: DiscoveredCharacteristic | null,
): OximeterBleProfile {
  const supportsMeasurements =
    measurementCharacteristic.properties.notify ||
    measurementCharacteristic.properties.indicate;

  if (!supportsMeasurements) {
    throw new DOMException(
      "The selected measurement characteristic does not support notifications or indications.",
      "NotSupportedError",
    );
  }

  const supportsCommands = commandCharacteristic
    ? commandCharacteristic.properties.write ||
      commandCharacteristic.properties.writeWithoutResponse
    : false;

  if (commandCharacteristic && !supportsCommands) {
    throw new DOMException(
      "The selected command characteristic does not support writing.",
      "NotSupportedError",
    );
  }

  return {
    deviceId: device.id,

    deviceName: device.name ?? "Unnamed Bluetooth device",

    measurementServiceUuid: measurementCharacteristic.serviceUuid,

    measurementCharacteristicUuid: measurementCharacteristic.characteristicUuid,

    commandServiceUuid: commandCharacteristic?.serviceUuid ?? null,

    commandCharacteristicUuid:
      commandCharacteristic?.characteristicUuid ?? null,
  };
}
