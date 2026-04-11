import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ReportConfig } from "./ReportSettings";

interface Issue {
  id: string;
  number: number;
  title: string;
  status: "open" | "in_progress" | "closed";
  repository: string;
  labels: string[];
  assignee?: string;
  url: string;
  createdAt: string;
  closedAt?: string;
}

interface PDFExportProps {
  disabled?: boolean;
  reportConfig: ReportConfig;
  issues?: Issue[];
}

export function PDFExport({ disabled, reportConfig, issues = [] }: PDFExportProps) {
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
      let yPosition = headerHeight + 5;

      // Helper: Add header to page
      const addHeader = () => {
        if (reportConfig.companyLogo) {
          try {
            pdf.addImage(reportConfig.companyLogo, "PNG", margin, margin, 30, 10);
          } catch (e) {
            console.warn("Failed to add logo:", e);
          }
        }

        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text(reportConfig.reportTitle, reportConfig.companyLogo ? margin + 35 : margin, margin + 7);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(reportConfig.projectName, reportConfig.companyLogo ? margin + 35 : margin, margin + 12);

        const today = new Date().toLocaleDateString();
        pdf.text(today, pageWidth - margin, margin + 7, { align: "right" });
        pdf.text(reportConfig.reportingPeriod, pageWidth - margin, margin + 12, { align: "right" });

        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, margin + 18, pageWidth - margin, margin + 18);
      };

      // Helper: Add footer to page
      const addFooter = (pageNum: number, total: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);

        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, pageHeight - margin + 5, pageWidth - margin, pageHeight - margin + 5);

        if (reportConfig.customFooter) {
          pdf.text(reportConfig.customFooter, margin, pageHeight - margin + 10);
        }

        if (reportConfig.showPageNumbers) {
          pdf.text(`Page ${pageNum} of ${total}`, pageWidth / 2, pageHeight - margin + 10, { align: "center" });
        }

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

      // Helper: Check if need new page
      const checkNewPage = (neededHeight: number) => {
        if (yPosition + neededHeight > availableHeight + headerHeight) {
          addFooter(currentPage, totalPages);
          pdf.addPage();
          currentPage++;
          addHeader();
          yPosition = headerHeight + 5;
          return true;
        }
        return false;
      };

      // Helper: Add section title
      const addSectionTitle = (title: string) => {
        checkNewPage(15);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(60, 60, 60);
        pdf.text(title, margin, yPosition + 5);
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, yPosition + 7, pageWidth - margin, yPosition + 7);
        yPosition += 12;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
      };

      // Helper: Capture element with expanded content
      const captureElement = async (element: HTMLElement): Promise<HTMLCanvasElement | null> => {
        try {
          const originalStyles = {
            height: element.style.height,
            maxHeight: element.style.maxHeight,
            overflow: element.style.overflow,
          };

          element.style.height = "auto";
          element.style.maxHeight = "none";
          element.style.overflow = "visible";

          const scrollableChildren = element.querySelectorAll("[class*='overflow'], [style*='overflow']");
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

          await new Promise((resolve) => setTimeout(resolve, 100));

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowHeight: element.scrollHeight + 100,
            height: element.scrollHeight,
          });

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

      // Helper: Add image to PDF with page splitting
      const addImageToPDF = (canvas: HTMLCanvasElement, imgWidth: number) => {
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let remainingHeight = imgHeight;
        let srcY = 0;

        while (remainingHeight > 0) {
          const spaceLeft = availableHeight + headerHeight - yPosition;
          const heightToRender = Math.min(remainingHeight, spaceLeft);
          
          const srcHeight = (heightToRender / imgHeight) * canvas.height;

          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = srcHeight;
          const ctx = tempCanvas.getContext("2d");
          
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, srcY, canvas.width, srcHeight,
              0, 0, canvas.width, srcHeight
            );
            const clippedImgData = tempCanvas.toDataURL("image/jpeg", 0.92);
            pdf.addImage(clippedImgData, "JPEG", margin, yPosition, imgWidth, heightToRender);
          }

          srcY += srcHeight;
          remainingHeight -= heightToRender;
          yPosition += heightToRender;

          if (remainingHeight > 0) {
            addFooter(currentPage, totalPages);
            pdf.addPage();
            currentPage++;
            totalPages++;
            addHeader();
            yPosition = headerHeight + 5;
          }
        }
      };

      // Calculate total pages first (estimate)
      const analyticsSections = [
        "smart-insights-section",
        "summary-metrics-section",
        "progress-bar-section",
        "analytics-widgets-section",
      ];
      
      // Estimate pages for analytics + issues table
      const issueRowsPerPage = Math.floor(availableHeight / 6); // ~6mm per row
      const tablePages = Math.ceil(issues.length / issueRowsPerPage);
      totalPages = 2 + tablePages; // Rough estimate

      // Start generating
      addHeader();

      // Capture analytics sections
      for (const sectionId of analyticsSections) {
        const element = document.getElementById(sectionId);
        if (!element) continue;

        const canvas = await captureElement(element);
        if (!canvas) continue;

        const sectionTitles: Record<string, string> = {
          "smart-insights-section": "SMART INSIGHTS",
          "summary-metrics-section": "EXECUTIVE SUMMARY",
          "progress-bar-section": "ISSUE PROGRESS",
          "analytics-widgets-section": "ANALYTICS & INSIGHTS",
        };

        addSectionTitle(sectionTitles[sectionId] || sectionId.toUpperCase());
        addImageToPDF(canvas, contentWidth);
        yPosition += 8;
      }

      // Generate issues table directly (not via html2canvas)
      if (issues.length > 0) {
        addSectionTitle("DETAILED ISSUE LIST");
        
        // Table header
        const colWidths = [15, 70, 25, 25, 45]; // #, Title, Status, Severity, Repository
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const startX = margin;
        
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setFillColor(245, 245, 245);
        pdf.rect(startX, yPosition, tableWidth, 7, "F");
        
        let xPos = startX + 2;
        const headers = ["#", "Title", "Status", "Severity", "Repository"];
        headers.forEach((header, i) => {
          pdf.text(header, xPos, yPosition + 5);
          xPos += colWidths[i];
        });
        yPosition += 7;

        // Table rows
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);

        for (let i = 0; i < issues.length; i++) {
          const issue = issues[i];
          
          // Check if need new page
          if (yPosition + 6 > availableHeight + headerHeight) {
            addFooter(currentPage, totalPages);
            pdf.addPage();
            currentPage++;
            if (currentPage > totalPages) totalPages = currentPage;
            addHeader();
            yPosition = headerHeight + 5;
            
            // Repeat table header on new page
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.setFillColor(245, 245, 245);
            pdf.rect(startX, yPosition, tableWidth, 7, "F");
            
            xPos = startX + 2;
            headers.forEach((header, idx) => {
              pdf.text(header, xPos, yPosition + 5);
              xPos += colWidths[idx];
            });
            yPosition += 7;
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7);
          }

          // Alternate row background
          if (i % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(startX, yPosition, tableWidth, 6, "F");
          }

          // Draw row
          xPos = startX + 2;
          
          // Issue number
          pdf.text(`#${issue.number}`, xPos, yPosition + 4);
          xPos += colWidths[0];
          
          // Title (truncate if too long)
          const maxTitleLength = 45;
          const title = issue.title.length > maxTitleLength 
            ? issue.title.substring(0, maxTitleLength) + "..." 
            : issue.title;
          pdf.text(title, xPos, yPosition + 4);
          xPos += colWidths[1];
          
          // Status with color
          const statusColors: Record<string, [number, number, number]> = {
            open: [34, 197, 94],
            in_progress: [234, 179, 8],
            closed: [107, 114, 128],
          };
          const statusColor = statusColors[issue.status] || [107, 114, 128];
          pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.text(issue.status.replace("_", " "), xPos, yPosition + 4);
          pdf.setTextColor(0, 0, 0);
          xPos += colWidths[2];
          
          // Severity
          const labelText = issue.labels.join(" ").toLowerCase();
          let severity = "-";
          if (labelText.includes("critical")) severity = "Critical";
          else if (labelText.includes("high")) severity = "High";
          else if (labelText.includes("medium")) severity = "Medium";
          else if (labelText.includes("low")) severity = "Low";
          pdf.text(severity, xPos, yPosition + 4);
          xPos += colWidths[3];
          
          // Repository (truncate if needed)
          const maxRepoLength = 25;
          const repo = issue.repository.length > maxRepoLength
            ? "..." + issue.repository.slice(-maxRepoLength + 3)
            : issue.repository;
          pdf.text(repo, xPos, yPosition + 4);
          
          yPosition += 6;
        }

        // Table border
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(startX, headerHeight + 17, tableWidth, yPosition - headerHeight - 17);
      }

      // Update total pages and re-add footers
      totalPages = currentPage;
      
      // Go back and update all footers with correct total
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        addFooter(p, totalPages);
      }

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