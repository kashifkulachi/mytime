"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Send,
} from "lucide-react";

import { submitAssessmentAction } from "@/actions/assessment.action";

import Voice from "./VoiceComponents/Voice";
import PatientInfo from "./PatientInfoComponents/PatientInfo";
import Oximeter from "./OximeterComponents/OximeterParent";
import { useAssessment } from "@/hooks/useAssessment";
import {
  clearStoredAssessmentStep,
  getServerAssessmentStep,
  getStoredAssessmentStep,
  saveAssessmentStep,
  subscribeToAssessmentStep,
} from "@/lib/assessment/assessmentStepStorage";
// import "@/temporarily/test_check_IFI";

type StepId = "voice" | "patient" | "oximeter";

interface StepDefinition {
  id: StepId;
  title: string;
  description: string;
}

const STEPS: StepDefinition[] = [
  {
    id: "voice",
    title: "Voice Recording",
    description: "Record and process the patient's voice.",
  },
  {
    id: "oximeter",
    title: "Oximeter Reading",
    description: "Collect SpO₂ and heart-rate measurements.",
  },
  {
    id: "patient",
    title: "Patient Information",
    description: "Enter the required patient information.",
  },
];

export default function AssessmentStepper() {
  const { resetAssessment } = useAssessment();

  const { assessment, setResult } = useAssessment();

  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const [isSubmitting, startSubmissionTransition] = useTransition();

  // const testInput: IFIFormulaInput = {
  //   dateOfBirth: "1995-05-20",
  //   age: 31,
  //   sex: "male",
  //   heightCm: 175,
  //   weightKg: 72,
  //   bmi: 23.51,
  //   frequency: 124.8,
  //   intensity: 68.4,
  //   amplitude: Number.NaN,
  //   spo2: 98,
  //   heartRate: 76,
  // };

  // validateFormulaInput(testInput);

  // console.log("Formula input is valid.");

  const activeStepSnapshot = useSyncExternalStore(
    subscribeToAssessmentStep,
    getStoredAssessmentStep,
    getServerAssessmentStep,
  );

  const parsedActiveStepIndex = Number(activeStepSnapshot);

  const activeStepIndex =
    Number.isInteger(parsedActiveStepIndex) &&
    parsedActiveStepIndex >= 0 &&
    parsedActiveStepIndex <= STEPS.length
      ? parsedActiveStepIndex
      : 0;

  const stepValidation = useMemo(
    () => ({
      voice: assessment.voice !== null,
      patient: assessment.patient !== null,
      oximeter: assessment.oximeter !== null,
    }),
    [assessment.voice, assessment.patient, assessment.oximeter],
  );

  const activeStep = STEPS[activeStepIndex];

  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === STEPS.length - 1;

  const isCurrentStepValid = stepValidation[activeStep.id];

  const isEntireAssessmentValid =
    stepValidation.voice && stepValidation.patient && stepValidation.oximeter;

  function updateActiveStep(stepIndex: number) {
    const safeStepIndex = Math.max(0, Math.min(stepIndex, STEPS.length - 1));

    saveAssessmentStep(safeStepIndex);
  }

  function handlePreviousStep() {
    setSubmissionError(null);

    updateActiveStep(activeStepIndex - 1);
  }

  function handleNextStep() {
    if (!isCurrentStepValid) {
      return;
    }

    setSubmissionError(null);

    updateActiveStep(activeStepIndex + 1);
  }

  function handleStepSelection(stepIndex: number) {
    /*
     * Users can always navigate backwards.
     */
    if (stepIndex <= activeStepIndex) {
      setSubmissionError(null);
      updateActiveStep(stepIndex);
      return;
    }

    /*
     * Users can only navigate forward if every step before
     * the selected step has been completed.
     */
    const allPreviousStepsAreValid = STEPS.slice(0, stepIndex).every(
      (step) => stepValidation[step.id],
    );

    if (!allPreviousStepsAreValid) {
      return;
    }

    setSubmissionError(null);
    updateActiveStep(stepIndex);
  }

  function handleSubmitAssessment() {
    if (!isEntireAssessmentValid || isSubmitting) {
      return;
    }

    setSubmissionError(null);

    startSubmissionTransition(async () => {
      try {
        /*
         * The server action receives the complete assessment.
         *
         * It should validate everything again on the server,
         * calculate the result, save the assessment, and return
         * an AssessmentResult.
         */
        // const result = await submitAssessmentAction(assessment);

        // setResult(result);

        resetAssessment();
        clearStoredAssessmentStep();
      } catch (error) {
        console.error("Assessment submission failed.", error);

        setSubmissionError(
          error instanceof Error
            ? error.message
            : "Unable to submit the assessment. Please try again.",
        );
      }
    });
  }

  function renderActiveStep() {
    switch (activeStep.id) {
      case "voice":
        return <Voice />;

      case "patient":
        return <PatientInfo />;

      case "oximeter":
        return <Oximeter />;

      default:
        return null;
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-5 py-6 sm:px-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-blue-600">
              Health Assessment
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Patient health monitoring
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Complete each step before submitting the final assessment.
            </p>
          </div>

          <nav aria-label="Assessment progress">
            <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {STEPS.map((step, index) => {
                const isActive = index === activeStepIndex;
                const isCompleted = stepValidation[step.id];

                const previousStepsAreComplete = STEPS.slice(0, index).every(
                  (previousStep) => stepValidation[previousStep.id],
                );

                const canSelectStep =
                  index <= activeStepIndex || previousStepsAreComplete;

                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => handleStepSelection(index)}
                      disabled={!canSelectStep || isSubmitting}
                      aria-current={isActive ? "step" : undefined}
                      className={[
                        "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition",
                        isActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white",
                        canSelectStep
                          ? "cursor-pointer hover:border-blue-300 hover:bg-slate-50"
                          : "cursor-not-allowed opacity-50",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          isCompleted
                            ? "bg-emerald-600 text-white"
                            : isActive
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>

                      <span>
                        <span
                          className={[
                            "block text-sm font-semibold",
                            isActive ? "text-blue-950" : "text-slate-900",
                          ].join(" ")}
                        >
                          {step.title}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {step.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </header>

        <div className="min-h-105 px-5 py-6 sm:px-8 sm:py-8">
          {/* <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Step {activeStepIndex + 1} of {STEPS.length}
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {activeStep.title}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {activeStep.description}
            </p>
          </div> */}

          {renderActiveStep()}
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-8">
          {submissionError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {submissionError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={isFirstStep || isSubmitting}
              className="inline-flex min-h-11 items-center cursor-pointer justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </button>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              {!isCurrentStepValid && (
                <p className="text-center text-xs text-slate-500 sm:text-right">
                  Complete this step to continue.
                </p>
              )}

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!isCurrentStepValid || isSubmitting}
                  className="inline-flex min-h-11 cursor-pointer  items-center justify-center gap-2 rounded-[10px] bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Next step
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  // onClick={handleSubmitAssessment}
                  disabled={!isEntireAssessmentValid || isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-emerald-600 px-5 text-sm font-semibold text-white transition cursor-pointer hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit assessment
                      <Send className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
