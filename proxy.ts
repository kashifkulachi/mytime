import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run the proxy on application routes while skipping:
     *
     * - Next.js static files
     * - Next.js image optimization
     * - favicon
     * - common static image assets
     *
     * Authentication cookies still remain available on all
     * normal application pages and API routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
