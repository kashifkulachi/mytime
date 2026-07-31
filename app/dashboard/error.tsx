// app/error.tsx
"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Replace this with Sentry, Datadog, LogRocket, etc.
    console.error("Application error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <main
      role="alert"
      className="flex min-h-[60vh] items-center justify-center px-6"
    >
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>

        <p className="mt-3 text-gray-600">
          We could not complete your request. Please try again.
        </p>

        {process.env.NODE_ENV === "development" && (
          <pre className="mt-4 overflow-auto rounded-md bg-gray-100 p-4 text-left text-sm">
            {error.message}
          </pre>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-black px-5 py-2.5 text-white hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
