// src/lib/bluetooth/subscribeToOximeterNotifications.ts

export type OximeterNotificationHandler = (value: DataView) => void;

/**
 * Starts BLE notifications on a characteristic
 * and forwards each incoming value to the provided handler.
 *
 * Returns a cleanup function that:
 * - removes the event listener
 * - stops notifications when possible
 */
export async function subscribeToOximeterNotifications(
  characteristic: BluetoothRemoteGATTCharacteristic,
  onNotification: OximeterNotificationHandler,
): Promise<() => Promise<void>> {
  const canNotify =
    characteristic.properties.notify || characteristic.properties.indicate;

  if (!canNotify) {
    throw new DOMException(
      "The selected characteristic does not support notifications or indications.",
      "NotSupportedError",
    );
  }

  const handleCharacteristicValueChanged = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic | null;

    const value = target?.value;

    if (!value) {
      return;
    }

    onNotification(value);
  };

  characteristic.addEventListener(
    "characteristicvaluechanged",
    handleCharacteristicValueChanged,
  );

  try {
    await characteristic.startNotifications();
  } catch (error) {
    characteristic.removeEventListener(
      "characteristicvaluechanged",
      handleCharacteristicValueChanged,
    );

    throw error;
  }

  return async () => {
    characteristic.removeEventListener(
      "characteristicvaluechanged",
      handleCharacteristicValueChanged,
    );

    try {
      await characteristic.stopNotifications();
    } catch {
      /**
       * The device may already be disconnected.
       * Cleanup should not crash the application.
       */
    }
  };
}
