// src/lib/bluetooth/discoverOximeterCharacteristics.ts

import type { DiscoveredCharacteristic } from "@/types/oximeter";

/**
 * Discovers the characteristics inside every permitted
 * primary service exposed by the connected oximeter.
 */
export async function discoverOximeterCharacteristics(
  server: BluetoothRemoteGATTServer,
): Promise<DiscoveredCharacteristic[]> {
  if (!server.connected) {
    throw new DOMException("The oximeter is not connected.", "NetworkError");
  }

  const services = await server.getPrimaryServices();

  const discoveredCharacteristics: DiscoveredCharacteristic[] = [];

  for (const service of services) {
    const characteristics = await service.getCharacteristics();

    for (const characteristic of characteristics) {
      discoveredCharacteristics.push({
        serviceUuid: service.uuid,

        characteristicUuid: characteristic.uuid,

        properties: {
          read: characteristic.properties.read,
          write: characteristic.properties.write,
          writeWithoutResponse: characteristic.properties.writeWithoutResponse,
          notify: characteristic.properties.notify,
          indicate: characteristic.properties.indicate,
        },
      });
    }
  }

  return discoveredCharacteristics;
}
