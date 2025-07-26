// src/lib/pdfExportService.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';
import { generateLoopNetUrl } from '../components/features/search/TractDetailPanel/LoopNetIntegration';

interface PDFExportOptions {
  tract: TractResult;
  weights: Weight[];
  aiAnalysis?: AIBusinessAnalysis | null;
  streetViewUrl?: string;
  includeLogo?: boolean;
}

interface ChartDataForPDF {
  chartElement: HTMLElement;
  title: string;
  description?: string;
}

export class PDFExportService {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 7;
  }

  async generateTractReport(options: PDFExportOptions): Promise<void> {
    const { tract, weights, aiAnalysis, streetViewUrl } = options;

    try {
      // Add header
      this.addHeader(tract);
      
      // Add executive summary
      this.addExecutiveSummary(tract, aiAnalysis);
      
      // Add key metrics
      this.addKeyMetrics(tract, weights);
      
      // Add Street View image if available
      if (streetViewUrl) {
        await this.addStreetViewImage(tract);
      }
      
      // Add AI analysis if available
      if (aiAnalysis) {
        this.addAIAnalysis(aiAnalysis);
      }
      
      // Add charts
      await this.addCharts(tract);
      
      // Add trend analysis
      this.addTrendAnalysis(tract);
      
      // Add demographic data
      this.addDemographicData(tract);
      
      // Add footer with links
      this.addFooterWithLinks(tract);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addHeader(tract: TractResult): void {
    // Title
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('NYC Business Location Report', this.margin, this.currentY);
    this.currentY += 15;

    // Tract info
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(tract.nta_name || 'Unknown Area', this.margin, this.currentY);
    this.currentY += 8;

    this.pdf.setFontSize(12);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(`Census Tract ${tract.geoid.slice(-6)}`, this.margin, this.currentY);
    this.currentY += 10;

    // Score badge
    const score = Math.round(tract.custom_score || 0);
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    
    // Score color logic
    if (score >= 80) this.pdf.setTextColor(34, 197, 94); // green
    else if (score >= 60) this.pdf.setTextColor(59, 130, 246); // blue  
    else if (score >= 40) this.pdf.setTextColor(249, 115, 22); // orange
    else this.pdf.setTextColor(239, 68, 68); // red
    
    this.pdf.text(`Overall Score: ${score}/100`, this.margin, this.currentY);
    this.currentY += 15;

    // Reset color
    this.pdf.setTextColor(0, 0, 0);
    this.addSeparator();
  }

  private addExecutiveSummary(tract: TractResult, aiAnalysis?: AIBusinessAnalysis | null): void {
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Executive Summary', this.margin, this.currentY);
    this.currentY += 10;

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    if (aiAnalysis && aiAnalysis.headline) {
      // Use AI-generated summary
      const wrappedText = this.pdf.splitTextToSize(aiAnalysis.headline, this.pageWidth - 2 * this.margin);
      this.pdf.text(wrappedText, this.margin, this.currentY);
      this.currentY += wrappedText.length * this.lineHeight + 5;
    } else {
      // Fallback summary
      const summary = this.generateFallbackSummary(tract);
      const wrappedText = this.pdf.splitTextToSize(summary, this.pageWidth - 2 * this.margin);
      this.pdf.text(wrappedText, this.margin, this.currentY);
      this.currentY += wrappedText.length * this.lineHeight + 5;
    }

    this.addSeparator();
  }

  private addKeyMetrics(tract: TractResult, weights: Weight[]): void {
    this.checkPageBreak(50);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Key Metrics', this.margin, this.currentY);
    this.currentY += 12;

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    // Create metrics grid
    const metrics = [
      { label: 'Foot Traffic Score', value: `${Math.round(tract.foot_traffic_score || 0)}/100` },
      { label: 'Safety Score', value: `${Math.round(tract.crime_score || 0)}/100` },
      { label: 'Demographics Match', value: `${Math.round(tract.demographic_match_pct || 0)}%` },
      { label: 'Average Rent', value: tract.avg_rent ? `$${tract.avg_rent}/sqft` : 'N/A' },
    ];

    // Add flood risk if available
    if (tract.flood_risk_score !== undefined) {
      metrics.push({ label: 'Flood Risk Score', value: `${Math.round(tract.flood_risk_score)}/100` });
    }

    // Display metrics in two columns
    const leftColumn = this.margin;
    const rightColumn = this.margin + (this.pageWidth - 2 * this.margin) / 2;

    metrics.forEach((metric, index) => {
      const x = index % 2 === 0 ? leftColumn : rightColumn;
      if (index % 2 === 0 && index > 0) {
        this.currentY += this.lineHeight;
      }

      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${metric.label}:`, x, this.currentY);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(metric.value, x + 40, this.currentY);
    });

    this.currentY += 15;
    this.addSeparator();
  }

  private async addStreetViewImage(tract: TractResult): Promise<void> {
    this.checkPageBreak(80);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Street View', this.margin, this.currentY);
    this.currentY += 10;

    try {
      // Try to capture the Google Maps image from the DOM
      const imageElement = document.querySelector('[data-testid="google-maps-image"]') as HTMLImageElement;
      
      if (imageElement && imageElement.complete) {
        const canvas = await html2canvas(imageElement, {
          useCORS: true,
          allowTaint: false,
          scale: 1
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const imgWidth = this.pageWidth - 2 * this.margin;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;
        
        this.pdf.addImage(imgData, 'JPEG', this.margin, this.currentY, imgWidth, imgHeight);
        this.currentY += imgHeight + 10;
      } else {
        // Fallback text if image not available
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.text('Street View image not available - see link in footer', this.margin, this.currentY);
        this.currentY += 10;
      }
    } catch (error) {
      console.warn('Could not add Street View image to PDF:', error);
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text('Street View image not available - see link in footer', this.margin, this.currentY);
      this.currentY += 10;
    }

    this.addSeparator();
  }

  private addAIAnalysis(aiAnalysis: AIBusinessAnalysis): void {
    this.checkPageBreak(60);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('AI Business Analysis', this.margin, this.currentY);
    this.currentY += 12;

    // Add reasoning
    if (aiAnalysis.reasoning) {
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      const wrappedReasoning = this.pdf.splitTextToSize(aiAnalysis.reasoning, this.pageWidth - 2 * this.margin);
      this.pdf.text(wrappedReasoning, this.margin, this.currentY);
      this.currentY += wrappedReasoning.length * this.lineHeight + 8;
    }

    // Add insights
    if (aiAnalysis.insights && aiAnalysis.insights.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Key Insights:', this.margin, this.currentY);
      this.currentY += 8;

      aiAnalysis.insights.forEach((insight, index) => {
        this.checkPageBreak(15);
        
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'bold');
        
        // Color code by type
        if (insight.type === 'strength') this.pdf.setTextColor(34, 197, 94);
        else if (insight.type === 'opportunity') this.pdf.setTextColor(59, 130, 246);
        else this.pdf.setTextColor(249, 115, 22);

        this.pdf.text(`${insight.icon} ${insight.title}`, this.margin + 5, this.currentY);
        this.currentY += this.lineHeight;

        this.pdf.setTextColor(0, 0, 0);
        this.pdf.setFont('helvetica', 'normal');
        const wrappedText = this.pdf.splitTextToSize(insight.description, this.pageWidth - 2 * this.margin - 10);
        this.pdf.text(wrappedText, this.margin + 5, this.currentY);
        this.currentY += wrappedText.length * this.lineHeight + 5;
      });
    }

    // Add bottom line
    if (aiAnalysis.bottomLine) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Bottom Line:', this.margin, this.currentY);
      this.currentY += 8;

      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      const wrappedBottomLine = this.pdf.splitTextToSize(aiAnalysis.bottomLine, this.pageWidth - 2 * this.margin);
      this.pdf.text(wrappedBottomLine, this.margin, this.currentY);
      this.currentY += wrappedBottomLine.length * this.lineHeight + 10;
    }

    this.addSeparator();
  }

  private async addCharts(tract: TractResult): Promise<void> {
    this.checkPageBreak(100);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Charts & Analytics', this.margin, this.currentY);
    this.currentY += 15;

    // Try to capture chart elements
    const chartSelectors = [
      '[data-testid="foot-traffic-chart"]',
      '[data-testid="crime-trend-chart"]',
      '[data-testid="demographic-chart"]'
    ];

    for (const selector of chartSelectors) {
      await this.addChartBySelector(selector);
    }
  }

  private async addChartBySelector(selector: string): Promise<void> {
    try {
      const chartElement = document.querySelector(selector) as HTMLElement;
      
      if (chartElement) {
        this.checkPageBreak(80);
        
        const canvas = await html2canvas(chartElement, {
          useCORS: true,
          allowTaint: false,
          scale: 1,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png', 0.9);
        const imgWidth = this.pageWidth - 2 * this.margin;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;
        
        // Limit height to avoid too large charts
        const maxHeight = 60;
        const finalHeight = Math.min(imgHeight, maxHeight);
        
        this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, finalHeight);
        this.currentY += finalHeight + 10;
      }
    } catch (error) {
      console.warn(`Could not add chart ${selector} to PDF:`, error);
    }
  }

  private addTrendAnalysis(tract: TractResult): void {
    this.checkPageBreak(40);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Trend Analysis', this.margin, this.currentY);
    this.currentY += 12;

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    // Foot traffic trends
    if (tract.foot_traffic_timeline) {
      const trends = this.analyzeTrends(tract.foot_traffic_timeline);
      this.pdf.text(`Foot Traffic Trend: ${trends}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }

    // Crime trends
    if (tract.crime_timeline) {
      const crimeTrends = this.analyzeCrimeTrends(tract.crime_timeline);
      this.pdf.text(`Safety Trend: ${crimeTrends}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }

    this.currentY += 10;
    this.addSeparator();
  }

  private addDemographicData(tract: TractResult): void {
    this.checkPageBreak(50);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Demographics', this.margin, this.currentY);
    this.currentY += 12;

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    const demographics = [
      { label: 'Demographics Match', value: `${Math.round(tract.demographic_match_pct || 0)}%` },
      { label: 'Gender Match', value: `${Math.round(tract.gender_match_pct || 0)}%` },
      { label: 'Age Match', value: `${Math.round(tract.age_match_pct || 0)}%` },
      { label: 'Income Match', value: `${Math.round(tract.income_match_pct || 0)}%` }
    ];

    demographics.forEach(demo => {
      this.pdf.text(`${demo.label}: ${demo.value}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });

    this.currentY += 10;
    this.addSeparator();
  }

  private addFooterWithLinks(tract: TractResult): void {
    // Go to last page
    const pageCount = this.pdf.getNumberOfPages();
    this.pdf.setPage(pageCount);
    
    // Start from near bottom of page
    this.currentY = this.pageHeight - 40;

    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Useful Links', this.margin, this.currentY);
    this.currentY += 10;

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    // Street View link
    const streetViewUrl = this.generateStreetViewUrl(tract);
    this.pdf.setTextColor(0, 0, 255);
    this.pdf.textWithLink('📍 Google Street View', this.margin, this.currentY, { url: streetViewUrl });
    this.currentY += this.lineHeight;

    // LoopNet link
    const loopNetUrl = generateLoopNetUrl(tract);
    this.pdf.textWithLink('🏢 View Properties on LoopNet', this.margin, this.currentY, { url: loopNetUrl });
    this.currentY += this.lineHeight + 5;

    // Reset color
    this.pdf.setTextColor(0, 0, 0);

    // Add generation timestamp
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, this.margin, this.currentY);
  }

  private generateStreetViewUrl(tract: TractResult): string {
    // Get coordinates from the tract data or use a default
    const lat = 40.7589; // Default to midtown Manhattan
    const lng = -73.9851;
    
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addSeparator(): void {
    this.currentY += 5;
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private generateFallbackSummary(tract: TractResult): string {
    const score = Math.round(tract.custom_score || 0);
    const rent = tract.avg_rent;
    
    if (score >= 80) {
      return `Excellent location with strong fundamentals (${score}/100 score). ${rent ? `Rent at $${rent}/sqft is competitive for this quality area.` : ''} Ideal for premium businesses with high foot traffic and good safety metrics.`;
    } else if (score >= 60) {
      return `Good business opportunity with solid metrics (${score}/100 score). ${rent ? `Monthly rent of $${rent}/sqft offers good value.` : ''} Suitable for most business types with balanced risk-reward profile.`;
    } else if (score >= 40) {
      return `Fair location with mixed indicators (${score}/100 score). ${rent ? `Consider rent costs ($${rent}/sqft) vs potential returns.` : ''} May work for specific business models with careful planning.`;
    } else {
      return `Lower scoring area with challenges (${score}/100 score). ${rent ? `Despite lower rent ($${rent}/sqft),` : ''} Detailed analysis recommended before making investment decisions.`;
    }
  }

  private analyzeTrends(timeline: Record<string, number>): string {
    const values = Object.values(timeline).filter(v => v != null && v > 0);
    if (values.length < 2) return 'Insufficient data';
    
    const recent = values.slice(-2);
    const change = ((recent[1] - recent[0]) / recent[0]) * 100;
    
    if (change > 5) return `Improving (+${change.toFixed(1)}%)`;
    if (change < -5) return `Declining (${change.toFixed(1)}%)`;
    return `Stable (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`;
  }

  private analyzeCrimeTrends(timeline: Record<string, number>): string {
    // For crime, lower numbers are better
    const values = Object.values(timeline).filter(v => v != null && v > 0);
    if (values.length < 2) return 'Insufficient data';
    
    const recent = values.slice(-2);
    const change = ((recent[1] - recent[0]) / recent[0]) * 100;
    
    if (change < -5) return `Improving (Safety up ${Math.abs(change).toFixed(1)}%)`;
    if (change > 5) return `Declining (Safety down ${change.toFixed(1)}%)`;
    return `Stable (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`;
  }

  public download(filename: string): void {
    this.pdf.save(filename);
  }

  public getBlob(): Blob {
    return this.pdf.output('blob');
  }
}