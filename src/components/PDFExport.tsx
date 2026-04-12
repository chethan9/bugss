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
      const headerHeight = 25;
      const footerHeight = 10;
      const usableHeight = pageHeight - headerHeight - footerHeight;

      // Grid settings - 3 columns
      const columns = 3;
      const gap = 4;
      const colWidth = (contentWidth - (columns - 1) * gap) / columns;

      let currentPage = 1;
      let yPosition = headerHeight;
      let colIndex = 0;

      // Helper: Add header
      const addHeader = (isFirstPage: boolean) => {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(0, 0, pageWidth, headerHeight - 2, "F");
        
        if (reportConfig.companyLogo && isFirstPage) {
          try {
            pdf.addImage(reportConfig.companyLogo, "PNG", margin, 5, 18, 9);
          } catch (e) {
            console.warn("Logo error:", e);
          }
        }

        const textX = reportConfig.companyLogo && isFirstPage ? margin + 22 : margin;
        
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text(reportConfig.reportTitle || "GitHub Issue Analytics Report", textX, 10);

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        const subtitle = [reportConfig.projectName, reportConfig.reportingPeriod].filter(Boolean).join(" • ");
        if (subtitle) pdf.text(subtitle, textX, 15);

        const today = new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        });
        pdf.text(today, pageWidth - margin, 10, { align: "right" });

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(margin, headerHeight - 2, pageWidth - margin, headerHeight - 2);
      };

      // Helper: Add footer
      const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 5;
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);

        if (reportConfig.showPageNumbers !== false) {
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
        }
      };

      // Helper: Start new page
      const newPage = () => {
        currentPage++;
        pdf.addPage();
        addHeader(false);
        yPosition = headerHeight;
        colIndex = 0;
      };

      // Helper: Capture widget with clean styling
      const captureWidget = async (widgetId: string): Promise<HTMLCanvasElement | null> => {
        const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement;
        if (!element) return null;

        try {
          const container = document.createElement("div");
          container.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 320px;
            background: #ffffff;
            padding: 12px;
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
          
          // Fix dark mode colors
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
            
            // Fix SVG
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

          await new Promise(resolve => setTimeout(resolve, 50));

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

      // Capture and render widgets in 3-column grid
      const enabledWidgets = reportConfig.pdfWidgets?.filter((w) => w.enabled) || [];
      
      if (enabledWidgets.length > 0) {
        // Section title
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text("ANALYTICS WIDGETS", margin, yPosition + 4);
        yPosition += 8;

        const widgetCanvases: { canvas: HTMLCanvasElement; label: string }[] = [];
        
        for (const widget of enabledWidgets) {
          const canvas = await captureWidget(widget.id);
          if (canvas) {
            widgetCanvases.push({ canvas, label: widget.label });
          }
        }

        // Calculate row heights and render widgets
        let rowWidgets: { canvas: HTMLCanvasElement; label: string; height: number }[] = [];
        
        for (let i = 0; i < widgetCanvases.length; i++) {
          const { canvas, label } = widgetCanvases[i];
          const aspectRatio = canvas.height / canvas.width;
          const widgetHeight = Math.min(colWidth * aspectRatio, 50); // Cap height at 50mm
          
          rowWidgets.push({ canvas, label, height: widgetHeight });
          
          // When we have 3 widgets or it's the last widget, render the row
          if (rowWidgets.length === columns || i === widgetCanvases.length - 1) {
            const rowHeight = Math.max(...rowWidgets.map(w => w.height)) + 6; // +6 for label
            
            // Check if row fits on current page
            if (yPosition + rowHeight > pageHeight - footerHeight) {
              newPage();
            }
            
            // Render row
            rowWidgets.forEach((widget, idx) => {
              const xPos = margin + idx * (colWidth + gap);
              
              // Widget label
              pdf.setFontSize(6);
              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(100, 116, 139);
              const truncatedLabel = widget.label.length > 20 ? widget.label.substring(0, 18) + "..." : widget.label;
              pdf.text(truncatedLabel, xPos, yPosition + 3);
              
              // Widget border
              pdf.setDrawColor(226, 232, 240);
              pdf.setFillColor(255, 255, 255);
              pdf.setLineWidth(0.2);
              pdf.roundedRect(xPos, yPosition + 4, colWidth, widget.height, 1, 1, "FD");
              
              // Widget image
              pdf.addImage(
                widget.canvas.toDataURL("image/png"),
                "PNG",
                xPos + 1,
                yPosition + 5,
                colWidth - 2,
                widget.height - 2
              );
            });
            
            yPosition += rowHeight + 4;
            rowWidgets = [];
          }
        }
      }

      // Issue table
      if (reportConfig.includeIssueTable && issues.length > 0) {
        // Start on new page if less than 40mm remaining
        if (yPosition > pageHeight - footerHeight - 40) {
          newPage();
        }

        // Section title
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text(`ISSUE LIST (${issues.length} total)`, margin, yPosition + 4);
        yPosition += 8;
        
        const colWidths = [12, 80, 18, 35, 35];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const rowHeight = 5;
        
        // Table header
        const drawTableHeader = () => {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(margin, yPosition, tableWidth, rowHeight + 1, "F");
          
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(71, 85, 105);
          
          let xPos = margin + 2;
          const headers = ["#", "Title", "State", "Labels", "Repository"];
          headers.forEach((header, idx) => {
            pdf.text(header, xPos, yPosition + 3.5);
            xPos += colWidths[idx];
          });
          
          yPosition += rowHeight + 1;
        };

        drawTableHeader();

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(5.5);

        for (let i = 0; i < issues.length; i++) {
          const issue = issues[i];
          
          if (yPosition + rowHeight > pageHeight - footerHeight) {
            newPage();
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(71, 85, 105);
            pdf.text("ISSUE LIST (continued)", margin, yPosition + 4);
            yPosition += 8;
            drawTableHeader();
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(5.5);
          }

          // Alternating row background
          if (i % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition, tableWidth, rowHeight, "F");
          }

          let xPos = margin + 2;

          // Issue number
          pdf.setTextColor(100, 116, 139);
          pdf.text(`#${issue.number}`, xPos, yPosition + 3.2);
          xPos += colWidths[0];

          // Title
          pdf.setTextColor(30, 41, 59);
          const title = issue.title.length > 55 ? issue.title.substring(0, 52) + "..." : issue.title;
          pdf.text(title, xPos, yPosition + 3.2);
          xPos += colWidths[1];

          // State
          const state = issue.status || issue.state || "open";
          const stateColors: Record<string, [number, number, number]> = {
            open: [34, 197, 94],
            in_progress: [234, 179, 8],
            closed: [148, 163, 184],
          };
          const stateColor = stateColors[state] || [148, 163, 184];
          pdf.setTextColor(stateColor[0], stateColor[1], stateColor[2]);
          pdf.text(String(state).replace("_", " "), xPos, yPosition + 3.2);
          xPos += colWidths[2];

          // Labels
          pdf.setTextColor(100, 116, 139);
          const labelNames = issue.labels.slice(0, 2).map((l) => 
            typeof l === "string" ? l : l.name
          );
          pdf.text(labelNames.join(", ").substring(0, 22) || "-", xPos, yPosition + 3.2);
          xPos += colWidths[3];

          // Repository
          pdf.setTextColor(71, 85, 105);
          let repoName = "-";
          if (typeof issue.repository === "string") {
            repoName = issue.repository.split("/").pop() || issue.repository;
          } else if (issue.repositories) {
            repoName = issue.repositories.name || issue.repositories.full_name;
          }
          pdf.text(repoName.substring(0, 22), xPos, yPosition + 3.2);

          yPosition += rowHeight;
        }
      }

      // Add footers to all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      // Save PDF
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