// src/types/oximeter.ts

/**
 * Represents the final oximeter values that will be saved
 * inside the assessment context.
 */
export interface OximeterData {
  spo2: number;
  heartRate: number;
}

/**
 * Represents a valid live measurement received
 * from the Bluetooth oximeter.
 */
export interface OximeterMeasurement {
  spo2: number;
  heartRate: number;
  receivedAt: number;
}

/**
 * Represents the current Bluetooth connection state.
 */
export type OximeterConnectionStatus =
  | "idle"
  | "scanning"
  | "connecting"
  | "discovering"
  | "subscribing"
  | "waiting-for-reading"
  | "receiving"
  | "disconnected"
  | "error";

/**
 * Represents a Bluetooth characteristic discovered
 * inside the selected oximeter.
 */
export interface DiscoveredCharacteristic {
  serviceUuid: string;
  characteristicUuid: string;

  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
}
