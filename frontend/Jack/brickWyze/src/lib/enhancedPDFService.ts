// src/lib/enhancedPDFService.ts - Beautiful design + Multipage support + Charts + Clickable links
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis, BusinessInsight } from '../types/AIAnalysisTypes';
import { generateLoopNetUrl } from '../components/features/search/TractDetailPanel/LoopNetIntegration';
import { generateStreetViewUrlSync } from '../components/features/search/TractDetailPanel/GoogleMapsImage';

interface ExportOptions {
  tract: TractResult;
  weights: Weight[];
  aiAnalysis?: AIBusinessAnalysis | null | undefined;
  includeCharts?: boolean;
  includeStreetView?: boolean;
  filename?: string;
}

interface ChartConfig {
  selector: string;
  title: string;
  description: string;
  category: string;
}

export class EnhancedPDFService {
  
  // 🚀 Chart configurations for capture
  private readonly chartConfigs: ChartConfig[] = [
    {
      selector: '[data-chart="demographic-overview"]',
      title: 'Demographic Overview',
      description: 'Complete demographic breakdown including ethnicity, age, gender, and income distributions',
      category: 'Demographics'
    },
    {
      selector: '[data-chart="ethnicity-distribution"]',
      title: 'Ethnicity Distribution',
      description: 'Population ethnicity breakdown with target market alignment analysis',
      category: 'Demographics'
    },
    {
      selector: '[data-chart="age-gender-distribution"]',
      title: 'Age & Gender Distribution',
      description: 'Age and gender demographics showing target market fit percentages',
      category: 'Demographics'
    },
    {
      selector: '[data-chart="income-distribution"]',
      title: 'Income Distribution',
      description: 'Household income levels and target economic alignment analysis',
      category: 'Demographics'
    },
    {
      selector: '[data-chart="foot-traffic-timeline"]',
      title: 'Foot Traffic Trends',
      description: 'Historical and projected pedestrian activity patterns over time',
      category: 'Traffic Analysis'
    },
    {
      selector: '[data-chart="foot-traffic-periods"]',
      title: 'Foot Traffic by Time Period',
      description: 'Daily foot traffic patterns broken down by morning, afternoon, and evening',
      category: 'Traffic Analysis'
    },
    {
      selector: '[data-chart="crime-trend"]',
      title: 'Safety Score Trends',
      description: 'Historical safety trends and future projections for the area',
      category: 'Safety Analysis'
    },
    {
      selector: '[data-chart="trend-indicators"]',
      title: 'Key Performance Indicators',
      description: 'Summary of all key metrics with trend sparklines and performance indicators',
      category: 'Overview'
    }
  ];

  // 🎨 Beautiful HTML template generation with multipage support + Charts
  private generateHTMLReport(options: ExportOptions, streetViewUrl: string, loopNetUrl: string, chartImages: { [key: string]: string } = {}): string {
    const { tract, weights, aiAnalysis, includeCharts = true } = options;
    
    console.log('🔍 [HTML Template] AI Analysis status:', {
      hasAI: !!aiAnalysis,
      type: typeof aiAnalysis,
      isObject: aiAnalysis !== null && typeof aiAnalysis === 'object'
    });

    const score = Math.round(tract.custom_score || 0);
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Score color function
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#10b981'; // Green
      if (score >= 60) return '#3b82f6'; // Blue
      if (score >= 40) return '#f59e0b'; // Orange
      return '#ef4444'; // Red
    };

    // Generate charts section HTML
    const generateChartsHTML = () => {
      if (!includeCharts) return '';

      const chartsByCategory = this.groupChartsByCategory(chartImages);
      if (Object.keys(chartsByCategory).length === 0) {
        return `
          <div class="section page-break">
            <h2 class="section-title">
              <span class="section-icon">📊</span>
              Data Visualizations
            </h2>
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-style: italic;">No charts are currently available to display.</p>
              <p style="color: #6b7280; font-size: 0.9rem; margin-top: 8px;">Charts will appear when demographic filters are applied in the interface.</p>
            </div>
          </div>
        `;
      }

      let chartsHTML = `
        <div class="section page-break">
          <h2 class="section-title">
            <span class="section-icon">📊</span>
            Data Visualizations
          </h2>
          <p style="color: #6b7280; margin-bottom: 30px;">Key metrics and trends visualization from the web interface</p>
      `;

      Object.entries(chartsByCategory).forEach(([category, charts]) => {
        chartsHTML += `
          <div class="chart-category">
            <h3 style="color: #1e40af; font-size: 1.25rem; font-weight: 600; margin: 30px 0 20px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
              ${category}
            </h3>
        `;

        charts.forEach(({ config, imageData }) => {
          chartsHTML += `
            <div class="chart-item" style="margin-bottom: 40px; page-break-inside: avoid;">
              <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h4 style="color: #374151; font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">${config.title}</h4>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 16px;">${config.description}</p>
                <div style="text-align: center;">
                  <img src="${imageData}" style="max-width: 100%; height: auto; border-radius: 8px;" alt="${config.title}" />
                </div>
              </div>
            </div>
          `;
        });

        chartsHTML += `</div>`;
      });

      chartsHTML += `</div>`;
      return chartsHTML;
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Location Intelligence Report - ${tract.nta_name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 40px;
        }
        
        .report-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          color: white;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.1;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header .subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 20px;
        }
        
        .header .date {
          font-size: 0.95rem;
          opacity: 0.8;
        }

        .content {
          padding: 40px;
          padding-top: 60px;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .section-icon {
          font-size: 1.5rem;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .metric-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .metric-value {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 4px;
        }
        
        .metric-label {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .executive-summary {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b;
          border-radius: 0 8px 8px 0;
          padding: 24px;
          margin-bottom: 30px;
        }
        
        .ai-section {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          padding: 30px;
          border: 1px solid #93c5fd;
          position: relative;
          overflow: hidden;
        }
        
        .ai-section::before {
          content: '🤖';
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 2rem;
          opacity: 0.3;
        }
        
        .ai-headline {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 16px;
          line-height: 1.3;
        }
        
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin: 20px 0;
        }
        
        .insight-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #3b82f6;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .insight-card.strength { border-left-color: #22c55e; }
        .insight-card.opportunity { border-left-color: #f59e0b; }
        .insight-card.consideration { border-left-color: #ef4444; }
        
        .insight-title {
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .business-types {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }
        
        .business-type {
          background: #3b82f6;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .bottom-line {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
          font-weight: 600;
          color: #0c4a6e;
        }
        
        .weights-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .weights-table th {
          background: #1e40af;
          color: white;
          padding: 16px;
          text-align: left;
          font-weight: 600;
        }
        
        .weights-table td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
        }
        
        .weights-table tbody tr:hover {
          background-color: #f8fafc;
        }
        
        .weight-bar {
          display: inline-block;
          height: 8px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 4px;
          margin-left: 8px;
        }
        
        .footer {
          background: #f8fafc;
          padding: 30px 40px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
        }
        
        .page-break {
          page-break-before: always;
          margin-top: 40px;
        }

        .chart-category {
          margin-bottom: 40px;
        }

        .chart-item {
          page-break-inside: avoid;
          margin-bottom: 30px;
        }

        .debug-section {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
        }
        .debug-title {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
        }
        .debug-content {
          font-size: 12px;
          color: #451a03;
          font-family: monospace;
        }
        
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .report-container { box-shadow: none; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <h1>📍 Location Intelligence Report</h1>
            <div class="subtitle">${tract.nta_name || 'NYC Location'} • Census Tract ${tract.geoid.slice(-6)}</div>
            <div class="date">Generated: ${today}</div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Executive Summary -->
          <div class="section">
            <h2 class="section-title">
              <span class="section-icon">📊</span>
              Executive Summary
            </h2>
            <div class="executive-summary">
              <p><strong>This ${tract.nta_name} location shows ${score >= 70 ? 'excellent' : score >= 50 ? 'moderate' : 'challenging'} business potential with an overall score of ${score}/100.</strong></p>
              
              <div style="margin-top: 16px;">
                <strong>Key Highlights:</strong>
                <ul style="margin-left: 20px; margin-top: 8px;">
                  <li><strong>Foot Traffic:</strong> ${Math.round(tract.foot_traffic_score || 0)}/100 - ${tract.foot_traffic_score >= 70 ? 'High activity area' : tract.foot_traffic_score >= 50 ? 'Moderate activity' : 'Lower foot traffic'}</li>
                  <li><strong>Safety Score:</strong> ${Math.round(tract.crime_score || 0)}/100 - ${tract.crime_score >= 70 ? 'Very safe area' : tract.crime_score >= 50 ? 'Generally safe' : 'Safety considerations needed'}</li>
                  <li><strong>Demographics Match:</strong> ${Math.round(tract.demographic_match_pct || 0)}% - ${(tract.demographic_match_pct || 0) >= 25 ? 'Strong target alignment' : (tract.demographic_match_pct || 0) >= 15 ? 'Moderate alignment' : 'Limited target match'}</li>
                  <li><strong>Rent:</strong> ${tract.avg_rent ? `$${tract.avg_rent}/sqft` : 'N/A'} - Market positioning for commercial space</li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Key Metrics -->
          <div class="section">
            <h2 class="section-title">
              <span class="section-icon">📈</span>
              Key Performance Metrics
            </h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value" style="color: ${getScoreColor(score)}">${score}/100</div>
                <div class="metric-label">Overall Score</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: ${getScoreColor(tract.foot_traffic_score || 0)}">${Math.round(tract.foot_traffic_score || 0)}/100</div>
                <div class="metric-label">Foot Traffic</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: ${getScoreColor(tract.crime_score || 0)}">${Math.round(tract.crime_score || 0)}/100</div>
                <div class="metric-label">Safety Score</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #6b7280">${Math.round(tract.demographic_match_pct || 0)}%</div>
                <div class="metric-label">Demographics Match</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #6b7280">${tract.avg_rent ? `$${tract.avg_rent}` : 'N/A'}</div>
                <div class="metric-label">Rent per sqft</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: ${getScoreColor(tract.resilience_score || 0)}">${Math.round(tract.resilience_score || 0)}/100</div>
                <div class="metric-label">Resilience Score</div>
              </div>
            </div>
          </div>
          
          <!-- Weights Table -->
          <div class="section">
            <h2 class="section-title">
              <span class="section-icon">⚖️</span>
              Your Priority Weights
            </h2>
            <table class="weights-table">
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Weight</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                ${weights.map(weight => `
                  <tr>
                    <td><strong>${this.formatWeightLabel(weight.id)}</strong></td>
                    <td>
                      ${weight.value}%
                      <div class="weight-bar" style="width: ${weight.value}px;"></div>
                    </td>
                    <td>${this.getWeightDescription(weight.id)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- 🚀 Charts Section -->
          ${generateChartsHTML()}
          
          ${aiAnalysis ? `
          <!-- AI Analysis -->
          <div class="section page-break">
            <h2 class="section-title">
              <span class="section-icon">🤖</span>
              AI Business Intelligence
            </h2>
            <div class="ai-section">
              <div class="ai-headline">${aiAnalysis.headline || 'AI Analysis Available'}</div>
              
              ${aiAnalysis.reasoning ? `<p style="margin-bottom: 20px; color: #374151;">${aiAnalysis.reasoning}</p>` : ''}
              
              ${aiAnalysis.insights && Array.isArray(aiAnalysis.insights) && aiAnalysis.insights.length > 0 ? `
                <h3 style="color: #1e40af; margin: 24px 0 16px 0;">Key Insights:</h3>
                <div class="insights-grid">
                  ${aiAnalysis.insights.map((insight: BusinessInsight) => `
                    <div class="insight-card ${insight.type || 'strength'}">
                      <div class="insight-title">
                        <span>${insight.icon || '📊'}</span>
                        <strong>${insight.title || 'Insight'}</strong>
                      </div>
                      <p style="color: #4b5563; font-size: 0.95rem;">${insight.description || ''}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              
              ${aiAnalysis.businessTypes && Array.isArray(aiAnalysis.businessTypes) && aiAnalysis.businessTypes.length > 0 ? `
                <h3 style="color: #1e40af; margin: 24px 0 12px 0;">Recommended Business Types:</h3>
                <div class="business-types">
                  ${aiAnalysis.businessTypes.map((type: string) => `<span class="business-type">${type}</span>`).join('')}
                </div>
              ` : ''}
              
              ${aiAnalysis.marketStrategy ? `
                <h3 style="color: #1e40af; margin: 24px 0 12px 0;">Market Strategy:</h3>
                <p style="color: #374151; margin-bottom: 16px;">${aiAnalysis.marketStrategy}</p>
              ` : ''}
              
              ${aiAnalysis.bottomLine ? `
                <div class="bottom-line">
                  <strong>Bottom Line:</strong> ${aiAnalysis.bottomLine}
                </div>
              ` : ''}
            </div>
          </div>
          ` : `
          <div class="debug-section">
            <div class="debug-title">🔍 DEBUG: AI Analysis Status</div>
            <div class="debug-content">
              AI Analysis: ${aiAnalysis ? 'Available' : 'Not Available'}<br>
              Type: ${typeof aiAnalysis}<br>
              Has properties: ${aiAnalysis && typeof aiAnalysis === 'object' ? 'Yes' : 'No'}<br>
              This section will show when AI analysis is included in Full Export.
            </div>
          </div>
          `}
          
          <!-- Location Details -->
          <div class="section">
            <h2 class="section-title">
              <span class="section-icon">📍</span>
              Location Details
            </h2>
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <div>
                  <strong>Census Tract:</strong><br>
                  <span style="color: #6b7280;">${tract.geoid}</span>
                </div>
                <div>
                  <strong>Neighborhood:</strong><br>
                  <span style="color: #6b7280;">${tract.nta_name || 'N/A'}</span>
                </div>
                <div>
                  <strong>Display Name:</strong><br>
                  <span style="color: #6b7280;">${tract.display_name || 'N/A'}</span>
                </div>
                <div>
                  <strong>Tract Name:</strong><br>
                  <span style="color: #6b7280;">${tract.tract_name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div style="margin-bottom: 8px;">
            <strong>Generated by BrickWyze</strong> • NYC Commercial Intelligence Platform
          </div>
          <div>
            Generated: ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // 🚀 NEW: Capture charts from DOM
  private async captureCharts(): Promise<{ [key: string]: string }> {
    console.log('📊 [Enhanced PDF] Starting chart capture...');
    
    // Add data attributes to chart elements
    this.addChartDataAttributes();
    
    const chartImages: { [key: string]: string } = {};
    let capturedCount = 0;

    for (const config of this.chartConfigs) {
      try {
        const element = document.querySelector(config.selector) as HTMLElement;
        
        if (!element) {
          console.log(`📊 [Chart Capture] Not found: ${config.selector}`);
          continue;
        }

        if (!this.isElementVisible(element)) {
          console.log(`📊 [Chart Capture] Not visible: ${config.selector}`);
          continue;
        }

        // Wait for chart to be ready
        await this.waitForChartReady(element);

        // Capture chart
        const canvas = await html2canvas(element, {
          useCORS: true,
          allowTaint: false,
          scale: 2, // High quality
          backgroundColor: '#ffffff',
          logging: false,
          width: element.offsetWidth,
          height: element.offsetHeight
        });

        const imageData = canvas.toDataURL('image/png', 0.95);
        chartImages[config.selector] = imageData;
        capturedCount++;

        console.log(`✅ [Chart Capture] Captured: ${config.title}`);

      } catch (error) {
        console.warn(`⚠️ [Chart Capture] Failed ${config.selector}:`, error);
      }
    }

    console.log(`📊 [Enhanced PDF] Captured ${capturedCount}/${this.chartConfigs.length} charts`);
    return chartImages;
  }

  // 🚀 NEW: Group charts by category
  private groupChartsByCategory(chartImages: { [key: string]: string }): { [category: string]: { config: ChartConfig; imageData: string }[] } {
    const grouped: { [category: string]: { config: ChartConfig; imageData: string }[] } = {};

    this.chartConfigs.forEach(config => {
      if (chartImages[config.selector]) {
        if (!grouped[config.category]) {
          grouped[config.category] = [];
        }
        grouped[config.category].push({
          config,
          imageData: chartImages[config.selector]
        });
      }
    });

    return grouped;
  }

  // 🚀 NEW: Add chart data attributes
  private addChartDataAttributes(): void {
    const attributeMap = [
      { selector: '.demographic-charts-container, [data-testid="demographic-charts"]', attribute: 'demographic-overview' },
      { selector: '.ethnicity-chart-section', attribute: 'ethnicity-distribution' },
      { selector: '.age-gender-chart-section', attribute: 'age-gender-distribution' },
      { selector: '.income-chart-section', attribute: 'income-distribution' },
      { selector: '[data-testid="foot-traffic-chart"]', attribute: 'foot-traffic-timeline' },
      { selector: '.foot-traffic-periods-container', attribute: 'foot-traffic-periods' },
      { selector: '[data-testid="crime-trend-chart"]', attribute: 'crime-trend' },
      { selector: '.trend-indicators-container', attribute: 'trend-indicators' }
    ];

    attributeMap.forEach(({ selector, attribute }) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.setAttribute('data-chart', attribute);
        });
        if (elements.length > 0) {
          console.log(`📊 [Chart Attributes] Added data-chart="${attribute}" to ${elements.length} elements`);
        }
      } catch (error) {
        console.warn(`⚠️ [Chart Attributes] Failed to add attribute to ${selector}:`, error);
      }
    });
  }

  // 🚀 NEW: Wait for chart to be ready
  private async waitForChartReady(element: HTMLElement, timeout: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkReady = () => {
        // Check for chart indicators
        const hasRechart = element.querySelector('.recharts-wrapper, .recharts-surface');
        const hasCanvas = element.querySelector('canvas');
        const hasSvg = element.querySelector('svg');
        const hasChartContent = element.querySelector('[data-chart-content]');
        
        if (hasRechart || hasCanvas || hasSvg || hasChartContent) {
          setTimeout(resolve, 500); // Small delay for animations
          return;
        }

        if (Date.now() - startTime > timeout) {
          resolve();
          return;
        }

        setTimeout(checkReady, 100);
      };

      checkReady();
    });
  }

  // 🚀 NEW: Check if element is visible
  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 && 
      rect.height > 0 && 
      style.display !== 'none' && 
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  // 🚀 MULTIPAGE PDF generation with charts
  public async generateLocationReport(options: ExportOptions): Promise<void> {
    const { filename = 'location-report.pdf', includeCharts = true } = options;
    
    try {
      console.log('🎨 [Enhanced PDF] Generating beautiful HTML template with charts...');
      
      // Capture charts first if requested
      let chartImages: { [key: string]: string } = {};
      if (includeCharts) {
        console.log('📊 [Enhanced PDF] Capturing charts...');
        chartImages = await this.captureCharts();
        console.log(`📊 [Enhanced PDF] Captured ${Object.keys(chartImages).length} charts`);
      }
      
      // Generate URLs for both HTML and clickable links
      const streetViewUrl = generateStreetViewUrlSync(options.tract);
      const loopNetUrl = generateLoopNetUrl(options.tract, 'commercial-real-estate', 'for-lease');
      
      console.log('🔗 [PDF Links] Generated URLs:', {
        streetView: streetViewUrl.substring(0, 80) + '...',
        loopNet: loopNetUrl
      });
      
      // Create HTML content with the generated URLs and charts
      const htmlContent = this.generateHTMLReport(options, streetViewUrl, loopNetUrl, chartImages);
      
      // Create temporary container with proper sizing
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // A4 width in pixels (210mm * 3.78)
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '14px';
      tempContainer.style.lineHeight = '1.4';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '0';
      tempContainer.style.boxSizing = 'border-box';
      
      // Add to DOM for rendering
      document.body.appendChild(tempContainer);
      
      // Capture FULL HEIGHT of content
      const fullHeight = tempContainer.scrollHeight;
      console.log('📏 [Enhanced PDF] Full content height:', fullHeight, 'pixels');
      
      // Wait for any images/content to load
      await new Promise(resolve => setTimeout(resolve, 1500)); // Longer wait for charts
      
      // MULTIPAGE CAPTURE: Capture with full content height
      const canvas = await html2canvas(tempContainer, {
        width: 794,
        height: fullHeight,
        scale: 1.5, // Good balance of quality and performance
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false
      });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // CREATE PDF with proper page handling
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate how many pages we need
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const scaledHeight = canvasHeight / ratio;
      
      console.log('📊 [Enhanced PDF] Canvas:', canvasWidth, 'x', canvasHeight);
      console.log('📄 [Enhanced PDF] PDF size:', pdfWidth, 'x', pdfHeight, 'mm');
      console.log('📏 [Enhanced PDF] Scaled content height:', scaledHeight, 'mm');
      
      // MULTIPAGE LOGIC: Split content across multiple pages
      const totalPages = Math.ceil(scaledHeight / pdfHeight);
      console.log('📚 [Enhanced PDF] Will create', totalPages, 'pages');
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Create a temporary canvas for this page section
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d')!;
        
        pageCanvas.width = canvasWidth;
        pageCanvas.height = Math.min(pdfHeight * ratio, canvasHeight - (page * pdfHeight * ratio));
        
        // Draw the portion of the main canvas for this page
        pageCtx.drawImage(
          canvas,
          0, page * pdfHeight * ratio, // Source x, y
          canvasWidth, pageCanvas.height, // Source width, height
          0, 0, // Dest x, y
          canvasWidth, pageCanvas.height // Dest width, height
        );
        
        // Add this page to PDF
        const pageImageData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(pageImageData, 'JPEG', 0, 0, pdfWidth, pageCanvas.height / ratio);
        
        console.log(`✅ [Enhanced PDF] Added page ${page + 1}/${totalPages}`);
      }
      
      // ADD CLICKABLE LINKS to the PDF
      this.addClickableLinks(pdf, options.tract, streetViewUrl, loopNetUrl);
      
      // Save the PDF
      pdf.save(filename);
      console.log('🎉 [Enhanced PDF] Multi-page PDF with charts saved successfully!');
      
    } catch (error) {
      console.error('❌ [Enhanced PDF] Generation failed:', error);
      throw new Error(`Enhanced PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ✅ ADD CLICKABLE LINKS at the top of the PDF
  private addClickableLinks(pdf: jsPDF, tract: TractResult, streetViewUrl: string, loopNetUrl: string): void {
    try {
      console.log('🔗 [PDF Links] Adding clickable links at top of PDF...');
      
      // Go to the first page
      pdf.setPage(1);
      
      // PDF dimensions (A4: 210mm x 297mm)
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Position links right below the header section but before content starts
      const startY = 75; // Moved up slightly to avoid content overlap
      const leftMargin = 20;
      const linkWidth = (pageWidth - 50) / 2; // Split into two columns with margins
      const linkHeight = 10; // Slightly smaller height
      
      // 🏢 LoopNet Link (Left side)
      const loopNetX = leftMargin;
      const loopNetY = startY;
      
      // Add colored background for LoopNet link
      pdf.setFillColor(59, 130, 246); // Blue background
      pdf.rect(loopNetX, loopNetY, linkWidth, linkHeight, 'F');
      
      // Add clickable area
      pdf.link(loopNetX, loopNetY, linkWidth, linkHeight, { url: loopNetUrl });
      
      // Add text label (NO EMOJIS - they cause artifacts)
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('LoopNet Commercial Properties', loopNetX + 2, loopNetY + 6.5);
      
      // 🗺️ Street View Link (Right side)
      const streetViewX = loopNetX + linkWidth + 10; // 10mm gap between links
      const streetViewY = startY;
      
      // Add colored background for Street View link
      pdf.setFillColor(34, 197, 94); // Green background
      pdf.rect(streetViewX, streetViewY, linkWidth, linkHeight, 'F');
      
      // Add clickable area
      pdf.link(streetViewX, streetViewY, linkWidth, linkHeight, { url: streetViewUrl });
      
      // Add text label (NO EMOJIS - they cause artifacts)
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('Google Maps Street View', streetViewX + 2, streetViewY + 6.5);
      
      // Add subtitle text below the links
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100); // Gray text
      pdf.text('Click buttons above to research this location further', leftMargin, startY + linkHeight + 6);
      
      // Reset text color for rest of document
      pdf.setTextColor(0, 0, 0);
      
      console.log('✅ [PDF Links] Successfully added clickable link buttons at top of PDF');
      
    } catch (error) {
      console.warn('⚠️ [PDF Links] Failed to add clickable links:', error);
      // Don't throw error - PDF should still work without clickable links
    }
  }

  // ✅ Utility methods
  private formatWeightLabel(id: string): string {
    const labels: Record<string, string> = {
      'foot_traffic': 'Foot Traffic',
      'crime': 'Safety Score',
      'rent_score': 'Rent Affordability',
      'poi': 'Points of Interest',
      'flood_risk': 'Flood Risk',
      'demographic': 'Demographics'
    };
    return labels[id] || id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getWeightDescription(id: string): string {
    const descriptions: Record<string, string> = {
      'foot_traffic': 'Customer flow and activity levels',
      'crime': 'Safety and security considerations',
      'rent_score': 'Commercial rent affordability',
      'poi': 'Nearby amenities and attractions',
      'flood_risk': 'Climate and flooding resilience',
      'demographic': 'Target customer alignment'
    };
    return descriptions[id] || 'Factor importance in analysis';
  }
}