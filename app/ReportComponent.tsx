"use client";
import { redirect, useRouter } from "next/navigation";

function ReportComponent() {
  const router = useRouter();
  redirect("/login");
  function handleClick() {
    router.push("/dashboard/get-report");
  }
  return (
    <div className="flex flex-col flex-1 h-full items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl h-full flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        Dashboard
      </main>
    </div>
  );
}

export default ReportComponent;
