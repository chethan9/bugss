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
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const headerHeight = 30;
      const footerHeight = 12;

      let currentPage = 1;
      let yPosition = headerHeight;

      // Helper: Add header
      const addHeader = (isFirstPage: boolean) => {
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
        pdf.text(reportConfig.reportTitle || "GitHub Issue Analytics Report", textX, 14);

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        const subtitle = [reportConfig.projectName, reportConfig.reportingPeriod].filter(Boolean).join(" • ");
        if (subtitle) pdf.text(subtitle, textX, 20);

        const today = new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
        });
        pdf.text(today, pageWidth - margin, 14, { align: "right" });
        
        if (reportConfig.companyName) {
          pdf.text(reportConfig.companyName, pageWidth - margin, 20, { align: "right" });
        }

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

        if (reportConfig.showPageNumbers !== false) {
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
        }

        if (reportConfig.showTimestamp !== false) {
          const timestamp = new Date().toLocaleString();
          pdf.text(timestamp, pageWidth - margin, footerY, { align: "right" });
        }
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

      // Helper: Capture widget with clean full-width styling
      const captureWidget = async (widgetId: string, widgetLabel: string): Promise<HTMLCanvasElement | null> => {
        const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement;
        if (!element) {
          console.warn(`Widget not found: ${widgetId}`);
          return null;
        }

        try {
          // Create a full-width container for clean capture
          const container = document.createElement("div");
          container.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 800px;
            background: #ffffff;
            padding: 24px;
            box-sizing: border-box;
          `;
          
          const clone = element.cloneNode(true) as HTMLElement;
          
          // Reset all styles for clean PDF rendering
          clone.style.cssText = `
            width: 100%;
            max-width: 100%;
            background: #ffffff;
            color: #1e293b;
            border-radius: 8px;
            overflow: visible;
          `;
          
          // Fix dark mode colors in clone
          const fixColors = (el: HTMLElement) => {
            const computed = window.getComputedStyle(el);
            
            // Fix text colors
            const color = computed.color;
            if (color.includes("255, 255, 255") || color === "rgb(255, 255, 255)" || 
                color.includes("248, 250, 252") || color.includes("226, 232, 240")) {
              el.style.color = "#1e293b";
            }
            
            // Fix backgrounds
            const bg = computed.backgroundColor;
            if (bg.includes("15, 23, 42") || bg.includes("30, 41, 59") || 
                bg.includes("51, 65, 85") || bg === "rgba(0, 0, 0, 0)") {
              el.style.backgroundColor = "#ffffff";
            }
            
            // Fix borders
            const borderColor = computed.borderColor;
            if (borderColor.includes("51, 65, 85") || borderColor.includes("71, 85, 105")) {
              el.style.borderColor = "#e2e8f0";
            }

            // Fix SVG fills and strokes
            if (el.tagName === "svg" || el.closest("svg")) {
              if (computed.fill === "rgb(255, 255, 255)" || computed.fill === "#fff") {
                el.style.fill = "#1e293b";
              }
              if (computed.stroke === "rgb(255, 255, 255)" || computed.stroke === "#fff") {
                el.style.stroke = "#1e293b";
              }
            }
          };
          
          // Apply color fixes recursively
          fixColors(clone);
          clone.querySelectorAll("*").forEach((child) => fixColors(child as HTMLElement));
          
          // Remove any Card dark backgrounds
          clone.querySelectorAll('[class*="card"], [class*="Card"]').forEach((card) => {
            (card as HTMLElement).style.backgroundColor = "#ffffff";
            (card as HTMLElement).style.borderColor = "#e2e8f0";
          });

          container.appendChild(clone);
          document.body.appendChild(container);

          // Wait for fonts and images to load
          await new Promise(resolve => setTimeout(resolve, 100));

          const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
            allowTaint: true,
          });

          document.body.removeChild(container);
          return canvas;
        } catch (error) {
          console.error(`Widget capture error for ${widgetId}:`, error);
          return null;
        }
      };

      // Start generating PDF
      addHeader(true);

      // Capture enabled widgets
      const enabledWidgets = reportConfig.pdfWidgets?.filter((w) => w.enabled) || [];
      
      if (enabledWidgets.length > 0) {
        addSectionTitle("ANALYTICS & INSIGHTS");

        for (const widget of enabledWidgets) {
          const canvas = await captureWidget(widget.id, widget.label);
          if (!canvas) continue;

          // Calculate dimensions to fit width
          const imgWidth = contentWidth;
          const aspectRatio = canvas.height / canvas.width;
          let imgHeight = imgWidth * aspectRatio;
          
          // Cap max height to 60% of usable page height
          const maxHeight = (pageHeight - headerHeight - footerHeight) * 0.6;
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
          }

          // Check if we need a new page
          if (yPosition + imgHeight + 20 > pageHeight - footerHeight) {
            currentPage++;
            pdf.addPage();
            addHeader(false);
            yPosition = headerHeight;
          }

          // Widget label
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(71, 85, 105);
          pdf.text(widget.label, margin, yPosition + 5);
          yPosition += 10;

          // Widget container with border
          pdf.setDrawColor(226, 232, 240);
          pdf.setFillColor(255, 255, 255);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(margin, yPosition, contentWidth, imgHeight + 8, 3, 3, "FD");

          // Widget image centered
          pdf.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            margin + 4,
            yPosition + 4,
            contentWidth - 8,
            imgHeight
          );

          yPosition += imgHeight + 20;
        }
      }

      // Issue table section
      if (reportConfig.includeIssueTable && issues.length > 0) {
        // Start table on new page if not enough space
        if (yPosition > pageHeight - footerHeight - 60) {
          currentPage++;
          pdf.addPage();
          addHeader(false);
          yPosition = headerHeight;
        }

        addSectionTitle(`DETAILED ISSUE LIST (${issues.length} issues)`);
        
        const colWidths = [14, 70, 20, 35, 40];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const rowHeight = 7;
        
        // Table header
        const drawTableHeader = () => {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(margin, yPosition, tableWidth, rowHeight + 2, "F");
          
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.2);
          pdf.rect(margin, yPosition, tableWidth, rowHeight + 2);
          
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(51, 65, 85);
          
          let xPos = margin + 3;
          const headers = ["#", "Title", "State", "Labels", "Repository"];
          headers.forEach((header, i) => {
            pdf.text(header, xPos, yPosition + 5.5);
            xPos += colWidths[i];
          });
          
          yPosition += rowHeight + 2;
        };

        drawTableHeader();

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);

        for (let i = 0; i < issues.length; i++) {
          const issue = issues[i];
          
          if (yPosition + rowHeight > pageHeight - footerHeight - 5) {
            currentPage++;
            pdf.addPage();
            addHeader(false);
            yPosition = headerHeight;
            drawTableHeader();
          }

          // Alternating row background
          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
          } else {
            pdf.setFillColor(255, 255, 255);
          }
          pdf.rect(margin, yPosition, tableWidth, rowHeight, "F");
          
          // Row border
          pdf.setDrawColor(241, 245, 249);
          pdf.setLineWidth(0.1);
          pdf.rect(margin, yPosition, tableWidth, rowHeight);

          let xPos = margin + 3;
          
          // Issue number
          pdf.setTextColor(100, 116, 139);
          pdf.text(`#${issue.number}`, xPos, yPosition + 4.5);
          xPos += colWidths[0];

          // Title (truncated)
          pdf.setTextColor(30, 41, 59);
          const maxTitleLen = 45;
          const title = issue.title.length > maxTitleLen 
            ? issue.title.substring(0, maxTitleLen) + "..." 
            : issue.title;
          pdf.text(title, xPos, yPosition + 4.5);
          xPos += colWidths[1];

          // State with color
          const state = issue.status || issue.state || "open";
          const stateColors: Record<string, [number, number, number]> = {
            open: [34, 197, 94],
            in_progress: [234, 179, 8],
            closed: [148, 163, 184],
          };
          const stateColor = stateColors[state] || [148, 163, 184];
          pdf.setTextColor(stateColor[0], stateColor[1], stateColor[2]);
          pdf.setFont("helvetica", "bold");
          pdf.text(String(state).replace("_", " "), xPos, yPosition + 4.5);
          pdf.setFont("helvetica", "normal");
          xPos += colWidths[2];

          // Labels
          pdf.setTextColor(100, 116, 139);
          const labelNames = issue.labels.slice(0, 2).map((l) => 
            typeof l === "string" ? l : l.name
          );
          const labelsText = labelNames.join(", ").substring(0, 22) || "-";
          pdf.text(labelsText, xPos, yPosition + 4.5);
          xPos += colWidths[3];

          // Repository
          pdf.setTextColor(71, 85, 105);
          let repoName = "-";
          if (typeof issue.repository === "string") {
            repoName = issue.repository.split("/").pop() || issue.repository;
          } else if (issue.repositories) {
            repoName = issue.repositories.name || issue.repositories.full_name;
          }
          pdf.text(repoName.substring(0, 25), xPos, yPosition + 4.5);

          yPosition += rowHeight;
        }

        // Table outer border
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
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