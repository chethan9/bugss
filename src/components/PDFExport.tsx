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

      let currentPage = 1;

      // Helper: Add header to page
      const addHeader = () => {
        // Logo (if provided)
        if (reportConfig.companyLogo) {
          pdf.addImage(reportConfig.companyLogo, "PNG", margin, margin, 30, 10);
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

        // Count visible widgets
        const sections = document.querySelectorAll('[id$="-section"]');
        const widgetCount = sections.length;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${widgetCount} analytics widgets included`, pageWidth - margin, margin + 16, { align: "right" });
        pdf.setTextColor(0, 0, 0);

        // Divider line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, margin + 18, pageWidth - margin, margin + 18);
      };

      // Helper: Add footer to page
      const addFooter = (pageNum: number, totalPages: number) => {
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
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - margin + 10, { align: "center" });
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
          // Color code confidentiality
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

      // Capture all dashboard sections
      const sections = [
        { id: "smart-insights-section", title: "SMART INSIGHTS" },
        { id: "summary-metrics-section", title: "EXECUTIVE SUMMARY" },
        { id: "progress-bar-section", title: "ISSUE PROGRESS" },
        { id: "analytics-widgets-section", title: "ANALYTICS & INSIGHTS" },
        { id: "issue-table-section", title: "DETAILED ISSUE LIST" },
      ];

      const capturedImages: { title: string; dataUrl: string; height: number }[] = [];

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (!element) continue;

        const canvas = await html2canvas(element, {
          scale: 1,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.75);
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        capturedImages.push({
          title: section.title,
          dataUrl: imgData,
          height: imgHeight,
        });
      }

      // Calculate total pages
      let totalPages = 1;
      let yPosition = margin + 25;
      for (const img of capturedImages) {
        if (yPosition + img.height + 10 > pageHeight - margin - 15) {
          totalPages++;
          yPosition = margin + 25;
        }
        yPosition += img.height + 15;
      }

      // Generate PDF with all images
      addHeader();
      yPosition = margin + 25;

      for (let i = 0; i < capturedImages.length; i++) {
        const img = capturedImages[i];

        // Check if we need a new page
        if (yPosition + img.height + 10 > pageHeight - margin - 15) {
          addFooter(currentPage, totalPages);
          pdf.addPage();
          currentPage++;
          addHeader();
          yPosition = margin + 25;
        }

        // Add section title
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(60, 60, 60);
        pdf.text(img.title, margin, yPosition);
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
        yPosition += 8;

        // Add image
        pdf.addImage(img.dataUrl, "JPEG", margin, yPosition, pageWidth - 2 * margin, img.height);
        yPosition += img.height + 15;
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