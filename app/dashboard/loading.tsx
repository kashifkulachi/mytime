// app/dashboard/(auth)/loading.tsx

export default function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2e6cf6]" />

        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
