// src/lib/bluetooth/useBluetoothSupported.ts

"use client";

import { useSyncExternalStore } from "react";
import { isBluetoothSupported } from "./isBluetoothSupoorted";

type BluetoothSupport = boolean | null;

function subscribe(): () => void {
  // Browser support generally does not change during the page session.
  return () => {};
}

function getClientSnapshot(): BluetoothSupport {
  return isBluetoothSupported();
}

function getServerSnapshot(): BluetoothSupport {
  return null;
}

export function useBluetoothSupported(): BluetoothSupport {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
