import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface PDFExportProps {
  disabled?: boolean;
}

export function PDFExport({ disabled }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let currentY = margin;

      // Add title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("GitHub Issue Dashboard Report", margin, currentY);
      
      currentY += 10;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, currentY);
      currentY += 15;

      // Sections to capture
      const sections = [
        { id: "smart-insights-section", title: "Smart Insights" },
        { id: "summary-metrics-section", title: "Summary Metrics" },
        { id: "progress-bar-section", title: "Issue Progress" },
        { id: "analytics-widgets-section", title: "Analytics Widgets" },
        { id: "issue-table-section", title: "Issues List" },
      ];

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const element = document.getElementById(section.id);

        if (!element) continue;

        // Capture section as image
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if we need a new page
        if (currentY + imgHeight > pageHeight - margin && i > 0) {
          pdf.addPage();
          currentY = margin;
        }

        // Add section title
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(section.title, margin, currentY);
        currentY += 8;

        // Add section image
        pdf.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;

        // Add page break if not last section
        if (i < sections.length - 1 && currentY > pageHeight - 50) {
          pdf.addPage();
          currentY = margin;
        }
      }

      // Save PDF
      const fileName = `github-dashboard-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDF}
      disabled={disabled || isExporting}
      className="gap-2"
    >
      {isExporting ? (
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