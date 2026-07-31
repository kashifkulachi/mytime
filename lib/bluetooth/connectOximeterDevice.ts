// // src/lib/bluetooth/connectOximeterDevice.ts

// /**
//  * Connects a previously selected Bluetooth device
//  * to its remote GATT server.
//  */
// export async function connectOximeterDevice(
//   device: BluetoothDevice,
// ): Promise<BluetoothRemoteGATTServer> {
//   /**
//    * Some Bluetooth devices do not expose a GATT server.
//    * BLE oximeters normally should expose one.
//    */
//   if (!device.gatt) {
//     throw new DOMException(
//       "The selected device does not provide a Bluetooth GATT server.",
//       "NotSupportedError",
//     );
//   }

//   /**
//    * If the device is already connected, return the
//    * existing GATT server instead of connecting again.
//    */
//   if (device.gatt.connected) {
//     return device.gatt;
//   }

//   const server = await device.gatt.connect();

//   return server;
// }

const DEFAULT_ADVERTISEMENT_TIMEOUT_MS = 10_000;

interface BluetoothDeviceWithAdvertisementSupport extends BluetoothDevice {
  unwatchAdvertisements?: () => void;
}

interface ConnectOximeterDeviceOptions {
  waitForAdvertisement?: boolean;
  advertisementTimeoutMs?: number;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

/**
 * Wait until Chrome detects a fresh advertisement from
 * a previously permitted Bluetooth device.
 *
 * This is useful on Windows because getDevices() may
 * return a permitted BluetoothDevice whose presence
 * information is stale.
 */
async function waitForDeviceAdvertisement(
  device: BluetoothDevice,
  timeoutMs: number,
): Promise<boolean> {
  const advertisementDevice = device as BluetoothDeviceWithAdvertisementSupport;

  if (typeof advertisementDevice.watchAdvertisements !== "function") {
    return false;
  }

  return new Promise<boolean>(async (resolve) => {
    let timeoutId: number | null = null;
    let isFinished = false;

    const finish = (wasAdvertisementReceived: boolean) => {
      if (isFinished) {
        return;
      }

      isFinished = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      device.removeEventListener("advertisementreceived", handleAdvertisement);

      advertisementDevice.unwatchAdvertisements?.();

      resolve(wasAdvertisementReceived);
    };

    const handleAdvertisement = (event: Event) => {
      const bluetoothEvent = event as BluetoothAdvertisingEvent;

      if (bluetoothEvent.device.id !== device.id) {
        return;
      }

      finish(true);
    };

    device.addEventListener("advertisementreceived", handleAdvertisement);

    timeoutId = window.setTimeout(() => {
      finish(false);
    }, timeoutMs);

    try {
      await advertisementDevice.watchAdvertisements!();
    } catch {
      finish(false);
    }
  });
}

/**
 * Connect to an oximeter's GATT server.
 *
 * During reconnect, waitForAdvertisement should be true.
 * During a fresh requestDevice() scan, it can be false
 * because the browser has just discovered the device.
 */
export async function connectOximeterDevice(
  device: BluetoothDevice,
  options: ConnectOximeterDeviceOptions = {},
): Promise<BluetoothRemoteGATTServer> {
  const {
    waitForAdvertisement = false,
    advertisementTimeoutMs = DEFAULT_ADVERTISEMENT_TIMEOUT_MS,
  } = options;

  if (!device.gatt) {
    throw new Error(
      "The selected Bluetooth device does not expose a GATT server.",
    );
  }

  if (device.gatt.connected) {
    return device.gatt;
  }

  if (waitForAdvertisement) {
    await waitForDeviceAdvertisement(device, advertisementTimeoutMs);

    /*
     * Give Windows a brief moment to update its BLE
     * device cache after receiving the advertisement.
     */
    await wait(300);
  }

  try {
    return await device.gatt.connect();
  } catch (firstError) {
    /*
     * A second attempt can recover from temporary
     * Windows/Chrome GATT state immediately after
     * advertisement discovery.
     */
    await wait(1_000);

    if (device.gatt.connected) {
      return device.gatt;
    }

    try {
      return await device.gatt.connect();
    } catch {
      throw firstError;
    }
  }
}
