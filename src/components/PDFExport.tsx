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

// Widget sizing configuration - aspect ratios and relative sizes
const WIDGET_CONFIG: Record<string, { size: "small" | "medium" | "large" | "wide"; aspectRatio: number }> = {
  // Small widgets (4 per row) - simple stats/numbers
  repositoryFilter: { size: "small", aspectRatio: 1.2 },
  summaryMetrics: { size: "small", aspectRatio: 0.8 },
  
  // Medium widgets (2 per row) - charts with some detail
  smartInsights: { size: "medium", aspectRatio: 0.9 },
  progressBar: { size: "medium", aspectRatio: 0.6 },
  projectHealthGauge: { size: "medium", aspectRatio: 1.1 },
  bugCategoryBreakdown: { size: "medium", aspectRatio: 1.0 },
  bugSeverityHeatmap: { size: "medium", aspectRatio: 0.8 },
  averageResolutionTime: { size: "medium", aspectRatio: 0.7 },
  moduleStabilityScore: { size: "medium", aspectRatio: 0.8 },
  reopenedIssuesTracker: { size: "medium", aspectRatio: 0.7 },
  bugHotspots: { size: "medium", aspectRatio: 0.9 },
  atRiskRelease: { size: "medium", aspectRatio: 0.8 },
  agingIssues: { size: "medium", aspectRatio: 0.8 },
  criticalUntouched: { size: "medium", aspectRatio: 0.8 },
  repeatBugDetector: { size: "medium", aspectRatio: 0.8 },
  focusRecommendations: { size: "medium", aspectRatio: 0.9 },
  bulletChart: { size: "medium", aspectRatio: 0.6 },
  sparkline: { size: "medium", aspectRatio: 0.5 },
  
  // Large widgets (2 per row but taller) - detailed charts
  burndownChart: { size: "large", aspectRatio: 0.7 },
  flowEfficiency: { size: "large", aspectRatio: 0.8 },
  developerLoad: { size: "large", aspectRatio: 0.9 },
  moduleTreemap: { size: "large", aspectRatio: 0.8 },
  moduleRadarChart: { size: "large", aspectRatio: 1.0 },
  
  // Wide widgets (full width) - complex visualizations
  issueTrendChart: { size: "wide", aspectRatio: 0.4 },
  stackedAreaChart: { size: "wide", aspectRatio: 0.45 },
  bugHeatmap: { size: "wide", aspectRatio: 0.5 },
  backlogWaterfallChart: { size: "wide", aspectRatio: 0.45 },
  resolutionHistogram: { size: "wide", aspectRatio: 0.4 },
  priorityScatterPlot: { size: "wide", aspectRatio: 0.5 },
  issueFunnelChart: { size: "wide", aspectRatio: 0.5 },
  backlogGrowth: { size: "wide", aspectRatio: 0.45 },
  bugFixEfficiency: { size: "wide", aspectRatio: 0.45 },
};

export function PDFExport({ disabled, reportConfig, issues = [] }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      const headerHeight = 16;
      const footerHeight = 8;
      const gutter = 4; // Gap between widgets

      let currentPage = 1;
      let totalPages = 1;
      let yPosition = headerHeight + 4;

      // Helper: Add header
      const addHeader = (isFirstPage: boolean) => {
        pdf.setFillColor(252, 252, 253);
        pdf.rect(0, 0, pageWidth, headerHeight - 2, "F");
        
        if (reportConfig.companyLogo && isFirstPage) {
          try {
            pdf.addImage(reportConfig.companyLogo, "PNG", margin, 3, 10, 5);
          } catch (e) {
            console.warn("Logo error:", e);
          }
        }

        const textX = reportConfig.companyLogo && isFirstPage ? margin + 12 : margin;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text(reportConfig.reportTitle || "GitHub Issue Analytics Report", textX, 7);

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        const subtitle = [reportConfig.projectName, reportConfig.reportingPeriod].filter(Boolean).join(" • ");
        if (subtitle) pdf.text(subtitle, textX, 11);

        const today = new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        });
        pdf.text(today, pageWidth - margin, 7, { align: "right" });

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
        yPosition = headerHeight + 4;
      };

      // Helper: Check if content fits
      const fitsOnPage = (height: number): boolean => {
        return (yPosition + height + 2) <= (pageHeight - footerHeight - 4);
      };

      // Helper: Capture widget
      const captureWidget = async (widgetId: string, captureWidth: number): Promise<HTMLCanvasElement | null> => {
        const printContainer = document.getElementById("pdf-print-container");
        let element = printContainer?.querySelector(`[data-pdf-widget-id="${widgetId}"]`) as HTMLElement;
        
        if (!element) {
          element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement;
        }
        
        if (!element) return null;

        try {
          const container = document.createElement("div");
          container.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: ${captureWidth}px;
            background: #ffffff;
            padding: 8px;
            box-sizing: border-box;
          `;
          
          const clone = element.cloneNode(true) as HTMLElement;
          clone.style.cssText = `width: 100%; max-width: 100%; background: #ffffff; color: #1e293b;`;
          
          // Fix colors for print
          const fixColors = (el: HTMLElement) => {
            const computed = window.getComputedStyle(el);
            if (computed.color.includes("255, 255, 255") || computed.color.includes("248, 250, 252")) {
              el.style.color = "#1e293b";
            }
            if (computed.backgroundColor.includes("15, 23, 42") || computed.backgroundColor.includes("30, 41, 59")) {
              el.style.backgroundColor = "#ffffff";
            }
          };
          
          fixColors(clone);
          clone.querySelectorAll("*").forEach((child) => fixColors(child as HTMLElement));
          clone.querySelectorAll('[class*="card"]').forEach((card) => {
            (card as HTMLElement).style.backgroundColor = "#ffffff";
            (card as HTMLElement).style.borderColor = "#e2e8f0";
          });

          container.appendChild(clone);
          document.body.appendChild(container);
          await new Promise(resolve => setTimeout(resolve, 50));

          const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
            width: captureWidth,
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

      // Get enabled widgets
      const enabledWidgets = reportConfig.pdfWidgets?.filter((w) => w.enabled) || [];
      
      if (enabledWidgets.length > 0) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text("ANALYTICS OVERVIEW", margin, yPosition);
        yPosition += 5;

        // Group widgets by size for fluid layout
        const widgetsWithConfig = enabledWidgets.map(w => ({
          ...w,
          config: WIDGET_CONFIG[w.id] || { size: "medium", aspectRatio: 0.8 }
        }));

        // Process widgets in a flow layout
        let rowWidgets: typeof widgetsWithConfig = [];
        let rowWidth = 0;
        
        const flushRow = async () => {
          if (rowWidgets.length === 0) return;
          
          // Calculate actual widths for this row
          const totalUnits = rowWidgets.reduce((sum, w) => {
            if (w.config.size === "small") return sum + 1;
            if (w.config.size === "medium") return sum + 2;
            if (w.config.size === "large") return sum + 2;
            return sum + 4; // wide
          }, 0);
          
          const unitWidth = (contentWidth - (rowWidgets.length - 1) * gutter) / Math.min(totalUnits, 4);
          let xPosition = margin;
          let maxHeight = 0;
          
          // First pass: capture all and find max height
          const captures: { canvas: HTMLCanvasElement | null; width: number; height: number }[] = [];
          
          for (const widget of rowWidgets) {
            let widgetUnits = 2;
            if (widget.config.size === "small") widgetUnits = 1;
            else if (widget.config.size === "wide") widgetUnits = 4;
            
            const pdfWidth = Math.min(unitWidth * widgetUnits, contentWidth);
            const captureWidth = Math.round(pdfWidth * 8); // Scale for capture
            
            const canvas = await captureWidget(widget.id, captureWidth);
            let pdfHeight = pdfWidth * widget.config.aspectRatio;
            
            if (canvas) {
              // Use actual aspect ratio from captured canvas
              const actualRatio = canvas.height / canvas.width;
              pdfHeight = pdfWidth * actualRatio;
            }
            
            // Limit height
            pdfHeight = Math.min(pdfHeight, 80);
            maxHeight = Math.max(maxHeight, pdfHeight);
            
            captures.push({ canvas, width: pdfWidth, height: pdfHeight });
          }
          
          // Check if row fits
          if (!fitsOnPage(maxHeight + 8)) {
            startNewPage();
          }
          
          // Second pass: draw widgets
          for (let i = 0; i < rowWidgets.length; i++) {
            const widget = rowWidgets[i];
            const { canvas, width: pdfWidth, height: pdfHeight } = captures[i];
            
            // Draw label
            pdf.setFontSize(6);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(100, 116, 139);
            const label = widget.label.length > 25 ? widget.label.substring(0, 25) + "..." : widget.label;
            pdf.text(label, xPosition, yPosition + 2);
            
            // Draw card background
            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(xPosition, yPosition + 3, pdfWidth, pdfHeight, 1, 1, "FD");
            
            // Add image if captured
            if (canvas) {
              const imgData = canvas.toDataURL("image/png");
              pdf.addImage(imgData, "PNG", xPosition + 1, yPosition + 4, pdfWidth - 2, pdfHeight - 2);
            }
            
            xPosition += pdfWidth + gutter;
          }
          
          yPosition += maxHeight + 10;
          rowWidgets = [];
          rowWidth = 0;
        };

        // Process each widget
        for (const widget of widgetsWithConfig) {
          let widgetUnits = 2;
          if (widget.config.size === "small") widgetUnits = 1;
          else if (widget.config.size === "wide") widgetUnits = 4;
          else if (widget.config.size === "large") widgetUnits = 2;
          
          // Wide widgets always get their own row
          if (widget.config.size === "wide") {
            await flushRow();
            rowWidgets = [widget];
            rowWidth = 4;
            await flushRow();
          } else {
            // Check if widget fits in current row (max 4 units per row)
            if (rowWidth + widgetUnits > 4) {
              await flushRow();
            }
            rowWidgets.push(widget);
            rowWidth += widgetUnits;
          }
        }
        
        // Flush remaining widgets
        await flushRow();
      }

      // Issue table
      if (reportConfig.includeIssueTable && issues.length > 0) {
        if (yPosition > headerHeight + 40) {
          startNewPage();
        }

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text(`ISSUE LIST (${issues.length} total)`, margin, yPosition);
        yPosition += 5;
        
        const colWidths = [12, 75, 16, 28, 38];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const rowHeight = 5;
        
        const drawTableHeader = () => {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(margin, yPosition, tableWidth, rowHeight + 0.5, "F");
          
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(71, 85, 105);
          
          let xPos = margin + 1;
          ["#", "Title", "State", "Labels", "Repository"].forEach((header, i) => {
            pdf.text(header, xPos, yPosition + 3.5);
            xPos += colWidths[i];
          });
          
          yPosition += rowHeight + 0.5;
        };

        drawTableHeader();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(5.5);

        for (let i = 0; i < issues.length; i++) {
          const issue = issues[i];
          
          if (yPosition + rowHeight > pageHeight - footerHeight - 4) {
            startNewPage();
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(71, 85, 105);
            pdf.text("ISSUE LIST (continued)", margin, yPosition);
            yPosition += 5;
            drawTableHeader();
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(5.5);
          }

          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, yPosition, tableWidth, rowHeight, "F");
          }

          let xPos = margin + 1;
          pdf.setTextColor(71, 85, 105);

          pdf.text(`#${issue.number}`, xPos, yPosition + 3.2);
          xPos += colWidths[0];

          pdf.setTextColor(30, 41, 59);
          const title = issue.title.length > 50 ? issue.title.substring(0, 50) + "..." : issue.title;
          pdf.text(title, xPos, yPosition + 3.2);
          xPos += colWidths[1];

          const state = issue.status || issue.state || "open";
          const colors: Record<string, [number, number, number]> = {
            open: [34, 197, 94],
            in_progress: [234, 179, 8],
            closed: [148, 163, 184],
          };
          pdf.setTextColor(...(colors[state] || [148, 163, 184]));
          pdf.text(String(state).replace("_", " "), xPos, yPosition + 3.2);
          xPos += colWidths[2];

          pdf.setTextColor(100, 116, 139);
          const labels = issue.labels.slice(0, 2).map(l => typeof l === "string" ? l : l.name).join(", ");
          pdf.text(labels.substring(0, 20) || "-", xPos, yPosition + 3.2);
          xPos += colWidths[3];

          pdf.setTextColor(71, 85, 105);
          let repo = "-";
          if (typeof issue.repository === "string") {
            repo = issue.repository.split("/").pop() || issue.repository;
          } else if (issue.repositories) {
            repo = issue.repositories.name || issue.repositories.full_name;
          }
          pdf.text(repo.substring(0, 22), xPos, yPosition + 3.2);

          yPosition += rowHeight;
        }
      }

      // Add footers
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      // Save
      const filename = `${(reportConfig.projectName || "report").replace(/\s+/g, "-")}-${
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