"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Activity,
  Calculator,
  CalendarDays,
  LoaderCircle,
  Ruler,
  SaveAll,
  VenusAndMars,
  Weight,
} from "lucide-react";

import type {
  AssessmentResult,
  PatientInfo as PatientInfoType,
} from "@/types/assessments";

import {
  patientInfoFormSchema,
  type PatientInfoFormValues,
} from "@/lib/schemas/assessment.schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssessment } from "@/hooks/useAssessment";
import { prepareFormulaInput } from "@/lib/calculations/IFI/prepareFormulaInput";
import { validateFormulaInput } from "@/lib/calculations/IFI/validateFormulaInput";
import { calculateIFI } from "@/lib/calculations/IFI/calculateIFI";
import { useRouter } from "next/navigation";
import { BiologicalAgeFormulaInput } from "@/types/calculations/biological-age-calculation";
import {
  calculateBiologicalAge,
  prepareBiologicalAgeInput,
  validateBiologicalAgeInput,
} from "@/lib/calculations/Biological-age";
import {
  calculateInflammationIndex,
  prepareInflammationIndexInput,
  validateInflammationIndexInput,
} from "@/lib/calculations/Inflammation-Index";
import {
  calculatePeptideDose,
  validatePeptideDoseInput,
} from "@/lib/calculations/Pepdie-dose";
import { preparePeptideDoseInput } from "@/lib/calculations/Pepdie-dose/preparePeptideDoseInput";
import {
  calculateHBOT,
  prepareHBOTInput,
  validateHBOTInput,
} from "@/lib/calculations/Hbot";
import { clearStoredAssessmentStep } from "@/lib/assessment/assessmentStepStorage";
// import { calculateAllPeptideDoses } from "@/lib/calculations/Pepdie-dose";

const EMPTY_FORM_VALUES: PatientInfoFormValues = {
  patientName: "",
  dateOfBirth: "",
  age: 0,
  sex: "male",
  heightCm: 0,
  weightKg: 0,
};

/**
 * Calculates the patient's completed age from a date
 * in YYYY-MM-DD format.
 */
function calculateAge(
  dateOfBirth: string,
  currentDate = new Date(),
): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const dateParts = dateOfBirth.split("-");

  if (dateParts?.length !== 3) {
    return null;
  }

  const [yearText, monthText, dayText] = dateParts;

  const birthYear = Number(yearText);
  const birthMonth = Number(monthText);
  const birthDay = Number(dayText);

  if (
    !Number.isInteger(birthYear) ||
    !Number.isInteger(birthMonth) ||
    !Number.isInteger(birthDay)
  ) {
    return null;
  }

  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

  /*
   * Prevent JavaScript from silently correcting an invalid
   * date such as February 31.
   */
  const isValidDate =
    birthDate.getFullYear() === birthYear &&
    birthDate.getMonth() === birthMonth - 1 &&
    birthDate.getDate() === birthDay;

  if (!isValidDate) {
    return null;
  }

  const today = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );

  if (birthDate > today) {
    return null;
  }

  let age = today.getFullYear() - birthDate.getFullYear();

  const birthdayHasNotOccurred =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (birthdayHasNotOccurred) {
    age -= 1;
  }

  return age >= 0 && age <= 120 ? age : null;
}

/**
 * Calculates BMI using:
 *
 * BMI = weight in kilograms / height in metres squared
 */
function calculateBmi(heightCm: number, weightKg: number): number | null {
  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg) ||
    heightCm <= 0 ||
    weightKg <= 0
  ) {
    return null;
  }

  const heightInMeters = heightCm / 100;

  const bmi = weightKg / (heightInMeters * heightInMeters);

  if (!Number.isFinite(bmi)) {
    return null;
  }

  return Number(bmi);
}

/**
 * Returns today's date in YYYY-MM-DD format.
 *
 * This is used as the maximum selectable DOB.
 */
function getTodayDateInputValue(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPatientFormValues(
  patient: PatientInfoType | null,
): PatientInfoFormValues {
  if (!patient) {
    return EMPTY_FORM_VALUES;
  }

  return {
    patientName: patient.patientName,
    dateOfBirth: patient.dateOfBirth,
    age: patient.age,
    sex: patient.sex,
    heightCm: patient.heightCm,
    weightKg: patient.weightKg,
  };
}

export default function PatientInfo() {
  const { assessment, updatePatient, setResult, resetAssessment, subject } =
    useAssessment();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<PatientInfoFormValues>({
    resolver: zodResolver(patientInfoFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: getPatientFormValues(assessment.patient),
  });

  /*
   * Restore patient information after AssessmentContext
   * loads its localStorage snapshot.
   */
  useEffect(() => {
    if (!assessment.patient) {
      return;
    }

    form.reset(getPatientFormValues(assessment.patient));
  }, [assessment.patient, form]);

  const dateOfBirth = form.watch("dateOfBirth");

  const heightCm = form.watch("heightCm");

  const weightKg = form.watch("weightKg");

  const calculatedAge = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);

  const calculatedBmi = useMemo(
    () => calculateBmi(heightCm, weightKg),
    [heightCm, weightKg],
  );

  const maximumDateOfBirth = useMemo(() => getTodayDateInputValue(), []);

  /*
   * Keep the age field synchronized with DOB.
   *
   * Age remains part of the submitted patient object, but
   * the user cannot manually change it.
   */
  useEffect(() => {
    form.setValue("age", calculatedAge ?? 0, {
      shouldValidate: dateOfBirth?.length === 10,
      shouldDirty: dateOfBirth?.length > 0,
    });
  }, [calculatedAge, dateOfBirth, form]);

  function handleNumberChange(
    value: string,
    onChange: (value: number) => void,
  ): void {
    if (value === "") {
      onChange(0);
      return;
    }

    const parsedValue = Number(value);

    onChange(Number.isFinite(parsedValue) ? parsedValue : 0);
  }

  // Before the Doctor Assessment has implement
  // async function handleSubmitPatient(
  //   values: PatientInfoFormValues,
  // ): Promise<void> {
  //   setIsSubmitting(true);
  //   const age = calculateAge(values.dateOfBirth);

  //   if (age === null) {
  //     form.setError("dateOfBirth", {
  //       type: "manual",
  //       message: "Please enter a valid date of birth.",
  //     });

  //     return;
  //   }

  //   const bmi = calculateBmi(values.heightCm, values.weightKg);

  //   if (bmi === null) {
  //     const message = "Enter a valid height and weight to calculate BMI.";

  //     form.setError("heightCm", {
  //       type: "manual",
  //       message,
  //     });

  //     form.setError("weightKg", {
  //       type: "manual",
  //       message,
  //     });

  //     return;
  //   }

  //   /*
  //    * Use the freshly calculated age and BMI instead of
  //    * relying on a possibly delayed form-state update.
  //    */
  //   const patientData: PatientInfoType = {
  //     patientName: values.patientName,
  //     dateOfBirth: values.dateOfBirth,
  //     age,
  //     sex: values.sex,
  //     heightCm: values.heightCm,
  //     weightKg: values.weightKg,
  //     bmi,
  //   };

  //   updatePatient(patientData);

  //   const updatedAssessment = {
  //     ...assessment,
  //     patient: patientData,
  //   };

  //   // ifi

  //   const ififormulaInput = prepareFormulaInput(updatedAssessment);

  //   validateFormulaInput(ififormulaInput);

  //   const ifiResult = calculateIFI(ififormulaInput);

  //   // Biological

  //   const biologicalAgeInput = prepareBiologicalAgeInput({
  //     assessment: updatedAssessment,
  //     ifiResult: ifiResult,
  //   });

  //   validateBiologicalAgeInput(biologicalAgeInput);

  //   const biologicalAgeResult = calculateBiologicalAge(biologicalAgeInput);

  //   // Inflammation Index

  //   // const inflammationInput = prepareInflammationIndexInput({
  //   //   assessment: updatedAssessment,
  //   //   ifiResult,
  //   // });

  //   // validateInflammationIndexInput(inflammationInput);

  //   // const inflammationIndexResult =
  //   //   calculateInflammationIndex(inflammationInput);

  //   const peptideDosageInput = preparePeptideDoseInput({
  //     ifiResult: ifiResult,
  //     patient: patientData,
  //   });

  //   validatePeptideDoseInput(peptideDosageInput);

  //   const peptideDoseResult = calculatePeptideDose(peptideDosageInput);

  //   const hbotInput = prepareHBOTInput(ifiResult);

  //   validateHBOTInput(hbotInput);

  //   const HBOTCalculatedSessions = calculateHBOT(hbotInput);

  //   const assessmentResult: AssessmentResult = {
  //     IFI: ifiResult,
  //     BiologicalAge: biologicalAgeResult,
  //     PeptideDose: peptideDoseResult,
  //     HBOTSessions: HBOTCalculatedSessions,
  //   };

  //   setResult(assessmentResult);

  //   try {
  //     const response = await fetch("/api/reports", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         patient: {
  //           name: patientData.patientName,
  //           dateOfBirth: patientData.dateOfBirth,
  //           evaluationDate: biologicalAgeResult.evaluationDate,
  //           gender: patientData.sex,
  //         },

  //         results: {
  //           IFI: ifiResult,
  //           BiologicalAge: biologicalAgeResult,
  //           PeptideDose: peptideDoseResult,
  //           HBOTSessions: HBOTCalculatedSessions,
  //         },
  //       }),
  //     });

  //     const data: unknown = await response.json();

  //     if (!response.ok) {
  //       console.error("Failed to create report:", data);

  //       throw new Error("Failed to create report.");
  //     }

  //     if (
  //       typeof data !== "object" ||
  //       data === null ||
  //       !("report" in data) ||
  //       typeof data.report !== "object" ||
  //       data.report === null ||
  //       !("id" in data.report) ||
  //       typeof data.report.id !== "string"
  //     ) {
  //       throw new Error(
  //         "Report was created, but the server returned an invalid report ID.",
  //       );
  //     }

  //     const reportId = data.report.id;

  //     // resetAssessment();
  //     // clearStoredAssessmentStep();

  //     router.push(`/dashboard/reports/${reportId}`);
  //   } catch (error) {
  //     console.error("Report creation failed:", error);
  //     toast.error("Report creation failed");
  //     return;
  //   } finally {
  //     setIsSubmitting(false);
  //   }

  //   // console.log("Peptide Dose: ", peptideDoseResult);

  //   // router.push("/dashboard/latest-report");

  //   toast.success("Submitted redirecting...");
  // }

  async function handleSubmitPatient(
    values: PatientInfoFormValues,
  ): Promise<void> {
    setIsSubmitting(true);

    try {
      /**
       * --------------------------------------------------------
       * 1. VALIDATE PATIENT DATA
       * --------------------------------------------------------
       */
      const age = calculateAge(values.dateOfBirth);

      if (age === null) {
        form.setError("dateOfBirth", {
          type: "manual",
          message: "Please enter a valid date of birth.",
        });

        return;
      }

      const bmi = calculateBmi(values.heightCm, values.weightKg);

      if (bmi === null) {
        const message = "Enter a valid height and weight to calculate BMI.";

        form.setError("heightCm", {
          type: "manual",
          message,
        });

        form.setError("weightKg", {
          type: "manual",
          message,
        });

        return;
      }

      /**
       * --------------------------------------------------------
       * 2. BUILD PATIENT DATA
       * --------------------------------------------------------
       */
      const patientData: PatientInfoType = {
        patientName: values.patientName,

        dateOfBirth: values.dateOfBirth,

        age,

        sex: values.sex,

        heightCm: values.heightCm,

        weightKg: values.weightKg,

        bmi,
      };

      updatePatient(patientData);

      /**
       * React/context state may not have updated yet, so continue
       * using the freshly-created patient object.
       */
      const updatedAssessment = {
        ...assessment,
        patient: patientData,
      };

      /**
       * --------------------------------------------------------
       * 3. IFI
       * --------------------------------------------------------
       */
      const ififormulaInput = prepareFormulaInput(updatedAssessment);

      validateFormulaInput(ififormulaInput);

      const ifiResult = calculateIFI(ififormulaInput);

      /**
       * --------------------------------------------------------
       * 4. BIOLOGICAL AGE
       * --------------------------------------------------------
       */
      const biologicalAgeInput = prepareBiologicalAgeInput({
        assessment: updatedAssessment,

        ifiResult,
      });

      validateBiologicalAgeInput(biologicalAgeInput);

      const biologicalAgeResult = calculateBiologicalAge(biologicalAgeInput);

      /**
       * --------------------------------------------------------
       * 5. PEPTIDE DOSAGE
       * --------------------------------------------------------
       */
      const peptideDosageInput = preparePeptideDoseInput({
        ifiResult,

        patient: patientData,
      });

      validatePeptideDoseInput(peptideDosageInput);

      const peptideDoseResult = calculatePeptideDose(peptideDosageInput);

      /**
       * --------------------------------------------------------
       * 6. HBOT
       * --------------------------------------------------------
       */
      const hbotInput = prepareHBOTInput(ifiResult);

      validateHBOTInput(hbotInput);

      const HBOTCalculatedSessions = calculateHBOT(hbotInput);

      /**
       * --------------------------------------------------------
       * 7. SAVE CALCULATION RESULTS LOCALLY
       * --------------------------------------------------------
       */
      const assessmentResult: AssessmentResult = {
        IFI: ifiResult,

        BiologicalAge: biologicalAgeResult,

        PeptideDose: peptideDoseResult,

        HBOTSessions: HBOTCalculatedSessions,
      };

      setResult(assessmentResult);

      /**
       * --------------------------------------------------------
       * 8. DETERMINE SECURE REPORT ENDPOINT
       * --------------------------------------------------------
       *
       * IMPORTANT:
       *
       * We never send patientId from the browser.
       *
       * Patient self-assessment:
       *
       *   POST /api/reports
       *
       * Doctor assessment:
       *
       *   POST
       *   /api/doctor/patients/{relationshipId}/reports
       *
       * The doctor API resolves patientId securely on the server.
       */
      let reportEndpoint: string;

      if (subject?.mode === "doctor-patient") {
        reportEndpoint = `/api/doctor/patients/${encodeURIComponent(
          subject.relationshipId,
        )}/reports`;
      } else {
        /**
         * Existing self-assessment behavior.
         *
         * We'll make the self-assessment initialization explicit
         * shortly, but this fallback preserves your current
         * working /dashboard/get-report flow for now.
         */
        reportEndpoint = "/api/reports";
      }

      /**
       * --------------------------------------------------------
       * 9. CREATE REPORT
       * --------------------------------------------------------
       */
      const response = await fetch(reportEndpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          patient: {
            name: patientData.patientName,

            dateOfBirth: patientData.dateOfBirth,

            evaluationDate: biologicalAgeResult.evaluationDate,

            gender: patientData.sex,
          },

          results: {
            IFI: ifiResult,

            BiologicalAge: biologicalAgeResult,

            PeptideDose: peptideDoseResult,

            HBOTSessions: HBOTCalculatedSessions,
          },
        }),
      });

      /**
       * --------------------------------------------------------
       * 10. SAFELY READ API RESPONSE
       * --------------------------------------------------------
       */
      const data: unknown = await response.json().catch(() => null);

      /**
       * Authentication expired while assessment was open.
       */
      if (response.status === 401) {
        toast.error("Your session has expired. Please sign in again.");

        router.push("/login");

        return;
      }

      /**
       * Doctor no longer has access to this patient.
       *
       * This can happen if the relationship was revoked while
       * the assessment was being completed.
       */
      if (response.status === 403 || response.status === 404) {
        if (subject?.mode === "doctor-patient") {
          toast.error(
            getApiErrorMessage(
              data,
              "You no longer have access to this patient.",
            ),
          );

          router.push("/dashboard/patients");

          return;
        }
      }

      if (!response.ok) {
        const message = getApiErrorMessage(data, "Failed to create report.");

        console.error("Failed to create report:", data);

        throw new Error(message);
      }

      /**
       * --------------------------------------------------------
       * 11. VALIDATE REPORT ID
       * --------------------------------------------------------
       */
      if (
        typeof data !== "object" ||
        data === null ||
        !("report" in data) ||
        typeof data.report !== "object" ||
        data.report === null ||
        !("id" in data.report) ||
        typeof data.report.id !== "string" ||
        !data.report.id.trim()
      ) {
        throw new Error(
          "Report was created, but the server returned an invalid report ID.",
        );
      }

      const reportId = data.report.id;

      toast.success("Assessment submitted successfully.");

      /**
       * --------------------------------------------------------
       * 12. REDIRECT
       * --------------------------------------------------------
       *
       * We can keep your existing report-generation page for both
       * workflows because its authorization already understands
       * doctor-patient relationships.
       */
      router.push(`/dashboard/reports/${encodeURIComponent(reportId)}`);

      /**
       * Do NOT reset here yet.
       *
       * Your report page transition/generation flow already works,
       * and we don't want to introduce another behavior change in
       * this step.
       *
       * We'll decide the correct completion/reset boundary once
       * both doctor and patient submission flows are tested.
       */
    } catch (error) {
      console.error("Report creation failed:", error);

      toast.error(
        error instanceof Error ? error.message : "Report creation failed.",
      );
    } finally {
      /**
       * Also fixes your existing age/BMI early-return bug.
       */
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden py-0 border-slate-200 bg-slate-50/40 shadow-none">
      <CardHeader className="border-b border-slate-200 bg-blue-50/70 px-5 py-5 sm:px-8">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-950 sm:text-2xl">
          <span className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          Bio Metrics Entry
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 py-7 sm:px-8 sm:py-9">
        <form
          id="patient-information-form"
          onSubmit={form.handleSubmit(handleSubmitPatient)}
          noValidate
        >
          <FieldGroup className="grid gap-7 md:grid-cols-2">
            <Controller
              name="patientName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    Patient Name
                  </FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="John"
                    aria-invalid={fieldState.invalid}
                    className="h-12   bg-white border border-outline-variant rounded-[5px]"
                  />

                  <FieldDescription>patient&apos;s name.</FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="dateOfBirth"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    <CalendarDays
                      className="size-4 text-slate-500"
                      aria-hidden="true"
                    />
                    Date of Birth
                  </FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    type="date"
                    max={maximumDateOfBirth}
                    aria-invalid={fieldState.invalid}
                    className="h-12   bg-white border border-outline-variant rounded-[5px]"
                  />

                  <FieldDescription>
                    Select the patient&apos;s date of birth.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="age"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    <CalendarDays
                      className="size-4 text-slate-500"
                      aria-hidden="true"
                    />
                    Age
                  </FieldLabel>

                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      ref={field.ref}
                      type="number"
                      value={calculatedAge ?? ""}
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                      aria-invalid={fieldState.invalid}
                      className="h-12  border-dashed rounded-[5px] cursor-not-allowed border-blue-200 bg-blue-50 px-4 pr-16 text-slate-700"
                    />

                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-500">
                      years
                    </span>
                  </div>

                  <FieldDescription>
                    Automatically calculated from the selected date of birth.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="sex"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    <VenusAndMars
                      className="size-4 text-slate-500"
                      aria-hidden="true"
                    />
                    Sex
                  </FieldLabel>

                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id={field.name}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                      className="min-h-12  border-outline-variant rounded-[5px] w-full bg-white"
                    >
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>

                    <SelectContent className=" border border-outline-variant rounded-[5px] mt-2">
                      <SelectItem className="rounded-[5px]">Select</SelectItem>
                      <SelectItem value="male" className="rounded-[5px]">
                        Male
                      </SelectItem>

                      <SelectItem value="female" className="rounded-[5px]">
                        Female
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <FieldDescription>
                    Biological sex for clinical reference.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="heightCm"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    <Ruler
                      className="size-4 text-slate-500"
                      aria-hidden="true"
                    />
                    Height
                  </FieldLabel>

                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      ref={field.ref}
                      type="number"
                      min={50}
                      max={250}
                      step="0.1"
                      inputMode="decimal"
                      placeholder="Enter height"
                      value={field.value === 0 ? "" : field.value}
                      onBlur={field.onBlur}
                      onChange={(event) =>
                        handleNumberChange(event.target.value, field.onChange)
                      }
                      aria-invalid={fieldState.invalid}
                      className="h-12 bg-white pr-14 border-outline-variant rounded-[5px]"
                    />

                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-500">
                      cm
                    </span>
                  </div>

                  <FieldDescription>
                    Enter the patient&apos;s measured height.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="weightKg"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    <Weight
                      className="size-4 text-slate-500"
                      aria-hidden="true"
                    />
                    Weight
                  </FieldLabel>

                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      ref={field.ref}
                      type="number"
                      min={2}
                      max={400}
                      step="0.1"
                      inputMode="decimal"
                      placeholder="Enter weight"
                      value={field.value === 0 ? "" : field.value}
                      onBlur={field.onBlur}
                      onChange={(event) =>
                        handleNumberChange(event.target.value, field.onChange)
                      }
                      aria-invalid={fieldState.invalid}
                      className="h-12 bg-white pr-14 border-outline-variant rounded-[5px]"
                    />

                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-500">
                      kg
                    </span>
                  </div>

                  <FieldDescription>
                    Enter the patient&apos;s current measured weight.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Field>
              <FieldLabel className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calculator
                  className="size-4 text-slate-500"
                  aria-hidden="true"
                />
                BMI
              </FieldLabel>

              <div
                aria-live="polite"
                aria-label={
                  calculatedBmi === null
                    ? "BMI has not been calculated"
                    : `BMI is ${calculatedBmi} kilograms per square metre`
                }
                className="flex h-12 items-center  rounded-[5px] border border-dashed border-blue-200 bg-blue-50 px-4 font-medium text-slate-700"
              >
                {calculatedBmi?.toFixed(2) ?? "--"}

                {calculatedBmi !== null && (
                  <span className="ml-1 text-sm font-normal text-slate-500">
                    kg/m²
                  </span>
                )}
              </div>

              <FieldDescription>
                Automatically calculated from height and weight.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isSubmitting}
              className="min-h-13 md:w-1/5 max-w-1/2 cursor-pointer rounded-[10px] flex gap-2 bg-secondary px-6 text-white hover:bg-secondary-container disabled:cursor-not-allowed"
            >
              {form.formState.isSubmitting || isSubmitting ? (
                <>
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Submitting Bio Metrics...
                </>
              ) : (
                <>
                  <SaveAll className="size-4" aria-hidden="true" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data !== "object" ||
    data === null ||
    !("message" in data) ||
    typeof data.message !== "string" ||
    !data.message.trim()
  ) {
    return fallback;
  }

  return data.message;
}
