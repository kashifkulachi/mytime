import { redirect } from "next/navigation";
import { Mail, ShieldCheck, UserRound } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getCurrentProfile,
  ProfileFetchError,
} from "@/lib/auth/getCurrentProfile";
import PersonalInformationForm from "@/components/profile/PersonalInformationForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";

export default async function ProfilePage() {
  let user;
  let profile;

  try {
    /**
     * Auth user gives us Supabase Auth-owned information,
     * such as the verified email address.
     */
    user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    /**
     * Application profile gives us application-owned data:
     * full name, role, etc.
     */
    profile = await getCurrentProfile();
  } catch (error) {
    /**
     * Next.js redirect() throws internally.
     * We don't want to accidentally swallow it.
     */
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    if (error instanceof ProfileFetchError) {
      console.error("[ProfilePage] Unable to load profile:", {
        code: error.code,
        message: error.message,
      });

      return <ProfileLoadError />;
    }

    throw error;
  }

  if (!profile) {
    redirect("/login");
  }

  const fullName = profile.fullName?.trim() || "MyTime User";

  const email = user.email?.trim() || "No email available";

  const initials = getInitials(fullName);

  const displayName = profile.role === "doctor" ? `Dr. ${fullName}` : fullName;

  const roleLabel = formatRole(profile.role);

  return (
    <main className="min-h-full bg-[#f7f9fc]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-8 lg:px-8 lg:py-10">
        {/* =====================================================
            PAGE HEADING
        ====================================================== */}

        <div className="mb-7">
          <h1 className="text-[26px] font-semibold tracking-[-0.5px] text-[#12355b]">
            My Profile
          </h1>

          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Manage your personal information and account security.
          </p>
        </div>

        {/* =====================================================
            PROFILE OVERVIEW
        ====================================================== */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
            <div className="flex min-w-0 items-center gap-4">
              {/* Avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#12355b] text-[16px] font-semibold uppercase tracking-wide text-white">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-slate-950">
                    {displayName}
                  </h2>

                  <span className="inline-flex rounded-full bg-[#2e6cf6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#2e6cf6]">
                    {roleLabel}
                  </span>
                </div>

                <p className="mt-1 truncate text-sm text-slate-500">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Authenticated Account
            </div>
          </div>
        </section>

        {/* =====================================================
            SETTINGS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT SIDE */}
          <div className="space-y-6">
            {/* Personal information */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10 text-[#2e6cf6]">
                    <UserRound
                      className="h-[18px] w-[18px]"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h2 className="text-[15px] font-semibold text-slate-950">
                      Personal Information
                    </h2>

                    <p className="mt-0.5 text-[13px] leading-5 text-slate-500">
                      Update the personal information associated with your
                      account.
                    </p>
                  </div>
                </div>
              </div>

              {/*
                NEXT STEP:

                We'll put our interactive client component here:

                <PersonalInformationForm
                  fullName={fullName}
                  email={email}
                />

                It will use:
                - React Hook Form
                - Zod
                - updateProfileNameAction()
                - updateProfileEmailAction()
                - Sonner toast
              */}

              <div className="space-y-5 p-6">
                {/* <ProfileFieldPreview label="Full name" value={fullName} />

                <ProfileFieldPreview label="Email address" value={email} /> */}
                <PersonalInformationForm email={email} fullName={fullName} />
              </div>
            </section>

            {/* Password */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10 text-[#2e6cf6]">
                    <ShieldCheck
                      className="h-[18px] w-[18px]"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h2 className="text-[15px] font-semibold text-slate-950">
                      Password & Security
                    </h2>

                    <p className="mt-0.5 text-[13px] leading-5 text-slate-500">
                      Keep your account protected with a strong password.
                    </p>
                  </div>
                </div>
              </div>

              {/*
                NEXT STEP:

                <ChangePasswordForm />

                This will contain:
                - current password
                - new password
                - confirm new password
                - show/hide controls
                - validation
                - loading state
                - Sonner errors/success
              */}

              <div className="p-6">
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-5">
                  <p className="text-sm font-medium text-slate-700">Password</p>

                  <p className="mt-1 text-[13px] leading-5 text-slate-500">
                    Your password is securely managed through your authenticated
                    account.
                  </p>
                </div>
              </div>

              <ChangePasswordForm />
            </section>
          </div>

          {/* ===================================================
              RIGHT SIDE — ACCOUNT INFO
          ==================================================== */}

          <aside>
            <div className="mt-4 rounded-xl border border-[#2e6cf6]/15 bg-[#2e6cf6]/5 p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#2e6cf6]"
                  aria-hidden="true"
                />

                <p className="text-[12px] leading-5 text-slate-600">
                  Changes to sensitive account information may require
                  additional email verification for security.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   SMALL SERVER-SIDE UI HELPERS
============================================================ */

function ProfileFieldPreview({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-medium text-slate-600">{label}</p>

      <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700">
        {value}
      </div>
    </div>
  );
}

function AccountInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-[13px] font-medium text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileLoadError() {
  return (
    <main className="flex min-h-[500px] items-center justify-center bg-[#f7f9fc] px-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-slate-950">
          Unable to load your profile
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          We couldn&apos;t retrieve your account information right now. Please
          refresh the page and try again.
        </p>
      </div>
    </main>
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "MU";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function formatRole(role: "doctor" | "patient" | "super_admin"): string {
  switch (role) {
    case "doctor":
      return "Doctor";

    case "super_admin":
      return "Super Admin";

    case "patient":
    default:
      return "Patient";
  }
}
