import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { IFIMonitoringCycleStatus } from "@/types/calculations/ifi-monitoring";
import type { IFIMonitoringCycle } from "./getOrCreateIFIMonitoringCycle";

interface GetIFIMonitoringCyclesInput {
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
 * ============================================================
 * GET PATIENT IFI MONITORING CYCLES
 * ============================================================
 *
 * Returns all monitoring cycles belonging to one patient.
 *
 * Used by:
 *
 * - patient self IFI monitoring
 * - doctor connected-patient IFI monitoring
 * - cycle history selector
 *
 * IMPORTANT:
 *
 * This is a READ-ONLY service.
 *
 * It does not:
 * - create cycles
 * - complete cycles
 * - calculate IFI
 * - calculate Recovery
 * - modify reports
 *
 * Authorization must already have been performed by the caller.
 */
export async function getIFIMonitoringCycles({
  patientId,
}: GetIFIMonitoringCyclesInput): Promise<IFIMonitoringCycle[]> {
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

    /**
     * Newest cycle first.
     *
     * This makes the current/latest monitoring period naturally
     * appear first in the UI selector.
     */
    .order("start_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(`Failed to read IFI monitoring cycles: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return (data as IFIMonitoringCycleRow[]).map(mapCycleRow);
}

function mapCycleRow(row: IFIMonitoringCycleRow): IFIMonitoringCycle {
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
