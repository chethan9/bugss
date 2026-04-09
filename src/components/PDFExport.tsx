import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ReportConfig } from "./ReportSettings";

interface PDFExportProps {
  disabled?: boolean;
  reportConfig: ReportConfig;
}

export function PDFExport({ disabled, reportConfig }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const confidentialityColors = {
    none: "",
    public: "#10b981",
    internal: "#f59e0b",
    confidential: "#ef4444",
  };

  const addHeaderFooter = (
    pdf: jsPDF,
    pageNum: number,
    totalPages: number,
    pageWidth: number,
    pageHeight: number
  ) => {
    const margin = 15;
    const headerHeight = 25;
    const footerHeight = 15;

    // HEADER
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, pageWidth, headerHeight, "F");

    // Logo (if exists)
    if (reportConfig.logoUrl) {
      try {
        pdf.addImage(reportConfig.logoUrl, "PNG", margin, 8, 0, 12);
      } catch (e) {
        console.error("Failed to add logo:", e);
      }
    }

    // Report Title
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text(reportConfig.reportTitle, reportConfig.logoUrl ? margin + 40 : margin, 12);

    // Project Name
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.text(reportConfig.projectName, reportConfig.logoUrl ? margin + 40 : margin, 18);

    // Date & Period (Right aligned)
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    const dateWidth = pdf.getTextWidth(dateStr);
    pdf.text(dateStr, pageWidth - margin - dateWidth, 12);

    const periodWidth = pdf.getTextWidth(reportConfig.reportingPeriod);
    pdf.text(reportConfig.reportingPeriod, pageWidth - margin - periodWidth, 18);

    // Header divider
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, headerHeight, pageWidth - margin, headerHeight);

    // FOOTER
    const footerY = pageHeight - footerHeight;

    // Footer divider
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Page number
    if (reportConfig.showPageNumbers) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      const pageText = `Page ${pageNum} of ${totalPages}`;
      const pageTextWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, (pageWidth - pageTextWidth) / 2, footerY + 8);
    }

    // Footer text (left)
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(reportConfig.footerText, margin, footerY + 8);

    // Timestamp (right)
    if (reportConfig.showTimestamp) {
      const timestamp = now.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const timestampWidth = pdf.getTextWidth(timestamp);
      pdf.text(timestamp, pageWidth - margin - timestampWidth, footerY + 8);
    }

    // Confidentiality label
    if (reportConfig.confidentialityLevel !== "none") {
      const labels = {
        public: "PUBLIC",
        internal: "INTERNAL USE ONLY",
        confidential: "CONFIDENTIAL",
      };
      const label = labels[reportConfig.confidentialityLevel];
      const color = confidentialityColors[reportConfig.confidentialityLevel];

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");

      // Parse color hex to RGB
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      pdf.setTextColor(r, g, b);

      const labelWidth = pdf.getTextWidth(label);
      pdf.text(label, pageWidth - margin - labelWidth, footerY + 12);
    }
  };

  const captureSection = async (
    elementId: string,
    width: number
  ): Promise<string | null> => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    try {
      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: width,
      });

      return canvas.toDataURL("image/jpeg", 0.75);
    } catch (error) {
      console.error(`Failed to capture ${elementId}:`, error);
      return null;
    }
  };

  const addSectionHeader = (
    pdf: jsPDF,
    title: string,
    y: number,
    pageWidth: number
  ): number => {
    const margin = 15;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text(title.toUpperCase(), margin, y);

    // Underline
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);

    return y + 10;
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const headerFooterSpace = 45;
      const contentHeight = pageHeight - headerFooterSpace;

      const currentPage = 1;
      const pages: Array<{ images: string[]; title: string }> = [];

      // PAGE 1: Executive Summary
      const summaryImg = await captureSection("summary-metrics-section", contentWidth * 3.78);
      const progressImg = await captureSection("progress-bar-section", contentWidth * 3.78);
      const insightsImg = await captureSection("smart-insights-section", contentWidth * 3.78);

      if (summaryImg || progressImg || insightsImg) {
        pages.push({
          title: "Executive Summary",
          images: [summaryImg, progressImg, insightsImg].filter(Boolean) as string[],
        });
      }

      // PAGE 2-X: Analytics Widgets
      const widgetsImg = await captureSection("analytics-widgets-section", contentWidth * 3.78);
      if (widgetsImg) {
        pages.push({
          title: "Analytics & Insights",
          images: [widgetsImg],
        });
      }

      // LAST PAGE: Issues Table
      const tableImg = await captureSection("issue-table-section", contentWidth * 3.78);
      if (tableImg) {
        pages.push({
          title: "Issue Details",
          images: [tableImg],
        });
      }

      const totalPages = pages.length;

      // Render all pages
      pages.forEach((page, pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Add header & footer
        addHeaderFooter(pdf, pageIndex + 1, totalPages, pageWidth, pageHeight);

        // Add section title
        let yPos = addSectionHeader(pdf, page.title, 35, pageWidth);

        // Add images
        page.images.forEach((imgData, imgIndex) => {
          const img = new Image();
          img.src = imgData;

          const imgWidth = contentWidth;
          const imgHeight = (img.height * imgWidth) / img.width;

          // Check if image fits on current page
          if (yPos + imgHeight > pageHeight - 20) {
            pdf.addPage();
            addHeaderFooter(pdf, pageIndex + 1, totalPages, pageWidth, pageHeight);
            yPos = 35;
          }

          pdf.addImage(imgData, "JPEG", margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 5;
        });
      });

      // Save PDF
      const fileName = `${reportConfig.projectName.replace(/\s+/g, "-")}-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={generatePDF}
      disabled={disabled || isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
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