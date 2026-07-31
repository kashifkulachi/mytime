"use client";
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Loader2,
  Redo2,
  SignalIcon,
  SquareActivity,
} from "lucide-react";
import { toast } from "sonner";

type OximeterStatusBarProps = {
  scan: () => void | Promise<void>;
  disconnect: () => void | Promise<void>;
  reconnect: () => void | Promise<boolean>;
  retryMeasurement: () => void | Promise<void>;

  isScanning: boolean;
  isDisconnecting: boolean;
  isDeviceConnected: boolean;
  isReconnecting: boolean;
  hasSavedDevice: boolean;
  requiresDeviceReauthorization: boolean;
  forgetDevice: () => Promise<void>;

  selectedDeviceName: string | null;
  errorMessage: string | null;
};

export default function OximeterStatusBar({
  scan,
  reconnect,
  isScanning,
  forgetDevice,
  isDisconnecting,
  isDeviceConnected,
  selectedDeviceName,
  hasSavedDevice,
  requiresDeviceReauthorization,
  isReconnecting,
  errorMessage,
}: OximeterStatusBarProps) {
  if (errorMessage) {
    toast.error(errorMessage);
  }

  return (
    <div
      className={`bg-primary-container p-md rounded-xl flex flex-wrap items-center justify-between gap-2 border-2  ${isDeviceConnected ? " border-green-500" : "border-outline-variant"}`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-lg shadow-sm">
          <span
            className="material-symbols-outlined text-secondary"
            data-icon="pulse_oximeter"
          >
            <SquareActivity className="w-7 h-7" />
          </span>
        </div>
        <div>
          <p className="font-label-md text-label-md text-on-primary-container">
            {isDeviceConnected
              ? selectedDeviceName
              : isReconnecting
                ? "Oximeter Paired: Connecting..."
                : "Device Name"}
          </p>
          {isDeviceConnected && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-xs text-[13px] font-label-sm text-on-tertiary-container">
                <span
                  className="material-symbols-outlined text-[13px]"
                  data-icon="bluetooth_connected"
                >
                  <BluetoothConnected className="w-4 h-4" />
                </span>
                Connected
              </span>
              <span className="flex items-center gap-2 text-[13px] font-label-sm text-on-primary-container">
                <span
                  className="material-symbols-outlined text-[13px]"
                  data-icon="signal_cellular_alt"
                >
                  <SignalIcon className="w-4 h-4" />
                </span>
                Strong Signal
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {!isDeviceConnected && !hasSavedDevice && (
          <button
            className="flex items-center gap-2 px-2 cursor-pointer py-2 bg-secondary text-on-secondary rounded-lg font-label-md hover:bg-surface-dim transition-colors disabled:opacity-50 hover:text-primary "
            onClick={scan}
            disabled={isScanning || isDeviceConnected}
          >
            {isScanning ? (
              <>
                <span
                  className="material-symbols-outlined text-[13px]"
                  data-icon="refresh"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                </span>
                <span>Connecting</span>
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-[13px]"
                  data-icon="refresh"
                >
                  <Bluetooth className="w-5 h-5" />
                </span>
                <span>Connect</span>
              </>
            )}
          </button>
        )}

        {hasSavedDevice &&
          !isDeviceConnected &&
          !requiresDeviceReauthorization && (
            <button
              type="button"
              onClick={() => {
                void reconnect();
              }}
              disabled={isReconnecting || isScanning}
              className="flex items-center gap-2 px-2 cursor-pointer py-2 bg-secondary text-on-primary rounded-lg font-label-md  hover:bg-tertiary disabled:opacity-50 border-secondary border transition-colors"
            >
              <span className=" text-[13px]">
                <Redo2 className="w-5 h-5" />
              </span>
              {isReconnecting ? "Reconnecting..." : "Reconnect Oximeter"}
            </button>
          )}

        {isDeviceConnected && hasSavedDevice && (
          <button
            className="flex items-center gap-sm px-2 cursor-pointer py-2 bg-amber-600 text-primary rounded-lg font-label-md hover:bg-surface-dim hover:text-primary disabled:opacity-50 border-amber-500 border transition-colors"
            disabled={
              (!isDeviceConnected && !hasSavedDevice) || isDisconnecting
            }
            onClick={forgetDevice}
          >
            <span
              className="material-symbols-outlined text-[13px]"
              data-icon="refresh"
            >
              <BluetoothOff className="w-5 h-5" />
            </span>
            {isDisconnecting ? "Forgetting..." : "Forget Device"}
          </button>
        )}
      </div>
    </div>
  );
}
