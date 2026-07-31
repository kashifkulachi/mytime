// src/lib/bluetooth/discoverOximeterServices.ts

/**
 * Represents a primary BLE service discovered
 * from the connected oximeter.
 */
export interface DiscoveredOximeterService {
  uuid: string;
  isPrimary: boolean;
}

/**
 * Retrieves all primary BLE services that the browser
 * has permission to access on the connected device.
 */
export async function discoverOximeterServices(
  server: BluetoothRemoteGATTServer,
): Promise<DiscoveredOximeterService[]> {
  if (!server.connected) {
    throw new DOMException("The oximeter is not connected.", "NetworkError");
  }

  const services = await server.getPrimaryServices();

  return services.map((service) => ({
    uuid: service.uuid,
    isPrimary: service.isPrimary,
  }));
}
