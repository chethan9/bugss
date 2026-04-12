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

// Widget column spans - how many columns each widget takes in a 3-column grid
const WIDGET_SPANS: Record<string, 1 | 2 | 3> = {
  // 1 column - small stat widgets
  repositoryFilter: 1,
  summaryMetrics: 1,
  sparkline: 1,
  
  // 2 columns - medium charts and gauges
  smartInsights: 2,
  progressBar: 2,
  projectHealthGauge: 2,
  bugCategoryBreakdown: 2,
  bugSeverityHeatmap: 2,
  averageResolutionTime: 1,
  moduleStabilityScore: 1,
  reopenedIssuesTracker: 1,
  bugHotspots: 2,
  atRiskRelease: 2,
  agingIssues: 2,
  criticalUntouched: 2,
  repeatBugDetector: 2,
  focusRecommendations: 2,
  bulletChart: 2,
  burndownChart: 2,
  flowEfficiency: 2,
  developerLoad: 2,
  moduleTreemap: 2,
  moduleRadarChart: 2,
  backlogGrowth: 2,
  bugFixEfficiency: 2,
  
  // 3 columns - full width charts
  issueTrendChart: 3,
  stackedAreaChart: 3,
  bugHeatmap: 3,
  backlogWaterfallChart: 3,
  resolutionHistogram: 3,
  priorityScatterPlot: 3,
  issueFunnelChart: 3,
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
      const headerHeight = 14;
      const footerHeight = 8;
      const gap = 3; // Gap between widgets
      const colWidth = (contentWidth - 2 * gap) / 3; // 3 column grid

      let currentPage = 1;
      let totalPages = 1;
      let yPosition = headerHeight + 2;

      // Header
      const addHeader = () => {
        pdf.setFillColor(252, 252, 253);
        pdf.rect(0, 0, pageWidth, headerHeight, "F");
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text(reportConfig.reportTitle || "GitHub Issue Analytics Report", margin, 7);

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        const subtitle = [reportConfig.projectName, reportConfig.reportingPeriod].filter(Boolean).join(" • ");
        if (subtitle) pdf.text(subtitle, margin, 11);

        const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        pdf.text(today, pageWidth - margin, 7, { align: "right" });

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(margin, headerHeight - 1, pageWidth - margin, headerHeight - 1);
      };

      // Footer
      const addFooter = (pageNum: number, total: number) => {
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        if (reportConfig.showPageNumbers !== false) {
          pdf.text(`Page ${pageNum} of ${total}`, pageWidth / 2, pageHeight - 4, { align: "center" });
        }
      };

      // New page
      const startNewPage = () => {
        currentPage++;
        totalPages++;
        pdf.addPage();
        addHeader();
        yPosition = headerHeight + 2;
      };

      // Check if fits
      const fitsOnPage = (height: number): boolean => {
        return (yPosition + height) <= (pageHeight - footerHeight - 2);
      };

      // Capture widget
      const captureWidget = async (widgetId: string, width: number): Promise<{ canvas: HTMLCanvasElement; isEmpty: boolean } | null> => {
        const printContainer = document.getElementById("pdf-print-container");
        let element = printContainer?.querySelector(`[data-pdf-widget-id="${widgetId}"]`) as HTMLElement;
        if (!element) {
          element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement;
        }
        if (!element) return null;

        try {
          const container = document.createElement("div");
          container.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;background:#fff;padding:8px;`;
          
          const clone = element.cloneNode(true) as HTMLElement;
          clone.style.cssText = "width:100%;max-width:100%;background:#fff;color:#1e293b;";
          
          // Fix colors for print
          const fixColors = (el: HTMLElement) => {
            const style = window.getComputedStyle(el);
            if (style.color.includes("255, 255, 255") || style.color.includes("248, 250, 252")) {
              el.style.color = "#1e293b";
            }
            if (style.backgroundColor.includes("15, 23, 42") || style.backgroundColor.includes("30, 41, 59")) {
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
          await new Promise(r => setTimeout(r, 100));

          // Check if widget is empty
          const text = clone.textContent || "";
          const hasCanvas = clone.querySelector("canvas, svg") !== null;
          const hasNumbers = /\d/.test(text);
          const isEmpty = !hasCanvas && !hasNumbers && text.trim().length < 20;

          const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
            width: width,
          });

          document.body.removeChild(container);
          return { canvas, isEmpty };
        } catch (error) {
          console.error(`Widget capture error for ${widgetId}:`, error);
          return null;
        }
      };

      // Start PDF
      addHeader();

      // Get enabled widgets
      const enabledWidgets = reportConfig.pdfWidgets?.filter((w) => w.enabled) || [];
      
      if (enabledWidgets.length > 0) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text("ANALYTICS OVERVIEW", margin, yPosition + 2);
        yPosition += 6;

        // Process widgets in rows
        let rowWidgets: Array<{ widget: typeof enabledWidgets[0]; span: number; capture: { canvas: HTMLCanvasElement; isEmpty: boolean } | null }> = [];
        let rowSpan = 0;

        const flushRow = async () => {
          if (rowWidgets.length === 0) return;

          // Filter out empty widgets
          const validWidgets = rowWidgets.filter(w => w.capture && !w.capture.isEmpty);
          if (validWidgets.length === 0) {
            rowWidgets = [];
            rowSpan = 0;
            return;
          }

          // Recalculate spans for valid widgets
          const totalSpan = validWidgets.reduce((sum, w) => sum + w.span, 0);
          
          // Find max height for this row
          let maxHeight = 0;
          const widgetData: Array<{ widget: typeof validWidgets[0]; pdfWidth: number; pdfHeight: number; xPos: number }> = [];
          let xPos = margin;

          for (const { widget, span, capture } of validWidgets) {
            if (!capture) continue;
            
            // Calculate width based on span (in a 3-column grid)
            const actualSpan = Math.min(span, 3);
            const pdfWidth = actualSpan * colWidth + (actualSpan - 1) * gap;
            
            // Calculate height from canvas aspect ratio
            const aspectRatio = capture.canvas.height / capture.canvas.width;
            let pdfHeight = pdfWidth * aspectRatio * 0.5; // Scale down
            pdfHeight = Math.min(pdfHeight, 70); // Max height
            pdfHeight = Math.max(pdfHeight, 25); // Min height
            
            maxHeight = Math.max(maxHeight, pdfHeight);
            widgetData.push({ widget: { widget: widget.widget, span, capture }, pdfWidth, pdfHeight, xPos });
            xPos += pdfWidth + gap;
          }

          // Check if row fits
          if (!fitsOnPage(maxHeight + 8)) {
            startNewPage();
          }

          // Draw widgets
          for (const { widget, pdfWidth, pdfHeight, xPos } of widgetData) {
            const { widget: w, capture } = widget;
            if (!capture) continue;

            // Label
            pdf.setFontSize(6);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(100, 116, 139);
            const label = w.widget.label.length > 30 ? w.widget.label.substring(0, 30) + "..." : w.widget.label;
            pdf.text(label, xPos, yPosition + 2);

            // Card background
            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(xPos, yPosition + 3, pdfWidth, pdfHeight, 1, 1, "FD");

            // Image
            const imgData = capture.canvas.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", xPos + 1, yPosition + 4, pdfWidth - 2, pdfHeight - 2);
          }

          yPosition += maxHeight + 10;
          rowWidgets = [];
          rowSpan = 0;
        };

        // Process each widget
        for (const widget of enabledWidgets) {
          const span = WIDGET_SPANS[widget.id] || 2;
          
          // Capture widget
          const captureWidth = span === 3 ? 680 : span === 2 ? 450 : 220;
          const capture = await captureWidget(widget.id, captureWidth);
          
          // Skip if capture failed
          if (!capture) continue;

          // Full width widgets get their own row
          if (span === 3) {
            await flushRow();
            rowWidgets = [{ widget, span, capture }];
            rowSpan = 3;
            await flushRow();
          } else {
            // Check if widget fits in current row
            if (rowSpan + span > 3) {
              await flushRow();
            }
            rowWidgets.push({ widget, span, capture });
            rowSpan += span;
          }
        }
        
        // Flush remaining
        await flushRow();
      }

      // Issue table
      if (reportConfig.includeIssueTable && issues.length > 0) {
        if (yPosition > headerHeight + 50) {
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