import type { OximeterData } from "@/types/oximeter";
import type { VoiceMetrics } from "@/types/voice";
import { IFICalculationResult } from "./assessment-calculation";

export interface PatientInfo {
  dateOfBirth: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  bmi: number;
}

export interface AssessmentResult {
  healthScore?: number;
  riskLevel?: string;
  recommendations?: string[];
  IFI?: IFICalculationResult;
}

export interface Assessment {
  voice: VoiceMetrics | null;
  patient: PatientInfo | null;
  oximeter: OximeterData | null;
  result: AssessmentResult | null;
}
