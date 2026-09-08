// // Patient Self Assessment
// "use client";

// import {
//   createContext,
//   ReactNode,
//   useCallback,
//   useMemo,
//   useSyncExternalStore,
// } from "react";

// import type {
//   Assessment,
//   AssessmentResult,
//   PatientInfo,
// } from "@/types/assessments";

// import type { OximeterData } from "@/types/oximeter";
// import type { VoiceMetrics } from "@/types/voice";

// interface AssessmentContextType {
//   assessment: Assessment;
//   updateVoice: (voice: VoiceMetrics) => void;
//   updatePatient: (patient: PatientInfo) => void;
//   updateOximeter: (oximeter: OximeterData | null) => void;
//   setResult: (result: AssessmentResult) => void;
//   resetAssessment: () => void;
//   resetVoice: () => void;
// }

// const ASSESSMENT_STORAGE_KEY = "mytime-assessment";

// const initialAssessment: Assessment = {
//   voice: null,
//   patient: null,
//   oximeter: null,
//   result: null,
// };

// /*
//  * This variable keeps the current assessment in memory.
//  *
//  * localStorage is used to restore it after a refresh.
//  */
// let assessmentSnapshot: Assessment = initialAssessment;

// /*
//  * Prevents localStorage from being read repeatedly.
//  */
// let hasLoadedStoredAssessment = false;

// /*
//  * Components subscribed to assessment changes.
//  */
// const listeners = new Set<() => void>();

// export const AssessmentContext = createContext<
//   AssessmentContextType | undefined
// >(undefined);

// /*
//  * Safely checks whether stored data has the expected structure.
//  */
// function isStoredAssessment(value: unknown): value is Partial<Assessment> {
//   return typeof value === "object" && value !== null;
// }

// /*
//  * Reads the saved assessment from localStorage.
//  *
//  * This only runs in the browser because localStorage does not exist
//  * during Next.js server rendering.
//  */
// function loadStoredAssessment(): void {
//   if (typeof window === "undefined" || hasLoadedStoredAssessment) {
//     return;
//   }

//   hasLoadedStoredAssessment = true;

//   try {
//     const storedAssessment = window.localStorage.getItem(
//       ASSESSMENT_STORAGE_KEY,
//     );

//     if (!storedAssessment) {
//       assessmentSnapshot = initialAssessment;
//       return;
//     }

//     const parsedAssessment: unknown = JSON.parse(storedAssessment);

//     if (!isStoredAssessment(parsedAssessment)) {
//       window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
//       assessmentSnapshot = initialAssessment;
//       return;
//     }

//     /*
//      * Merge with initialAssessment so newly added properties
//      * still receive their default values.
//      */
//     assessmentSnapshot = {
//       ...initialAssessment,
//       ...parsedAssessment,
//     };
//   } catch (error) {
//     console.error("Unable to restore assessment data.", error);

//     window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
//     assessmentSnapshot = initialAssessment;
//   }
// }

// /*
//  * Saves the latest assessment in localStorage.
//  */
// function saveAssessment(assessment: Assessment): void {
//   if (typeof window === "undefined") {
//     return;
//   }

//   try {
//     window.localStorage.setItem(
//       ASSESSMENT_STORAGE_KEY,
//       JSON.stringify(assessment),
//     );
//   } catch (error) {
//     console.error("Unable to save assessment data.", error);
//   }
// }

// /*
//  * Tells all subscribed components that assessment data changed.
//  */
// function emitAssessmentChange(): void {
//   listeners.forEach((listener) => {
//     listener();
//   });
// }

// /*
//  * Updates both the memory snapshot and localStorage.
//  */
// function updateAssessmentStore(
//   updater: (previousAssessment: Assessment) => Assessment,
// ): void {
//   loadStoredAssessment();

//   assessmentSnapshot = updater(assessmentSnapshot);

//   saveAssessment(assessmentSnapshot);
//   emitAssessmentChange();
// }

// /*
//  * React uses this on the client to read the latest assessment.
//  */
// function getAssessmentSnapshot(): Assessment {
//   loadStoredAssessment();

//   return assessmentSnapshot;
// }

// /*
//  * React uses this during server rendering.
//  *
//  * Returning initialAssessment keeps the server-rendered HTML stable
//  * and avoids hydration errors.
//  */
// function getServerAssessmentSnapshot(): Assessment {
//   return initialAssessment;
// }

// /*
//  * Subscribes React to assessment and localStorage changes.
//  */
// function subscribeToAssessment(listener: () => void): () => void {
//   listeners.add(listener);

//   const handleStorageChange = (event: StorageEvent) => {
//     if (event.key !== ASSESSMENT_STORAGE_KEY) {
//       return;
//     }

//     try {
//       if (!event.newValue) {
//         assessmentSnapshot = initialAssessment;
//       } else {
//         const parsedAssessment: unknown = JSON.parse(event.newValue);

//         if (isStoredAssessment(parsedAssessment)) {
//           assessmentSnapshot = {
//             ...initialAssessment,
//             ...parsedAssessment,
//           };
//         }
//       }

//       emitAssessmentChange();
//     } catch (error) {
//       console.error("Unable to synchronize assessment storage.", error);
//     }
//   };

//   if (typeof window !== "undefined") {
//     window.addEventListener("storage", handleStorageChange);
//   }

//   return () => {
//     listeners.delete(listener);

//     if (typeof window !== "undefined") {
//       window.removeEventListener("storage", handleStorageChange);
//     }
//   };
// }

// export function AssessmentProvider({ children }: { children: ReactNode }) {
//   const assessment = useSyncExternalStore(
//     subscribeToAssessment,
//     getAssessmentSnapshot,
//     getServerAssessmentSnapshot,
//   );

//   const updateVoice = useCallback((voice: VoiceMetrics) => {
//     updateAssessmentStore((previousAssessment) => ({
//       ...previousAssessment,
//       voice,
//     }));
//   }, []);

//   const updatePatient = useCallback((patient: PatientInfo) => {
//     updateAssessmentStore((previousAssessment) => ({
//       ...previousAssessment,
//       patient,
//     }));
//   }, []);

//   const updateOximeter = useCallback((oximeter: OximeterData | null) => {
//     updateAssessmentStore((previousAssessment) => ({
//       ...previousAssessment,
//       oximeter,
//     }));
//   }, []);

//   const setResult = useCallback((result: AssessmentResult) => {
//     updateAssessmentStore((previousAssessment) => ({
//       ...previousAssessment,
//       result,
//     }));
//   }, []);

//   const resetAssessment = useCallback(() => {
//     assessmentSnapshot = initialAssessment;
//     hasLoadedStoredAssessment = true;

//     if (typeof window !== "undefined") {
//       window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
//     }

//     emitAssessmentChange();
//   }, []);

//   const resetVoice = useCallback(() => {
//     assessmentSnapshot = {
//       ...assessmentSnapshot,
//       voice: initialAssessment.voice,
//     };

//     if (typeof window !== "undefined") {
//       window.localStorage.setItem(
//         ASSESSMENT_STORAGE_KEY,
//         JSON.stringify(assessmentSnapshot),
//       );
//     }

//     emitAssessmentChange();
//   }, []);

//   const contextValue = useMemo<AssessmentContextType>(
//     () => ({
//       assessment,
//       updateVoice,
//       resetVoice,
//       updatePatient,
//       updateOximeter,
//       setResult,
//       resetAssessment,
//     }),
//     [
//       assessment,
//       updateVoice,
//       resetVoice,
//       updatePatient,
//       updateOximeter,
//       setResult,
//       resetAssessment,
//     ],
//   );

//   return (
//     <AssessmentContext.Provider value={contextValue}>
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
import type { AssessmentSubject } from "@/types/assessment-subject";
import type { OximeterData } from "@/types/oximeter";
import type { VoiceMetrics } from "@/types/voice";

interface AssessmentContextType {
  /**
   * Clinical assessment data.
   */
  assessment: Assessment;

  /**
   * Identifies WHO this assessment belongs to.
   *
   * null means an assessment session has not been explicitly
   * initialized yet.
   */
  subject: AssessmentSubject | null;

  updateVoice: (voice: VoiceMetrics) => void;

  updatePatient: (patient: PatientInfo) => void;

  updateOximeter: (oximeter: OximeterData | null) => void;

  setResult: (result: AssessmentResult) => void;

  /**
   * Starts a completely new assessment session.
   *
   * IMPORTANT:
   *
   * This resets all previous clinical assessment data and locks
   * the supplied subject for the new session.
   *
   * We deliberately do NOT expose a generic setSubject().
   */
  startAssessment: (subject: AssessmentSubject) => void;

  /**
   * Clears both assessment data and assessment subject.
   */
  resetAssessment: () => void;

  resetVoice: () => void;
}

const ASSESSMENT_STORAGE_KEY = "mytime-assessment";

/**
 * Storage format version.
 *
 * Your old localStorage contained the Assessment object directly.
 *
 * We are now storing:
 *
 * {
 *   version: 2,
 *   assessment: {...},
 *   subject: {...}
 * }
 *
 * loadStoredSession() below remains backward-compatible with the
 * old format so existing development data does not crash.
 */
const ASSESSMENT_STORAGE_VERSION = 2;

const initialAssessment: Assessment = {
  voice: null,
  patient: null,
  oximeter: null,
  result: null,
};

interface AssessmentSessionSnapshot {
  assessment: Assessment;
  subject: AssessmentSubject | null;
}

interface PersistedAssessmentSession {
  version: number;
  assessment: Assessment;
  subject: AssessmentSubject | null;
}

/**
 * ------------------------------------------------------------
 * IN-MEMORY STORE
 * ------------------------------------------------------------
 */
const initialSessionSnapshot: AssessmentSessionSnapshot = {
  assessment: initialAssessment,
  subject: null,
};

let sessionSnapshot: AssessmentSessionSnapshot = initialSessionSnapshot;

/**
 * Prevents repeated localStorage reads.
 */
let hasLoadedStoredAssessment = false;

/**
 * Components subscribed to assessment/session changes.
 */
const listeners = new Set<() => void>();

export const AssessmentContext = createContext<
  AssessmentContextType | undefined
>(undefined);

/**
 * ------------------------------------------------------------
 * TYPE GUARDS
 * ------------------------------------------------------------
 */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredAssessment(value: unknown): value is Partial<Assessment> {
  return isObject(value);
}

function isAssessmentSubject(value: unknown): value is AssessmentSubject {
  if (!isObject(value)) {
    return false;
  }

  if (value.mode === "patient-self") {
    return true;
  }

  if (value.mode !== "doctor-patient") {
    return false;
  }

  if (
    typeof value.relationshipId !== "string" ||
    !value.relationshipId.trim()
  ) {
    return false;
  }

  if (!isObject(value.patient)) {
    return false;
  }

  const fullName = value.patient.fullName;

  return fullName === null || typeof fullName === "string";
}

/**
 * ------------------------------------------------------------
 * LOAD STORED SESSION
 * ------------------------------------------------------------
 */
function loadStoredSession(): void {
  if (typeof window === "undefined" || hasLoadedStoredAssessment) {
    return;
  }

  hasLoadedStoredAssessment = true;

  try {
    const stored = window.localStorage.getItem(ASSESSMENT_STORAGE_KEY);

    if (!stored) {
      sessionSnapshot = initialSessionSnapshot;

      return;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!isObject(parsed)) {
      clearInvalidStorage();
      return;
    }

    /**
     * --------------------------------------------------------
     * VERSION 2 FORMAT
     * --------------------------------------------------------
     */
    if (
      parsed.version === ASSESSMENT_STORAGE_VERSION &&
      isStoredAssessment(parsed.assessment)
    ) {
      const storedSubject = parsed.subject;

      sessionSnapshot = {
        assessment: {
          ...initialAssessment,
          ...parsed.assessment,
        },

        subject:
          storedSubject === null || isAssessmentSubject(storedSubject)
            ? storedSubject
            : null,
      };

      return;
    }

    /**
     * --------------------------------------------------------
     * LEGACY FORMAT
     * --------------------------------------------------------
     *
     * Previous localStorage value was simply:
     *
     * {
     *   voice,
     *   patient,
     *   oximeter,
     *   result
     * }
     *
     * Preserve that data but leave subject null.
     */
    if (isStoredAssessment(parsed)) {
      sessionSnapshot = {
        assessment: {
          ...initialAssessment,
          ...parsed,
        },

        subject: null,
      };

      /**
       * Immediately migrate legacy storage to V2.
       */
      saveSession(sessionSnapshot);

      return;
    }

    clearInvalidStorage();
  } catch (error) {
    console.error("Unable to restore assessment session.", error);

    clearInvalidStorage();
  }
}

function clearInvalidStorage(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
  }

  sessionSnapshot = initialSessionSnapshot;
}

/**
 * ------------------------------------------------------------
 * SAVE SESSION
 * ------------------------------------------------------------
 */
function saveSession(snapshot: AssessmentSessionSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  const persistedSession: PersistedAssessmentSession = {
    version: ASSESSMENT_STORAGE_VERSION,

    assessment: snapshot.assessment,

    subject: snapshot.subject,
  };

  try {
    window.localStorage.setItem(
      ASSESSMENT_STORAGE_KEY,
      JSON.stringify(persistedSession),
    );
  } catch (error) {
    console.error("Unable to save assessment session.", error);
  }
}

/**
 * ------------------------------------------------------------
 * SUBSCRIPTIONS
 * ------------------------------------------------------------
 */
function emitAssessmentChange(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function updateSessionStore(
  updater: (previous: AssessmentSessionSnapshot) => AssessmentSessionSnapshot,
): void {
  loadStoredSession();

  sessionSnapshot = updater(sessionSnapshot);

  saveSession(sessionSnapshot);

  emitAssessmentChange();
}

/**
 * useSyncExternalStore requires the same object reference until
 * the store actually changes.
 */
function getSessionSnapshot(): AssessmentSessionSnapshot {
  loadStoredSession();

  return sessionSnapshot;
}

function getServerSessionSnapshot(): AssessmentSessionSnapshot {
  return initialSessionSnapshot;
}

function subscribeToAssessment(listener: () => void): () => void {
  listeners.add(listener);

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== ASSESSMENT_STORAGE_KEY) {
      return;
    }

    try {
      if (!event.newValue) {
        sessionSnapshot = initialSessionSnapshot;

        emitAssessmentChange();

        return;
      }

      const parsed: unknown = JSON.parse(event.newValue);

      if (
        !isObject(parsed) ||
        parsed.version !== ASSESSMENT_STORAGE_VERSION ||
        !isStoredAssessment(parsed.assessment)
      ) {
        return;
      }

      const storedSubject = parsed.subject;

      sessionSnapshot = {
        assessment: {
          ...initialAssessment,
          ...parsed.assessment,
        },

        subject:
          storedSubject === null || isAssessmentSubject(storedSubject)
            ? storedSubject
            : null,
      };

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

/**
 * ------------------------------------------------------------
 * PROVIDER
 * ------------------------------------------------------------
 */
export function AssessmentProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeToAssessment,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  const assessment = snapshot.assessment;

  const subject = snapshot.subject;

  /**
   * ----------------------------------------------------------
   * START NEW ASSESSMENT
   * ----------------------------------------------------------
   *
   * This is the ONLY normal way to establish the assessment
   * subject.
   *
   * It also wipes old measurements/results so Patient A's data
   * can never accidentally continue into Patient B's assessment.
   */
  const startAssessment = useCallback((newSubject: AssessmentSubject) => {
    sessionSnapshot = {
      assessment: initialAssessment,

      subject: newSubject,
    };

    hasLoadedStoredAssessment = true;

    saveSession(sessionSnapshot);

    emitAssessmentChange();
  }, []);

  const updateVoice = useCallback((voice: VoiceMetrics) => {
    updateSessionStore((previous) => ({
      ...previous,

      assessment: {
        ...previous.assessment,
        voice,
      },
    }));
  }, []);

  const updatePatient = useCallback((patient: PatientInfo) => {
    updateSessionStore((previous) => ({
      ...previous,

      assessment: {
        ...previous.assessment,
        patient,
      },
    }));
  }, []);

  const updateOximeter = useCallback((oximeter: OximeterData | null) => {
    updateSessionStore((previous) => ({
      ...previous,

      assessment: {
        ...previous.assessment,
        oximeter,
      },
    }));
  }, []);

  const setResult = useCallback((result: AssessmentResult) => {
    updateSessionStore((previous) => ({
      ...previous,

      assessment: {
        ...previous.assessment,
        result,
      },
    }));
  }, []);

  /**
   * ----------------------------------------------------------
   * RESET EVERYTHING
   * ----------------------------------------------------------
   */
  const resetAssessment = useCallback(() => {
    sessionSnapshot = initialSessionSnapshot;

    hasLoadedStoredAssessment = true;

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    }

    emitAssessmentChange();
  }, []);

  /**
   * ----------------------------------------------------------
   * RESET VOICE ONLY
   * ----------------------------------------------------------
   */
  const resetVoice = useCallback(() => {
    updateSessionStore((previous) => ({
      ...previous,

      assessment: {
        ...previous.assessment,

        voice: initialAssessment.voice,
      },
    }));
  }, []);

  const contextValue = useMemo<AssessmentContextType>(
    () => ({
      assessment,

      subject,

      startAssessment,

      updateVoice,

      resetVoice,

      updatePatient,

      updateOximeter,

      setResult,

      resetAssessment,
    }),

    [
      assessment,
      subject,
      startAssessment,
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
