"use client";

import { useCallback } from "react";

import { useAssessment } from "@/hooks/useAssessment";
import { useOximeterBluetooth } from "@/hooks/useOximeterBluetooth";

export function useOximeterAssessment() {
  const bluetooth = useOximeterBluetooth();

  const { assessment, updateOximeter } = useAssessment();

  const { spo2, heartRate, clearMeasurement } = bluetooth;

  /**
   * The current Bluetooth measurement is complete
   * only when both values are available.
   */
  const hasCompleteMeasurement =
    typeof spo2 === "number" && typeof heartRate === "number";

  /**
   * Save the current oximeter reading into the
   * Assessment Context.
   *
   * This function should be called only when the
   * user clicks the Continue button.
   */
  const saveMeasurementToAssessment = useCallback((): boolean => {
    if (!hasCompleteMeasurement) {
      return false;
    }

    updateOximeter({
      spo2,
      heartRate,
    });

    bluetooth.disconnect();

    return true;
  }, [hasCompleteMeasurement, spo2, heartRate, updateOximeter, bluetooth]);

  /**
   * Clear both:
   *
   * 1. The currently displayed Bluetooth reading.
   * 2. The saved oximeter reading in Assessment Context.
   */
  const clearAssessmentMeasurement = useCallback(() => {
    clearMeasurement();
    updateOximeter(null);
  }, [clearMeasurement, updateOximeter]);

  return {
    ...bluetooth,

    assessmentOximeter: assessment.oximeter,

    hasCompleteMeasurement,

    saveMeasurementToAssessment,

    clearAssessmentMeasurement,
  };
}
