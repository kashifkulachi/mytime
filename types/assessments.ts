import type { OximeterData } from "@/types/oximeter";
import type { VoiceMetrics } from "@/types/voice";
import { IFICalculationResult } from "./calculations/ifi-calculation";
import { BiologicalAgeCalculationResult } from "./calculations/biological-age-calculation";
import { InflammationIndexCalculationResult } from "./calculations/inflammation-index-calculation";
import { PeptideDoseCalculationResult } from "./calculations/peptide-dose-calculation";
import { HBOTCalculationResult } from "./calculations/htbot-calculations";

export interface PatientInfo {
  patientName: string;
  dateOfBirth: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  bmi: number;
}

export interface AssessmentResult {
  IFI: IFICalculationResult;
  BiologicalAge: BiologicalAgeCalculationResult;
  InflammationIndex?: InflammationIndexCalculationResult;
  PeptideDose: PeptideDoseCalculationResult;
  HBOTSessions: HBOTCalculationResult;
}

export interface Assessment {
  voice: VoiceMetrics | null;
  patient: PatientInfo | null;
  oximeter: OximeterData | null;
  result: AssessmentResult | null;
}
