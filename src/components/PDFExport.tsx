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

      // Grid settings - 3 columns, 3 rows = 9 widgets per page
      const columns = 3;
      const rows = 3;
      const widgetsPerPage = columns * rows;
      const gap = 4;
      const colWidth = (contentWidth - (columns - 1) * gap) / columns;
      const rowHeight = (pageHeight - headerHeight - footerHeight - 15 - (rows - 1) * gap) / rows;
      const widgetHeight = Math.min(rowHeight - 6, 75); // Cap widget height

      let currentPage = 1;

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

      // Helper: Capture widget from hidden print container
      const captureWidget = async (widgetId: string): Promise<HTMLCanvasElement | null> => {
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
            width: 280px;
            background: #ffffff;
            padding: 6px;
            box-sizing: border-box;
          `;
          
          const clone = element.cloneNode(true) as HTMLElement;
          clone.style.cssText = `
            width: 100%;
            max-width: 100%;
            background: #ffffff;
            color: #1e293b;
            overflow: hidden;
            font-size: 10px;
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

          await new Promise(resolve => setTimeout(resolve, 100));

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
      let yPosition = headerHeight;

      // Capture all enabled widgets
      const enabledWidgets = reportConfig.pdfWidgets?.filter((w) => w.enabled) || [];
      console.log(`Capturing ${enabledWidgets.length} enabled widgets...`);
      
      const widgetCanvases: { canvas: HTMLCanvasElement; label: string }[] = [];
      
      for (const widget of enabledWidgets) {
        const canvas = await captureWidget(widget.id);
        if (canvas) {
          widgetCanvases.push({ canvas, label: widget.label });
          console.log(`Captured: ${widget.label}`);
        }
      }

      console.log(`Successfully captured ${widgetCanvases.length} widgets`);

      if (widgetCanvases.length > 0) {
        // Section title
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text("ANALYTICS WIDGETS", margin, yPosition + 4);
        yPosition += 8;

        // Render widgets in 3x3 grid (9 per page)
        let widgetIndex = 0;
        
        while (widgetIndex < widgetCanvases.length) {
          // Check if we need a new page
          if (widgetIndex > 0 && widgetIndex % widgetsPerPage === 0) {
            currentPage++;
            pdf.addPage();
            addHeader(false);
            yPosition = headerHeight;
            
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(71, 85, 105);
            pdf.text("ANALYTICS WIDGETS (continued)", margin, yPosition + 4);
            yPosition += 8;
          }

          // Calculate how many widgets to render on this page
          const startIdx = widgetIndex;
          const endIdx = Math.min(widgetIndex + widgetsPerPage, widgetCanvases.length);
          const pageWidgetCount = endIdx - startIdx;

          // Render widgets for this page
          for (let i = 0; i < pageWidgetCount; i++) {
            const { canvas, label } = widgetCanvases[startIdx + i];
            const row = Math.floor(i / columns);
            const col = i % columns;
            
            const xPos = margin + col * (colWidth + gap);
            const yPos = yPosition + row * (widgetHeight + gap + 8);
            
            // Widget label
            pdf.setFontSize(6);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(100, 116, 139);
            const truncatedLabel = label.length > 25 ? label.substring(0, 23) + "..." : label;
            pdf.text(truncatedLabel, xPos, yPos + 3);
            
            // Widget border/background
            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(255, 255, 255);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(xPos, yPos + 4, colWidth, widgetHeight, 2, 2, "FD");
            
            // Widget image - fit proportionally
            const imgWidth = colWidth - 4;
            const imgHeight = widgetHeight - 4;
            
            // Calculate aspect ratio to fit image
            const canvasRatio = canvas.width / canvas.height;
            const cellRatio = imgWidth / imgHeight;
            
            let drawWidth = imgWidth;
            let drawHeight = imgHeight;
            let offsetX = 0;
            let offsetY = 0;
            
            if (canvasRatio > cellRatio) {
              // Image is wider - fit to width
              drawHeight = imgWidth / canvasRatio;
              offsetY = (imgHeight - drawHeight) / 2;
            } else {
              // Image is taller - fit to height
              drawWidth = imgHeight * canvasRatio;
              offsetX = (imgWidth - drawWidth) / 2;
            }
            
            pdf.addImage(
              canvas.toDataURL("image/png"),
              "PNG",
              xPos + 2 + offsetX,
              yPos + 6 + offsetY,
              drawWidth,
              drawHeight
            );
          }

          widgetIndex = endIdx;
        }
      }

      // ALWAYS start issue table on a new page
      if (reportConfig.includeIssueTable && issues.length > 0) {
        currentPage++;
        pdf.addPage();
        addHeader(false);
        yPosition = headerHeight;

        // Section title
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text(`ISSUE LIST (${issues.length} total)`, margin, yPosition + 4);
        yPosition += 10;
        
        const colWidths = [14, 72, 20, 32, 40];
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
          
          if (yPosition + rowHeight > pageHeight - footerHeight - 5) {
            currentPage++;
            pdf.addPage();
            addHeader(false);
            yPosition = headerHeight;
            
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(71, 85, 105);
            pdf.text("ISSUE LIST (continued)", margin, yPosition + 4);
            yPosition += 10;
            
            drawTableHeader();
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(6.5);
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

          // Title
          pdf.setTextColor(30, 41, 59);
          const maxTitleLen = 48;
          const title = issue.title.length > maxTitleLen 
            ? issue.title.substring(0, maxTitleLen) + "..." 
            : issue.title;
          pdf.text(title, xPos, yPosition + 4);
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
          pdf.text(String(state).replace("_", " "), xPos, yPosition + 4);
          xPos += colWidths[2];

          // Labels
          pdf.setTextColor(100, 116, 139);
          const labelNames = issue.labels.slice(0, 2).map((l) => 
            typeof l === "string" ? l : l.name
          );
          const labelsText = labelNames.join(", ");
          pdf.text(labelsText.substring(0, 22) || "-", xPos, yPosition + 4);
          xPos += colWidths[3];

          // Repository
          pdf.setTextColor(71, 85, 105);
          let repoName = "-";
          if (typeof issue.repository === "string") {
            repoName = issue.repository.split("/").pop() || issue.repository;
          } else if (issue.repositories) {
            repoName = issue.repositories.name || issue.repositories.full_name;
          }
          pdf.text(repoName.substring(0, 25), xPos, yPosition + 4);

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