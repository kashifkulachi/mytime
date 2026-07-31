"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import type { OximeterBleProfile } from "@/lib/bluetooth/buildOximeterProfile";
import { connectToOximeter } from "@/lib/bluetooth/connectToOximeter";
import { dataViewToUint8Array } from "@/lib/bluetooth/dataViewToUint8Array";
import { getBluetoothErrorMessage } from "@/lib/bluetooth/getBluetoothErrorMessage";
import { OximeterBluetoothManager } from "@/lib/bluetooth/OximeterBluetoothManager";
import {
  hasStoredOximeterProfile,
  removeOximeterProfile,
  saveOximeterProfile,
  subscribeToOximeterProfile,
} from "@/lib/bluetooth/oximeterProfileStorage";
import { parseOximeterNotification } from "@/lib/bluetooth/parseOximeterNotification";
import {
  OximeterReconnectUnavailableReason,
  reconnectToOximeter,
} from "@/lib/bluetooth/reconnectToOximeter";
import { subscribeToOximeterNotifications } from "@/lib/bluetooth/subscribeToOximeterNotifications";

/**
 * Controls the complete browser Bluetooth lifecycle
 * for the oximeter.
 *
 * It handles:
 *
 * - scanning
 * - connecting
 * - reconnecting
 * - disconnecting
 * - notification listening
 * - measurement parsing
 * - localStorage profile persistence
 */
export function useOximeterBluetooth() {
  const [isScanning, setIsScanning] = useState(false);

  const [isRetryingMeasurement, setIsRetryingMeasurement] = useState(false);

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [isReconnecting, setIsReconnecting] = useState(false);

  const [selectedDeviceName, setSelectedDeviceName] = useState<string | null>(
    null,
  );

  const [isDeviceConnected, setIsDeviceConnected] = useState(false);

  const [isListeningForNotifications, setIsListeningForNotifications] =
    useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [spo2, setSpo2] = useState<number | null>(null);

  const [heartRate, setHeartRate] = useState<number | null>(null);

  const [notificationCount, setNotificationCount] = useState(0);

  const [validMeasurementCount, setValidMeasurementCount] = useState(0);

  const [latestNotificationByteLength, setLatestNotificationByteLength] =
    useState<number | null>(null);

  const [latestNotificationBytes, setLatestNotificationBytes] = useState<
    number[]
  >([]);

  const [discoveredServiceCount, setDiscoveredServiceCount] = useState(0);

  const [discoveredCharacteristicCount, setDiscoveredCharacteristicCount] =
    useState(0);

  const [measurementCandidateCount, setMeasurementCandidateCount] = useState(0);

  const [commandCandidateCount, setCommandCandidateCount] = useState(0);

  const [
    selectedMeasurementCharacteristicUuid,
    setSelectedMeasurementCharacteristicUuid,
  ] = useState<string | null>(null);

  const [
    selectedCommandCharacteristicUuid,
    setSelectedCommandCharacteristicUuid,
  ] = useState<string | null>(null);

  const [oximeterProfile, setOximeterProfile] =
    useState<OximeterBleProfile | null>(null);

  const [reconnectUnavailableReason, setReconnectUnavailableReason] =
    useState<OximeterReconnectUnavailableReason | null>(null);

  const [requiresDeviceReauthorization, setRequiresDeviceReauthorization] =
    useState(false);

  /**
   * React safely reads whether a saved profile exists.
   *
   * Server render:
   * false
   *
   * Initial hydration:
   * false
   *
   * After hydration:
   * localStorage is checked and the real value is used.
   */
  const hasSavedDevice = useSyncExternalStore(
    subscribeToOximeterProfile,
    hasStoredOximeterProfile,
    () => false,
  );

  /**
   * Create only one Bluetooth manager instance
   * for the lifetime of this hook.
   */
  const [bluetoothManager] = useState(() => new OximeterBluetoothManager());

  /**
   * Clears only the current SpO₂ and heart-rate result.
   *
   * It does not disconnect the device.
   */
  const clearMeasurement = useCallback((): void => {
    // setSpo2(null);
    // setHeartRate(null);

    setNotificationCount(0);
    setValidMeasurementCount(0);

    setLatestNotificationByteLength(null);
    setLatestNotificationBytes([]);
  }, []);

  /**
   * Clears React connection state.
   *
   * It does not directly call the Bluetooth API.
   */
  const clearConnectionState = useCallback((): void => {
    setIsDeviceConnected(false);
    setIsListeningForNotifications(false);

    setSelectedMeasurementCharacteristicUuid(null);
    setSelectedCommandCharacteristicUuid(null);
  }, []);

  /**
   * Clears all displayed Bluetooth information.
   *
   * This function intentionally does not remove
   * the localStorage profile.
   */
  const resetDisplayedState = useCallback((): void => {
    setErrorMessage(null);
    setSelectedDeviceName(null);

    clearConnectionState();
    clearMeasurement();

    setDiscoveredServiceCount(0);
    setDiscoveredCharacteristicCount(0);

    setMeasurementCandidateCount(0);
    setCommandCandidateCount(0);

    setOximeterProfile(null);
  }, [clearConnectionState, clearMeasurement]);

  /**
   * Processes every incoming BLE notification.
   */
  const handleIncomingNotification = useCallback((value: DataView): void => {
    const bytes = dataViewToUint8Array(value);

    setNotificationCount((currentCount) => currentCount + 1);

    setLatestNotificationByteLength(bytes.length);
    setLatestNotificationBytes(Array.from(bytes));

    const measurement = parseOximeterNotification(value);

    /**
     * Ignore status packets, incomplete packets,
     * and packets that do not contain valid readings.
     */
    if (!measurement) {
      return;
    }

    setSpo2(measurement.spo2);
    setHeartRate(measurement.heartRate);

    setValidMeasurementCount((currentCount) => currentCount + 1);
  }, []);

  /**
   * Handles unexpected physical disconnection.
   *
   * The saved localStorage profile remains available,
   * so the user can reconnect later.
   */
  const handleGattDisconnected = useCallback((): void => {
    setIsDeviceConnected(false);
    setIsListeningForNotifications(false);

    setIsScanning(false);
    setIsReconnecting(false);
    setIsRetryingMeasurement(false);

    void bluetoothManager.stopListening();

    setErrorMessage(
      "The oximeter disconnected. Please reconnect or scan again.",
    );
  }, [bluetoothManager]);

  /**
   * Opens the browser Bluetooth chooser and creates
   * a completely new connection.
   */
  const scan = useCallback(async (): Promise<void> => {
    if (isScanning || isReconnecting) {
      return;
    }

    try {
      setIsScanning(true);
      setErrorMessage(null);
      setReconnectUnavailableReason(null);

      const previousDevice = bluetoothManager.getDevice();

      previousDevice?.removeEventListener(
        "gattserverdisconnected",
        handleGattDisconnected,
      );

      resetDisplayedState();

      const result = await connectToOximeter({
        bluetoothManager,
        onNotification: handleIncomingNotification,
      });

      result.device.addEventListener(
        "gattserverdisconnected",
        handleGattDisconnected,
      );

      setSelectedDeviceName(
        result.device.name ??
          result.profile.deviceName ??
          "Unnamed Bluetooth device",
      );

      setIsDeviceConnected(result.server.connected);
      setIsListeningForNotifications(true);

      setDiscoveredServiceCount(result.serviceCount);

      setDiscoveredCharacteristicCount(result.characteristicCount);

      setMeasurementCandidateCount(result.measurementCandidateCount);

      setCommandCandidateCount(result.commandCandidateCount);

      setSelectedMeasurementCharacteristicUuid(
        result.measurementCharacteristic.uuid,
      );

      setSelectedCommandCharacteristicUuid(
        result.commandCharacteristic?.uuid ?? null,
      );

      /**
       * Keep the profile in React state for the
       * current browser session.
       */
      setOximeterProfile(result.profile);

      /**
       * Save the serializable BLE profile to
       * localStorage for future reconnect attempts.
       *
       * This also notifies useSyncExternalStore,
       * causing hasSavedDevice to become true.
       */
      saveOximeterProfile(result.profile);

      setRequiresDeviceReauthorization(false);

      setReconnectUnavailableReason(null);
      setErrorMessage(null);
    } catch (error) {
      clearConnectionState();

      setErrorMessage(getBluetoothErrorMessage(error));
    } finally {
      setIsScanning(false);
    }
  }, [
    bluetoothManager,
    clearConnectionState,
    handleGattDisconnected,
    handleIncomingNotification,
    isReconnecting,
    isScanning,
    resetDisplayedState,
  ]);

  /**
   * Reconnects to a previously permitted and saved
   * oximeter without opening the device chooser.
   */
  const reconnect = useCallback(async (): Promise<boolean> => {
    if (isScanning || isReconnecting || isDisconnecting) {
      return false;
    }

    // if (!hasSavedDevice) {
    //   setErrorMessage(
    //     "No saved oximeter was found. Please scan for the device first.",
    //   );

    //   return false;
    // }

    try {
      setIsReconnecting(true);
      setErrorMessage(null);
      setReconnectUnavailableReason(null);

      const currentDevice = bluetoothManager.getDevice();

      currentDevice?.removeEventListener(
        "gattserverdisconnected",
        handleGattDisconnected,
      );

      const result = await reconnectToOximeter({
        bluetoothManager,
        onNotification: handleIncomingNotification,
      });

      if (result.status === "unavailable") {
        setReconnectUnavailableReason(result.reason);

        setIsDeviceConnected(false);
        setIsListeningForNotifications(false);

        // switch (result.reason) {
        //   case "NO_SAVED_PROFILE":
        //     setErrorMessage(
        //       "No previously connected oximeter was found. Please scan and connect your oximeter first.",
        //     );
        //     break;

        //   // case "PERMITTED_DEVICE_NOT_FOUND":
        //   //   setErrorMessage(
        //   //     "The previously connected oximeter could not be found. Please scan and connect it again.",
        //   //   );
        //   //   break;

        //   case "GET_DEVICES_UNSUPPORTED":
        //     setErrorMessage(
        //       "Your browser doesn't support automatic Bluetooth reconnection. Use 'Scan for Oximeter' instead. If you're using Chrome, you may also enable the experimental Web Bluetooth 'getDevices' feature from chrome://flags if available.",
        //     );
        //     break;
        // }

        if (result.status === "unavailable") {
          setReconnectUnavailableReason(result.reason);

          setIsDeviceConnected(false);
          setIsListeningForNotifications(false);

          switch (result.reason) {
            case "NO_SAVED_PROFILE": {
              setRequiresDeviceReauthorization(false);

              setErrorMessage(
                "No saved oximeter was found. Please scan and authorize the device first.",
              );

              break;
            }

            case "GET_DEVICES_UNSUPPORTED": {
              setRequiresDeviceReauthorization(false);

              setErrorMessage(
                "This browser cannot retrieve previously authorized Bluetooth devices. Use Scan for Oximeter. In supported Chrome installations, the required persistent Bluetooth permission feature may need to be enabled before authorizing the device.",
              );

              break;
            }

            case "PERMITTED_DEVICE_NOT_FOUND": {
              /**
               * Our application still has a saved profile,
               * but Chrome's current permission store does
               * not contain the corresponding device.
               *
               * The profile cannot restore browser permission.
               * requestDevice() must be used again.
               */
              removeOximeterProfile();

              setRequiresDeviceReauthorization(true);

              setErrorMessage(
                "The saved oximeter authorization is no longer valid. Please select the device again using Scan for Oximeter.",
              );

              break;
            }
          }

          return false;
        }

        return true;
      }

      /**
       * Ensure the listener is attached only once.
       */
      result.device.removeEventListener(
        "gattserverdisconnected",
        handleGattDisconnected,
      );

      result.device.addEventListener(
        "gattserverdisconnected",
        handleGattDisconnected,
      );

      setSelectedDeviceName(
        result.device.name ?? result.profile.deviceName ?? "Oximeter",
      );

      setOximeterProfile(result.profile);

      setSelectedMeasurementCharacteristicUuid(
        result.measurementCharacteristic.uuid,
      );

      setSelectedCommandCharacteristicUuid(
        result.commandCharacteristic?.uuid ?? null,
      );

      setIsDeviceConnected(bluetoothManager.isConnected());

      setIsListeningForNotifications(true);

      /**
       * Save the latest profile again in case any
       * service or characteristic information changed.
       */
      saveOximeterProfile(result.profile);

      return true;
    } catch (error) {
      console.error("Full oximeter reconnect error:", error);

      await bluetoothManager.disconnect();

      setIsDeviceConnected(false);
      setIsListeningForNotifications(false);

      setErrorMessage(getBluetoothErrorMessage(error));

      return false;
    } finally {
      setIsReconnecting(false);
    }
  }, [
    bluetoothManager,
    handleGattDisconnected,
    handleIncomingNotification,
    isDisconnecting,
    isReconnecting,
    isScanning,
  ]);

  /**
   * Restarts notifications while keeping the same
   * Bluetooth connection.
   */
  const retryMeasurement = useCallback(async (): Promise<void> => {
    if (isRetryingMeasurement) {
      return;
    }

    try {
      setIsRetryingMeasurement(true);
      setErrorMessage(null);

      if (!bluetoothManager.isConnected()) {
        throw new DOMException(
          "The oximeter is no longer connected. Please reconnect or scan again.",
          "NetworkError",
        );
      }

      const measurementCharacteristic =
        bluetoothManager.getMeasurementCharacteristic();

      if (!measurementCharacteristic) {
        throw new DOMException(
          "The measurement characteristic is unavailable. Please reconnect or scan again.",
          "NotFoundError",
        );
      }

      await bluetoothManager.stopListening();

      setIsListeningForNotifications(false);

      clearMeasurement();

      const stopNotifications = await subscribeToOximeterNotifications(
        measurementCharacteristic,
        handleIncomingNotification,
      );

      bluetoothManager.setNotificationCleanup(stopNotifications);

      setIsListeningForNotifications(true);

      setIsDeviceConnected(bluetoothManager.isConnected());
    } catch (error) {
      setIsListeningForNotifications(false);

      setErrorMessage(getBluetoothErrorMessage(error));
    } finally {
      setIsRetryingMeasurement(false);
    }
  }, [
    bluetoothManager,
    clearMeasurement,
    handleIncomingNotification,
    isRetryingMeasurement,
  ]);

  /**
   * Disconnects the current GATT connection.
   *
   * Important:
   * The saved localStorage profile is not removed.
   * Therefore, the reconnect button can appear after
   * a normal disconnection.
   */
  const disconnect = useCallback(async (): Promise<void> => {
    if (isDisconnecting) {
      return;
    }

    try {
      setIsDisconnecting(true);
      setErrorMessage(null);

      const device = bluetoothManager.getDevice();

      device?.removeEventListener(
        "gattserverdisconnected",
        handleGattDisconnected,
      );

      await bluetoothManager.disconnect();

      clearConnectionState();
      clearMeasurement();
    } catch (error) {
      setErrorMessage(getBluetoothErrorMessage(error));
    } finally {
      setIsDisconnecting(false);
    }
  }, [
    bluetoothManager,
    clearConnectionState,
    clearMeasurement,
    handleGattDisconnected,
    isDisconnecting,
  ]);

  /**
   * Disconnects the device and removes its saved
   * profile from localStorage.
   */
  const forgetDevice = useCallback(async (): Promise<void> => {
    try {
      setErrorMessage(null);

      const device = bluetoothManager.getDevice();

      device?.removeEventListener(
        "gattserverdisconnected",
        handleGattDisconnected,
      );

      /**
       * Clear live Bluetooth objects stored
       * inside the manager.
       */
      await bluetoothManager.reset();

      /**
       * Remove the serializable profile from
       * localStorage.
       *
       * This notifies useSyncExternalStore, causing
       * hasSavedDevice to become false.
       */
      removeOximeterProfile();

      setReconnectUnavailableReason(null);

      resetDisplayedState();
    } catch (error) {
      setErrorMessage(getBluetoothErrorMessage(error));
    }
  }, [bluetoothManager, handleGattDisconnected, resetDisplayedState]);

  /**
   * Dismisses the current displayed error.
   */
  const clearError = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  /**
   * Disconnects when the component using this hook
   * is unmounted.
   *
   * It intentionally does not remove the saved
   * localStorage profile.
   */
  useEffect(() => {
    return () => {
      const device = bluetoothManager.getDevice();

      device?.removeEventListener(
        "gattserverdisconnected",
        handleGattDisconnected,
      );

      void bluetoothManager.disconnect();
    };
  }, [bluetoothManager, handleGattDisconnected]);

  /**
   * Values derived from React state.
   */
  const hasValidMeasurement = spo2 !== null && heartRate !== null;

  const canRetryMeasurement =
    isDeviceConnected &&
    !isScanning &&
    !isReconnecting &&
    !isRetryingMeasurement &&
    !isDisconnecting;

  const canDisconnect =
    isDeviceConnected && !isScanning && !isReconnecting && !isDisconnecting;

  /**
   * A saved profile is enough to offer Forget Device,
   * even when no live BluetoothDevice object currently
   * exists after a page refresh.
   */
  const canForgetDevice =
    hasSavedDevice || oximeterProfile !== null || isDeviceConnected;

  /**
   * Reconnect is available only when:
   *
   * - the device is disconnected
   * - a saved profile exists
   * - no conflicting Bluetooth action is running
   */
  const canReconnect =
    !isDeviceConnected &&
    hasSavedDevice &&
    !isScanning &&
    !isReconnecting &&
    !isDisconnecting;

  return {
    /**
     * Connection actions
     */
    scan,
    reconnect,
    retryMeasurement,
    disconnect,
    forgetDevice,

    clearMeasurement,
    clearError,
    requiresDeviceReauthorization,

    /**
     * Loading states
     */
    isScanning,
    isReconnecting,
    isRetryingMeasurement,
    isDisconnecting,

    /**
     * Connection state
     */
    isDeviceConnected,
    isListeningForNotifications,
    setIsListeningForNotifications,

    /**
     * Saved-device state
     */
    hasSavedDevice,
    reconnectUnavailableReason,

    /**
     * Device information
     */
    selectedDeviceName,
    oximeterProfile,

    /**
     * Latest valid health measurement
     */
    spo2,
    heartRate,
    hasValidMeasurement,

    /**
     * BLE notification information
     */
    notificationCount,
    validMeasurementCount,
    latestNotificationByteLength,
    latestNotificationBytes,

    /**
     * BLE discovery information
     */
    discoveredServiceCount,
    discoveredCharacteristicCount,
    measurementCandidateCount,
    commandCandidateCount,

    selectedMeasurementCharacteristicUuid,
    selectedCommandCharacteristicUuid,

    /**
     * Error state
     */
    errorMessage,

    /**
     * Button availability
     */
    canReconnect,
    canRetryMeasurement,
    canDisconnect,
    canForgetDevice,
  };
}
