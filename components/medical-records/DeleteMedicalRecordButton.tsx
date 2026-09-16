"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface DeleteMedicalRecordButtonProps {
  reportId: string;
  evaluationDate?: string;
  variant?: "desktop" | "mobile";
}

export default function DeleteMedicalRecordButton({
  reportId,
  evaluationDate,
  variant = "desktop",
}: DeleteMedicalRecordButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/medical-records/${encodeURIComponent(reportId)}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete medical record.");
      }

      setIsOpen(false);

      toast.success("Medical record deleted successfully.");

      /**
       * Re-render the server component so the deleted report
       * disappears from the Medical Records history.
       */
      router.refresh();
    } catch (error) {
      console.error(
        `[DeleteMedicalRecordButton] Failed to delete report ${reportId}:`,
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete medical record.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* ======================================================
          DELETE BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isDeleting}
        className={
          variant === "mobile"
            ? "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            : "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>

      {/* ======================================================
          CONFIRMATION DIALOG
      ====================================================== */}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setIsOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-record-title-${reportId}`}
            aria-describedby={`delete-record-description-${reportId}`}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}

            <div className="flex items-start justify-between gap-4 px-5 pt-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <Trash2 className="h-4.5 w-4.5 text-red-600" />
                </div>

                <div className="min-w-0">
                  <h2
                    id={`delete-record-title-${reportId}`}
                    className="text-sm font-semibold text-[#12355b]"
                  >
                    Delete medical record?
                  </h2>

                  <p
                    id={`delete-record-description-${reportId}`}
                    className="mt-1 text-xs leading-5 text-slate-500"
                  >
                    This permanently deletes this medical record, its assessment
                    results, and its generated PDF. This action cannot be
                    undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                aria-label="Close delete confirmation"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Record information */}

            {evaluationDate && (
              <div className="mx-5 mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Assessment
                </p>

                <p className="mt-1 text-xs font-semibold text-[#12355b]">
                  {formatDate(evaluationDate)}
                </p>
              </div>
            )}

            {/* Warning */}

            <div className="mx-5 mt-4 rounded-lg border border-red-100 bg-red-50/70 px-3.5 py-3">
              <p className="text-xs leading-5 text-red-700">
                Once deleted, this report will no longer appear in your medical
                history and cannot be recovered from this application.
              </p>
            </div>

            {/* Actions */}

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-[#12355b] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex h-9 min-w-[118px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
