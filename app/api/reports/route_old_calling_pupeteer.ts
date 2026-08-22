// import { NextRequest } from "next/server";

// import { generatePdf } from "@/lib/pdf/generateMedicalReportPdf";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// function getBaseUrl(request: NextRequest): string {
//   const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

//   if (configuredUrl) {
//     return configuredUrl.replace(/\/$/, "");
//   }

//   return request.nextUrl.origin;
// }

// export async function GET(request: NextRequest): Promise<Response> {
//   try {
//     const baseUrl = getBaseUrl(request);
//     console.log(baseUrl);
//     const reportUrl = `${baseUrl}/reports/print`;

//     const pdfBuffer = await generatePdf({
//       reportUrl,
//     });

//     return new Response(new Uint8Array(pdfBuffer), {
//       status: 200,
//       headers: {
//         "Content-Type": "application/pdf",
//         "Content-Disposition": `attachment; filename="${new Date().toISOString()}-mytime-medical-report.pdf"`,
//         "Cache-Control": "private, no-store, max-age=0",
//       },
//     });
//   } catch (error) {
//     console.error("Medical report PDF generation failed:", error);

//     return Response.json(
//       {
//         error: "Unable to generate the medical report PDF.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }
