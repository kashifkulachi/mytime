import {
  buildOximeterProfile,
  type OximeterBleProfile,
} from "@/lib/bluetooth/buildOximeterProfile";

import { connectOximeterDevice } from "@/lib/bluetooth/connectOximeterDevice";
import { discoverOximeterCharacteristics } from "@/lib/bluetooth/discoverOximeterCharacteristics";
import { discoverOximeterServices } from "@/lib/bluetooth/discoverOximeterServices";
import { findOximeterCharacteristicCandidates } from "@/lib/bluetooth/findOximeterCharacteristicCandidates";
import { getOximeterCharacteristic } from "@/lib/bluetooth/getOximeterCharacteristic";
import { isBluetoothSupported } from "@/lib/bluetooth/isBluetoothSupoorted";
import { OximeterBluetoothManager } from "@/lib/bluetooth/OximeterBluetoothManager";
import { requestOximeterDevice } from "@/lib/bluetooth/requestOximeterDevice";
import { subscribeToOximeterNotifications } from "@/lib/bluetooth/subscribeToOximeterNotifications";

export interface ConnectToOximeterOptions {
  /**
   * The manager that will store all live browser
   * Bluetooth objects.
   */
  bluetoothManager: OximeterBluetoothManager;

  /**
   * Called whenever the oximeter sends a BLE
   * notification.
   *
   * The caller can convert and parse this DataView.
   */
  onNotification: (value: DataView) => void;

  /**
   * Controls whether an existing connection should
   * be closed before beginning a new connection.
   *
   * Defaults to true.
   */
  disconnectExistingConnection?: boolean;
}

export interface ConnectToOximeterResult {
  device: BluetoothDevice;

  server: BluetoothRemoteGATTServer;

  profile: OximeterBleProfile;

  measurementCharacteristic: BluetoothRemoteGATTCharacteristic;

  commandCharacteristic: BluetoothRemoteGATTCharacteristic | null;

  serviceCount: number;

  characteristicCount: number;

  measurementCandidateCount: number;

  commandCandidateCount: number;
}

/**
 * Runs the complete initial oximeter connection flow.
 *
 * Flow:
 *
 * request device
 *      ↓
 * connect GATT
 *      ↓
 * discover services
 *      ↓
 * discover characteristics
 *      ↓
 * find BLE candidates
 *      ↓
 * build BLE profile
 *      ↓
 * recover live characteristics
 *      ↓
 * subscribe to notifications
 *      ↓
 * populate Bluetooth Manager
 */
export async function connectToOximeter({
  bluetoothManager,
  onNotification,
  disconnectExistingConnection = true,
}: ConnectToOximeterOptions): Promise<ConnectToOximeterResult> {
  if (!isBluetoothSupported()) {
    throw new DOMException(
      "Web Bluetooth is not supported in this browser.",
      "NotSupportedError",
    );
  }

  if (typeof onNotification !== "function") {
    throw new TypeError("An onNotification callback is required.");
  }

  try {
    /**
     * Prevent a previous connection or notification
     * listener from remaining active.
     */
    if (disconnectExistingConnection) {
      await bluetoothManager.disconnect();
    }

    /**
     * Step 1:
     * Ask the user to select an oximeter.
     */
    const device = await requestOximeterDevice();

    bluetoothManager.setDevice(device);

    /**
     * Step 2:
     * Connect to the device's GATT server.
     */
    const server = await connectOximeterDevice(device);

    bluetoothManager.setServer(server);

    /**
     * Step 3:
     * Discover all accessible primary services.
     */
    const services = await discoverOximeterServices(server);

    if (services.length === 0) {
      throw new DOMException(
        "No accessible Bluetooth services were found on the selected device.",
        "NotFoundError",
      );
    }

    /**
     * Step 4:
     * Discover all accessible characteristics.
     */
    const characteristics = await discoverOximeterCharacteristics(server);

    if (characteristics.length === 0) {
      throw new DOMException(
        "No accessible Bluetooth characteristics were found on the selected device.",
        "NotFoundError",
      );
    }

    /**
     * Step 5:
     * Separate notification characteristics from
     * writable command characteristics.
     */
    const candidates = findOximeterCharacteristicCandidates(characteristics);

    const measurementCandidate = candidates.measurementCandidates[0];

    const commandCandidate = candidates.commandCandidates[0] ?? null;

    if (!measurementCandidate) {
      throw new DOMException(
        "No notification or indication characteristic was found for the selected oximeter.",
        "NotFoundError",
      );
    }

    /**
     * Step 6:
     * Build the serializable BLE profile.
     *
     * This profile contains UUIDs and device identity,
     * but no live browser Bluetooth objects.
     */
    const profile = buildOximeterProfile(
      device,
      measurementCandidate,
      commandCandidate,
    );

    bluetoothManager.setProfile(profile);

    /**
     * Step 7:
     * Recover the real browser measurement
     * characteristic.
     */
    const measurementCharacteristic = await getOximeterCharacteristic(
      server,
      measurementCandidate.serviceUuid,
      measurementCandidate.characteristicUuid,
    );

    bluetoothManager.setMeasurementCharacteristic(measurementCharacteristic);

    /**
     * Step 8:
     * Recover the optional writable command
     * characteristic.
     */
    let commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

    if (commandCandidate) {
      commandCharacteristic = await getOximeterCharacteristic(
        server,
        commandCandidate.serviceUuid,
        commandCandidate.characteristicUuid,
      );

      bluetoothManager.setCommandCharacteristic(commandCharacteristic);
    } else {
      bluetoothManager.setCommandCharacteristic(null);
    }

    /**
     * Step 9:
     * Subscribe to live measurement notifications.
     */
    const stopNotifications = await subscribeToOximeterNotifications(
      measurementCharacteristic,
      onNotification,
    );

    bluetoothManager.setNotificationCleanup(stopNotifications);

    /**
     * Step 10:
     * Confirm that the GATT connection is still
     * active after discovery and subscription.
     */
    if (!bluetoothManager.isConnected()) {
      throw new DOMException(
        "The oximeter disconnected before notification setup completed.",
        "NetworkError",
      );
    }

    return {
      device,
      server,
      profile,
      measurementCharacteristic,
      commandCharacteristic,

      serviceCount: services.length,

      characteristicCount: characteristics.length,

      measurementCandidateCount: candidates.measurementCandidates.length,

      commandCandidateCount: candidates.commandCandidates.length,
    };
  } catch (error) {
    /**
     * Clean up a partially completed connection.
     *
     * For example:
     * - GATT connected but discovery failed
     * - characteristic found but notification failed
     * - device disconnected during setup
     */
    await bluetoothManager.disconnect();

    throw error;
  }
}
