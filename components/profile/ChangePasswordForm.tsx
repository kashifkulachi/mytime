"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { changeProfilePasswordAction } from "@/app/dashboard/(auth)/profile/actions";

type PasswordFieldErrors = {
  currentPassword?: string[];
  password?: string[];
  confirmPassword?: string[];
};

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});

  const [isPending, startTransition] = useTransition();

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    setFieldErrors({});

    /**
     * Small client-side UX checks.
     *
     * The server action remains responsible for the real
     * validation and authentication.
     */
    if (!currentPassword) {
      setFieldErrors({
        currentPassword: ["Please enter your current password."],
      });

      return;
    }

    if (!password) {
      setFieldErrors({
        password: ["Please enter your new password."],
      });

      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({
        confirmPassword: ["Passwords do not match."],
      });

      return;
    }

    const formData = new FormData();

    formData.set("currentPassword", currentPassword);

    formData.set("password", password);

    formData.set("confirmPassword", confirmPassword);

    startTransition(async () => {
      try {
        const result = await changeProfilePasswordAction(formData);

        if (!result.success) {
          setFieldErrors(result.fieldErrors ?? {});

          toast.error(result.message);
          return;
        }

        /**
         * Clear sensitive values immediately after
         * a successful password change.
         */
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");

        setShowCurrentPassword(false);
        setShowPassword(false);
        setShowConfirmPassword(false);

        setFieldErrors({});

        toast.success(
          result.message || "Your password has been changed successfully.",
        );
      } catch (error) {
        console.error(
          "[Profile] Unexpected password change client error:",
          error,
        );

        toast.error(
          "Unable to change your password right now. Please try again.",
        );
      }
    });
  };

  const currentPasswordError = fieldErrors.currentPassword?.[0];

  const passwordError = fieldErrors.password?.[0];

  const confirmPasswordError = fieldErrors.confirmPassword?.[0];

  const hasMinimumLength = password.length >= 8;

  const hasLowercase = /[a-z]/.test(password);

  const hasUppercase = /[A-Z]/.test(password);

  const hasNumber = /\d/.test(password);

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !isPending;

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="max-w-[620px] space-y-5">
        {/* =====================================================
            CURRENT PASSWORD
        ====================================================== */}

        <PasswordInput
          id="current-password"
          label="Current password"
          value={currentPassword}
          onChange={(value) => {
            setCurrentPassword(value);

            if (currentPasswordError) {
              setFieldErrors((current) => ({
                ...current,
                currentPassword: undefined,
              }));
            }
          }}
          showPassword={showCurrentPassword}
          onToggleVisibility={() =>
            setShowCurrentPassword((current) => !current)
          }
          autoComplete="current-password"
          placeholder="Enter your current password"
          disabled={isPending}
          error={currentPasswordError}
        />

        <div className="h-px bg-slate-100" />

        {/* =====================================================
            NEW PASSWORD
        ====================================================== */}

        <PasswordInput
          id="new-password"
          label="New password"
          value={password}
          onChange={(value) => {
            setPassword(value);

            if (passwordError) {
              setFieldErrors((current) => ({
                ...current,
                password: undefined,
              }));
            }
          }}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword((current) => !current)}
          autoComplete="new-password"
          placeholder="Enter your new password"
          disabled={isPending}
          error={passwordError}
        />

        {/* Password requirements */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
            Password requirements
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <Requirement
              passed={hasMinimumLength}
              label="At least 8 characters"
            />

            <Requirement passed={hasUppercase} label="One uppercase letter" />

            <Requirement passed={hasLowercase} label="One lowercase letter" />

            <Requirement passed={hasNumber} label="One number" />
          </div>
        </div>

        {/* =====================================================
            CONFIRM PASSWORD
        ====================================================== */}

        <PasswordInput
          id="confirm-new-password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);

            if (confirmPasswordError) {
              setFieldErrors((current) => ({
                ...current,
                confirmPassword: undefined,
              }));
            }
          }}
          showPassword={showConfirmPassword}
          onToggleVisibility={() =>
            setShowConfirmPassword((current) => !current)
          }
          autoComplete="new-password"
          placeholder="Confirm your new password"
          disabled={isPending}
          error={confirmPasswordError}
        />

        {passwordsMatch && (
          <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-600">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Passwords match
          </div>
        )}

        {/* =====================================================
            SECURITY NOTICE
        ====================================================== */}

        <div className="flex gap-3 rounded-xl border border-[#2e6cf6]/15 bg-[#2e6cf6]/5 p-4">
          <ShieldCheck
            className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#2e6cf6]"
            aria-hidden="true"
          />

          <div>
            <p className="text-[12px] font-semibold text-[#12355b]">
              Account security
            </p>

            <p className="mt-1 text-[12px] leading-5 text-slate-600">
              We&apos;ll verify your current password before allowing your
              password to be changed.
            </p>
          </div>
        </div>

        {/* =====================================================
            SUBMIT
        ====================================================== */}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            aria-busy={isPending}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#12355b] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#0d2948] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Changing...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Change Password
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ============================================================
   PASSWORD INPUT
============================================================ */

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;

  onChange: (value: string) => void;

  showPassword: boolean;

  onToggleVisibility: () => void;

  autoComplete: "current-password" | "new-password";

  placeholder: string;

  disabled?: boolean;

  error?: string;
};

function PasswordInput({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  autoComplete,
  placeholder,
  disabled = false,
  error,
}: PasswordInputProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[12px] font-medium text-slate-600"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2e6cf6] focus:ring-2 focus:ring-[#2e6cf6]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={
            showPassword
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showPassword ? (
            <EyeOff className="h-[17px] w-[17px]" aria-hidden="true" />
          ) : (
            <Eye className="h-[17px] w-[17px]" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-[12px] leading-5 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   PASSWORD REQUIREMENT
============================================================ */

function Requirement({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-[11px] transition-colors ${
        passed ? "text-emerald-600" : "text-slate-500"
      }`}
    >
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          passed
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-white"
        }`}
      >
        {passed && <Check className="h-2.5 w-2.5" aria-hidden="true" />}
      </div>

      <span>{label}</span>
    </div>
  );
}
