// src/lib/bluetooth/OximeterBluetoothManager.ts

import type { OximeterBleProfile } from "@/lib/bluetooth/buildOximeterProfile";

type StopNotifications = () => Promise<void>;

/**
 * Stores and manages the live Bluetooth objects
 * used by the oximeter connection.
 *
 * Important:
 * Live Bluetooth objects should not be stored in
 * localStorage because they cannot be serialized.
 *
 * They also should not be placed directly inside
 * the assessment data that may later be submitted
 * to an API.
 */
export class OximeterBluetoothManager {
  private device: BluetoothDevice | null = null;

  private server: BluetoothRemoteGATTServer | null = null;

  private measurementCharacteristic: BluetoothRemoteGATTCharacteristic | null =
    null;

  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null =
    null;

  private profile: OximeterBleProfile | null = null;

  private stopNotifications: StopNotifications | null = null;

  /**
   * Saves the currently selected Bluetooth device.
   */
  setDevice(device: BluetoothDevice): void {
    this.device = device;
  }

  /**
   * Saves the connected GATT server.
   */
  setServer(server: BluetoothRemoteGATTServer): void {
    this.server = server;
  }

  /**
   * Saves the real measurement characteristic.
   */
  setMeasurementCharacteristic(
    characteristic: BluetoothRemoteGATTCharacteristic,
  ): void {
    this.measurementCharacteristic = characteristic;
  }

  /**
   * Saves the optional writable command
   * characteristic.
   */
  setCommandCharacteristic(
    characteristic: BluetoothRemoteGATTCharacteristic | null,
  ): void {
    this.commandCharacteristic = characteristic;
  }

  /**
   * Saves the serializable oximeter profile.
   */
  setProfile(profile: OximeterBleProfile): void {
    this.profile = profile;
  }

  /**
   * Saves the function used to stop the current
   * notification subscription.
   */
  setNotificationCleanup(cleanup: StopNotifications): void {
    this.stopNotifications = cleanup;
  }

  getDevice(): BluetoothDevice | null {
    return this.device;
  }

  getServer(): BluetoothRemoteGATTServer | null {
    return this.server;
  }

  getMeasurementCharacteristic(): BluetoothRemoteGATTCharacteristic | null {
    return this.measurementCharacteristic;
  }

  getCommandCharacteristic(): BluetoothRemoteGATTCharacteristic | null {
    return this.commandCharacteristic;
  }

  getProfile(): OximeterBleProfile | null {
    return this.profile;
  }

  /**
   * Returns true only when a device has an active
   * GATT connection.
   */
  isConnected(): boolean {
    return Boolean(this.device?.gatt?.connected && this.server?.connected);
  }

  /**
   * Stops the active notification subscription.
   */
  async stopListening(): Promise<void> {
    if (!this.stopNotifications) {
      return;
    }

    const cleanup = this.stopNotifications;

    this.stopNotifications = null;

    await cleanup();
  }

  /**
   * Stops notifications, disconnects the device,
   * and clears all live Bluetooth references.
   *
   * The serializable profile is kept by default so
   * it can later be used for reconnection.
   */
  async disconnect(clearProfile = false): Promise<void> {
    await this.stopListening();

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }

    this.server = null;
    this.measurementCharacteristic = null;
    this.commandCharacteristic = null;
    this.device = null;

    if (clearProfile) {
      this.profile = null;
    }
  }

  /**
   * Clears every stored value.
   *
   * This will eventually be used when the user
   * chooses to forget or unpair the oximeter.
   */
  async reset(): Promise<void> {
    await this.disconnect(true);
  }
}
