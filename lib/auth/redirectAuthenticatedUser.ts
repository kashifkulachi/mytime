import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function redirectAuthenticatedUser(): Promise<void> {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }
}
