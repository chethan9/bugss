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
      const margin = 8;
      const contentWidth = pageWidth - 2 * margin;
      const headerHeight = 12;
      const footerHeight = 6;
      
      // Grid settings: 3 columns, 3 rows = 9 widgets per page
      const cols = 3;
      const rows = 3;
      const gap = 4;
      const cellWidth = (contentWidth - (cols - 1) * gap) / cols;
      const availableHeight = pageHeight - headerHeight - footerHeight - margin * 2;
      const cellHeight = (availableHeight - (rows - 1) * gap) / rows;

      let currentPage = 1;
      let totalPages = 1;

      // Header
      const addHeader = () => {
        pdf.setFillColor(250, 250, 252);
        pdf.rect(0, 0, pageWidth, headerHeight, "F");
        
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text(reportConfig.reportTitle || "GitHub Issue Analytics Report", margin, 7);

        pdf.setFontSize(6);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        const subtitle = [reportConfig.projectName, reportConfig.reportingPeriod].filter(Boolean).join(" • ");
        if (subtitle) pdf.text(subtitle, margin, 10);

        const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        pdf.text(today, pageWidth - margin, 7, { align: "right" });
      };

      // Footer
      const addFooter = (pageNum: number, total: number) => {
        pdf.setFontSize(6);
        pdf.setTextColor(148, 163, 184);
        if (reportConfig.showPageNumbers !== false) {
          pdf.text(`Page ${pageNum} of ${total}`, pageWidth / 2, pageHeight - 3, { align: "center" });
        }
      };

      // Capture widget with compression
      const captureWidget = async (widgetId: string): Promise<string | null> => {
        const printContainer = document.getElementById("pdf-print-container");
        let element = printContainer?.querySelector(`[data-pdf-widget-id="${widgetId}"]`) as HTMLElement;
        if (!element) {
          element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement;
        }
        if (!element) return null;

        try {
          const container = document.createElement("div");
          container.style.cssText = `position:fixed;left:-9999px;top:0;width:280px;background:#fff;padding:6px;`;
          
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
          await new Promise(r => setTimeout(r, 50));

          // Check if widget is empty
          const text = clone.textContent || "";
          const hasCanvas = clone.querySelector("canvas, svg") !== null;
          const hasNumbers = /\d/.test(text);
          if (!hasCanvas && !hasNumbers && text.trim().length < 20) {
            document.body.removeChild(container);
            return null;
          }

          // Low resolution capture for smaller file size
          const canvas = await html2canvas(container, {
            scale: 1, // Lower scale = smaller file
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
            width: 280,
          });

          document.body.removeChild(container);
          
          // Convert to JPEG with compression (0.6 quality)
          return canvas.toDataURL("image/jpeg", 0.6);
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
        // Capture all widgets first
        const capturedWidgets: Array<{ id: string; label: string; imgData: string }> = [];
        
        for (const widget of enabledWidgets) {
          const imgData = await captureWidget(widget.id);
          if (imgData) {
            capturedWidgets.push({
              id: widget.id,
              label: widget.label || widget.id,
              imgData,
            });
          }
        }

        // Calculate pages needed (9 widgets per page)
        const widgetsPerPage = cols * rows;
        const widgetPages = Math.ceil(capturedWidgets.length / widgetsPerPage);
        totalPages = widgetPages + (reportConfig.includeIssueTable && issues.length > 0 ? Math.ceil(issues.length / 25) : 0);

        // Render widgets in grid
        let widgetIndex = 0;
        const yStart = headerHeight + 2;

        for (let page = 0; page < widgetPages; page++) {
          if (page > 0) {
            pdf.addPage();
            currentPage++;
            addHeader();
          }

          // Draw widgets in 3x3 grid
          for (let row = 0; row < rows && widgetIndex < capturedWidgets.length; row++) {
            for (let col = 0; col < cols && widgetIndex < capturedWidgets.length; col++) {
              const widget = capturedWidgets[widgetIndex];
              const x = margin + col * (cellWidth + gap);
              const y = yStart + row * (cellHeight + gap);

              // Label
              pdf.setFontSize(5);
              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(100, 116, 139);
              const label = widget.label.length > 25 ? widget.label.substring(0, 25) + "..." : widget.label;
              pdf.text(label, x, y + 3);

              // Card background
              pdf.setDrawColor(226, 232, 240);
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(x, y + 4, cellWidth, cellHeight - 5, 1, 1, "FD");

              // Image - fit within cell
              try {
                pdf.addImage(widget.imgData, "JPEG", x + 1, y + 5, cellWidth - 2, cellHeight - 7);
              } catch (e) {
                console.error("Failed to add image:", e);
              }

              widgetIndex++;
            }
          }
        }
      }

      // Issue table
      if (reportConfig.includeIssueTable && issues.length > 0) {
        pdf.addPage();
        currentPage++;
        addHeader();

        let yPosition = headerHeight + 2;

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(71, 85, 105);
        pdf.text(`ISSUE LIST (${issues.length} total)`, margin, yPosition);
        yPosition += 4;
        
        const colWidths = [10, 70, 14, 25, 35];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const rowHeight = 4;
        
        const drawTableHeader = () => {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(margin, yPosition, tableWidth, rowHeight + 0.5, "F");
          
          pdf.setFontSize(5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(71, 85, 105);
          
          let xPos = margin + 1;
          ["#", "Title", "State", "Labels", "Repository"].forEach((header, i) => {
            pdf.text(header, xPos, yPosition + 3);
            xPos += colWidths[i];
          });
          
          yPosition += rowHeight + 0.5;
        };

        drawTableHeader();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(5);

        for (let i = 0; i < issues.length; i++) {
          const issue = issues[i];
          
          if (yPosition + rowHeight > pageHeight - footerHeight - 3) {
            pdf.addPage();
            currentPage++;
            totalPages++;
            addHeader();
            yPosition = headerHeight + 2;
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(71, 85, 105);
            pdf.text("ISSUE LIST (continued)", margin, yPosition);
            yPosition += 4;
            drawTableHeader();
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(5);
          }

          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, yPosition, tableWidth, rowHeight, "F");
          }

          let xPos = margin + 1;
          pdf.setTextColor(71, 85, 105);

          pdf.text(`#${issue.number}`, xPos, yPosition + 2.8);
          xPos += colWidths[0];

          pdf.setTextColor(30, 41, 59);
          const title = issue.title.length > 45 ? issue.title.substring(0, 45) + "..." : issue.title;
          pdf.text(title, xPos, yPosition + 2.8);
          xPos += colWidths[1];

          const state = issue.status || issue.state || "open";
          const colors: Record<string, [number, number, number]> = {
            open: [34, 197, 94],
            in_progress: [234, 179, 8],
            closed: [148, 163, 184],
          };
          pdf.setTextColor(...(colors[state] || [148, 163, 184]));
          pdf.text(String(state).replace("_", " "), xPos, yPosition + 2.8);
          xPos += colWidths[2];

          pdf.setTextColor(100, 116, 139);
          const labels = issue.labels.slice(0, 2).map(l => typeof l === "string" ? l : l.name).join(", ");
          pdf.text(labels.substring(0, 18) || "-", xPos, yPosition + 2.8);
          xPos += colWidths[3];

          pdf.setTextColor(71, 85, 105);
          let repo = "-";
          if (typeof issue.repository === "string") {
            repo = issue.repository.split("/").pop() || issue.repository;
          } else if (issue.repositories) {
            repo = issue.repositories.name || issue.repositories.full_name;
          }
          pdf.text(repo.substring(0, 20), xPos, yPosition + 2.8);

          yPosition += rowHeight;
        }
      }

      // Add footers to all pages
      for (let i = 1; i <= currentPage; i++) {
        pdf.setPage(i);
        addFooter(i, currentPage);
      }

      // Save with compression
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