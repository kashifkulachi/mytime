// src/lib/bluetooth/findOximeterCharacteristicCandidates.ts

import type { DiscoveredCharacteristic } from "@/types/oximeter";

export interface OximeterCharacteristicCandidates {
  measurementCandidates: DiscoveredCharacteristic[];
  commandCandidates: DiscoveredCharacteristic[];
}

/**
 * Separates discovered BLE characteristics into:
 *
 * 1. Measurement candidates
 *    Characteristics that can notify or indicate new values.
 *
 * 2. Command candidates
 *    Characteristics that accept write commands.
 */
export function findOximeterCharacteristicCandidates(
  characteristics: DiscoveredCharacteristic[],
): OximeterCharacteristicCandidates {
  const measurementCandidates = characteristics.filter(
    (characteristic) =>
      characteristic.properties.notify || characteristic.properties.indicate,
  );

  const commandCandidates = characteristics.filter(
    (characteristic) =>
      characteristic.properties.write ||
      characteristic.properties.writeWithoutResponse,
  );

  return {
    measurementCandidates,
    commandCandidates,
  };
}
