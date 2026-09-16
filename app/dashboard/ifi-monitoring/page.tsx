import { redirect } from "next/navigation";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

import IFIMonitoringDashboard from "@/components/ifi-monitoring/IFIMonitoringDashboard";

/**
 * ============================================================
 * PATIENT IFI MONITORING PAGE
 * ============================================================
 *
 * Route:
 *
 * /dashboard/ifi-monitoring
 *
 * Responsibilities:
 *
 * - authenticate server-side
 * - allow patient accounts only
 * - provide authenticated patient identity
 * - render the shared IFI Monitoring dashboard
 *
 * Clinical monitoring data itself is loaded securely through:
 *
 * GET /api/ifi-monitoring
 *
 * That API resolves patientId from the authenticated profile,
 * so no patient UUID is exposed as an authorization mechanism.
 */

export default async function IFIMonitoringPage() {
  /**
   * ----------------------------------------------------------
   * 1. AUTHENTICATION
   * ----------------------------------------------------------
   */
  const profile = await requireCurrentProfile();

  /**
   * ----------------------------------------------------------
   * 2. PATIENT-ONLY PAGE
   * ----------------------------------------------------------
   *
   * Doctors should access IFI Monitoring through:
   *
   * /dashboard/patients/[relationshipId]/ifi-monitoring
   */
  if (profile.role !== "patient") {
    redirect("/dashboard");
  }

  /**
   * ----------------------------------------------------------
   * 3. PATIENT DISPLAY NAME
   * ----------------------------------------------------------
   */
  const patientName = profile.fullName?.trim() || "Patient";

  /**
   * ----------------------------------------------------------
   * 4. RENDER SHARED MONITORING DASHBOARD
   * ----------------------------------------------------------
   *
   * The client component knows nothing about patient ownership.
   *
   * It simply calls the patient-safe endpoint:
   *
   * /api/ifi-monitoring
   */
  return (
    <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <IFIMonitoringDashboard
        apiEndpoint="/api/ifi-monitoring"
        patientName={patientName}
      />
    </div>
  );
}
