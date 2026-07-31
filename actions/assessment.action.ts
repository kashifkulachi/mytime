import type { Assessment, AssessmentResult } from "@/types/assessments";

export async function submitAssessmentAction(
  assessment: Assessment,
): Promise<AssessmentResult> {
  console.log("hello");
}
