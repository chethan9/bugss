import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PDFExportProps {
  disabled?: boolean;
}

export function PDFExport({ disabled }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true, // Enable PDF compression
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let currentPage = 1;

      // Helper function to capture and add section with optimized settings
      const captureSection = async (sectionId: string, sectionTitle: string) => {
        const element = document.getElementById(sectionId);
        if (!element) return;

        // Add section title
        if (currentPage > 1) {
          pdf.addPage();
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text(sectionTitle, margin, margin + 5);

        try {
          // Optimized html2canvas settings for smaller file size
          const canvas = await html2canvas(element, {
            scale: 1, // Reduced from 2 to 1 (50% reduction in resolution)
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: 1200, // Fixed width for consistency
            imageTimeout: 0,
            removeContainer: true,
            // Optimize for file size
            foreignObjectRendering: false,
            allowTaint: true,
          });

          // Convert canvas to compressed JPEG
          const imgData = canvas.toDataURL("image/jpeg", 0.7); // 70% quality JPEG
          
          // Calculate dimensions
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if image fits on current page
          const availableHeight = pageHeight - (margin + 15);
          
          if (imgHeight > availableHeight) {
            // Split into multiple pages if needed
            let remainingHeight = imgHeight;
            let sourceY = 0;
            
            while (remainingHeight > 0) {
              const heightToAdd = Math.min(availableHeight, remainingHeight);
              const sourceHeight = (heightToAdd / imgHeight) * canvas.height;
              
              // Create a temporary canvas for this slice
              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = canvas.width;
              tempCanvas.height = sourceHeight;
              const tempCtx = tempCanvas.getContext("2d");
              
              if (tempCtx) {
                tempCtx.drawImage(
                  canvas,
                  0, sourceY,
                  canvas.width, sourceHeight,
                  0, 0,
                  canvas.width, sourceHeight
                );
                
                const sliceData = tempCanvas.toDataURL("image/jpeg", 0.7);
                pdf.addImage(sliceData, "JPEG", margin, margin + 15, imgWidth, heightToAdd);
              }
              
              remainingHeight -= heightToAdd;
              sourceY += sourceHeight;
              
              if (remainingHeight > 0) {
                pdf.addPage();
                currentPage++;
              }
            }
          } else {
            // Fits on one page
            pdf.addImage(imgData, "JPEG", margin, margin + 15, imgWidth, imgHeight);
          }
          
          currentPage++;
        } catch (error) {
          console.error(`Error capturing section ${sectionId}:`, error);
        }
      };

      // Title page
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text("GitHub Issue Dashboard Report", pageWidth / 2, 40, { align: "center" });
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      pdf.text(`Generated: ${date}`, pageWidth / 2, 50, { align: "center" });

      // Capture sections
      const sections = [
        { id: "smart-insights-section", title: "Smart Insights" },
        { id: "summary-metrics-section", title: "Summary Metrics" },
        { id: "progress-bar-section", title: "Issue Progress" },
        { id: "analytics-widgets-section", title: "Analytics Widgets" },
        { id: "issue-table-section", title: "Issues List" },
      ];

      for (const section of sections) {
        await captureSection(section.id, section.title);
      }

      // Save with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      pdf.save(`github-dashboard-${timestamp}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDF}
      disabled={disabled || isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
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