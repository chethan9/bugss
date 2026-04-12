import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ReportConfig } from "./ReportSettings";

interface Issue {
  id: string | number;
  number: number;
  title: string;
  state?: string;
  status?: "open" | "in_progress" | "closed";
  repository?: string;
  labels: Array<{ name: string; color?: string } | string>;
  assignee?: string;
  assignees?: Array<{ login: string }>;
  url?: string;
  html_url?: string;
  createdAt?: string;
  created_at?: string;
  closedAt?: string;
  closed_at?: string;
  repositories?: { full_name: string; name: string };
}

interface PDFExportProps {
  disabled?: boolean;
  reportConfig: ReportConfig;
  issues?: Issue[];
}

// Define widget sizes - which widgets need more space
const WIDE_WIDGETS = [
  "burndownChart",
  "flowEfficiency", 
  "issueTrendChart",
  "stackedAreaChart",
  "bugHeatmap",
  "moduleRadarChart",
  "priorityScatterPlot",
  "backlogWaterfallChart",
  "resolutionHistogram",
];

const MEDIUM_WIDGETS = [
  "projectHealthGauge",
  "bugCategoryBreakdown",
  "moduleTreemap",
  "issueFunnelChart",
  "bugSeverityHeatmap",
  "developerLoad",
  "focusRecommendations",
  "bulletChart",
];

// Small widgets that can fit in narrow columns
const SMALL_WIDGETS = [
  "smartInsights",
  "averageResolutionTime",
  "moduleStabilityScore",
  "reopenedIssuesTracker",
  "bugHotspots",
  "atRiskRelease",
  "agingIssues",
  "criticalUntouched",
  "backlogGrowth",
  "bugFixEfficiency",
  "repeatBugDetector",
  "sparkline",
  "repositoryFilter",
  "dateRangeFilter",
];

export function PDFExport({ disabled, reportConfig, issues = [] }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const getWidgetSize = (widgetId: string): "wide" | "medium" | "small" => {
    if (WIDE_WIDGETS.includes(widgetId)) return "wide";
    if (MEDIUM_WIDGETS.includes(widgetId)) return "medium";
    return "small";
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      const headerHeight = 20;
      const footerHeight = 8;

      let currentPage = 1;
      let totalPages = 1;
      let yPosition = headerHeight + 5;

      // Helper: Add header
      const addHeader = (isFirstPage: boolean) => {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(0, 0, pageWidth, headerHeight - 2, "F");
        
        if (reportConfig.companyLogo && isFirstPage) {
          try {
            pdf.addImage(reportConfig.companyLogo, "PNG", margin, 3, 14, 7);
          } catch (e) {
            console.warn("Logo error:", e);
          }
        }

        const textX = reportConfig.companyLogo && isFirstPage ? margin + 18 : margin;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text(reportConfig.reportTitle || "GitHub Issue Analytics Report", textX, 8);

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        const subtitle = [reportConfig.projectName, reportConfig.reportingPeriod].filter(Boolean).join(" • ");
        if (subtitle) pdf.text(subtitle, textX, 13);

        const today = new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        });
        pdf.text(today, pageWidth - margin, 8, { align: "right" });

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(margin, headerHeight - 2, pageWidth - margin, headerHeight - 2);
      };

      // Helper: Add footer
      const addFooter = (pageNum: number, total: number) => {
        const footerY = pageHeight - 4;
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        if (reportConfig.showPageNumbers !== false) {
          pdf.text(`Page ${pageNum} of ${total}`, pageWidth / 2, footerY, { align: "center" });
        }
      };

      // Helper: Start new page
      const startNewPage = () => {
        currentPage++;
        totalPages++;
        pdf.addPage();
        addHeader(false);
        yPosition = headerHeight + 5;
      };

      // Helper: Check if content fits on current page
      const fitsOnPage = (height: number): boolean => {
        return (yPosition + height + 5) <= (pageHeight - footerHeight - 5);
      };

      // Helper: Capture widget
      const captureWidget = async (widgetId: string, targetWidth: number): Promise<HTMLCanvasElement | null> => {
        const printContainer = document.getElementById("pdf-print-container");
        let element = printContainer?.querySelector(`[data-pdf-widget-id="${widgetId}"]`) as HTMLElement;
        
        if (!element) {
          element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement;
        }
        
        if (!element) {
          console.warn(`Widget not found: ${widgetId}`);
          return null;
        }

        try {
          const container = document.createElement("div");
          container.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: ${targetWidth}px;
            background: #ffffff;
            padding: 16px;
            box-sizing: border-box;
          `;
          
          const clone = element.cloneNode(true) as HTMLElement;
          clone.style.cssText = `
            width: 100%;
            max-width: 100%;
            background: #ffffff;
            color: #1e293b;
            overflow: visible;
          `;
          
          // Fix colors for print
          const fixColors = (el: HTMLElement) => {
            const computed = window.getComputedStyle(el);
            const color = computed.color;
            const bg = computed.backgroundColor;
            
            if (color.includes("255, 255, 255") || color.includes("248, 250, 252") || color.includes("226, 232, 240")) {
              el.style.color = "#1e293b";
            }
            if (bg.includes("15, 23, 42") || bg.includes("30, 41, 59") || bg.includes("51, 65, 85") || bg === "rgba(0, 0, 0, 0)") {
              el.style.backgroundColor = "#ffffff";
            }
            
            if (el.tagName === "svg" || el.closest("svg")) {
              if (computed.fill === "rgb(255, 255, 255)") el.style.fill = "#1e293b";
              if (computed.stroke === "rgb(255, 255, 255)") el.style.stroke = "#1e293b";
            }
          };
          
          fixColors(clone);
          clone.querySelectorAll("*").forEach((child) => fixColors(child as HTMLElement));
          
          clone.querySelectorAll('[class*="card"], [class*="Card"]').forEach((card) => {
            (card as HTMLElement).style.backgroundColor = "#ffffff";
            (card as HTMLElement).style.borderColor = "#e2e8f0";
          });

          container.appendChild(clone);
          document.body.appendChild(container);

          await new Promise(resolve => setTimeout(resolve, 150));

          const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
          });

          document.body.removeChild(container);
          return canvas;
        } catch (error) {
          console.error(`Widget capture error for ${widgetId}:`, error);
          return null;
        }
      };

      // Start PDF
      addHeader(true);

      // Capture and layout widgets
      const enabledWidgets = reportConfig.pdfWidgets?.filter((w) => w.enabled) || [];
      console.log(`Processing ${enabledWidgets.length} widgets...`);

      if (enabledWidgets.length > 0) {
        // Section title
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text("ANALYTICS OVERVIEW", margin, yPosition);
        yPosition += 8;

        // Group widgets by size for better layout
        const widgetGroups: Array<{ widget: typeof enabledWidgets[0]; size: "wide" | "medium" | "small" }> = 
          enabledWidgets.map(w => ({ widget: w, size: getWidgetSize(w.id) }));

        // Process widgets in a flowing 2-column layout
        let pendingSmallWidget: { canvas: HTMLCanvasElement; label: string; height: number } | null = null;
        const halfWidth = (contentWidth - 4) / 2;
        const pxToMm = 0.264583;

        for (const { widget, size } of widgetGroups) {
          // Determine render width based on widget size
          const renderWidthPx = size === "wide" ? 720 : size === "medium" ? 500 : 360;
          const canvas = await captureWidget(widget.id, renderWidthPx);
          
          if (!canvas) continue;

          // Calculate dimensions
          const aspectRatio = canvas.width / canvas.height;
          let pdfWidth: number;
          let pdfHeight: number;
          let xPos: number;

          if (size === "wide") {
            // Full width
            pdfWidth = contentWidth - 4;
            pdfHeight = Math.min(pdfWidth / aspectRatio, 85);
            xPos = margin + 2;

            // Flush any pending small widget first
            if (pendingSmallWidget) {
              if (!fitsOnPage(pendingSmallWidget.height + 10)) {
                startNewPage();
              }
              // Draw pending widget on left
              pdf.setFontSize(6);
              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(100, 116, 139);
              pdf.text(pendingSmallWidget.label.substring(0, 35), margin + 2, yPosition + 3);
              
              pdf.setDrawColor(226, 232, 240);
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(margin + 2, yPosition + 4, halfWidth - 2, pendingSmallWidget.height, 2, 2, "FD");
              pdf.addImage(pendingSmallWidget.canvas.toDataURL("image/png"), "PNG", margin + 3, yPosition + 5, halfWidth - 4, pendingSmallWidget.height - 2);
              
              yPosition += pendingSmallWidget.height + 12;
              pendingSmallWidget = null;
            }

            // Check page fit
            if (!fitsOnPage(pdfHeight + 10)) {
              startNewPage();
            }

            // Draw label
            pdf.setFontSize(6);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(100, 116, 139);
            pdf.text(widget.label.substring(0, 50), xPos, yPosition + 3);

            // Draw widget
            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(xPos, yPosition + 4, pdfWidth, pdfHeight, 2, 2, "FD");
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", xPos + 1, yPosition + 5, pdfWidth - 2, pdfHeight - 2);

            yPosition += pdfHeight + 12;

          } else if (size === "medium") {
            // Medium widgets - 60% width, centered or paired
            pdfWidth = contentWidth * 0.6;
            pdfHeight = Math.min(pdfWidth / aspectRatio, 70);
            xPos = margin + (contentWidth - pdfWidth) / 2;

            // Flush pending small widget
            if (pendingSmallWidget) {
              if (!fitsOnPage(pendingSmallWidget.height + 10)) {
                startNewPage();
              }
              pdf.setFontSize(6);
              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(100, 116, 139);
              pdf.text(pendingSmallWidget.label.substring(0, 35), margin + 2, yPosition + 3);
              
              pdf.setDrawColor(226, 232, 240);
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(margin + 2, yPosition + 4, halfWidth - 2, pendingSmallWidget.height, 2, 2, "FD");
              pdf.addImage(pendingSmallWidget.canvas.toDataURL("image/png"), "PNG", margin + 3, yPosition + 5, halfWidth - 4, pendingSmallWidget.height - 2);
              
              yPosition += pendingSmallWidget.height + 12;
              pendingSmallWidget = null;
            }

            if (!fitsOnPage(pdfHeight + 10)) {
              startNewPage();
            }

            pdf.setFontSize(6);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(100, 116, 139);
            pdf.text(widget.label.substring(0, 45), xPos, yPosition + 3);

            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(xPos, yPosition + 4, pdfWidth, pdfHeight, 2, 2, "FD");
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", xPos + 1, yPosition + 5, pdfWidth - 2, pdfHeight - 2);

            yPosition += pdfHeight + 12;

          } else {
            // Small widgets - pair them side by side
            pdfWidth = halfWidth - 2;
            pdfHeight = Math.min(pdfWidth / aspectRatio, 55);

            if (pendingSmallWidget) {
              // We have a pair - draw both side by side
              const maxHeight = Math.max(pendingSmallWidget.height, pdfHeight);
              
              if (!fitsOnPage(maxHeight + 10)) {
                startNewPage();
              }

              // Left widget (pending)
              pdf.setFontSize(6);
              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(100, 116, 139);
              pdf.text(pendingSmallWidget.label.substring(0, 28), margin + 2, yPosition + 3);
              
              pdf.setDrawColor(226, 232, 240);
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(margin + 2, yPosition + 4, halfWidth - 2, pendingSmallWidget.height, 2, 2, "FD");
              pdf.addImage(pendingSmallWidget.canvas.toDataURL("image/png"), "PNG", margin + 3, yPosition + 5, halfWidth - 4, pendingSmallWidget.height - 2);

              // Right widget (current)
              const rightX = margin + halfWidth + 2;
              pdf.text(widget.label.substring(0, 28), rightX, yPosition + 3);
              
              pdf.roundedRect(rightX, yPosition + 4, halfWidth - 2, pdfHeight, 2, 2, "FD");
              pdf.addImage(canvas.toDataURL("image/png"), "PNG", rightX + 1, yPosition + 5, halfWidth - 4, pdfHeight - 2);

              yPosition += maxHeight + 12;
              pendingSmallWidget = null;

            } else {
              // Save for pairing with next small widget
              pendingSmallWidget = {
                canvas,
                label: widget.label,
                height: pdfHeight,
              };
            }
          }
        }

        // Flush any remaining pending widget
        if (pendingSmallWidget) {
          if (!fitsOnPage(pendingSmallWidget.height + 10)) {
            startNewPage();
          }
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(100, 116, 139);
          pdf.text(pendingSmallWidget.label.substring(0, 35), margin + 2, yPosition + 3);
          
          pdf.setDrawColor(226, 232, 240);
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(margin + 2, yPosition + 4, halfWidth - 2, pendingSmallWidget.height, 2, 2, "FD");
          pdf.addImage(pendingSmallWidget.canvas.toDataURL("image/png"), "PNG", margin + 3, yPosition + 5, halfWidth - 4, pendingSmallWidget.height - 2);
          
          yPosition += pendingSmallWidget.height + 12;
        }
      }

      // Issue table on NEW PAGE
      if (reportConfig.includeIssueTable && issues.length > 0) {
        startNewPage();

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text(`ISSUE LIST (${issues.length} total)`, margin, yPosition);
        yPosition += 8;
        
        const colWidths = [12, 75, 18, 30, 42];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const rowHeight = 5.5;
        
        // Table header
        const drawTableHeader = () => {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(margin, yPosition, tableWidth, rowHeight + 1, "F");
          
          pdf.setFontSize(6.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(71, 85, 105);
          
          let xPos = margin + 2;
          const headers = ["#", "Title", "State", "Labels", "Repository"];
          headers.forEach((header, i) => {
            pdf.text(header, xPos, yPosition + 4);
            xPos += colWidths[i];
          });
          
          yPosition += rowHeight + 1;
        };

        drawTableHeader();

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);

        for (let i = 0; i < issues.length; i++) {
          const issue = issues[i];
          
          if (yPosition + rowHeight > pageHeight - footerHeight - 5) {
            startNewPage();
            
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(71, 85, 105);
            pdf.text("ISSUE LIST (continued)", margin, yPosition);
            yPosition += 8;
            
            drawTableHeader();
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(6);
          }

          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, yPosition, tableWidth, rowHeight, "F");
          }

          let xPos = margin + 2;
          pdf.setTextColor(71, 85, 105);

          pdf.text(`#${issue.number}`, xPos, yPosition + 3.5);
          xPos += colWidths[0];

          pdf.setTextColor(30, 41, 59);
          const maxTitleLen = 50;
          const title = issue.title.length > maxTitleLen 
            ? issue.title.substring(0, maxTitleLen) + "..." 
            : issue.title;
          pdf.text(title, xPos, yPosition + 3.5);
          xPos += colWidths[1];

          const state = issue.status || issue.state || "open";
          const stateColors: Record<string, [number, number, number]> = {
            open: [34, 197, 94],
            in_progress: [234, 179, 8],
            closed: [148, 163, 184],
          };
          const stateColor = stateColors[state] || [148, 163, 184];
          pdf.setTextColor(stateColor[0], stateColor[1], stateColor[2]);
          pdf.text(String(state).replace("_", " "), xPos, yPosition + 3.5);
          xPos += colWidths[2];

          pdf.setTextColor(100, 116, 139);
          const labelNames = issue.labels.slice(0, 2).map((l) => 
            typeof l === "string" ? l : l.name
          );
          const labelsText = labelNames.join(", ");
          pdf.text(labelsText.substring(0, 20) || "-", xPos, yPosition + 3.5);
          xPos += colWidths[3];

          pdf.setTextColor(71, 85, 105);
          let repoName = "-";
          if (typeof issue.repository === "string") {
            repoName = issue.repository.split("/").pop() || issue.repository;
          } else if (issue.repositories) {
            repoName = issue.repositories.name || issue.repositories.full_name;
          }
          pdf.text(repoName.substring(0, 28), xPos, yPosition + 3.5);

          yPosition += rowHeight;
        }
      }

      // Add footers to all pages
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      // Save PDF
      const filename = `${(reportConfig.projectName || "report").replace(/\s+/g, "-")}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(filename);
      
      console.log(`PDF generated: ${filename}, ${totalPages} pages`);
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