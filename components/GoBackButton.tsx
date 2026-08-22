// components/go-back-button.tsx

"use client";

export function GoBackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white/70 px-5 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      Go back
    </button>
  );
}
