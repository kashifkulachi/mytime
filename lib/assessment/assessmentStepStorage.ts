const ACTIVE_STEP_STORAGE_KEY = "mytime-assessment-active-step";

const DEFAULT_STEP_INDEX = 0;

export function getStoredAssessmentStep(): string {
  if (typeof window === "undefined") {
    return String(DEFAULT_STEP_INDEX);
  }

  return (
    window.localStorage.getItem(ACTIVE_STEP_STORAGE_KEY) ??
    String(DEFAULT_STEP_INDEX)
  );
}

export function getServerAssessmentStep(): string {
  return String(DEFAULT_STEP_INDEX);
}

export function subscribeToAssessmentStep(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === ACTIVE_STEP_STORAGE_KEY || event.key === null) {
      callback();
    }
  };

  const handleLocalStepChange = () => {
    callback();
  };

  window.addEventListener("storage", handleStorageChange);

  window.addEventListener("assessment-step-change", handleLocalStepChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);

    window.removeEventListener("assessment-step-change", handleLocalStepChange);
  };
}

export function saveAssessmentStep(stepIndex: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_STEP_STORAGE_KEY, String(stepIndex));

  /*
   * The native storage event only fires in other tabs.
   * This custom event updates the current tab immediately.
   */
  window.dispatchEvent(new Event("assessment-step-change"));
}

export function clearStoredAssessmentStep(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_STEP_STORAGE_KEY);

  window.dispatchEvent(new Event("assessment-step-change"));
}
