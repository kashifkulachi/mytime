// src/lib/bluetooth/getOximeterCharacteristic.ts

/**
 * Retrieves the real BLE characteristic object
 * using its service UUID and characteristic UUID.
 *
 * This browser object is required for:
 * - starting notifications
 * - reading values
 * - writing commands
 * - listening for measurement events
 */
export async function getOximeterCharacteristic(
  server: BluetoothRemoteGATTServer,
  serviceUuid: BluetoothServiceUUID,
  characteristicUuid: BluetoothCharacteristicUUID,
): Promise<BluetoothRemoteGATTCharacteristic> {
  if (!server.connected) {
    throw new DOMException("The oximeter is not connected.", "NetworkError");
  }

  /**
   * Find the required service on the connected device.
   */
  const service = await server.getPrimaryService(serviceUuid);

  /**
   * Find the required characteristic inside that service.
   */
  const characteristic = await service.getCharacteristic(characteristicUuid);

  return characteristic;
}
