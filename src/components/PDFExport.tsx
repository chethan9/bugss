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
  state: string;
  status?: "open" | "in_progress" | "closed";
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
      const headerHeight = 30;
      const footerHeight = 12;
      const usableHeight = pageHeight - headerHeight - footerHeight;

      let currentPage = 1;
      let yPosition = headerHeight;

      // Helper: Add header
      const addHeader = (isFirstPage: boolean) => {
        // Background header bar
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, 0, pageWidth, headerHeight - 5, "F");
        
        if (reportConfig.companyLogo && isFirstPage) {
          try {
            pdf.addImage(reportConfig.companyLogo, "PNG", margin, 8, 25, 12);
          } catch (e) {
            console.warn("Logo error:", e);
          }
        }

        const textX = reportConfig.companyLogo && isFirstPage ? margin + 30 : margin;
        
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text(reportConfig.reportTitle, textX, 14);

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        const subtitle = [reportConfig.projectName, reportConfig.reportingPeriod].filter(Boolean).join(" • ");
        pdf.text(subtitle, textX, 20);

        // Right side date
        const today = new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
        });
        pdf.text(today, pageWidth - margin, 14, { align: "right" });
        
        if (reportConfig.companyName) {
          pdf.text(reportConfig.companyName, pageWidth - margin, 20, { align: "right" });
        }

        // Separator line
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, headerHeight - 5, pageWidth - margin, headerHeight - 5);
      };

      // Helper: Add footer
      const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 8;
        
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);

        if (reportConfig.customFooter) {
          pdf.text(reportConfig.customFooter, margin, footerY);
        }

        if (reportConfig.showPageNumbers) {
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
        }

        if (reportConfig.showTimestamp) {
          const timestamp = new Date().toLocaleString();
          pdf.text(timestamp, pageWidth - margin, footerY, { align: "right" });
        }

        if (reportConfig.confidentialityLevel !== "none") {
          pdf.setFontSize(6);
          if (reportConfig.confidentialityLevel === "confidential") {
            pdf.setTextColor(220, 38, 38);
          } else {
            pdf.setTextColor(148, 163, 184);
          }
          pdf.text(
            reportConfig.confidentialityLevel.toUpperCase(),
            pageWidth - margin,
            footerY - 3,
            { align: "right" }
          );
        }

        pdf.setTextColor(0, 0, 0);
      };

      // Helper: Check for new page
      const checkNewPage = (neededHeight: number): boolean => {
        if (yPosition + neededHeight > pageHeight - footerHeight) {
          currentPage++;
          pdf.addPage();
          addHeader(false);
          yPosition = headerHeight;
          return true;
        }
        return false;
      };

      // Helper: Add section title
      const addSectionTitle = (title: string) => {
        checkNewPage(15);
        
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text(title, margin, yPosition + 6);
        
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(margin, yPosition + 9, pageWidth - margin, yPosition + 9);
        
        yPosition += 14;
        pdf.setFont("helvetica", "normal");
      };

      // Helper: Capture widget with clean styling
      const captureWidget = async (elementId: string): Promise<HTMLCanvasElement | null> => {
        const element = document.querySelector(`[data-widget-id="${elementId}"]`) as HTMLElement;
        if (!element) return null;

        try {
          // Create a wrapper with white background
          const wrapper = document.createElement("div");
          wrapper.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          `;
          
          const clone = element.cloneNode(true) as HTMLElement;
          clone.style.background = "white";
          clone.style.color = "#1e293b";
          
          // Fix text colors in clone
          clone.querySelectorAll("*").forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            if (computed.color.includes("255, 255, 255") || computed.color === "rgb(255, 255, 255)") {
              htmlEl.style.color = "#1e293b";
            }
          });

          wrapper.appendChild(clone);
          document.body.appendChild(wrapper);

          const canvas = await html2canvas(wrapper, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
          });

          document.body.removeChild(wrapper);
          return canvas;
        } catch (error) {
          console.error("Widget capture error:", error);
          return null;
        }
      };

      // Start generating PDF
      addHeader(true);

      // Summary metrics section
      if (reportConfig.includeSummaryMetrics) {
        addSectionTitle("EXECUTIVE SUMMARY");
        
        const summaryEl = document.getElementById("summary-metrics-section");
        if (summaryEl) {
          try {
            const canvas = await html2canvas(summaryEl, {
              scale: 2,
              backgroundColor: "#ffffff",
              logging: false,
            });
            const imgHeight = (canvas.height * contentWidth) / canvas.width;
            
            if (checkNewPage(imgHeight + 5)) {
              // Page was added
            }
            
            pdf.addImage(
              canvas.toDataURL("image/png"),
              "PNG",
              margin,
              yPosition,
              contentWidth,
              Math.min(imgHeight, usableHeight - 20)
            );
            yPosition += imgHeight + 10;
          } catch (e) {
            console.warn("Summary capture error:", e);
          }
        }
      }

      // Capture enabled widgets
      const enabledWidgets = reportConfig.pdfWidgets?.filter((w) => w.enabled) || [];
      
      if (enabledWidgets.length > 0) {
        addSectionTitle("ANALYTICS & INSIGHTS");

        for (const widget of enabledWidgets) {
          const canvas = await captureWidget(widget.id);
          if (!canvas) continue;

          const imgWidth = contentWidth * 0.9;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          const maxHeight = usableHeight * 0.4;
          const finalHeight = Math.min(imgHeight, maxHeight);

          checkNewPage(finalHeight + 15);

          // Widget label
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(100, 116, 139);
          pdf.text(widget.label, margin, yPosition + 4);
          yPosition += 8;

          // Widget border
          pdf.setDrawColor(226, 232, 240);
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(margin, yPosition, contentWidth, finalHeight + 8, 2, 2, "FD");

          // Widget image
          pdf.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            margin + (contentWidth - imgWidth) / 2,
            yPosition + 4,
            imgWidth,
            finalHeight
          );

          yPosition += finalHeight + 16;
        }
      }

      // Issue table
      if (reportConfig.includeIssueTable && issues.length > 0) {
        addSectionTitle("DETAILED ISSUE LIST");
        
        const colWidths = [12, 75, 22, 30, 40];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const rowHeight = 6;
        
        // Table header
        const drawTableHeader = () => {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(margin, yPosition, tableWidth, rowHeight + 1, "F");
          
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(71, 85, 105);
          
          let xPos = margin + 2;
          const headers = ["#", "Title", "State", "Labels", "Repository"];
          headers.forEach((header, i) => {
            pdf.text(header, xPos, yPosition + 4.5);
            xPos += colWidths[i];
          });
          
          yPosition += rowHeight + 1;
        };

        drawTableHeader();

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);

        for (let i = 0; i < issues.length; i++) {
          const issue = issues[i];
          
          if (yPosition + rowHeight > pageHeight - footerHeight) {
            currentPage++;
            pdf.addPage();
            addHeader(false);
            yPosition = headerHeight;
            drawTableHeader();
          }

          // Alternating row background
          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, yPosition, tableWidth, rowHeight, "F");
          }

          let xPos = margin + 2;
          pdf.setTextColor(71, 85, 105);

          // Issue number
          pdf.text(`#${issue.number}`, xPos, yPosition + 4);
          xPos += colWidths[0];

          // Title (truncated)
          pdf.setTextColor(30, 41, 59);
          const maxTitleLen = 50;
          const title = issue.title.length > maxTitleLen 
            ? issue.title.substring(0, maxTitleLen) + "..." 
            : issue.title;
          pdf.text(title, xPos, yPosition + 4);
          xPos += colWidths[1];

          // State with color
          const state = issue.status || issue.state;
          const stateColors: Record<string, [number, number, number]> = {
            open: [34, 197, 94],
            in_progress: [234, 179, 8],
            closed: [148, 163, 184],
          };
          const stateColor = stateColors[state] || [148, 163, 184];
          pdf.setTextColor(stateColor[0], stateColor[1], stateColor[2]);
          pdf.text(state.replace("_", " "), xPos, yPosition + 4);
          xPos += colWidths[2];

          // Labels
          pdf.setTextColor(100, 116, 139);
          const labelsText = issue.labels.slice(0, 2).join(", ");
          pdf.text(labelsText.substring(0, 20) || "-", xPos, yPosition + 4);
          xPos += colWidths[3];

          // Repository
          pdf.setTextColor(71, 85, 105);
          const repoName = issue.repository.split("/").pop() || issue.repository;
          pdf.text(repoName.substring(0, 25), xPos, yPosition + 4);

          yPosition += rowHeight;
        }

        // Table border
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, headerHeight + 14, tableWidth, yPosition - headerHeight - 14);
      }

      // Add footers to all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      // Save
      const filename = `${reportConfig.projectName.replace(/\s+/g, "-")}-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
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