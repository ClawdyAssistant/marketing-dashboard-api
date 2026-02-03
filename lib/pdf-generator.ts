import puppeteer from 'puppeteer';
import { prisma } from './prisma';

interface ReportData {
  id: string;
  name: string;
  dateRange: {
    start: string;
    end: string;
  };
  campaigns: Array<{
    name: string;
    platform: string;
    metrics: {
      spend: number;
      revenue: number;
      roas: number;
      clicks: number;
      impressions: number;
      conversions: number;
    };
  }>;
  insights: any;
  totalMetrics: {
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
  };
}

/**
 * Generate HTML template for PDF report
 */
function generateReportHTML(data: ReportData): string {
  const insights = data.insights ? JSON.parse(data.insights) : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1f2937;
      padding: 40px;
      background: white;
    }
    
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    h1 {
      color: #111827;
      font-size: 32px;
      margin-bottom: 8px;
    }
    
    .date-range {
      color: #6b7280;
      font-size: 14px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
    
    .metric-label {
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #111827;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    h2 {
      font-size: 20px;
      margin-bottom: 16px;
      color: #111827;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th {
      background: #f3f4f6;
      text-align: left;
      padding: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .insights-box {
      background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .insights-box h3 {
      font-size: 16px;
      margin-bottom: 12px;
      color: #1e40af;
    }
    
    .insights-box p {
      line-height: 1.6;
      color: #1f2937;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.name}</h1>
    <div class="date-range">
      ${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Total Spend</div>
      <div class="metric-value">$${data.totalMetrics.spend.toLocaleString()}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Revenue</div>
      <div class="metric-value">$${data.totalMetrics.revenue.toLocaleString()}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">ROAS</div>
      <div class="metric-value">${data.totalMetrics.roas.toFixed(2)}x</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Conversions</div>
      <div class="metric-value">${data.totalMetrics.conversions.toLocaleString()}</div>
    </div>
  </div>

  ${insights ? `
  <div class="section">
    <h2>AI Insights</h2>
    <div class="insights-box">
      <h3>Summary</h3>
      <p>${insights.summary}</p>
    </div>
    
    ${insights.recommendations && insights.recommendations.length > 0 ? `
    <div class="insights-box">
      <h3>Key Recommendations</h3>
      <ul style="margin-left: 20px; line-height: 1.8;">
        ${insights.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="section">
    <h2>Campaign Performance</h2>
    <table>
      <thead>
        <tr>
          <th>Campaign</th>
          <th>Platform</th>
          <th>Spend</th>
          <th>Revenue</th>
          <th>ROAS</th>
          <th>Conversions</th>
        </tr>
      </thead>
      <tbody>
        ${data.campaigns.map(campaign => `
          <tr>
            <td>${campaign.name}</td>
            <td style="text-transform: capitalize;">${campaign.platform.replace('-', ' ')}</td>
            <td>$${campaign.metrics.spend.toLocaleString()}</td>
            <td>$${campaign.metrics.revenue.toLocaleString()}</td>
            <td>${campaign.metrics.roas.toFixed(2)}x</td>
            <td>${campaign.metrics.conversions}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleDateString()} | Marketing ROI Dashboard
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF report
 */
export async function generateReportPDF(reportId: string): Promise<Buffer> {
  // Fetch report and related data
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      user: {
        include: {
          integrations: {
            include: {
              campaigns: {
                include: {
                  metrics: {
                    where: {
                      date: {
                        gte: new Date((report as any).dateRange.start),
                        lte: new Date((report as any).dateRange.end),
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!report) {
    throw new Error('Report not found');
  }

  // Aggregate campaign data
  const campaigns: any[] = [];
  let totalSpend = 0;
  let totalRevenue = 0;
  let totalConversions = 0;

  report.user.integrations.forEach(integration => {
    integration.campaigns.forEach(campaign => {
      let spend = 0;
      let revenue = 0;
      let clicks = 0;
      let impressions = 0;
      let conversions = 0;

      campaign.metrics.forEach(metric => {
        spend += metric.spend;
        revenue += metric.revenue || 0;
        clicks += metric.clicks;
        impressions += metric.impressions;
        conversions += metric.conversions;
      });

      const roas = spend > 0 ? revenue / spend : 0;

      campaigns.push({
        name: campaign.name,
        platform: integration.platform,
        metrics: { spend, revenue, roas, clicks, impressions, conversions }
      });

      totalSpend += spend;
      totalRevenue += revenue;
      totalConversions += conversions;
    });
  });

  const reportData: ReportData = {
    id: report.id,
    name: report.name,
    dateRange: report.dateRange as any,
    campaigns,
    insights: report.insights,
    totalMetrics: {
      spend: totalSpend,
      revenue: totalRevenue,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      conversions: totalConversions,
    }
  };

  // Generate HTML
  const html = generateReportHTML(reportData);

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    printBackground: true,
  });

  await browser.close();

  return pdf;
}
