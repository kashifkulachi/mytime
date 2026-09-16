import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { IFIMonitoringCycleStatus } from "@/types/calculations/ifi-monitoring";
import type { IFIMonitoringCycle } from "./getOrCreateIFIMonitoringCycle";

interface GetActiveIFIMonitoringCycleInput {
  patientId: string;
}

interface IFIMonitoringCycleRow {
  id: string;
  patient_id: string;
  baseline_report_id: string;
  start_date: string;
  end_date: string;
  status: IFIMonitoringCycleStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Returns the patient's currently active IFI monitoring cycle.
 *
 * IMPORTANT:
 *
 * This is a READ-ONLY service.
 *
 * It does NOT:
 * - create a monitoring cycle
 * - complete a monitoring cycle
 * - modify reports
 * - calculate IFI
 * - calculate Recovery
 *
 * The caller must already have authorization to access
 * the supplied patient.
 */
export async function getActiveIFIMonitoringCycle({
  patientId,
}: GetActiveIFIMonitoringCycleInput): Promise<IFIMonitoringCycle | null> {
  const normalizedPatientId = patientId.trim();

  if (!normalizedPatientId) {
    throw new Error("Patient ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ifi_monitoring_cycles")
    .select(
      `
        id,
        patient_id,
        baseline_report_id,
        start_date,
        end_date,
        status,
        completed_at,
        created_at,
        updated_at
      `,
    )
    .eq("patient_id", normalizedPatientId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to read active IFI monitoring cycle: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  const row = data as IFIMonitoringCycleRow;

  return {
    id: row.id,
    patientId: row.patient_id,
    baselineReportId: row.baseline_report_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
