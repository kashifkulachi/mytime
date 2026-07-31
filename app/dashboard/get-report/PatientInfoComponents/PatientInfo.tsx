"use client";

import { useEffect, useMemo } from "react";
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

import type { PatientInfo as PatientInfoType } from "@/types/assessments";

import {
  patientInfoFormSchema,
  type PatientInfoFormValues,
} from "@/lib/validations/assessment.schema";

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
import { prepareFormulaInput } from "@/lib/calculations/prepareFormulaInput";
import { validateFormulaInput } from "@/lib/calculations/validateFormulaInput";
import { calculateIFI } from "@/lib/calculations/calculateIFI";
import { useRouter } from "next/navigation";

const EMPTY_FORM_VALUES: PatientInfoFormValues = {
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
    dateOfBirth: patient.dateOfBirth,
    age: patient.age,
    sex: patient.sex,
    heightCm: patient.heightCm,
    weightKg: patient.weightKg,
  };
}

export default function PatientInfo() {
  const { assessment, updatePatient, setResult } = useAssessment();
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

  async function handleSavePatient(
    values: PatientInfoFormValues,
  ): Promise<void> {
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

    /*
     * Use the freshly calculated age and BMI instead of
     * relying on a possibly delayed form-state update.
     */
    const patientData: PatientInfoType = {
      dateOfBirth: values.dateOfBirth,
      age,
      sex: values.sex,
      heightCm: values.heightCm,
      weightKg: values.weightKg,
      bmi,
    };

    await updatePatient(patientData);

    const updatedAssessment = {
      ...assessment,
      patient: patientData,
    };

    const formulaInput = prepareFormulaInput(updatedAssessment);

    validateFormulaInput(formulaInput);

    const calculatedIFI_Real_Value = calculateIFI(formulaInput);

    setResult({
      IFI: calculatedIFI_Real_Value,
    });

    router.push("/dashboard/latest-report");

    console.log("Calculated IFI Values Completed: ", calculatedIFI_Real_Value);
    toast.success("Patient information saved.");
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
          onSubmit={form.handleSubmit(handleSavePatient)}
          noValidate
        >
          <FieldGroup className="grid gap-7 md:grid-cols-2">
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
              disabled={form.formState.isSubmitting}
              className="min-h-13 md:w-1/5 max-w-1/2 cursor-pointer rounded-[10px] flex gap-2 bg-secondary px-6 text-white hover:bg-secondary-container disabled:cursor-not-allowed"
            >
              {form.formState.isSubmitting ? (
                <>
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving Bio Metrics...
                </>
              ) : (
                <>
                  <SaveAll className="size-4" aria-hidden="true" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
