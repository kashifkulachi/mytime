import axios from "axios";

import api from "@/lib/axios";
import { VoiceMetrics } from "@/types/voice";

export interface VoiceProcessingResult {
  frequency: number;
  intensity: number;
  amplitude: number;
}

export async function processVoice(audio: Blob): Promise<VoiceMetrics> {
  const formData = new FormData();

  formData.append("voice", audio, `voice-recording-${Date.now()}.webm`);

  try {
    const { data } = await api.post<VoiceMetrics>(
      "/api/voice/analyze",
      formData,
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error.response?.data);
      throw new Error(
        error.response?.data?.message ?? "Unable to process voice recording.",
      );
    }

    throw new Error(
      "An unexpected error occurred while processing the voice recording.",
    );
  }
}
