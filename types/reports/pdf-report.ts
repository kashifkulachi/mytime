import type { PatientInfo } from "@/types/assessments";
import type { VoiceMetrics } from "@/types/voice";
import type { OximeterData } from "@/types/oximeter";

import type { IFICalculationResult } from "@/types/calculations/ifi-calculation";

import type { BiologicalAgeCalculationResult } from "@/types/calculations/biological-age-calculation";

import type { InflammationIndexCalculationResult } from "@/types/calculations/inflammation-index-calculation";
import { PeptideDoseCalculationResult } from "../calculations/peptide-dose-calculation";

/**
 * Report format version.
 *
 * Increase this when the report data structure changes in a way that older
 * report templates cannot safely render.
 */
export type PdfReportSchemaVersion = "1.0.0";

/**
 * Stable report status values.
 */
export type PdfReportStatus = "draft" | "completed";

/**
 * Basic report identification and generation metadata.
 */
export interface PdfReportMetadata {
  /**
   * Unique report identifier.
   *
   * This can initially be generated with crypto.randomUUID().
   * Later, it can use the Supabase assessment/report record ID.
   */
  reportId: string;

  /**
   * Version of this report data contract.
   */
  schemaVersion: PdfReportSchemaVersion;

  /**
   * Current lifecycle state of the report.
   */
  status: PdfReportStatus;

  /**
   * Date used by the assessment formulas.
   *
   * Example:
   * "2026-07-10"
   */
  evaluationDate: string;

  /**
   * Timestamp when all assessment calculations finished.
   */
  assessmentCompletedAt: string;

  /**
   * Timestamp when the PDF report data was prepared.
   */
  reportGeneratedAt: string;

  /**
   * Optional application name displayed in the PDF.
   */
  platformName: string;

  /**
   * Optional report title displayed on the cover or header.
   */
  reportTitle: string;
}

/**
 * Optional clinician information.
 *
 * These values can be added later when doctors and organizations are stored
 * in Supabase.
 */
export interface PdfReportClinician {
  clinicianId?: string;
  fullName?: string;
  professionalTitle?: string;
  organizationName?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
}

/**
 * Optional patient identification fields that are separate from the medical
 * and formula inputs.
 *
 * Your current PatientInfo does not contain the patient's name or database ID,
 * so these fields remain optional until patient selection/database integration
 * is complete.
 */
export interface PdfReportPatientIdentity {
  patientId?: string;
  medicalRecordNumber?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

/**
 * Patient details used during the assessment and displayed in the report.
 */
export interface PdfReportPatientSection {
  identity: PdfReportPatientIdentity;

  information: PatientInfo;
}

/**
 * Voice measurements used by the IFI calculation.
 *
 * This section stores only serializable measurement values. It must not contain
 * the recording Blob, MediaStream, object URL, or browser recording objects.
 */
export interface PdfReportVoiceSection {
  processedAt: string;

  rmsAmplitude: number;
  meanFrequency: number;
  meanIntensity: number;
}

/**
 * Oximeter readings used by the calculations.
 */
export interface PdfReportOximeterSection {
  spo2: number;
  heartRate: number;

  /**
   * Optional device information for report traceability.
   */
  deviceName?: string;
  measuredAt?: string;
}

/**
 * All source measurements displayed in the report.
 */
export interface PdfReportMeasurements {
  voice: PdfReportVoiceSection;
  oximeter: PdfReportOximeterSection;
}

/**
 * Complete calculated results currently supported by the platform.
 *
 * The final workbook result can be added here after its formula module has
 * been analyzed and implemented.
 */
export interface PdfReportCalculationResults {
  ifi: IFICalculationResult;

  biologicalAge: BiologicalAgeCalculationResult;

  inflammationIndex: InflammationIndexCalculationResult;

  peptideDose: PeptideDoseCalculationResult;
}

/**
 * Important disclaimer content displayed in the PDF.
 */
export interface PdfReportDisclaimers {
  /**
   * General formula-model disclaimer.
   */
  calculationModel: string;

  /**
   * Peptide-dose proof-of-concept disclaimer.
   */
  peptideDose: string;

  /**
   * General medical/report-use disclaimer.
   */
  clinicalUse: string;
}

/**
 * Optional report branding and asset configuration.
 *
 * Prefer data URLs, base64 values, or absolute URLs that Chromium can access.
 * Local relative paths may not resolve correctly during server-side rendering.
 */
export interface PdfReportBranding {
  logoUrl?: string;
  organizationName?: string;
  organizationAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
}

/**
 * Complete serializable data object passed to the Chromium PDF report page
 * or HTML template.
 *
 * This object should be safe to:
 * - store in Supabase JSON;
 * - send through an API route;
 * - serialize with JSON.stringify();
 * - pass into a server-side React report component;
 * - render through Puppeteer or Chromium.
 */
export interface PdfReportData {
  metadata: PdfReportMetadata;

  clinician?: PdfReportClinician;

  patient: PdfReportPatientSection;

  measurements: PdfReportMeasurements;

  results: PdfReportCalculationResults;

  branding?: PdfReportBranding;

  disclaimers: PdfReportDisclaimers;
}

/**
 * Input used when preparing PdfReportData from an assessment.
 *
 * Keeping the preparation input separate makes it easier to validate that all
 * required data exists before Chromium starts rendering.
 */
export interface PreparePdfReportDataInput {
  reportId: string;

  patientIdentity?: PdfReportPatientIdentity;

  patient: PatientInfo;

  voice: VoiceMetrics;

  oximeter: OximeterData;

  results: PdfReportCalculationResults;

  clinician?: PdfReportClinician;

  branding?: PdfReportBranding;

  evaluationDate: string;

  assessmentCompletedAt: string;
}
