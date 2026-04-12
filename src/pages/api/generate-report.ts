import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
    responseLimit: false,
  },
  maxDuration: 60,
};

interface ReportRequest {
  reportName: string;
  reposForReport: string[];
  enabledWidgets: string[];
  includeHeader: boolean;
  includeSummary: boolean;
  issues: any[];
  selectedRepos: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let browser = null;

  try {
    const {
      reportName,
      issues,
      selectedRepos,
      enabledWidgets,
      includeHeader,
      includeSummary,
    }: ReportRequest = req.body;

    console.log("🚀 Starting Puppeteer PDF generation...");
    console.log(`📊 Issues: ${issues?.length}, Repos: ${selectedRepos?.length}, Widgets: ${enabledWidgets?.length}`);

    // Launch browser with bundled Chromium
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    });

    const page = await browser.newPage();

    // Build HTML content with widgets
    const html = generateReportHTML({
      reportName,
      issues,
      selectedRepos,
      enabledWidgets,
      includeHeader,
      includeSummary,
    });

    await page.setContent(html, { waitUntil: "networkidle0" });

    // Wait for charts to render
    await page.waitForTimeout(2000);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
    });

    await browser.close();
    browser = null;

    console.log(`✅ PDF generated: ${pdfBuffer.length} bytes`);

    // Return PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${reportName}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error("❌ PDF generation error:", error);
    if (browser) await browser.close();
    res.status(500).json({ 
      error: "Failed to generate PDF", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}

function generateReportHTML(params: {
  reportName: string;
  issues: any[];
  selectedRepos: string[];
  enabledWidgets: string[];
  includeHeader: boolean;
  includeSummary: boolean;
}): string {
  const { reportName, issues, selectedRepos, enabledWidgets, includeHeader, includeSummary } = params;

  // Calculate metrics
  const totalIssues = issues.length;
  const openIssues = issues.filter(i => i.status === "open").length;
  const closedIssues = issues.filter(i => i.status === "closed").length;
  const openPercent = totalIssues > 0 ? ((openIssues / totalIssues) * 100).toFixed(1) : "0";
  const closedPercent = totalIssues > 0 ? ((closedIssues / totalIssues) * 100).toFixed(1) : "0";

  // Get labels distribution
  const labelCounts: Record<string, number> = {};
  issues.forEach(issue => {
    (issue.labels || []).forEach((label: string) => {
      labelCounts[label] = (labelCounts[label] || 0) + 1;
    });
  });
  const topLabels = Object.entries(labelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Calculate resolution time for closed issues
  const closedWithTime = issues.filter(i => i.closed_at && i.created_at);
  let avgResolutionDays = 0;
  if (closedWithTime.length > 0) {
    const totalDays = closedWithTime.reduce((sum, i) => {
      const created = new Date(i.created_at).getTime();
      const closed = new Date(i.closed_at).getTime();
      return sum + (closed - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgResolutionDays = totalDays / closedWithTime.length;
  }

  // Issues by month
  const monthCounts: Record<string, { open: number; closed: number }> = {};
  issues.forEach(issue => {
    const date = new Date(issue.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthCounts[monthKey]) monthCounts[monthKey] = { open: 0, closed: 0 };
    if (issue.status === "open") monthCounts[monthKey].open++;
    else monthCounts[monthKey].closed++;
  });
  const recentMonths = Object.entries(monthCounts).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6).reverse();

  // Severity distribution
  const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  issues.forEach(issue => {
    const labels = (issue.labels || []).map((l: string) => l.toLowerCase());
    if (labels.some((l: string) => l.includes("critical"))) severityCounts.Critical++;
    else if (labels.some((l: string) => l.includes("high"))) severityCounts.High++;
    else if (labels.some((l: string) => l.includes("medium"))) severityCounts.Medium++;
    else if (labels.some((l: string) => l.includes("low"))) severityCounts.Low++;
  });

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      color: #1a1a2e;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      padding: 20px 0;
      border-bottom: 2px solid #3b82f6;
      margin-bottom: 20px;
    }
    .header h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 4px; }
    .header .subtitle { color: #64748b; font-size: 12px; }
    .header .date { color: #64748b; font-size: 11px; margin-top: 4px; }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .widget {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      page-break-inside: avoid;
    }
    .widget-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .widget-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .widget-subtitle {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    
    .metric-green { color: #10b981; }
    .metric-red { color: #ef4444; }
    .metric-blue { color: #3b82f6; }
    .metric-purple { color: #8b5cf6; }
    
    .bar-chart { margin-top: 8px; }
    .bar-row {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .bar-label {
      width: 80px;
      font-size: 10px;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bar-container {
      flex: 1;
      height: 14px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin: 0 8px;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 4px;
    }
    .bar-value {
      width: 30px;
      font-size: 10px;
      color: #1a1a2e;
      font-weight: 600;
      text-align: right;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }
    .status-item {
      text-align: center;
      padding: 8px;
      background: #fff;
      border-radius: 6px;
    }
    .status-value { font-size: 20px; font-weight: 700; }
    .status-label { font-size: 9px; color: #64748b; margin-top: 2px; }
    
    .summary-section {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .summary-title { font-size: 13px; font-weight: 600; color: #0369a1; margin-bottom: 10px; }
    .summary-text { font-size: 11px; color: #1a1a2e; line-height: 1.6; }
    
    .page-break { page-break-after: always; }
    
    .issues-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-top: 10px;
    }
    .issues-table th {
      background: #f1f5f9;
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
    }
    .issues-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    .issues-table tr:nth-child(even) { background: #fafafa; }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 600;
    }
    .badge-open { background: #dcfce7; color: #166534; }
    .badge-closed { background: #f1f5f9; color: #64748b; }
    .badge-critical { background: #fef2f2; color: #dc2626; }
    .badge-high { background: #fff7ed; color: #ea580c; }
    .badge-medium { background: #fefce8; color: #ca8a04; }
    .badge-low { background: #f0fdf4; color: #16a34a; }
  </style>
</head>
<body>
  ${includeHeader ? `
  <div class="header">
    <h1>${reportName}</h1>
    <div class="subtitle">GitHub Issue Analytics Report</div>
    <div class="date">Generated on ${dateStr} • ${selectedRepos.length} repositories • ${totalIssues} issues</div>
  </div>
  ` : ""}
  
  ${includeSummary ? `
  <div class="summary-section">
    <div class="summary-title">Executive Summary</div>
    <div class="summary-text">
      This report covers <strong>${totalIssues} issues</strong> across <strong>${selectedRepos.length} repositories</strong>.
      Currently, <strong>${openIssues} issues (${openPercent}%)</strong> are open and <strong>${closedIssues} issues (${closedPercent}%)</strong> are closed.
      ${avgResolutionDays > 0 ? `Average resolution time is <strong>${avgResolutionDays.toFixed(1)} days</strong>.` : ""}
      ${severityCounts.Critical > 0 ? `<span style="color:#dc2626">⚠️ ${severityCounts.Critical} critical issues require attention.</span>` : ""}
    </div>
  </div>
  ` : ""}
  
  <!-- Summary Metrics Row -->
  <div class="grid">
    <div class="widget">
      <div class="widget-title">Total Issues</div>
      <div class="widget-value metric-blue">${totalIssues}</div>
      <div class="widget-subtitle">Across ${selectedRepos.length} repositories</div>
    </div>
    
    <div class="widget">
      <div class="widget-title">Open Issues</div>
      <div class="widget-value metric-red">${openIssues}</div>
      <div class="widget-subtitle">${openPercent}% of total</div>
    </div>
    
    <div class="widget">
      <div class="widget-title">Closed Issues</div>
      <div class="widget-value metric-green">${closedIssues}</div>
      <div class="widget-subtitle">${closedPercent}% of total</div>
    </div>
  </div>
  
  <div class="grid">
    <div class="widget">
      <div class="widget-title">Avg Resolution Time</div>
      <div class="widget-value">${avgResolutionDays.toFixed(1)}</div>
      <div class="widget-subtitle">days to close</div>
    </div>
    
    <div class="widget">
      <div class="widget-title">Repositories</div>
      <div class="widget-value metric-purple">${selectedRepos.length}</div>
      <div class="widget-subtitle">connected repos</div>
    </div>
    
    <div class="widget">
      <div class="widget-title">Severity Distribution</div>
      <div class="status-grid">
        <div class="status-item">
          <div class="status-value metric-red">${severityCounts.Critical + severityCounts.High}</div>
          <div class="status-label">Critical/High</div>
        </div>
        <div class="status-item">
          <div class="status-value">${severityCounts.Medium + severityCounts.Low}</div>
          <div class="status-label">Medium/Low</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Labels Chart -->
  <div class="grid">
    <div class="widget" style="grid-column: span 2;">
      <div class="widget-title">Top Labels</div>
      <div class="bar-chart">
        ${topLabels.slice(0, 8).map(([label, count]) => `
          <div class="bar-row">
            <div class="bar-label">${label}</div>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${Math.min(100, (count / (topLabels[0]?.[1] || 1)) * 100)}%"></div>
            </div>
            <div class="bar-value">${count}</div>
          </div>
        `).join("")}
      </div>
    </div>
    
    <div class="widget">
      <div class="widget-title">Issue Trend</div>
      <div class="bar-chart">
        ${recentMonths.map(([month, counts]) => `
          <div class="bar-row">
            <div class="bar-label">${month}</div>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${Math.min(100, ((counts.open + counts.closed) / Math.max(...recentMonths.map(m => m[1].open + m[1].closed))) * 100)}%"></div>
            </div>
            <div class="bar-value">${counts.open + counts.closed}</div>
          </div>
        `).join("")}
      </div>
    </div>
  </div>
  
  <!-- Issues Table -->
  <div class="widget" style="margin-top: 15px;">
    <div class="widget-title">Recent Issues (Top 50)</div>
    <table class="issues-table">
      <thead>
        <tr>
          <th style="width:50px">#</th>
          <th>Title</th>
          <th style="width:70px">Status</th>
          <th style="width:70px">Severity</th>
          <th style="width:90px">Created</th>
        </tr>
      </thead>
      <tbody>
        ${issues.slice(0, 50).map(issue => {
          const labels = (issue.labels || []).map((l: string) => l.toLowerCase());
          let severity = "—";
          let severityClass = "";
          if (labels.some((l: string) => l.includes("critical"))) { severity = "Critical"; severityClass = "badge-critical"; }
          else if (labels.some((l: string) => l.includes("high"))) { severity = "High"; severityClass = "badge-high"; }
          else if (labels.some((l: string) => l.includes("medium"))) { severity = "Medium"; severityClass = "badge-medium"; }
          else if (labels.some((l: string) => l.includes("low"))) { severity = "Low"; severityClass = "badge-low"; }
          
          const created = new Date(issue.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          
          return `
            <tr>
              <td>#${issue.number}</td>
              <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${issue.title}</td>
              <td><span class="badge ${issue.status === "open" ? "badge-open" : "badge-closed"}">${issue.status}</span></td>
              <td>${severityClass ? `<span class="badge ${severityClass}">${severity}</span>` : severity}</td>
              <td>${created}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  </div>
  
</body>
</html>
  `;
}