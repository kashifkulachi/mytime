import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { count, error } = await supabase
      .from("biological_age_results")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      console.error("Supabase connection test failed:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Supabase connection failed.",
          error: error.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Next.js successfully connected to Supabase.",
      biologicalAgeResultCount: count ?? 0,
    });
  } catch (error) {
    console.error("Unexpected Supabase connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unexpected Supabase connection error.",
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      {
        status: 500,
      },
    );
  }
}
