const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

export function getSupportedAudioMimeType(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  return SUPPORTED_AUDIO_MIME_TYPES.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
}
