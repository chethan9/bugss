import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ReportConfig } from "./ReportSettings";

interface PDFExportProps {
  disabled?: boolean;
  reportConfig: ReportConfig;
}

export function PDFExport({ disabled, reportConfig }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const headerHeight = 25;
      const footerHeight = 15;
      const availableHeight = pageHeight - headerHeight - footerHeight - margin;

      let currentPage = 1;
      let totalPages = 1;

      // Helper: Add header to page
      const addHeader = () => {
        // Logo (if provided)
        if (reportConfig.companyLogo) {
          try {
            pdf.addImage(reportConfig.companyLogo, "PNG", margin, margin, 30, 10);
          } catch (e) {
            console.warn("Failed to add logo:", e);
          }
        }

        // Title and meta
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text(reportConfig.reportTitle, reportConfig.companyLogo ? margin + 35 : margin, margin + 7);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(reportConfig.projectName, reportConfig.companyLogo ? margin + 35 : margin, margin + 12);

        // Date and period (right aligned)
        const today = new Date().toLocaleDateString();
        pdf.text(today, pageWidth - margin, margin + 7, { align: "right" });
        pdf.text(reportConfig.reportingPeriod, pageWidth - margin, margin + 12, { align: "right" });

        // Divider line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, margin + 18, pageWidth - margin, margin + 18);
      };

      // Helper: Add footer to page
      const addFooter = (pageNum: number, total: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);

        // Footer line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, pageHeight - margin + 5, pageWidth - margin, pageHeight - margin + 5);

        // Footer text (left)
        if (reportConfig.customFooter) {
          pdf.text(reportConfig.customFooter, margin, pageHeight - margin + 10);
        }

        // Page number (center)
        if (reportConfig.showPageNumbers) {
          pdf.text(`Page ${pageNum} of ${total}`, pageWidth / 2, pageHeight - margin + 10, { align: "center" });
        }

        // Timestamp and confidentiality (right)
        const timestamp = new Date().toLocaleString();
        let rightText = "";
        if (reportConfig.showTimestamp) {
          rightText = timestamp;
        }
        if (reportConfig.confidentialityLevel !== "none") {
          if (rightText) rightText += " • ";
          rightText += reportConfig.confidentialityLevel.toUpperCase();
        }
        if (rightText) {
          if (reportConfig.confidentialityLevel === "confidential") {
            pdf.setTextColor(200, 0, 0);
          } else if (reportConfig.confidentialityLevel === "internal") {
            pdf.setTextColor(200, 100, 0);
          }
          pdf.text(rightText, pageWidth - margin, pageHeight - margin + 10, { align: "right" });
          pdf.setTextColor(100, 100, 100);
        }

        pdf.setTextColor(0, 0, 0);
      };

      // Helper: Capture element with full scroll content
      const captureElement = async (element: HTMLElement): Promise<HTMLCanvasElement | null> => {
        try {
          // Store original styles
          const originalStyles = {
            height: element.style.height,
            maxHeight: element.style.maxHeight,
            overflow: element.style.overflow,
          };

          // Temporarily expand element to show all content
          element.style.height = "auto";
          element.style.maxHeight = "none";
          element.style.overflow = "visible";

          // Also handle any scrollable children (like tables)
          const scrollableChildren = element.querySelectorAll('[style*="overflow"], [class*="overflow"]');
          const childStyles: { el: HTMLElement; styles: { height: string; maxHeight: string; overflow: string } }[] = [];
          
          scrollableChildren.forEach((child) => {
            const htmlChild = child as HTMLElement;
            childStyles.push({
              el: htmlChild,
              styles: {
                height: htmlChild.style.height,
                maxHeight: htmlChild.style.maxHeight,
                overflow: htmlChild.style.overflow,
              },
            });
            htmlChild.style.height = "auto";
            htmlChild.style.maxHeight = "none";
            htmlChild.style.overflow = "visible";
          });

          // Wait for reflow
          await new Promise((resolve) => setTimeout(resolve, 100));

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowHeight: element.scrollHeight + 100,
            height: element.scrollHeight,
          });

          // Restore original styles
          element.style.height = originalStyles.height;
          element.style.maxHeight = originalStyles.maxHeight;
          element.style.overflow = originalStyles.overflow;

          childStyles.forEach(({ el, styles }) => {
            el.style.height = styles.height;
            el.style.maxHeight = styles.maxHeight;
            el.style.overflow = styles.overflow;
          });

          return canvas;
        } catch (error) {
          console.error("Failed to capture element:", error);
          return null;
        }
      };

      // Define sections to capture
      const sections = [
        { id: "smart-insights-section", title: "SMART INSIGHTS" },
        { id: "summary-metrics-section", title: "EXECUTIVE SUMMARY" },
        { id: "progress-bar-section", title: "ISSUE PROGRESS" },
        { id: "analytics-widgets-section", title: "ANALYTICS & INSIGHTS" },
        { id: "issue-table-section", title: "DETAILED ISSUE LIST" },
      ];

      // Capture all sections
      const capturedImages: { title: string; canvas: HTMLCanvasElement; imgHeight: number }[] = [];

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (!element) continue;

        const canvas = await captureElement(element);
        if (!canvas) continue;

        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        capturedImages.push({
          title: section.title,
          canvas,
          imgHeight,
        });
      }

      // Calculate total pages needed
      let yPosition = headerHeight + 5;
      for (const img of capturedImages) {
        const sectionTitleHeight = 10;
        let remainingHeight = img.imgHeight;

        // Check if section title fits on current page
        if (yPosition + sectionTitleHeight > availableHeight + headerHeight) {
          totalPages++;
          yPosition = headerHeight + 5;
        }
        yPosition += sectionTitleHeight;

        // Calculate pages for this image
        while (remainingHeight > 0) {
          const spaceLeft = availableHeight + headerHeight - yPosition;
          if (remainingHeight <= spaceLeft) {
            yPosition += remainingHeight + 10;
            remainingHeight = 0;
          } else {
            remainingHeight -= spaceLeft;
            totalPages++;
            yPosition = headerHeight + 5;
          }
        }
      }

      // Generate PDF pages
      addHeader();
      yPosition = headerHeight + 5;

      for (let i = 0; i < capturedImages.length; i++) {
        const img = capturedImages[i];
        const imgData = img.canvas.toDataURL("image/jpeg", 0.92);
        const sectionTitleHeight = 10;

        // Check if section title fits on current page
        if (yPosition + sectionTitleHeight > availableHeight + headerHeight) {
          addFooter(currentPage, totalPages);
          pdf.addPage();
          currentPage++;
          addHeader();
          yPosition = headerHeight + 5;
        }

        // Add section title
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(60, 60, 60);
        pdf.text(img.title, margin, yPosition + 5);
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, yPosition + 7, pageWidth - margin, yPosition + 7);
        yPosition += sectionTitleHeight;

        // Add image, splitting across pages if needed
        let imgYOffset = 0;
        let remainingImgHeight = img.imgHeight;
        const imgWidth = contentWidth;
        const fullImgHeight = img.imgHeight;

        while (remainingImgHeight > 0) {
          const spaceLeft = availableHeight + headerHeight - yPosition;
          const heightToRender = Math.min(remainingImgHeight, spaceLeft);
          
          // Calculate source coordinates for clipping
          const srcY = (imgYOffset / fullImgHeight) * img.canvas.height;
          const srcHeight = (heightToRender / fullImgHeight) * img.canvas.height;

          // Create a temporary canvas for the clipped portion
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = img.canvas.width;
          tempCanvas.height = srcHeight;
          const ctx = tempCanvas.getContext("2d");
          
          if (ctx) {
            ctx.drawImage(
              img.canvas,
              0, srcY, img.canvas.width, srcHeight,
              0, 0, img.canvas.width, srcHeight
            );
            const clippedImgData = tempCanvas.toDataURL("image/jpeg", 0.92);
            pdf.addImage(clippedImgData, "JPEG", margin, yPosition, imgWidth, heightToRender);
          }

          imgYOffset += heightToRender;
          remainingImgHeight -= heightToRender;
          yPosition += heightToRender;

          if (remainingImgHeight > 0) {
            addFooter(currentPage, totalPages);
            pdf.addPage();
            currentPage++;
            addHeader();
            yPosition = headerHeight + 5;
          }
        }

        yPosition += 10; // Gap between sections
      }

      // Add footer to last page
      addFooter(currentPage, totalPages);

      // Save PDF
      const filename = `${reportConfig.projectName.replace(/\s+/g, "-")}-report-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={disabled || isGenerating}
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 h-8 px-2 font-normal"
    >
      {isGenerating ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}