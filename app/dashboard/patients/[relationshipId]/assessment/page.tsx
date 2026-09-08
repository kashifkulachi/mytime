// "use client";

// import {
//   ArrowLeft,
//   LoaderCircle,
//   ShieldCheck,
//   Stethoscope,
//   UserRound,
// } from "lucide-react";
// import { useParams, useRouter } from "next/navigation";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { toast } from "sonner";

// import type { AssessmentSubject } from "@/types/assessment-subject";

// interface PatientWorkspaceApiResponse {
//   success: boolean;
//   code?: string;
//   message?: string;
//   error?: string;

//   patientWorkspace?: {
//     relationshipId: string;

//     patient: {
//       fullName: string | null;
//     };

//     relationship: {
//       status: "active";
//       createdAt: string;
//       acceptedAt: string | null;
//       updatedAt: string;
//     };
//   };
// }

// type PatientWorkspace = NonNullable<
//   PatientWorkspaceApiResponse["patientWorkspace"]
// >;

// function getInitials(name: string | null): string {
//   if (!name) {
//     return "PT";
//   }

//   const parts = name.trim().split(/\s+/).filter(Boolean);

//   if (parts.length === 0) {
//     return "PT";
//   }

//   if (parts.length === 1) {
//     return parts[0].slice(0, 2).toUpperCase();
//   }

//   return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
// }

// export default function DoctorPatientAssessmentPage() {
//   const params = useParams<{
//     relationshipId: string;
//   }>();

//   const router = useRouter();

//   const relationshipId = params.relationshipId;

//   const [workspace, setWorkspace] = useState<PatientWorkspace | null>(null);

//   const [isLoading, setIsLoading] = useState(true);

//   const [pageError, setPageError] = useState<string | null>(null);

//   const redirectToLogin = useCallback(() => {
//     const returnPath = `/dashboard/patients/${encodeURIComponent(
//       relationshipId,
//     )}/assessment`;

//     router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
//   }, [relationshipId, router]);

//   const loadWorkspace = useCallback(async () => {
//     if (!relationshipId) {
//       throw new Error("A patient relationship ID was not provided.");
//     }

//     const response = await fetch(
//       `/api/doctor/patients/${encodeURIComponent(relationshipId)}`,
//       {
//         method: "GET",
//         cache: "no-store",
//       },
//     );

//     const data = (await response.json()) as PatientWorkspaceApiResponse;

//     if (response.status === 401) {
//       redirectToLogin();
//       return;
//     }

//     if (response.status === 403) {
//       throw new Error(
//         data.message ??
//           "You are not authorized to access this patient assessment.",
//       );
//     }

//     if (response.status === 404) {
//       throw new Error(
//         data.message ?? "This patient relationship is unavailable.",
//       );
//     }

//     if (!response.ok || !data.success || !data.patientWorkspace) {
//       throw new Error(
//         data.message || data.error || "Unable to load the selected patient.",
//       );
//     }

//     setWorkspace(data.patientWorkspace);
//   }, [redirectToLogin, relationshipId]);

//   useEffect(() => {
//     let cancelled = false;

//     async function initialize() {
//       try {
//         setIsLoading(true);
//         setPageError(null);

//         await loadWorkspace();
//       } catch (error) {
//         if (cancelled) {
//           return;
//         }

//         const message =
//           error instanceof Error
//             ? error.message
//             : "Unable to load the selected patient.";

//         setPageError(message);

//         toast.error(message);
//       } finally {
//         if (!cancelled) {
//           setIsLoading(false);
//         }
//       }
//     }

//     void initialize();

//     return () => {
//       cancelled = true;
//     };
//   }, [loadWorkspace]);

//   const patientName = useMemo(
//     () => workspace?.patient.fullName?.trim() || "Patient",
//     [workspace],
//   );

//   /**
//    * Locked assessment subject for this doctor workflow.
//    *
//    * IMPORTANT:
//    * No patient UUID is present here.
//    */
//   const assessmentSubject = useMemo<AssessmentSubject | null>(() => {
//     if (!workspace) {
//       return null;
//     }

//     return {
//       mode: "doctor-patient",
//       relationshipId: workspace.relationshipId,

//       patient: {
//         fullName: workspace.patient.fullName,
//       },
//     };
//   }, [workspace]);

//   if (isLoading) {
//     return (
//       <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
//         <div className="flex flex-col items-center gap-3">
//           <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

//           <p className="text-sm font-medium text-slate-600">
//             Preparing patient assessment...
//           </p>
//         </div>
//       </main>
//     );
//   }

//   if (!workspace || !assessmentSubject) {
//     return (
//       <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
//         <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
//           <h1 className="text-xl font-bold text-[#032b52]">
//             Assessment unavailable
//           </h1>

//           <p className="mt-2 text-sm leading-6 text-slate-500">
//             {pageError ?? "This patient cannot currently be assessed."}
//           </p>

//           <button
//             type="button"
//             onClick={() => router.push("/dashboard/patients")}
//             className="mt-6 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#062542]"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             Back to My Patients
//           </button>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="min-h-screen w-full bg-[#f8f9fd]">
//       <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
//         <button
//           type="button"
//           onClick={() =>
//             router.push(
//               `/dashboard/patients/${encodeURIComponent(
//                 workspace.relationshipId,
//               )}`,
//             )
//           }
//           className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#063467]"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Patient Workspace
//         </button>

//         <header className="mt-5">
//           <div className="flex items-center gap-2">
//             <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0ff] text-[#005cff]">
//               <Stethoscope className="h-5 w-5" />
//             </span>

//             <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
//               Doctor Assessment
//             </p>
//           </div>

//           <h1 className="mt-4 text-[28px] font-bold tracking-[-0.025em] text-[#062d52] sm:text-[34px]">
//             New MyTime Assessment
//           </h1>

//           <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
//             Complete the MyTime assessment for the selected patient. The patient
//             is locked for this assessment session.
//           </p>
//         </header>

//         <section className="mt-7 rounded-2xl border border-slate-300 bg-white px-5 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:px-6">
//           <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
//             <div className="flex min-w-0 items-center gap-4">
//               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-bold text-[#063467]">
//                 {getInitials(patientName)}
//               </div>

//               <div className="min-w-0">
//                 <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
//                   Assessment Patient
//                 </p>

//                 <h2 className="mt-1 truncate text-lg font-bold text-[#092846]">
//                   {patientName}
//                 </h2>
//               </div>
//             </div>

//             <div className="flex items-start gap-2 rounded-lg bg-[#f7faff] px-3 py-3 text-xs leading-5 text-slate-600">
//               <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#005cff]" />

//               <span>Active doctor-patient relationship verified.</span>
//             </div>
//           </div>
//         </section>

//         <section className="mt-7 rounded-2xl border border-slate-300 bg-white px-5 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-6">
//           <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#005cff]">
//             <UserRound className="h-6 w-6" />
//           </div>

//           <h2 className="mt-4 text-lg font-bold text-[#092846]">
//             Assessment subject ready
//           </h2>

//           <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
//             The next step is to attach your existing AssessmentStepper here
//             using this locked patient relationship.
//           </p>

//           <div className="mx-auto mt-5 max-w-xl rounded-lg bg-slate-50 px-4 py-3 text-left">
//             <p className="text-xs font-semibold text-slate-500">
//               Assessment Mode
//             </p>

//             <p className="mt-1 text-sm font-semibold text-[#092846]">
//               Doctor assessment
//             </p>

//             <p className="mt-3 text-xs font-semibold text-slate-500">Patient</p>

//             <p className="mt-1 text-sm font-semibold text-[#092846]">
//               {patientName}
//             </p>
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }
"use client";

import {
  ArrowLeft,
  LoaderCircle,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { AssessmentContext } from "@/context/AssesmentContext";
import type { DoctorPatientAssessmentSubject } from "@/types/assessment-subject";

/**
 * IMPORTANT:
 *
 * Update this import path if your actual AssessmentStepper lives
 * somewhere else.
 */
import AssessmentStepper from "@/app/dashboard/get-report/AssesmentStepper";

interface PatientWorkspaceApiResponse {
  success: boolean;

  code?: string;
  message?: string;
  error?: string;

  patientWorkspace?: {
    relationshipId: string;

    patient: {
      fullName: string | null;
    };

    relationship: {
      status: "active";
      createdAt: string;
      acceptedAt: string | null;
      updatedAt: string;
    };
  };
}

type PatientWorkspace = NonNullable<
  PatientWorkspaceApiResponse["patientWorkspace"]
>;

function getInitials(name: string | null): string {
  if (!name) {
    return "PT";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "PT";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function DoctorPatientAssessmentPage() {
  const params = useParams<{
    relationshipId: string;
  }>();

  const router = useRouter();

  const relationshipId = params.relationshipId;

  const assessmentContext = useContext(AssessmentContext);

  if (!assessmentContext) {
    throw new Error(
      "DoctorPatientAssessmentPage must be used inside AssessmentProvider.",
    );
  }

  const { subject, startAssessment } = assessmentContext;

  const [workspace, setWorkspace] = useState<PatientWorkspace | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [pageError, setPageError] = useState<string | null>(null);

  /**
   * Prevent startAssessment() from firing repeatedly when the
   * context updates during Voice/Oximeter/Patient steps.
   */
  const subjectInitializedRef = useRef(false);

  const redirectToLogin = useCallback(() => {
    const returnPath = `/dashboard/patients/${encodeURIComponent(
      relationshipId,
    )}/assessment`;

    router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
  }, [relationshipId, router]);

  /**
   * ----------------------------------------------------------
   * LOAD ACTIVE PATIENT RELATIONSHIP
   * ----------------------------------------------------------
   */
  const loadWorkspace = useCallback(async () => {
    if (!relationshipId) {
      throw new Error("A patient relationship ID was not provided.");
    }

    const response = await fetch(
      `/api/doctor/patients/${encodeURIComponent(relationshipId)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const data = (await response.json()) as PatientWorkspaceApiResponse;

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    if (response.status === 403) {
      throw new Error(
        data.message ??
          "You are not authorized to access this patient assessment.",
      );
    }

    if (response.status === 404) {
      throw new Error(
        data.message ?? "This patient relationship is unavailable.",
      );
    }

    if (!response.ok || !data.success || !data.patientWorkspace) {
      throw new Error(
        data.message || data.error || "Unable to load the selected patient.",
      );
    }

    setWorkspace(data.patientWorkspace);
  }, [redirectToLogin, relationshipId]);

  /**
   * ----------------------------------------------------------
   * INITIAL LOAD
   * ----------------------------------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setIsLoading(true);
        setPageError(null);

        await loadWorkspace();
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load the selected patient.";

        setPageError(message);

        toast.error(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadWorkspace]);

  const patientName = useMemo(
    () => workspace?.patient.fullName?.trim() || "Patient",
    [workspace],
  );

  /**
   * ----------------------------------------------------------
   * BUILD LOCKED DOCTOR ASSESSMENT SUBJECT
   * ----------------------------------------------------------
   */
  const assessmentSubject =
    useMemo<DoctorPatientAssessmentSubject | null>(() => {
      if (!workspace) {
        return null;
      }

      return {
        mode: "doctor-patient",

        relationshipId: workspace.relationshipId,

        patient: {
          fullName: workspace.patient.fullName,
        },
      };
    }, [workspace]);

  /**
   * ----------------------------------------------------------
   * START / RESTORE ASSESSMENT SESSION
   * ----------------------------------------------------------
   *
   * There are two cases:
   *
   * 1. Fresh doctor assessment
   *    → startAssessment()
   *    → clears old clinical data
   *
   * 2. Page refresh during SAME assessment
   *    → existing subject matches relationshipId
   *    → do NOT reset clinical data
   *
   * This is critical because AssessmentContext is persisted in
   * localStorage.
   */
  useEffect(() => {
    if (!assessmentSubject || subjectInitializedRef.current) {
      return;
    }

    /**
     * --------------------------------------------------------
     * SAME DOCTOR/PATIENT SESSION
     * --------------------------------------------------------
     *
     * Example:
     *
     * Doctor recorded voice
     * → refreshes page
     * → context restored from localStorage
     *
     * We must NOT wipe that assessment.
     */
    const existingSubjectMatches =
      subject?.mode === "doctor-patient" &&
      subject.relationshipId === assessmentSubject.relationshipId;

    if (existingSubjectMatches) {
      subjectInitializedRef.current = true;

      return;
    }

    /**
     * --------------------------------------------------------
     * NEW PATIENT / NEW SUBJECT
     * --------------------------------------------------------
     *
     * This intentionally resets:
     *
     * voice
     * oximeter
     * patient metrics
     * results
     *
     * before locking the new patient.
     */
    startAssessment(assessmentSubject);

    subjectInitializedRef.current = true;
  }, [assessmentSubject, startAssessment, subject]);

  /**
   * ----------------------------------------------------------
   * WAIT UNTIL CONTEXT SUBJECT IS READY
   * ----------------------------------------------------------
   */
  const isAssessmentSubjectReady =
    subject?.mode === "doctor-patient" &&
    subject.relationshipId === workspace?.relationshipId;

  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

          <p className="text-sm font-medium text-slate-600">
            Preparing patient assessment...
          </p>
        </div>
      </main>
    );
  }

  if (!workspace || !assessmentSubject) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#032b52]">
            Assessment unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {pageError ?? "This patient cannot currently be assessed."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/patients")}
            className="mt-6 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#062542]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Patients
          </button>
        </div>
      </main>
    );
  }

  /**
   * Context update happens immediately after startAssessment(),
   * but wait for it explicitly before mounting the Stepper.
   */
  if (!isAssessmentSubjectReady) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

          <p className="text-sm font-medium text-slate-600">
            Starting assessment session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#f8f9fd]">
      <div className="mx-auto w-full max-w-[1180px]  py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Back */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/dashboard/patients/${encodeURIComponent(
                workspace.relationshipId,
              )}`,
            )
          }
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#063467]"
        >
          <ArrowLeft className="h-4 w-4" />
          Patient Workspace
        </button>

        {/* Header */}

        <header className="mt-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0ff] text-[#005cff]">
              <Stethoscope className="h-5 w-5" />
            </span>

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Doctor Assessment
            </p>
          </div>

          <h1 className="mt-4 text-[28px] font-bold tracking-[-0.025em] text-[#062d52] sm:text-[34px]">
            New MyTime Assessment
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
            Complete the MyTime assessment for the selected patient.
          </p>
        </header>

        {/* Locked Patient */}

        <section className="mt-7 rounded-2xl border border-slate-300 bg-white px-5 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-bold text-[#063467]">
                {getInitials(patientName)}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Assessment Patient
                </p>

                <h2 className="mt-1 truncate text-lg font-bold text-[#092846]">
                  {patientName}
                </h2>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-[#f7faff] px-3 py-3 text-xs leading-5 text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#005cff]" />

              <span>Patient locked for this assessment session.</span>
            </div>
          </div>
        </section>

        {/* Existing Assessment Stepper */}

        <section className="mt-7">
          <AssessmentStepper />
        </section>
      </div>
    </main>
  );
}
