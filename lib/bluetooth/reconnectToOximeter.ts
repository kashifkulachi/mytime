// import type { OximeterBleProfile } from "@/lib/bluetooth/buildOximeterProfile";
// import { connectOximeterDevice } from "@/lib/bluetooth/connectOximeterDevice";
// import {
//   getPreviouslyPermittedOximeter,
//   type PreviouslyPermittedOximeterResult,
// } from "@/lib/bluetooth/getPreviouslyPermittedOximeter";
// import { getOximeterCharacteristic } from "@/lib/bluetooth/getOximeterCharacteristic";
// import { OximeterBluetoothManager } from "@/lib/bluetooth/OximeterBluetoothManager";
// import { subscribeToOximeterNotifications } from "@/lib/bluetooth/subscribeToOximeterNotifications";

// /**
//  * Reasons why automatic reconnection could not begin.
//  *
//  * These are normal fallback situations rather than
//  * Bluetooth connection errors.
//  */
// export type OximeterReconnectUnavailableReason =
//   | "NO_SAVED_PROFILE"
//   | "GET_DEVICES_UNSUPPORTED"
//   | "PERMITTED_DEVICE_NOT_FOUND";

// export interface ReconnectToOximeterOptions {
//   /**
//    * Stores the restored live Bluetooth objects.
//    */
//   bluetoothManager: OximeterBluetoothManager;

//   /**
//    * Receives every BLE notification after the
//    * notification subscription has been restored.
//    */
//   onNotification: (value: DataView) => void;

//   /**
//    * Disconnects any current manager connection
//    * before reconnecting.
//    *
//    * Defaults to true.
//    */
//   disconnectExistingConnection?: boolean;
// }

// export interface ReconnectedOximeter {
//   status: "connected";

//   device: BluetoothDevice;

//   server: BluetoothRemoteGATTServer;

//   profile: OximeterBleProfile;

//   measurementCharacteristic: BluetoothRemoteGATTCharacteristic;

//   commandCharacteristic: BluetoothRemoteGATTCharacteristic | null;
// }

// export interface OximeterReconnectUnavailable {
//   status: "unavailable";

//   reason: OximeterReconnectUnavailableReason;

//   profile: OximeterBleProfile | null;
// }

// export type ReconnectToOximeterResult =
//   | ReconnectedOximeter
//   | OximeterReconnectUnavailable;

// /**
//  * Determines why a previously permitted device
//  * could not be retrieved.
//  */
// function getUnavailableResult(
//   previousDeviceResult: PreviouslyPermittedOximeterResult,
// ): OximeterReconnectUnavailable {
//   if (!previousDeviceResult.savedProfile) {
//     return {
//       status: "unavailable",
//       reason: "NO_SAVED_PROFILE",
//       profile: null,
//     };
//   }

//   if (!previousDeviceResult.supportsPreviouslyPermittedDevices) {
//     return {
//       status: "unavailable",
//       reason: "GET_DEVICES_UNSUPPORTED",
//       profile: previousDeviceResult.savedProfile,
//     };
//   }

//   return {
//     status: "unavailable",
//     reason: "PERMITTED_DEVICE_NOT_FOUND",
//     profile: previousDeviceResult.savedProfile,
//   };
// }

// type OximeterProfileWithCommand = OximeterBleProfile & {
//   commandServiceUuid: string;
//   commandCharacteristicUuid: string;
// };

// /**
//  * Checks that command UUIDs are either both present
//  * or both absent.
//  *
//  * A command characteristic cannot be recovered when
//  * only one of its UUIDs exists.
//  */
// function hasCompleteCommandProfile(
//   profile: OximeterBleProfile,
// ): profile is OximeterProfileWithCommand {
//   return Boolean(
//     profile.commandServiceUuid && profile.commandCharacteristicUuid,
//   );
// }

// /**
//  * Reconnects to an oximeter previously authorized
//  * for the current browser origin.
//  *
//  * This function does not open the Bluetooth device
//  * chooser.
//  *
//  * It returns status "unavailable" when automatic
//  * reconnection cannot be attempted. It throws only
//  * when the device was found but the actual GATT,
//  * characteristic, or notification setup failed.
//  */
// export async function reconnectToOximeter({
//   bluetoothManager,
//   onNotification,
//   disconnectExistingConnection = true,
// }: ReconnectToOximeterOptions): Promise<ReconnectToOximeterResult> {
//   if (typeof onNotification !== "function") {
//     throw new TypeError("An onNotification callback is required.");
//   }

//   /**
//    * Retrieve the saved profile and matching
//    * BluetoothDevice, when supported.
//    */
//   const previousDeviceResult = await getPreviouslyPermittedOximeter();

//   if (!previousDeviceResult.permittedOximeter) {
//     return getUnavailableResult(previousDeviceResult);
//   }

//   const { device, profile } = previousDeviceResult.permittedOximeter;

//   try {
//     /**
//      * Remove a previous notification listener and
//      * close any previous GATT connection managed by
//      * this manager.
//      */
//     if (disconnectExistingConnection) {
//       await bluetoothManager.disconnect();
//     }

//     /**
//      * Restore the permitted BluetoothDevice before
//      * beginning the new GATT connection.
//      */
//     bluetoothManager.setDevice(device);

//     /**
//      * A page refresh destroys the old JavaScript GATT
//      * server object. Establish a completely new GATT
//      * connection using the restored device.
//      */
//     const server = await connectOximeterDevice(device);

//     bluetoothManager.setServer(server);

//     /**
//      * Recover the measurement characteristic directly
//      * from the UUIDs saved in the BLE profile.
//      *
//      * Full service and characteristic discovery is not
//      * required because these UUIDs were established
//      * during the original successful connection.
//      */
//     const measurementCharacteristic = await getOximeterCharacteristic(
//       server,
//       profile.measurementServiceUuid,
//       profile.measurementCharacteristicUuid,
//     );

//     bluetoothManager.setMeasurementCharacteristic(measurementCharacteristic);

//     /**
//      * Restore the optional writable command
//      * characteristic when both command UUIDs exist.
//      */
//     let commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

//     if (hasCompleteCommandProfile(profile)) {
//       commandCharacteristic = await getOximeterCharacteristic(
//         server,
//         profile.commandServiceUuid,
//         profile.commandCharacteristicUuid,
//       );

//       bluetoothManager.setCommandCharacteristic(commandCharacteristic);
//     } else {
//       bluetoothManager.setCommandCharacteristic(null);
//     }

//     /**
//      * Restore live notification listening.
//      */
//     const stopNotifications = await subscribeToOximeterNotifications(
//       measurementCharacteristic,
//       onNotification,
//     );

//     bluetoothManager.setNotificationCleanup(stopNotifications);

//     /**
//      * Restore the serializable profile inside the
//      * manager.
//      */
//     bluetoothManager.setProfile(profile);

//     if (!bluetoothManager.isConnected()) {
//       throw new DOMException(
//         "The oximeter disconnected before reconnection completed.",
//         "NetworkError",
//       );
//     }

//     return {
//       status: "connected",

//       device,
//       server,
//       profile,

//       measurementCharacteristic,
//       commandCharacteristic,
//     };
//   } catch (error) {
//     /**
//      * Clean up a partially restored connection.
//      *
//      * The saved profile remains in localStorage so the
//      * user can retry or use the normal Scan button.
//      */
//     await bluetoothManager.disconnect();

//     throw error;
//   }
// }

import type { OximeterBleProfile } from "@/lib/bluetooth/buildOximeterProfile";
import { connectOximeterDevice } from "@/lib/bluetooth/connectOximeterDevice";
import {
  getPreviouslyPermittedOximeter,
  type PreviouslyPermittedOximeterResult,
} from "@/lib/bluetooth/getPreviouslyPermittedOximeter";
import { getOximeterCharacteristic } from "@/lib/bluetooth/getOximeterCharacteristic";
import { OximeterBluetoothManager } from "@/lib/bluetooth/OximeterBluetoothManager";
import { subscribeToOximeterNotifications } from "@/lib/bluetooth/subscribeToOximeterNotifications";

export type OximeterReconnectUnavailableReason =
  | "NO_SAVED_PROFILE"
  | "GET_DEVICES_UNSUPPORTED"
  | "PERMITTED_DEVICE_NOT_FOUND";

export interface ReconnectToOximeterOptions {
  bluetoothManager: OximeterBluetoothManager;
  onNotification: (value: DataView) => void;
  disconnectExistingConnection?: boolean;
}

export interface ReconnectedOximeter {
  status: "connected";

  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  profile: OximeterBleProfile;

  measurementCharacteristic: BluetoothRemoteGATTCharacteristic;

  commandCharacteristic: BluetoothRemoteGATTCharacteristic | null;
}

export interface OximeterReconnectUnavailable {
  status: "unavailable";
  reason: OximeterReconnectUnavailableReason;
  profile: OximeterBleProfile | null;
}

export type ReconnectToOximeterResult =
  | ReconnectedOximeter
  | OximeterReconnectUnavailable;

type OximeterProfileWithCommand = OximeterBleProfile & {
  commandServiceUuid: string;
  commandCharacteristicUuid: string;
};

function hasCompleteCommandProfile(
  profile: OximeterBleProfile,
): profile is OximeterProfileWithCommand {
  return Boolean(
    profile.commandServiceUuid && profile.commandCharacteristicUuid,
  );
}

function getUnavailableResult(
  result: PreviouslyPermittedOximeterResult,
): OximeterReconnectUnavailable {
  if (!result.savedProfile) {
    return {
      status: "unavailable",
      reason: "NO_SAVED_PROFILE",
      profile: null,
    };
  }

  if (!result.supportsPreviouslyPermittedDevices) {
    return {
      status: "unavailable",
      reason: "GET_DEVICES_UNSUPPORTED",
      profile: result.savedProfile,
    };
  }

  return {
    status: "unavailable",
    reason: "PERMITTED_DEVICE_NOT_FOUND",
    profile: result.savedProfile,
  };
}

function createReconnectError(stage: string, error: unknown): Error {
  const originalMessage =
    error instanceof Error ? error.message : String(error);

  return new Error(
    `Oximeter reconnect failed during ${stage}: ${originalMessage}`,
    {
      cause: error,
    },
  );
}

export async function reconnectToOximeter({
  bluetoothManager,
  onNotification,
  disconnectExistingConnection = true,
}: ReconnectToOximeterOptions): Promise<ReconnectToOximeterResult> {
  if (typeof onNotification !== "function") {
    throw new TypeError("An onNotification callback is required.");
  }

  const previousDeviceResult = await getPreviouslyPermittedOximeter();

  if (!previousDeviceResult.permittedOximeter) {
    return getUnavailableResult(previousDeviceResult);
  }

  const { device, profile } = previousDeviceResult.permittedOximeter;

  try {
    if (disconnectExistingConnection) {
      await bluetoothManager.disconnect();
    }

    bluetoothManager.setDevice(device);

    let server: BluetoothRemoteGATTServer;

    try {
      server = await connectOximeterDevice(device, {
        waitForAdvertisement: true,
        advertisementTimeoutMs: 10_000,
      });
    } catch (error) {
      throw createReconnectError("GATT connection", error);
    }

    bluetoothManager.setServer(server);

    let measurementCharacteristic: BluetoothRemoteGATTCharacteristic;

    try {
      measurementCharacteristic = await getOximeterCharacteristic(
        server,
        profile.measurementServiceUuid,
        profile.measurementCharacteristicUuid,
      );
    } catch (error) {
      throw createReconnectError("measurement characteristic recovery", error);
    }

    bluetoothManager.setMeasurementCharacteristic(measurementCharacteristic);

    /**
     * The command characteristic is optional.
     *
     * Failure to recover it must not prevent us from
     * receiving SpO₂ and heart-rate notifications.
     */
    let commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

    if (hasCompleteCommandProfile(profile)) {
      try {
        commandCharacteristic = await getOximeterCharacteristic(
          server,
          profile.commandServiceUuid,
          profile.commandCharacteristicUuid,
        );
      } catch (error) {
        console.warn(
          "The optional oximeter command characteristic could not be restored.",
          error,
        );

        commandCharacteristic = null;
      }
    }

    bluetoothManager.setCommandCharacteristic(commandCharacteristic);

    let stopNotifications: () => Promise<void>;

    try {
      stopNotifications = await subscribeToOximeterNotifications(
        measurementCharacteristic,
        onNotification,
      );
    } catch (error) {
      throw createReconnectError("notification subscription", error);
    }

    bluetoothManager.setNotificationCleanup(stopNotifications);

    bluetoothManager.setProfile(profile);

    if (!server.connected) {
      throw createReconnectError(
        "connection verification",
        new DOMException(
          "The GATT server disconnected before setup completed.",
          "NetworkError",
        ),
      );
    }

    return {
      status: "connected",

      device,
      server,
      profile,

      measurementCharacteristic,
      commandCharacteristic,
    };
  } catch (error) {
    await bluetoothManager.disconnect();

    throw error;
  }
}
