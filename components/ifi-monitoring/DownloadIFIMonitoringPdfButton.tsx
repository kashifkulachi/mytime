// "use client";

// import { useState } from "react";
// import { Download, LoaderCircle } from "lucide-react";
// import { toast } from "sonner";

// interface DownloadIFIMonitoringPdfButtonProps {
//   patientName: string;
//   cycleStartDate: string;
// }

// export function DownloadIFIMonitoringPdfButton({
//   patientName,
//   cycleStartDate,
// }: DownloadIFIMonitoringPdfButtonProps) {
//   const [isGenerating, setIsGenerating] = useState(false);

//   const handleDownload = async () => {
//     if (isGenerating) {
//       return;
//     }

//     setIsGenerating(true);

//     try {
//       /**
//        * Dynamically importing these libraries keeps them out of the
//        * initial page bundle and guarantees that they only execute
//        * inside the browser.
//        */
//       const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
//         import("html2canvas"),
//         import("jspdf"),
//       ]);

//       /**
//        * IFIMonitoringDashboard will expose the exact portion of the
//        * page that belongs in the PDF using this data attribute.
//        */
//       const reportElement = document.querySelector<HTMLElement>(
//         '[data-ifi-monitoring-pdf="true"]',
//       );

//       if (!reportElement) {
//         throw new Error("IFI monitoring report content was not found.");
//       }

//       /**
//        * Wait for fonts before taking the snapshot.
//        */
//       if (document.fonts?.ready) {
//         await document.fonts.ready;
//       }

//       /**
//        * Capture the complete monitoring report.
//        *
//        * scale: 2 gives substantially better text/chart quality than
//        * the browser's native CSS pixel resolution.
//        */
//       const canvas = await html2canvas(reportElement, {
//         scale: 2,
//         useCORS: true,
//         backgroundColor: "#ffffff",
//         logging: false,
//         windowWidth: reportElement.scrollWidth,
//       });

//       const imageData = canvas.toDataURL("image/png", 1);

//       /**
//        * A4 portrait dimensions in millimeters.
//        */
//       const pdf = new jsPDF({
//         orientation: "portrait",
//         unit: "mm",
//         format: "a4",
//         compress: true,
//       });

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();

//       const margin = 10;

//       const printableWidth = pageWidth - margin * 2;
//       const printableHeight = pageHeight - margin * 2;

//       /**
//        * Scale the screenshot to the printable PDF width while
//        * preserving its original aspect ratio.
//        */
//       const renderedImageHeight =
//         (canvas.height * printableWidth) / canvas.width;

//       let remainingHeight = renderedImageHeight;
//       let verticalPosition = margin;

//       /**
//        * First page.
//        */
//       pdf.addImage(
//         imageData,
//         "PNG",
//         margin,
//         verticalPosition,
//         printableWidth,
//         renderedImageHeight,
//         undefined,
//         "FAST",
//       );

//       remainingHeight -= printableHeight;

//       /**
//        * Additional pages.
//        *
//        * We reuse the same complete screenshot and move it upward on
//        * subsequent pages. The PDF page itself clips everything
//        * outside its visible page.
//        */
//       while (remainingHeight > 0) {
//         pdf.addPage();

//         verticalPosition = margin - (renderedImageHeight - remainingHeight);

//         pdf.addImage(
//           imageData,
//           "PNG",
//           margin,
//           verticalPosition,
//           printableWidth,
//           renderedImageHeight,
//           undefined,
//           "FAST",
//         );

//         remainingHeight -= printableHeight;
//       }

//       const safePatientName =
//         patientName
//           .trim()
//           .replace(/[^a-zA-Z0-9]+/g, "-")
//           .replace(/^-+|-+$/g, "")
//           .toLowerCase() || "patient";

//       const safeCycleDate = cycleStartDate || "monitoring";

//       pdf.save(`ifi-monitoring-${safePatientName}-${safeCycleDate}.pdf`);

//       toast.success("IFI monitoring PDF downloaded.");
//     } catch (error) {
//       console.error("[IFI Monitoring PDF] Generation failed:", error);

//       toast.error(
//         error instanceof Error
//           ? error.message
//           : "Unable to generate IFI monitoring PDF.",
//       );
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   return (
//     <button
//       type="button"
//       onClick={handleDownload}
//       disabled={isGenerating}
//       className="
//         inline-flex h-9 cursor-pointer items-center justify-center
//         gap-2 rounded-lg bg-[#2e6cf6] px-4
//         text-sm font-medium text-white
//         transition-colors
//         hover:bg-[#245bd1]
//         focus-visible:outline-none
//         focus-visible:ring-2
//         focus-visible:ring-[#2e6cf6]/30
//         disabled:cursor-not-allowed
//         disabled:opacity-60
//       "
//     >
//       {isGenerating ? (
//         <>
//           <LoaderCircle className="h-4 w-4 animate-spin" />
//           Generating PDF...
//         </>
//       ) : (
//         <>
//           <Download className="h-4 w-4" />
//           Download PDF
//         </>
//       )}
//     </button>
//   );
// }

"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

interface DownloadIFIMonitoringPdfButtonProps {
  patientName: string;
  cycleStartDate: string;
}

export function DownloadIFIMonitoringPdfButton({
  patientName,
  cycleStartDate,
}: DownloadIFIMonitoringPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      /**
       * Dynamic imports:
       *
       * These libraries are needed only when the user actually
       * requests a PDF, so they do not need to be part of the
       * initial monitoring-page execution.
       */
      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const reportElement = document.querySelector<HTMLElement>(
        '[data-ifi-monitoring-pdf="true"]',
      );

      if (!reportElement) {
        throw new Error("IFI monitoring report content was not found.");
      }

      /**
       * Wait until browser fonts have finished loading.
       */
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      /**
       * Give Recharts/browser layout one frame to make sure
       * everything is painted before taking the snapshot.
       */
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      /**
       * Capture the complete monitoring document.
       *
       * pixelRatio 2 gives us a sharper PDF while still keeping
       * memory usage reasonable for this relatively tall report.
       */
      const imageData = await toPng(reportElement, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });

      /**
       * We need the generated PNG dimensions in order to preserve
       * its aspect ratio when placing it into the PDF.
       */

      const image = new Image();

      image.src = imageData;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();

        image.onerror = () => {
          reject(
            new Error("The IFI monitoring screenshot could not be prepared."),
          );
        };
      });

      /**
       * ----------------------------------------------------------
       * PDF
       * ----------------------------------------------------------
       *
       * Standard A4 portrait PDF.
       */
      //   const pdf = new jsPDF({
      //     orientation: "portrait",
      //     unit: "mm",
      //     format: "a4",
      //     compress: true,
      //   });

      //   const pageWidth = pdf.internal.pageSize.getWidth();
      //   const pageHeight = pdf.internal.pageSize.getHeight();

      //   const margin = 10;

      //   const printableWidth = pageWidth - margin * 3;
      //   const printableHeight = pageHeight - margin * 20;

      //   /**
      //    * Scale the captured image to A4 printable width while
      //    * preserving its aspect ratio.
      //    */
      //   const renderedImageHeight = (image.height * printableWidth) / image.width;

      //   let remainingHeight = renderedImageHeight;

      //   const verticalPosition = margin;

      //   /**
      //    * ----------------------------------------------------------
      //    * PAGE 1
      //    * ----------------------------------------------------------
      //    */
      //   pdf.addImage(
      //     imageData,
      //     "PNG",
      //     margin,
      //     verticalPosition,
      //     printableWidth,
      //     renderedImageHeight,
      //     undefined,
      //     "FAST",
      //   );

      //   remainingHeight -= printableHeight;

      /**
       * ----------------------------------------------------------
       * ADDITIONAL PAGES
       * ----------------------------------------------------------
       *
       * The complete screenshot is reused.
       *
       * On every following page it is shifted upward so the next
       * portion becomes visible.
       */
      //   while (remainingHeight > 0) {
      //     pdf.addPage();

      //     verticalPosition = margin - (renderedImageHeight - remainingHeight);

      //     pdf.addImage(
      //       imageData,
      //       "PNG",
      //       margin,
      //       verticalPosition,
      //       printableWidth,
      //       renderedImageHeight,
      //       undefined,
      //       "FAST",
      //     );

      //     remainingHeight -= printableHeight;
      //   }

      /**
       * ============================================================
       * SINGLE LONG PDF PAGE WITH MARGINS
       * ============================================================
       */

      const pagePadding = 10; // mm padding on all four sides

      /**
       * Total PDF width.
       */
      const pdfWidth = 210;

      /**
       * Content width after left + right padding.
       */
      const contentWidth = pdfWidth - pagePadding * 2;

      /**
       * Scale the screenshot proportionally to the available
       * content width.
       */
      const contentHeight = (image.height * contentWidth) / image.width;

      /**
       * PDF height includes:
       *
       * top padding
       * + monitoring content
       * + bottom padding
       */
      const pdfHeight = contentHeight + pagePadding * 2;

      /**
       * Create one continuous custom-sized PDF page.
       */
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
        compress: true,
      });

      /**
       * Place the screenshot inside the page margins.
       */
      pdf.addImage(
        imageData,
        "PNG",
        pagePadding, // left
        pagePadding, // top
        contentWidth,
        contentHeight,
        undefined,
        "FAST",
      );
      /**
       * ----------------------------------------------------------
       * FILE NAME
       * ----------------------------------------------------------
       */
      const safePatientName =
        patientName
          .trim()
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase() || "patient";

      const safeCycleDate = cycleStartDate.trim() || "monitoring";

      const fileName = `ifi-monitoring-${safePatientName}-${safeCycleDate}.pdf`;

      /**
       * Browser-only download.
       *
       * Nothing is uploaded to Supabase and nothing is stored
       * by our application.
       */
      pdf.save(fileName);

      toast.success("IFI monitoring PDF downloaded.");
    } catch (error) {
      console.error("[IFI Monitoring PDF] Generation failed:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to generate IFI monitoring PDF.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="
        inline-flex h-9 cursor-pointer items-center justify-center
        gap-2 rounded-lg bg-[#2e6cf6] px-4
        text-[11px] font-semibold text-white
        transition-colors
        hover:bg-[#255bd4]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#2e6cf6]/30
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {isGenerating ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.8} />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" strokeWidth={1.8} />
          Download PDF
        </>
      )}
    </button>
  );
}
