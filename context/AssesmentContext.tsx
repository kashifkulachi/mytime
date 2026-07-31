// "use client";

// import { createContext, useState, ReactNode } from "react";
// import type {
//   Assessment,
//   AssessmentResult,
//   PatientInfo,
// } from "@/types/assesments";
// import type { OximeterData } from "@/types/oximeter";
// import type { VoiceMetrics } from "@/types/voice";

// interface AssessmentContextType {
//   assessment: Assessment;
//   updateVoice: (voice: VoiceMetrics) => void;
//   updatePatient: (patient: PatientInfo) => void;
//   updateOximeter: (oximeter: OximeterData | null) => void;
//   setResult: (result: AssessmentResult) => void;
//   resetAssessment: () => void;
// }

// const initialAssessment: Assessment = {
//   voice: null,
//   patient: null,
//   oximeter: null,
//   result: null,
// };

// export const AssessmentContext = createContext<
//   AssessmentContextType | undefined
// >(undefined);

// export function AssessmentProvider({ children }: { children: ReactNode }) {
//   const [assessment, setAssessment] = useState<Assessment>(initialAssessment);

//   const updateVoice = (voice: VoiceMetrics) => {
//     setAssessment((prev) => ({
//       ...prev,
//       voice,
//     }));
//   };

//   const updatePatient = (patient: PatientInfo) => {
//     setAssessment((prev) => ({
//       ...prev,
//       patient,
//     }));
//   };

//   const updateOximeter = (oximeter: OximeterData | null) => {
//     setAssessment((prev) => ({
//       ...prev,
//       oximeter,
//     }));
//   };

//   const setResult = (result: AssessmentResult) => {
//     setAssessment((prev) => ({
//       ...prev,
//       result,
//     }));
//   };

//   const resetAssessment = () => {
//     setAssessment(initialAssessment);
//   };

//   return (
//     <AssessmentContext.Provider
//       value={{
//         assessment,
//         updateVoice,
//         updatePatient,
//         updateOximeter,
//         setResult,
//         resetAssessment,
//       }}
//     >
//       {children}
//     </AssessmentContext.Provider>
//   );
// }

"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

import type {
  Assessment,
  AssessmentResult,
  PatientInfo,
} from "@/types/assessments";

import type { OximeterData } from "@/types/oximeter";
import type { VoiceMetrics } from "@/types/voice";

interface AssessmentContextType {
  assessment: Assessment;
  updateVoice: (voice: VoiceMetrics) => void;
  updatePatient: (patient: PatientInfo) => void;
  updateOximeter: (oximeter: OximeterData | null) => void;
  setResult: (result: AssessmentResult) => void;
  resetAssessment: () => void;
  resetVoice: () => void;
}

const ASSESSMENT_STORAGE_KEY = "mytime-assessment";

const initialAssessment: Assessment = {
  voice: null,
  patient: null,
  oximeter: null,
  result: null,
};

/*
 * This variable keeps the current assessment in memory.
 *
 * localStorage is used to restore it after a refresh.
 */
let assessmentSnapshot: Assessment = initialAssessment;

/*
 * Prevents localStorage from being read repeatedly.
 */
let hasLoadedStoredAssessment = false;

/*
 * Components subscribed to assessment changes.
 */
const listeners = new Set<() => void>();

export const AssessmentContext = createContext<
  AssessmentContextType | undefined
>(undefined);

/*
 * Safely checks whether stored data has the expected structure.
 */
function isStoredAssessment(value: unknown): value is Partial<Assessment> {
  return typeof value === "object" && value !== null;
}

/*
 * Reads the saved assessment from localStorage.
 *
 * This only runs in the browser because localStorage does not exist
 * during Next.js server rendering.
 */
function loadStoredAssessment(): void {
  if (typeof window === "undefined" || hasLoadedStoredAssessment) {
    return;
  }

  hasLoadedStoredAssessment = true;

  try {
    const storedAssessment = window.localStorage.getItem(
      ASSESSMENT_STORAGE_KEY,
    );

    if (!storedAssessment) {
      assessmentSnapshot = initialAssessment;
      return;
    }

    const parsedAssessment: unknown = JSON.parse(storedAssessment);

    if (!isStoredAssessment(parsedAssessment)) {
      window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
      assessmentSnapshot = initialAssessment;
      return;
    }

    /*
     * Merge with initialAssessment so newly added properties
     * still receive their default values.
     */
    assessmentSnapshot = {
      ...initialAssessment,
      ...parsedAssessment,
    };
  } catch (error) {
    console.error("Unable to restore assessment data.", error);

    window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    assessmentSnapshot = initialAssessment;
  }
}

/*
 * Saves the latest assessment in localStorage.
 */
function saveAssessment(assessment: Assessment): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ASSESSMENT_STORAGE_KEY,
      JSON.stringify(assessment),
    );
  } catch (error) {
    console.error("Unable to save assessment data.", error);
  }
}

/*
 * Tells all subscribed components that assessment data changed.
 */
function emitAssessmentChange(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

/*
 * Updates both the memory snapshot and localStorage.
 */
function updateAssessmentStore(
  updater: (previousAssessment: Assessment) => Assessment,
): void {
  loadStoredAssessment();

  assessmentSnapshot = updater(assessmentSnapshot);

  saveAssessment(assessmentSnapshot);
  emitAssessmentChange();
}

/*
 * React uses this on the client to read the latest assessment.
 */
function getAssessmentSnapshot(): Assessment {
  loadStoredAssessment();

  return assessmentSnapshot;
}

/*
 * React uses this during server rendering.
 *
 * Returning initialAssessment keeps the server-rendered HTML stable
 * and avoids hydration errors.
 */
function getServerAssessmentSnapshot(): Assessment {
  return initialAssessment;
}

/*
 * Subscribes React to assessment and localStorage changes.
 */
function subscribeToAssessment(listener: () => void): () => void {
  listeners.add(listener);

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== ASSESSMENT_STORAGE_KEY) {
      return;
    }

    try {
      if (!event.newValue) {
        assessmentSnapshot = initialAssessment;
      } else {
        const parsedAssessment: unknown = JSON.parse(event.newValue);

        if (isStoredAssessment(parsedAssessment)) {
          assessmentSnapshot = {
            ...initialAssessment,
            ...parsedAssessment,
          };
        }
      }

      emitAssessmentChange();
    } catch (error) {
      console.error("Unable to synchronize assessment storage.", error);
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange);
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageChange);
    }
  };
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const assessment = useSyncExternalStore(
    subscribeToAssessment,
    getAssessmentSnapshot,
    getServerAssessmentSnapshot,
  );

  const updateVoice = useCallback((voice: VoiceMetrics) => {
    updateAssessmentStore((previousAssessment) => ({
      ...previousAssessment,
      voice,
    }));
  }, []);

  const updatePatient = useCallback((patient: PatientInfo) => {
    updateAssessmentStore((previousAssessment) => ({
      ...previousAssessment,
      patient,
    }));
  }, []);

  const updateOximeter = useCallback((oximeter: OximeterData | null) => {
    updateAssessmentStore((previousAssessment) => ({
      ...previousAssessment,
      oximeter,
    }));
  }, []);

  const setResult = useCallback((result: AssessmentResult) => {
    updateAssessmentStore((previousAssessment) => ({
      ...previousAssessment,
      result,
    }));
  }, []);

  const resetAssessment = useCallback(() => {
    assessmentSnapshot = initialAssessment;
    hasLoadedStoredAssessment = true;

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    }

    emitAssessmentChange();
  }, []);

  const resetVoice = useCallback(() => {
    assessmentSnapshot = {
      ...assessmentSnapshot,
      voice: initialAssessment.voice,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        ASSESSMENT_STORAGE_KEY,
        JSON.stringify(assessmentSnapshot),
      );
    }

    emitAssessmentChange();
  }, []);

  const contextValue = useMemo<AssessmentContextType>(
    () => ({
      assessment,
      updateVoice,
      resetVoice,
      updatePatient,
      updateOximeter,
      setResult,
      resetAssessment,
    }),
    [
      assessment,
      updateVoice,
      resetVoice,
      updatePatient,
      updateOximeter,
      setResult,
      resetAssessment,
    ],
  );

  return (
    <AssessmentContext.Provider value={contextValue}>
      {children}
    </AssessmentContext.Provider>
  );
}
