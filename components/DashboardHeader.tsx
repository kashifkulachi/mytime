import { UserRound } from "lucide-react";

import LogoutButton from "@/components/auth/LogoutButton";

type DashboardHeaderProps = {
  fullName: string | null;
  role: "doctor" | "patient" | "super_admin";
};

export default function DashboardHeader({
  fullName,
  role,
}: DashboardHeaderProps) {
  const displayName = getDisplayName(fullName);
  const initials = getInitials(displayName);

  const name = role === "doctor" ? `Dr. ${displayName}` : displayName;

  const roleLabel =
    role === "super_admin"
      ? "Super Admin"
      : role === "doctor"
        ? "Doctor"
        : "Patient";

  return (
    <header className="flex h-16 w-full items-center justify-end border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        {/* USER */}
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#032b50] text-[12px] font-bold uppercase tracking-wide text-white"
            aria-hidden="true"
          >
            {initials}
          </div>

          {/* IDENTITY */}
          <div className="hidden min-w-0 sm:block">
            <p className="max-w-[220px] truncate text-sm font-semibold leading-5 text-slate-950">
              {name}
            </p>

            <p className="text-[11px] font-medium leading-4 text-slate-500">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* SEPARATOR */}
        <div
          className="hidden h-7 w-px bg-slate-200 sm:block"
          aria-hidden="true"
        />

        {/* LOGOUT */}
        <div className="flex items-center">
          <LogoutButton variant="header" />
        </div>
      </div>
    </header>
  );
}

function getDisplayName(fullName: string | null): string {
  const normalizedName = fullName?.trim();

  return normalizedName || "MyTime User";
}

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
