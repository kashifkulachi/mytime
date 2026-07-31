"use client";

import { useEffect, useState } from "react";

import {
  buildOximeterProfile,
  type OximeterBleProfile,
} from "@/lib/bluetooth/buildOximeterProfile";

import { connectOximeterDevice } from "@/lib/bluetooth/connectOximeterDevice";
import { dataViewToUint8Array } from "@/lib/bluetooth/dataViewToUint8Array";
import { discoverOximeterCharacteristics } from "@/lib/bluetooth/discoverOximeterCharacteristics";
import { discoverOximeterServices } from "@/lib/bluetooth/discoverOximeterServices";
import { findOximeterCharacteristicCandidates } from "@/lib/bluetooth/findOximeterCharacteristicCandidates";
import { getBluetoothErrorMessage } from "@/lib/bluetooth/getBluetoothErrorMessage";
import { getOximeterCharacteristic } from "@/lib/bluetooth/getOximeterCharacteristic";
import { isBluetoothSupported } from "@/lib/bluetooth/isBluetoothSupoorted";
import { OximeterBluetoothManager } from "@/lib/bluetooth/OximeterBluetoothManager";
import { parseOximeterNotification } from "@/lib/bluetooth/parseOximeterNotification";
import { requestOximeterDevice } from "@/lib/bluetooth/requestOximeterDevice";
import { subscribeToOximeterNotifications } from "@/lib/bluetooth/subscribeToOximeterNotifications";
import OximeterStatusBar from "./OximeterStatusBar";
import { connectToOximeter } from "@/lib/bluetooth/connectToOximeter";

export default function OximeterParserTestPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);

  const [selectedDeviceName, setSelectedDeviceName] = useState<string | null>(
    null,
  );

  const [isDeviceConnected, setIsDeviceConnected] = useState(false);

  const [discoveredServiceCount, setDiscoveredServiceCount] = useState(0);

  const [discoveredCharacteristicCount, setDiscoveredCharacteristicCount] =
    useState(0);

  const [measurementCandidateCount, setMeasurementCandidateCount] = useState(0);

  const [commandCandidateCount, setCommandCandidateCount] = useState(0);

  const [
    selectedMeasurementCharacteristicUuid,
    setSelectedMeasurementCharacteristicUuid,
  ] = useState<string | null>(null);

  const [isListeningForNotifications, setIsListeningForNotifications] =
    useState(false);

  const [notificationCount, setNotificationCount] = useState(0);

  const [latestNotificationByteLength, setLatestNotificationByteLength] =
    useState<number | null>(null);

  const [latestNotificationBytes, setLatestNotificationBytes] = useState<
    number[]
  >([]);

  const [liveSpo2, setLiveSpo2] = useState<number | null>(null);

  const [liveHeartRate, setLiveHeartRate] = useState<number | null>(null);

  const [validMeasurementCount, setValidMeasurementCount] = useState(0);

  const [oximeterProfile, setOximeterProfile] =
    useState<OximeterBleProfile | null>(null);

  const [isManagerConnected, setIsManagerConnected] = useState(false);

  const [isRetryingMeasurement, setIsRetryingMeasurement] = useState(false);

  /**
   * Creates one manager instance for the lifetime
   * of this page component.
   */
  const [bluetoothManager] = useState(() => new OximeterBluetoothManager());

  /**
   * Disconnect when the user leaves this page.
   */
  useEffect(() => {
    return () => {
      void bluetoothManager.disconnect();
    };
  }, [bluetoothManager]);

  const resetDisplayedResults = (): void => {
    setErrorMessage(null);

    setSelectedDeviceName(null);
    setIsDeviceConnected(false);
    setIsManagerConnected(false);

    setDiscoveredServiceCount(0);
    setDiscoveredCharacteristicCount(0);

    setMeasurementCandidateCount(0);
    setCommandCandidateCount(0);

    setSelectedMeasurementCharacteristicUuid(null);

    setIsListeningForNotifications(false);

    setNotificationCount(0);
    setLatestNotificationByteLength(null);
    setLatestNotificationBytes([]);

    setLiveSpo2(null);
    setLiveHeartRate(null);
    setValidMeasurementCount(0);

    setOximeterProfile(null);
  };

  const handleIncomingNotification = (value: DataView): void => {
    const bytes = dataViewToUint8Array(value);

    setNotificationCount((currentCount) => currentCount + 1);

    setLatestNotificationByteLength(bytes.length);

    setLatestNotificationBytes(Array.from(bytes));

    const measurement = parseOximeterNotification(value);

    if (!measurement) {
      return;
    }

    setLiveSpo2(measurement.spo2);

    setLiveHeartRate(measurement.heartRate);

    setValidMeasurementCount((currentCount) => currentCount + 1);
  };

  // const handleScanForOximeter = async (): Promise<void> => {
  //   try {
  //     setIsScanning(true);

  //     resetDisplayedResults();

  //     /**
  //      * Clean up any previous BLE connection.
  //      */
  //     await bluetoothManager.disconnect();

  //     /**
  //      * Confirm that Web Bluetooth is supported.
  //      */
  //     if (!isBluetoothSupported()) {
  //       throw new DOMException(
  //         "Web Bluetooth is not supported in this browser.",
  //         "NotSupportedError",
  //       );
  //     }

  //     /**
  //      * Open the browser Bluetooth device chooser.
  //      */
  //     const device = await requestOximeterDevice();

  //     bluetoothManager.setDevice(device);

  //     setSelectedDeviceName(device.name ?? "Unnamed Bluetooth device");

  //     /**
  //      * Connect to the device's GATT server.
  //      */
  //     const server = await connectOximeterDevice(device);

  //     bluetoothManager.setServer(server);

  //     setIsDeviceConnected(server.connected);

  //     /**
  //      * Discover all accessible services.
  //      */
  //     const services = await discoverOximeterServices(server);

  //     setDiscoveredServiceCount(services.length);

  //     /**
  //      * Discover all characteristics.
  //      */
  //     const characteristics = await discoverOximeterCharacteristics(server);

  //     setDiscoveredCharacteristicCount(characteristics.length);

  //     /**
  //      * Find notification and writable
  //      * characteristic candidates.
  //      */
  //     const candidates = findOximeterCharacteristicCandidates(characteristics);

  //     setMeasurementCandidateCount(candidates.measurementCandidates.length);

  //     setCommandCandidateCount(candidates.commandCandidates.length);

  //     const firstMeasurementCandidate = candidates.measurementCandidates[0];

  //     const firstCommandCandidate = candidates.commandCandidates[0] ?? null;

  //     if (!firstMeasurementCandidate) {
  //       throw new DOMException(
  //         "No notification or indication characteristic was found.",
  //         "NotFoundError",
  //       );
  //     }

  //     /**
  //      * Build and store the serializable
  //      * oximeter profile.
  //      */
  //     const profile = buildOximeterProfile(
  //       device,
  //       firstMeasurementCandidate,
  //       firstCommandCandidate,
  //     );

  //     bluetoothManager.setProfile(profile);

  //     setOximeterProfile(profile);

  //     /**
  //      * Retrieve the actual browser measurement
  //      * characteristic.
  //      */
  //     const measurementCharacteristic = await getOximeterCharacteristic(
  //       server,
  //       firstMeasurementCandidate.serviceUuid,
  //       firstMeasurementCandidate.characteristicUuid,
  //     );

  //     bluetoothManager.setMeasurementCharacteristic(measurementCharacteristic);

  //     setSelectedMeasurementCharacteristicUuid(measurementCharacteristic.uuid);

  //     /**
  //      * Retrieve the optional writable command
  //      * characteristic.
  //      */
  //     if (firstCommandCandidate) {
  //       const commandCharacteristic = await getOximeterCharacteristic(
  //         server,
  //         firstCommandCandidate.serviceUuid,
  //         firstCommandCandidate.characteristicUuid,
  //       );

  //       bluetoothManager.setCommandCharacteristic(commandCharacteristic);
  //     } else {
  //       bluetoothManager.setCommandCharacteristic(null);
  //     }

  //     /**
  //      * Subscribe to incoming BLE notifications.
  //      */

  //     //old before rety
  //     // const stopNotifications = await subscribeToOximeterNotifications(
  //     //   measurementCharacteristic,
  //     //   (value) => {
  //     //     const bytes = dataViewToUint8Array(value);

  //     //     setNotificationCount((currentCount) => currentCount + 1);

  //     //     setLatestNotificationByteLength(bytes.length);

  //     //     setLatestNotificationBytes(Array.from(bytes));

  //     //     const measurement = parseOximeterNotification(value);

  //     //     if (!measurement) {
  //     //       return;
  //     //     }

  //     //     setLiveSpo2(measurement.spo2);

  //     //     setLiveHeartRate(measurement.heartRate);

  //     //     setValidMeasurementCount((currentCount) => currentCount + 1);
  //     //   },
  //     // );

  //     const stopNotifications = await subscribeToOximeterNotifications(
  //       measurementCharacteristic,
  //       handleIncomingNotification,
  //     );

  //     bluetoothManager.setNotificationCleanup(stopNotifications);

  //     setIsListeningForNotifications(true);

  //     setIsManagerConnected(bluetoothManager.isConnected());
  //   } catch (error) {
  //     await bluetoothManager.disconnect();

  //     setIsDeviceConnected(false);
  //     setIsManagerConnected(false);
  //     setIsListeningForNotifications(false);

  //     setErrorMessage(getBluetoothErrorMessage(error));
  //   } finally {
  //     setIsScanning(false);
  //   }
  // };

  const handleScanForOximeter = async (): Promise<void> => {
    try {
      setIsScanning(true);

      resetDisplayedResults();

      const result = await connectToOximeter({
        bluetoothManager,
        onNotification: handleIncomingNotification,
      });

      setSelectedDeviceName(result.device.name ?? "Unnamed Bluetooth device");

      setIsDeviceConnected(result.server.connected);

      setIsManagerConnected(bluetoothManager.isConnected());

      setDiscoveredServiceCount(result.serviceCount);

      setDiscoveredCharacteristicCount(result.characteristicCount);

      setMeasurementCandidateCount(result.measurementCandidateCount);

      setCommandCandidateCount(result.commandCandidateCount);

      setSelectedMeasurementCharacteristicUuid(
        result.measurementCharacteristic.uuid,
      );

      setOximeterProfile(result.profile);

      setIsListeningForNotifications(true);
    } catch (error) {
      setIsDeviceConnected(false);
      setIsManagerConnected(false);

      setIsListeningForNotifications(false);

      setErrorMessage(getBluetoothErrorMessage(error));
    } finally {
      setIsScanning(false);
    }
  };
  const handleDisconnect = async (): Promise<void> => {
    try {
      await bluetoothManager.disconnect();

      setIsDeviceConnected(false);
      setIsManagerConnected(false);
      setIsListeningForNotifications(false);
    } catch (error) {
      setErrorMessage(getBluetoothErrorMessage(error));
    }
  };

  const handleForgetDevice = async (): Promise<void> => {
    try {
      await bluetoothManager.reset();

      resetDisplayedResults();
    } catch (error) {
      setErrorMessage(getBluetoothErrorMessage(error));
    }
  };

  const handleRetryMeasurement = async (): Promise<void> => {
    try {
      setIsRetryingMeasurement(true);
      setErrorMessage(null);

      /**
       * Confirm that the oximeter is still connected.
       */
      if (!bluetoothManager.isConnected()) {
        throw new DOMException(
          "The oximeter is no longer connected. Please scan and connect again.",
          "NetworkError",
        );
      }

      /**
       * Get the already discovered measurement
       * characteristic from the Bluetooth Manager.
       */
      const measurementCharacteristic =
        bluetoothManager.getMeasurementCharacteristic();

      if (!measurementCharacteristic) {
        throw new DOMException(
          "The measurement characteristic is not available. Please scan and connect again.",
          "NotFoundError",
        );
      }

      /**
       * Stop the previous notification listener.
       *
       * This does not disconnect the oximeter.
       */
      await bluetoothManager.stopListening();

      setIsListeningForNotifications(false);

      /**
       * Clear the previous displayed measurement.
       *
       * The UI will now wait for a fresh reading.
       */
      setLiveSpo2(null);
      setLiveHeartRate(null);

      setNotificationCount(0);
      setValidMeasurementCount(0);

      setLatestNotificationByteLength(null);
      setLatestNotificationBytes([]);

      /**
       * Restart notifications on the same
       * measurement characteristic.
       */
      const stopNotifications = await subscribeToOximeterNotifications(
        measurementCharacteristic,
        handleIncomingNotification,
      );

      bluetoothManager.setNotificationCleanup(stopNotifications);

      setIsListeningForNotifications(true);

      setIsManagerConnected(bluetoothManager.isConnected());
    } catch (error) {
      setIsListeningForNotifications(false);

      setErrorMessage(getBluetoothErrorMessage(error));
    } finally {
      setIsRetryingMeasurement(false);
    }
  };

  const managerDevice = bluetoothManager.getDevice();

  const managerServer = bluetoothManager.getServer();

  const managerMeasurementCharacteristic =
    bluetoothManager.getMeasurementCharacteristic();

  const managerCommandCharacteristic =
    bluetoothManager.getCommandCharacteristic();

  const managerProfile = bluetoothManager.getProfile();

  return (
    <main className="w-full">
      <OximeterStatusBar />
      <h1>Oximeter Bluetooth Test</h1>

      <p>
        This page scans for the oximeter, connects to it, discovers its BLE
        characteristics, subscribes to live notifications, and parses SpO₂ and
        heart rate.
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "24px",
        }}
      >
        <button
          type="button"
          onClick={handleScanForOximeter}
          disabled={isScanning}
          className="bg-primary text-on-primary"
          style={{
            padding: "10px 18px",
            cursor: isScanning ? "not-allowed" : "pointer",
          }}
        >
          {isScanning ? "Connecting..." : "Scan for Oximeter"}
        </button>

        <button
          type="button"
          onClick={handleDisconnect}
          disabled={!isDeviceConnected}
          className="bg-secondary text-on-secondary"
          style={{
            padding: "10px 18px",
            cursor: isDeviceConnected ? "pointer" : "not-allowed",
          }}
        >
          Disconnect
        </button>

        <button
          type="button"
          onClick={handleForgetDevice}
          disabled={!managerDevice && !managerProfile}
          className="bg-tertiary text-on-tertiary"
          style={{
            padding: "10px 18px",
            cursor: managerDevice || managerProfile ? "pointer" : "not-allowed",
          }}
        >
          Forget Device
        </button>
      </div>

      {errorMessage && (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid #cc0000",
            borderRadius: "6px",
            padding: "12px",
          }}
        >
          <strong>Bluetooth error:</strong>

          <p>{errorMessage}</p>
        </div>
      )}

      <section style={sectionStyle}>
        <h2>Connection</h2>

        <StatusRow
          label="Selected device"
          value={selectedDeviceName ?? "No device selected"}
        />

        <StatusRow
          label="Device connection"
          value={isDeviceConnected ? "Connected" : "Disconnected"}
        />

        <StatusRow
          label="Manager connection"
          value={isManagerConnected ? "Connected" : "Disconnected"}
        />

        <StatusRow
          label="Listening for notifications"
          value={isListeningForNotifications ? "Yes" : "No"}
        />
      </section>

      <section style={sectionStyle}>
        <h2>BLE Discovery</h2>

        <StatusRow label="Discovered services" value={discoveredServiceCount} />

        <StatusRow
          label="Discovered characteristics"
          value={discoveredCharacteristicCount}
        />

        <StatusRow
          label="Measurement candidates"
          value={measurementCandidateCount}
        />

        <StatusRow label="Command candidates" value={commandCandidateCount} />

        <StatusRow
          label="Selected measurement UUID"
          value={selectedMeasurementCharacteristicUuid ?? "Not selected"}
          useCode
        />
      </section>

      <section style={sectionStyle}>
        <h2>Live Measurement</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          <MeasurementCard
            label="Oxygen saturation"
            value={liveSpo2 !== null ? `${liveSpo2}%` : "--"}
          />

          <MeasurementCard
            label="Heart rate"
            value={liveHeartRate !== null ? `${liveHeartRate} BPM` : "--"}
          />
        </div>

        <button
          type="button"
          onClick={handleRetryMeasurement}
          className="bg-primary text-on-primary  m-5"
          disabled={
            isScanning ||
            isRetryingMeasurement ||
            !isDeviceConnected ||
            !managerMeasurementCharacteristic
          }
          style={{
            padding: "10px 18px",
            cursor:
              !isScanning &&
              !isRetryingMeasurement &&
              isDeviceConnected &&
              managerMeasurementCharacteristic
                ? "pointer"
                : "not-allowed",
          }}
        >
          {isRetryingMeasurement ? "Retrying..." : "Retry Measurement"}
        </button>

        <div style={{ marginTop: "20px" }}>
          <StatusRow label="Notifications received" value={notificationCount} />

          <StatusRow label="Valid measurements" value={validMeasurementCount} />

          <StatusRow
            label="Latest packet size"
            value={
              latestNotificationByteLength !== null
                ? `${latestNotificationByteLength} bytes`
                : "No packet received"
            }
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <strong>Latest notification bytes:</strong>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#f5f5f5",
              padding: "12px",
              borderRadius: "6px",
              marginTop: "8px",
            }}
          >
            {latestNotificationBytes.length > 0
              ? latestNotificationBytes.join(", ")
              : "No bytes received"}
          </pre>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Bluetooth Manager</h2>

        <StatusRow label="Device stored" value={managerDevice ? "Yes" : "No"} />

        <StatusRow
          label="GATT server stored"
          value={managerServer ? "Yes" : "No"}
        />

        <StatusRow
          label="Measurement characteristic stored"
          value={managerMeasurementCharacteristic ? "Yes" : "No"}
        />

        <StatusRow
          label="Command characteristic stored"
          value={managerCommandCharacteristic ? "Yes" : "No"}
        />

        <StatusRow
          label="BLE profile stored"
          value={managerProfile ? "Yes" : "No"}
        />
      </section>

      <section style={sectionStyle}>
        <h2>Oximeter BLE Profile</h2>

        {!oximeterProfile ? (
          <p>No oximeter profile created yet.</p>
        ) : (
          <>
            <StatusRow
              label="Device ID"
              value={oximeterProfile.deviceId}
              useCode
            />

            <StatusRow label="Device name" value={oximeterProfile.deviceName} />

            <StatusRow
              label="Measurement service UUID"
              value={oximeterProfile.measurementServiceUuid}
              useCode
            />

            <StatusRow
              label="Measurement characteristic UUID"
              value={oximeterProfile.measurementCharacteristicUuid}
              useCode
            />

            <StatusRow
              label="Command service UUID"
              value={
                oximeterProfile.commandServiceUuid ??
                "No command service selected"
              }
              useCode
            />

            <StatusRow
              label="Command characteristic UUID"
              value={
                oximeterProfile.commandCharacteristicUuid ??
                "No command characteristic selected"
              }
              useCode
            />
          </>
        )}
      </section>
    </main>
  );
}

interface StatusRowProps {
  label: string;
  value: string | number;
  useCode?: boolean;
}

function StatusRow({ label, value, useCode = false }: StatusRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(180px, 260px) 1fr",
        gap: "12px",
        padding: "8px 0",
        borderBottom: "1px solid #eeeeee",
      }}
    >
      <strong>{label}:</strong>

      {useCode ? (
        <code
          style={{
            wordBreak: "break-all",
          }}
        >
          {value}
        </code>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}

interface MeasurementCardProps {
  label: string;
  value: string;
}

function MeasurementCard({ label, value }: MeasurementCardProps) {
  return (
    <div
      style={{
        border: "1px solid #dddddd",
        borderRadius: "8px",
        padding: "20px",
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: "8px",
        }}
      >
        {label}
      </p>

      <strong
        style={{
          fontSize: "28px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const sectionStyle = {
  border: "1px solid #dddddd",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "20px",
};
