export function getBluetoothErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "An unknown Bluetooth error occurred.";
  }

  switch (error.name) {
    case "NotFoundError":
      return "No oximeter was selected. Please scan again and select your device.";

    case "NotAllowedError":
      return "Bluetooth permission was denied. Please allow Bluetooth access and try again.";

    case "SecurityError":
      return "Bluetooth access requires a secure HTTPS connection or localhost.";

    case "NetworkError":
      return "The Bluetooth connection was interrupted. Make sure the oximeter is nearby and turned on.";

    case "NotSupportedError":
      return "This browser or device does not support the required Bluetooth functionality.";

    case "InvalidStateError":
      return "The Bluetooth device is not ready. Please disconnect it from other applications and try again.";

    case "AbortError":
      return "The Bluetooth operation was cancelled.";

    default:
      return error.message || "Unable to connect to the oximeter.";
  }
}
