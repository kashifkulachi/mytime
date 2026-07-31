import { isBluetoothSupported } from "@/lib/bluetooth/isBluetoothSupoorted";
import { OXIMETER_OPTIONAL_SERVICE_UUIDS } from "@/lib/bluetooth/oximeterUuids";

/**
 * Opens the browser's Bluetooth device chooser
 * and returns the device selected by the user.
 *
 * Important:
 * This function must be called directly from a user action,
 * such as a button click.
 */

export async function requestOximeterDevice(): Promise<BluetoothDevice> {
  if (!isBluetoothSupported()) {
    throw new DOMException(
      "Web Bluetooth is not supported in this browser.",
      "NotSupportedError",
    );
  }

  const device = await navigator.bluetooth.requestDevice({
    /*
     * During development, show every nearby BLE device.
     *
     * Later, after confirming the exact device name or service UUID,
     * we can replace this with stricter filters.
     */
    acceptAllDevices: true,

    /*
     * Requests permission to access these services
     * after the user selects a device.
     */
    optionalServices: OXIMETER_OPTIONAL_SERVICE_UUIDS,
  });

  return device;
}
