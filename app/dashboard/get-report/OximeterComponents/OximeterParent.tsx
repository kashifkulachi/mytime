"use client";
import OximeterStatusBar from "./OximeterStatusBar";
import { useOximeterAssessment } from "@/hooks/useOximeterAssessment";
import MetricsGrid from "./MetricsGrid";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface OximeterStepProps {
  onContinue?: () => void;
}

export default function OximeterParent({ onContinue }: OximeterStepProps) {
  const {
    spo2,
    heartRate,
    scan,
    reconnect,
    disconnect,
    retryMeasurement,
    isDeviceConnected,
    isScanning,
    isReconnecting,
    selectedDeviceName,
    isDisconnecting,
    errorMessage,
    hasSavedDevice,
    forgetDevice,
    reconnectUnavailableReason,
    isListeningForNotifications,
    hasCompleteMeasurement,
    requiresDeviceReauthorization,
    saveMeasurementToAssessment,
  } = useOximeterAssessment();

  return (
    <main>
      <div className="mb-3">
        {errorMessage && (
          <div className="rounded-xl mb-4 border border-error text-red-50  bg-error/80 px-4 py-3 text-sm leading-6  shadow-sm sm:px-5 sm:py-4">
            Ensure your Bluetooth is enabled and your oximeter is powered on
            before starting. Keep the device nearby and select it from the list
            when it appears to establish a secure connection.
          </div>
        )}
        <OximeterStatusBar
          scan={scan}
          disconnect={disconnect}
          reconnect={reconnect}
          retryMeasurement={retryMeasurement}
          isScanning={isScanning}
          isReconnecting={isReconnecting}
          hasSavedDevice={hasSavedDevice}
          forgetDevice={forgetDevice}
          requiresDeviceReauthorization={requiresDeviceReauthorization}
          isDeviceConnected={isDeviceConnected}
          selectedDeviceName={selectedDeviceName}
          isDisconnecting={isDisconnecting}
          errorMessage={errorMessage}
        />
      </div>

      {reconnectUnavailableReason === "GET_DEVICES_UNSUPPORTED" && (
        <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4">
          <h3 className="font-semibold">
            Automatic reconnect isn&apos;t available
          </h3>

          <p className="mt-2 text-sm">
            Your browser doesn&apos;t support reconnecting to previously
            permitted Bluetooth devices.
          </p>

          <p className="mt-2 text-sm">
            You can still use the <strong> Scan for Oximeter </strong>
            button to reconnect manually.
          </p>

          <details className="mt-3">
            <summary className="cursor-pointer font-medium">
              Advanced (Chrome)
            </summary>

            <div className="mt-2 text-sm">
              Some Chrome versions expose this feature behind
              <Link
                className="text-secondary-container mx-1.5"
                onClick={() =>
                  navigator.clipboard.writeText(
                    "chrome://flags/#enable-web-bluetooth-new-permissions-backend",
                  )
                }
                href="chrome://flags/#enable-web-bluetooth-new-permissions-backend"
                target="_blank"
              >
                Copy and Paste this in Chrome to enable Bluetooth Auto
                Reconnection
              </Link>
              . Search for
              <strong> Web Bluetooth</strong> or
              <strong> getDevices</strong> if the option is available.
            </div>
          </details>
        </div>
      )}

      <MetricsGrid
        heartRate={heartRate}
        spo2={spo2}
        disconnect={disconnect}
        isDeviceConnected={isDeviceConnected}
        isListeningForNotifications={isListeningForNotifications}
        saveMeasurement={saveMeasurementToAssessment}
        hasCompletemeasurement={hasCompleteMeasurement}
      />
    </main>
  );
}
