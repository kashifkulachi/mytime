// import type { OximeterBleProfile } from "@/lib/bluetooth/buildOximeterProfile";

// /**
//  * localStorage key used to persist the last
//  * successfully connected oximeter profile.
//  */
// export const OXIMETER_PROFILE_STORAGE_KEY =
//   "mytime-health:oximeter-ble-profile";

// export const OXIMETER_PROFILE_CHANGED_EVENT = "oximeter-profile-changed";

// function notifyOximeterProfileChanged(): void {
//   if (typeof window === "undefined") {
//     return;
//   }

//   window.dispatchEvent(new Event(OXIMETER_PROFILE_CHANGED_EVENT));
// }

// /**
//  * Checks whether browser localStorage is available.
//  *
//  * Bluetooth helpers may be imported while Next.js
//  * is rendering on the server, where window and
//  * localStorage do not exist.
//  */
// function isLocalStorageAvailable(): boolean {
//   return (
//     typeof window !== "undefined" && typeof window.localStorage !== "undefined"
//   );
// }

// /**
//  * Checks whether a value is a non-empty string.
//  */
// function isNonEmptyString(value: unknown): value is string {
//   return typeof value === "string" && value.trim().length > 0;
// }

// /**
//  * Checks whether a value is either:
//  *
//  * - a non-empty string
//  * - null
//  *
//  * This is useful for optional command UUIDs.
//  */
// function isNullableNonEmptyString(value: unknown): value is string | null {
//   return value === null || isNonEmptyString(value);
// }

// /**
//  * Runtime validation for data loaded from
//  * localStorage.
//  *
//  * TypeScript types disappear at runtime, so data
//  * read from localStorage must still be validated
//  * before the application trusts it.
//  */
// function isOximeterBleProfile(value: unknown): value is OximeterBleProfile {
//   if (typeof value !== "object" || value === null) {
//     return false;
//   }

//   const profile = value as Record<string, unknown>;

//   return (
//     isNonEmptyString(profile.deviceId) &&
//     isNonEmptyString(profile.deviceName) &&
//     isNonEmptyString(profile.measurementServiceUuid) &&
//     isNonEmptyString(profile.measurementCharacteristicUuid) &&
//     isNullableNonEmptyString(profile.commandServiceUuid) &&
//     isNullableNonEmptyString(profile.commandCharacteristicUuid)
//   );
// }

// /**
//  * Saves the serializable oximeter profile.
//  *
//  * This function must never receive or save live
//  * browser Bluetooth objects such as:
//  *
//  * - BluetoothDevice
//  * - BluetoothRemoteGATTServer
//  * - BluetoothRemoteGATTCharacteristic
//  */
// export function saveOximeterProfile(profile: OximeterBleProfile): void {
//   if (!isLocalStorageAvailable()) {
//     return;
//   }

//   try {
//     const serializedProfile = JSON.stringify(profile);

//     window.localStorage.setItem(
//       OXIMETER_PROFILE_STORAGE_KEY,
//       serializedProfile,
//     );
//   } catch (error) {
//     console.error("Unable to save the oximeter Bluetooth profile.", error);
//   }
// }

// /**
//  * Loads the previously saved oximeter profile.
//  *
//  * Returns null when:
//  *
//  * - localStorage is unavailable
//  * - no profile was saved
//  * - the stored JSON is invalid
//  * - the stored object does not match the expected
//  *   OximeterBleProfile structure
//  */
// export function loadOximeterProfile(): OximeterBleProfile | null {
//   if (!isLocalStorageAvailable()) {
//     return null;
//   }

//   try {
//     const serializedProfile = window.localStorage.getItem(
//       OXIMETER_PROFILE_STORAGE_KEY,
//     );

//     if (!serializedProfile) {
//       return null;
//     }

//     const parsedProfile: unknown = JSON.parse(serializedProfile);

//     if (!isOximeterBleProfile(parsedProfile)) {
//       /**
//        * Remove corrupted or outdated data so future
//        * reconnect attempts do not repeatedly fail.
//        */
//       removeOximeterProfile();

//       return null;
//     }

//     return parsedProfile;
//   } catch (error) {
//     console.error("Unable to load the oximeter Bluetooth profile.", error);

//     /**
//      * A malformed JSON value should not remain in
//      * storage.
//      */
//     removeOximeterProfile();

//     return null;
//   }
// }

// /**
//  * Removes the saved oximeter profile.
//  *
//  * Use this when the user clicks:
//  *
//  * "Forget Device"
//  */
// export function removeOximeterProfile(): void {
//   if (!isLocalStorageAvailable()) {
//     return;
//   }

//   try {
//     window.localStorage.removeItem(OXIMETER_PROFILE_STORAGE_KEY);
//   } catch (error) {
//     console.error("Unable to remove the oximeter Bluetooth profile.", error);
//   }
// }

// /**
//  * Returns true when a valid saved profile exists.
//  *
//  * This is mainly useful for UI decisions such as
//  * showing:
//  *
//  * - Reconnect
//  * - Previously connected device
//  * - Forget saved device
//  */
// export function hasSavedOximeterProfile(): boolean {
//   return loadOximeterProfile() !== null;
// }

// import type { OximeterBleProfile } from "@/lib/bluetooth/buildOximeterProfile";

// const OXIMETER_PROFILE_STORAGE_KEY = "mytime-health:oximeter-ble-profile";

// const OXIMETER_PROFILE_CHANGED_EVENT = "mytime-health:oximeter-profile-changed";

// function isLocalStorageAvailable(): boolean {
//   return (
//     typeof window !== "undefined" && typeof window.localStorage !== "undefined"
//   );
// }

// function notifyOximeterProfileChanged(): void {
//   if (typeof window === "undefined") {
//     return;
//   }

//   window.dispatchEvent(new Event(OXIMETER_PROFILE_CHANGED_EVENT));
// }

// export function saveOximeterProfile(profile: OximeterBleProfile): void {
//   if (!isLocalStorageAvailable()) {
//     return;
//   }

//   window.localStorage.setItem(
//     OXIMETER_PROFILE_STORAGE_KEY,
//     JSON.stringify(profile),
//   );

//   notifyOximeterProfileChanged();
// }

// export function loadOximeterProfile(): OximeterBleProfile | null {
//   if (!isLocalStorageAvailable()) {
//     return null;
//   }

//   const storedProfile = window.localStorage.getItem(
//     OXIMETER_PROFILE_STORAGE_KEY,
//   );

//   if (!storedProfile) {
//     return null;
//   }

//   try {
//     return JSON.parse(storedProfile) as OximeterBleProfile;
//   } catch {
//     removeOximeterProfile();

//     return null;
//   }
// }

// export function removeOximeterProfile(): void {
//   if (!isLocalStorageAvailable()) {
//     return;
//   }

//   window.localStorage.removeItem(OXIMETER_PROFILE_STORAGE_KEY);

//   notifyOximeterProfileChanged();
// }

// export function hasStoredOximeterProfile(): boolean {
//   return loadOximeterProfile() !== null;
// }

// export function subscribeToOximeterProfile(
//   onStoreChange: () => void,
// ): () => void {
//   if (typeof window === "undefined") {
//     return () => {};
//   }

//   const handleStorageChange = (event: StorageEvent) => {
//     if (event.key === OXIMETER_PROFILE_STORAGE_KEY) {
//       onStoreChange();
//     }
//   };

//   const handleLocalProfileChange = () => {
//     onStoreChange();
//   };

//   window.addEventListener("storage", handleStorageChange);

//   window.addEventListener(
//     OXIMETER_PROFILE_CHANGED_EVENT,
//     handleLocalProfileChange,
//   );

//   return () => {
//     window.removeEventListener("storage", handleStorageChange);

//     window.removeEventListener(
//       OXIMETER_PROFILE_CHANGED_EVENT,
//       handleLocalProfileChange,
//     );
//   };
// }

import type { OximeterBleProfile } from "@/lib/bluetooth/buildOximeterProfile";

const OXIMETER_PROFILE_STORAGE_KEY = "mytime-health:oximeter-ble-profile";

const OXIMETER_PROFILE_CHANGED_EVENT = "mytime-health:oximeter-profile-changed";

/**
 * Checks whether browser localStorage can safely be accessed.
 *
 * Accessing window.localStorage can sometimes throw an error,
 * for example when browser privacy settings block storage.
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage !== undefined;
  } catch {
    return false;
  }
}

/**
 * Notifies subscribers in the current browser tab.
 *
 * The native "storage" event normally only fires in other tabs,
 * so we need a custom event for changes made in this tab.
 */
function notifyOximeterProfileChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(OXIMETER_PROFILE_CHANGED_EVENT));
}

/**
 * Saves the serializable BLE profile in localStorage.
 */
export function saveOximeterProfile(profile: OximeterBleProfile): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(
      OXIMETER_PROFILE_STORAGE_KEY,
      JSON.stringify(profile),
    );

    notifyOximeterProfileChanged();
  } catch {
    // Storage may be unavailable, full, or blocked.
  }
}

/**
 * Loads and validates the stored BLE profile.
 *
 * Important:
 * This function does not modify localStorage because it may
 * indirectly be called while React is rendering.
 */
export function loadOximeterProfile(): OximeterBleProfile | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const storedProfile = window.localStorage.getItem(
      OXIMETER_PROFILE_STORAGE_KEY,
    );

    if (!storedProfile) {
      return null;
    }

    const parsedProfile: unknown = JSON.parse(storedProfile);

    if (typeof parsedProfile !== "object" || parsedProfile === null) {
      return null;
    }

    return parsedProfile as OximeterBleProfile;
  } catch {
    return null;
  }
}

/**
 * Removes the saved BLE profile.
 */
export function removeOximeterProfile(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.removeItem(OXIMETER_PROFILE_STORAGE_KEY);

    notifyOximeterProfileChanged();
  } catch {
    // Storage may be unavailable or blocked.
  }
}

/**
 * Returns a primitive boolean snapshot for useSyncExternalStore.
 *
 * This function must remain pure:
 * - no state updates
 * - no event dispatches
 * - no localStorage writes
 */
export function hasStoredOximeterProfile(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const storedProfile = window.localStorage.getItem(
      OXIMETER_PROFILE_STORAGE_KEY,
    );

    if (!storedProfile) {
      return false;
    }

    const parsedProfile: unknown = JSON.parse(storedProfile);

    return typeof parsedProfile === "object" && parsedProfile !== null;
  } catch {
    return false;
  }
}

/**
 * Subscribes React to changes in the saved oximeter profile.
 */
export function subscribeToOximeterProfile(
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorageChange = (event: StorageEvent): void => {
    if (event.key === OXIMETER_PROFILE_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleLocalProfileChange = (): void => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorageChange);

  window.addEventListener(
    OXIMETER_PROFILE_CHANGED_EVENT,
    handleLocalProfileChange,
  );

  return () => {
    window.removeEventListener("storage", handleStorageChange);

    window.removeEventListener(
      OXIMETER_PROFILE_CHANGED_EVENT,
      handleLocalProfileChange,
    );
  };
}
