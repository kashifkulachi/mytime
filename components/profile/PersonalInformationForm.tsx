"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Mail, Pencil, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import {
  updateProfileEmailAction,
  updateProfileNameAction,
} from "@/app/dashboard/(auth)/profile/actions";

type PersonalInformationFormProps = {
  fullName: string;
  email: string;
};

type FieldErrors = {
  fullName?: string[];
  email?: string[];
};

export default function PersonalInformationForm({
  fullName,
  email,
}: PersonalInformationFormProps) {
  const [currentName, setCurrentName] = useState(fullName);

  const [currentEmail, setCurrentEmail] = useState(email);

  const [name, setName] = useState(fullName);

  const [newEmail, setNewEmail] = useState(email);

  const [editingName, setEditingName] = useState(false);

  const [editingEmail, setEditingEmail] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [isNamePending, startNameTransition] = useTransition();

  const [isEmailPending, startEmailTransition] = useTransition();

  /* ============================================================
     NAME
  ============================================================ */

  const handleNameEdit = () => {
    setName(currentName);

    setFieldErrors((current) => ({
      ...current,
      fullName: undefined,
    }));

    setEditingName(true);
  };

  const handleNameCancel = () => {
    if (isNamePending) return;

    setName(currentName);

    setFieldErrors((current) => ({
      ...current,
      fullName: undefined,
    }));

    setEditingName(false);
  };

  const handleNameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isNamePending) return;

    const normalizedName = name.trim();

    if (normalizedName === currentName.trim()) {
      setEditingName(false);
      return;
    }

    const formData = new FormData();

    formData.set("fullName", normalizedName);

    setFieldErrors((current) => ({
      ...current,
      fullName: undefined,
    }));

    startNameTransition(async () => {
      try {
        const result = await updateProfileNameAction(formData);

        if (!result.success) {
          setFieldErrors((current) => ({
            ...current,
            fullName: result.fieldErrors?.fullName,
          }));

          toast.error(result.message);
          return;
        }

        setCurrentName(normalizedName);
        setName(normalizedName);
        setEditingName(false);

        toast.success(result.message || "Your name has been updated.");
      } catch (error) {
        console.error("[Profile] Unexpected name update client error:", error);

        toast.error("Unable to update your name right now. Please try again.");
      }
    });
  };

  /* ============================================================
     EMAIL
  ============================================================ */

  const handleEmailEdit = () => {
    setNewEmail(currentEmail);

    setFieldErrors((current) => ({
      ...current,
      email: undefined,
    }));

    setEditingEmail(true);
  };

  const handleEmailCancel = () => {
    if (isEmailPending) return;

    setNewEmail(currentEmail);

    setFieldErrors((current) => ({
      ...current,
      email: undefined,
    }));

    setEditingEmail(false);
  };

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEmailPending) return;

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (normalizedEmail === currentEmail.trim().toLowerCase()) {
      setEditingEmail(false);
      return;
    }

    const formData = new FormData();

    formData.set("email", normalizedEmail);

    setFieldErrors((current) => ({
      ...current,
      email: undefined,
    }));

    startEmailTransition(async () => {
      try {
        const result = await updateProfileEmailAction(formData);

        if (!result.success) {
          setFieldErrors((current) => ({
            ...current,
            email: result.fieldErrors?.email,
          }));

          toast.error(result.message);
          return;
        }

        /**
         * IMPORTANT:
         *
         * We intentionally do NOT replace currentEmail
         * with normalizedEmail here.
         *
         * Supabase may require the user to verify the
         * new address first. Until that process finishes,
         * the authenticated user's current email remains
         * the existing verified address.
         */
        setNewEmail(currentEmail);
        setEditingEmail(false);

        toast.success(
          result.message || "Email change requested. Please check your email.",
          {
            duration: 6000,
          },
        );
      } catch (error) {
        console.error("[Profile] Unexpected email update client error:", error);

        toast.error("Unable to update your email right now. Please try again.");
      }
    });
  };

  const nameError = fieldErrors.fullName?.[0];

  const emailError = fieldErrors.email?.[0];

  return (
    <div className="divide-y divide-slate-100">
      {/* =====================================================
          FULL NAME
      ====================================================== */}

      <form onSubmit={handleNameSubmit} className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <UserRound className="h-[17px] w-[17px]" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="profile-full-name"
                className="text-[12px] font-medium text-slate-500"
              >
                Full name
              </label>

              {editingName ? (
                <div className="mt-2 max-w-[480px]">
                  <input
                    id="profile-full-name"
                    name="fullName"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);

                      if (nameError) {
                        setFieldErrors((current) => ({
                          ...current,
                          fullName: undefined,
                        }));
                      }
                    }}
                    autoComplete="name"
                    autoFocus
                    disabled={isNamePending}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={
                      nameError ? "profile-full-name-error" : undefined
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2e6cf6] focus:ring-2 focus:ring-[#2e6cf6]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter your full name"
                  />

                  {nameError && (
                    <p
                      id="profile-full-name-error"
                      className="mt-1.5 text-[12px] leading-5 text-red-600"
                    >
                      {nameError}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-1 break-words text-sm font-medium text-slate-800">
                  {currentName}
                </p>
              )}
            </div>
          </div>

          {editingName ? (
            <div className="flex shrink-0 items-center gap-2 pl-[50px] sm:pl-0">
              <button
                type="button"
                onClick={handleNameCancel}
                disabled={isNamePending}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={isNamePending || !name.trim()}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#12355b] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0d2948] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isNamePending ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                )}

                {isNamePending ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNameEdit}
              className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-[#2e6cf6] transition-colors hover:bg-[#2e6cf6]/5"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
          )}
        </div>
      </form>

      {/* =====================================================
          EMAIL
      ====================================================== */}

      <form onSubmit={handleEmailSubmit} className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <Mail className="h-[17px] w-[17px]" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="profile-email"
                className="text-[12px] font-medium text-slate-500"
              >
                Email address
              </label>

              {editingEmail ? (
                <div className="mt-2 max-w-[480px]">
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    value={newEmail}
                    onChange={(event) => {
                      setNewEmail(event.target.value);

                      if (emailError) {
                        setFieldErrors((current) => ({
                          ...current,
                          email: undefined,
                        }));
                      }
                    }}
                    autoComplete="email"
                    autoFocus
                    disabled={isEmailPending}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={
                      emailError ? "profile-email-error" : "profile-email-help"
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2e6cf6] focus:ring-2 focus:ring-[#2e6cf6]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter your email address"
                  />

                  {emailError ? (
                    <p
                      id="profile-email-error"
                      className="mt-1.5 text-[12px] leading-5 text-red-600"
                    >
                      {emailError}
                    </p>
                  ) : (
                    <p
                      id="profile-email-help"
                      className="mt-1.5 text-[11px] leading-5 text-slate-400"
                    >
                      Changing your email may require verification before the
                      new address becomes active.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="mt-1 break-all text-sm font-medium text-slate-800">
                    {currentEmail}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Your verified sign-in email
                  </p>
                </>
              )}
            </div>
          </div>

          {editingEmail ? (
            <div className="flex shrink-0 items-center gap-2 pl-[50px] sm:pl-0">
              <button
                type="button"
                onClick={handleEmailCancel}
                disabled={isEmailPending}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Cancel
              </button>

              <button
                type="submit"
                disabled={isEmailPending || !newEmail.trim()}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#12355b] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0d2948] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEmailPending ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                )}

                {isEmailPending ? "Sending..." : "Update"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEmailEdit}
              className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-[#2e6cf6] transition-colors hover:bg-[#2e6cf6]/5"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
