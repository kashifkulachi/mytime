// app/not-found.tsx

import { GoBackButton } from "@/components/GoBackButton";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-24 dark:bg-zinc-950">
      {/* Background decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent dark:from-zinc-950" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent dark:from-zinc-950" />
      </div>

      <section className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Status */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-violet-500" />
            </span>
            Error 404
          </div>
        </div>

        {/* 404 */}
        <div className="relative">
          <p
            aria-hidden="true"
            className="select-none bg-gradient-to-b from-zinc-950 to-zinc-400 bg-clip-text text-[9rem] font-black leading-none tracking-tighter text-transparent sm:text-[12rem] dark:from-white dark:to-zinc-700"
          >
            404
          </p>

          <div className="absolute inset-0 -z-10 scale-110 bg-violet-500/10 blur-3xl" />
        </div>

        {/* Copy */}
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          This page wandered off.
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist, has been moved,
          or may have taken a wrong turn somewhere.
        </p>

        {/* Actions */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-lg shadow-zinc-950/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 sm:w-auto dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <HomeIcon />
            Back to home
            <ArrowRightIcon />
          </Link>

          <GoBackButton />
        </div>

        <p className="mt-10 text-xs text-zinc-400 dark:text-zinc-600">
          If you believe this is an error, try refreshing the page.
        </p>
      </section>
    </main>
  );
}

function HomeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform group-hover:translate-x-0.5"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
