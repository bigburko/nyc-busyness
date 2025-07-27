// src/lib/enhancedPDFService.ts - Beautiful design + Multipage support + TypeScript fixes
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';

interface ExportOptions {
  tract: TractResult;
  weights: Weight[];
  aiAnalysis?: AIBusinessAnalysis | null | undefined;
  includeCharts?: boolean;
  includeStreetView?: boolean;
  filename?: string;
}

export class EnhancedPDFService {
  
  // 🎨 Beautiful HTML template generation with multipage support
  private generateHTMLReport(options: ExportOptions): string {
    const { tract, weights, aiAnalysis } = options;
    
    // 🔍 DEBUG: Simple logging to avoid TypeScript issues
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

    const getScoreGradient = (score: number) => {
      if (score >= 80) return 'linear-gradient(135deg, #10b981, #34d399)';
      if (score >= 60) return 'linear-gradient(135deg, #3b82f6, #60a5fa)';
      if (score >= 40) return 'linear-gradient(135deg, #f59e0b, #fbbf24)';
      return 'linear-gradient(135deg, #ef4444, #f87171)';
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
        
        .score-badge {
          position: absolute;
          top: 40px;
          right: 40px;
          background: ${getScoreGradient(score)};
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 2rem;
          font-weight: 800;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          border: 2px solid rgba(255,255,255,0.2);
        }
        
        .content {
          padding: 40px;
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
        
        /* 🔍 DEBUG SECTION */
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
          <div class="score-badge">${score}/100</div>
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
          
          ${aiAnalysis ? `
          <!-- AI Analysis -->
          <div class="section page-break">
            <h2 class="section-title">
              <span class="section-icon">🤖</span>
              AI Business Intelligence
            </h2>
            <div class="ai-section">
              <div class="ai-headline">${(aiAnalysis as any).headline || 'AI Analysis Available'}</div>
              
              ${(aiAnalysis as any).reasoning ? `<p style="margin-bottom: 20px; color: #374151;">${(aiAnalysis as any).reasoning}</p>` : ''}
              
              ${(aiAnalysis as any).insights && Array.isArray((aiAnalysis as any).insights) && (aiAnalysis as any).insights.length > 0 ? `
                <h3 style="color: #1e40af; margin: 24px 0 16px 0;">Key Insights:</h3>
                <div class="insights-grid">
                  ${(aiAnalysis as any).insights.map((insight: any) => `
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
              
              ${(aiAnalysis as any).businessTypes && Array.isArray((aiAnalysis as any).businessTypes) && (aiAnalysis as any).businessTypes.length > 0 ? `
                <h3 style="color: #1e40af; margin: 24px 0 12px 0;">Recommended Business Types:</h3>
                <div class="business-types">
                  ${(aiAnalysis as any).businessTypes.map((type: string) => `<span class="business-type">${type}</span>`).join('')}
                </div>
              ` : ''}
              
              ${(aiAnalysis as any).marketStrategy ? `
                <h3 style="color: #1e40af; margin: 24px 0 12px 0;">Market Strategy:</h3>
                <p style="color: #374151; margin-bottom: 16px;">${(aiAnalysis as any).marketStrategy}</p>
              ` : ''}
              
              ${(aiAnalysis as any).bottomLine ? `
                <div class="bottom-line">
                  <strong>Bottom Line:</strong> ${(aiAnalysis as any).bottomLine}
                </div>
              ` : ''}
            </div>
          </div>
          ` : `
          <!-- 🔍 DEBUG: No AI Analysis Available -->
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

          <!-- Property Research Links -->
          <div class="section">
            <h2 class="section-title">
              <span class="section-icon">🔗</span>
              Property Research Links
            </h2>
            <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
              <div style="padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                <strong>🏢 LoopNet Commercial Properties:</strong><br>
                <a href="https://www.loopnet.com/search/commercial-real-estate/${encodeURIComponent(tract.nta_name || '')}-new-york/" 
                   style="color: #2563eb; text-decoration: none;">
                  View available commercial properties in ${tract.nta_name || 'this area'}
                </a>
              </div>
              <div style="padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                <strong>🗺️ Google Maps Street View:</strong><br>
                <a href="https://www.google.com/maps/search/${encodeURIComponent(tract.nta_name || 'NYC')}" 
                   style="color: #2563eb; text-decoration: none;">
                  Explore the area with Street View
                </a>
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

  // 🚀 MULTIPAGE PDF generation
  public async generateLocationReport(options: ExportOptions): Promise<void> {
    const { filename = 'location-report.pdf' } = options;
    
    try {
      console.log('🎨 [Enhanced PDF] Generating beautiful HTML template...');
      
      // Create HTML content
      const htmlContent = this.generateHTMLReport(options);
      
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
      
      // 🎯 KEY FIX: Capture FULL HEIGHT of content (not fixed height)
      const fullHeight = tempContainer.scrollHeight;
      console.log('📏 [Enhanced PDF] Full content height:', fullHeight, 'pixels');
      
      // Wait for any images/content to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 🚀 MULTIPAGE CAPTURE: Capture with full content height
      const canvas = await html2canvas(tempContainer, {
        width: 794,
        height: fullHeight, // ✅ CHANGED: Use full height instead of fixed height
        scale: 1.5, // Good balance of quality and performance
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false
      });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // 📄 CREATE PDF with proper page handling
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
      
      // 🎯 MULTIPAGE LOGIC: Split content across multiple pages
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
      
      // Save the PDF
      pdf.save(filename);
      console.log('🎉 [Enhanced PDF] Multi-page PDF saved successfully!');
      
    } catch (error) {
      console.error('❌ [Enhanced PDF] Generation failed:', error);
      throw new Error(`Enhanced PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ✅ FIXED: Utility methods with proper TypeScript
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