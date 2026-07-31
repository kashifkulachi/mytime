export interface VoiceProcessingResult {
  frequency: number;
  intensity: number;
  amplitude: number;
}

export interface VoiceMetrics {
  processedAt: string;
  metrics: VoiceProcessingResult;
}
