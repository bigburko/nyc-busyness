// src/lib/pdfExportService.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';

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

  async generateTractReport(
    tract: TractResult,
    weights: Weight[],
    aiAnalysis?: AIBusinessAnalysis | null,
    filename?: string
  ): Promise<void> {
    try {
      // Add header
      this.addHeader(tract);
      
      // Add executive summary
      this.addExecutiveSummary(tract, aiAnalysis);
      
      // Add key metrics
      this.addKeyMetrics(tract, weights);
      
      // Add Street View image if available
      await this.addStreetViewImage(tract);
      
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
      
      // Save the PDF
      const finalFilename = filename || `${tract.nta_name?.replace(/[^a-zA-Z0-9]/g, '_')}_tract_${tract.geoid.slice(-6)}_report.pdf`;
      this.pdf.save(finalFilename);
      
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
    this.currentY += 8;

    // Add date
    this.pdf.text(`Generated: ${new Date().toLocaleDateString()}`, this.margin, this.currentY);
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
    this.checkPageBreak(40);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Executive Summary', this.margin, this.currentY);
    this.currentY += 12;

    if (aiAnalysis?.headline) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      const wrappedHeadline = this.pdf.splitTextToSize(aiAnalysis.headline, this.pageWidth - 2 * this.margin);
      this.pdf.text(wrappedHeadline, this.margin, this.currentY);
      this.currentY += wrappedHeadline.length * this.lineHeight + 5;
    }

    // Default summary if no AI analysis
    const summaryText = aiAnalysis?.reasoning || 
      `This location in ${tract.nta_name} has an overall business viability score of ${Math.round(tract.custom_score || 0)}/100. 
       Key factors include foot traffic patterns, safety metrics, demographic alignment, and rental costs.`;

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const wrappedSummary = this.pdf.splitTextToSize(summaryText, this.pageWidth - 2 * this.margin);
    this.pdf.text(wrappedSummary, this.margin, this.currentY);
    this.currentY += wrappedSummary.length * this.lineHeight + 15;

    this.addSeparator();
  }

  private addKeyMetrics(tract: TractResult, weights: Weight[]): void {
    this.checkPageBreak(50);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Key Metrics', this.margin, this.currentY);
    this.currentY += 12;

    this.pdf.setFontSize(11);

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
      const imageElement = document.querySelector('[data-testid="google-maps-image"]') as HTMLElement;
      
      if (imageElement) {
        const canvas = await html2canvas(imageElement, {
          useCORS: true,
          allowTaint: false,
          scale: 1,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const imgWidth = this.pageWidth - 2 * this.margin;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;
        
        // Limit height
        const maxHeight = 60;
        const finalHeight = Math.min(imgHeight, maxHeight);
        
        this.pdf.addImage(imgData, 'JPEG', this.margin, this.currentY, imgWidth, finalHeight);
        this.currentY += finalHeight + 10;
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

    // Business insights
    if (aiAnalysis.insights && aiAnalysis.insights.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Key Insights:', this.margin, this.currentY);
      this.currentY += 8;

      aiAnalysis.insights.forEach(insight => {
        this.checkPageBreak(15);
        
        this.pdf.setFontSize(11);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(`• ${insight.title}`, this.margin, this.currentY);
        this.currentY += this.lineHeight;

        this.pdf.setFont('helvetica', 'normal');
        const wrappedDesc = this.pdf.splitTextToSize(insight.description, this.pageWidth - 2 * this.margin - 10);
        this.pdf.text(wrappedDesc, this.margin + 5, this.currentY);
        this.currentY += wrappedDesc.length * this.lineHeight + 3;
      });

      this.currentY += 5;
    }

    // Business types
    if (aiAnalysis.businessTypes && aiAnalysis.businessTypes.length > 0) {
      this.checkPageBreak(20);
      
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Recommended Business Types:', this.margin, this.currentY);
      this.currentY += 8;

      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      aiAnalysis.businessTypes.forEach(type => {
        this.pdf.text(`• ${type}`, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      });

      this.currentY += 5;
    }

    // Market strategy
    if (aiAnalysis.marketStrategy) {
      this.checkPageBreak(20);
      
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Market Strategy:', this.margin, this.currentY);
      this.currentY += 8;

      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      const wrappedStrategy = this.pdf.splitTextToSize(aiAnalysis.marketStrategy, this.pageWidth - 2 * this.margin);
      this.pdf.text(wrappedStrategy, this.margin, this.currentY);
      this.currentY += wrappedStrategy.length * this.lineHeight + 5;
    }

    // Bottom line
    if (aiAnalysis.bottomLine) {
      this.checkPageBreak(15);
      
      this.pdf.setFontSize(14);
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
    // Calculate total pages using internal property access
    const totalPages = (this.pdf.internal as any).getNumberOfPages?.() || this.pdf.internal.pages?.length - 1 || 1;
    
    // Go to last page
    this.pdf.setPage(totalPages);
    
    // Start from near bottom of page
    this.currentY = this.pageHeight - 40;
    
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Quick Links', this.margin, this.currentY);
    this.currentY += 10;

    // Get coordinates for Street View
    const coords = this.getTractCoordinates(tract);
    const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords.lat},${coords.lng}`;
    
    // Generate LoopNet URL
    const loopNetUrl = this.generateLoopNetUrl(tract);

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 255); // Blue for links

    this.pdf.text('Street View:', this.margin, this.currentY);
    this.pdf.text(streetViewUrl, this.margin + 25, this.currentY);
    this.currentY += this.lineHeight + 2;

    this.pdf.text('LoopNet Search:', this.margin, this.currentY);
    this.pdf.text(loopNetUrl, this.margin + 30, this.currentY);
    this.currentY += this.lineHeight + 2;

    // Reset color
    this.pdf.setTextColor(0, 0, 0);
    
    // Add page numbers
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(10);
      this.pdf.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin - 20, this.pageHeight - 10);
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addSeparator(): void {
    this.pdf.setLineWidth(0.5);
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private analyzeTrends(timeline: Record<string, number | undefined>): string {
    const values = Object.values(timeline).filter(v => v !== undefined) as number[];
    if (values.length < 2) return 'Insufficient data';

    const latest = values[values.length - 1];
    const previous = values[values.length - 2];
    const change = ((latest - previous) / previous) * 100;

    if (change > 5) return `Increasing (+${change.toFixed(1)}%)`;
    if (change < -5) return `Decreasing (${change.toFixed(1)}%)`;
    return 'Stable';
  }

  private analyzeCrimeTrends(timeline: Record<string, number | undefined>): string {
    const values = Object.values(timeline).filter(v => v !== undefined) as number[];
    if (values.length < 2) return 'Insufficient data';

    const latest = values[values.length - 1];
    const previous = values[values.length - 2];
    const change = ((latest - previous) / previous) * 100;

    if (change > 5) return `Improving safety (+${change.toFixed(1)}% crime reduction)`;
    if (change < -5) return `Safety concerns (${Math.abs(change).toFixed(1)}% crime increase)`;
    return 'Stable safety conditions';
  }

  private getTractCoordinates(tract: TractResult): { lat: number; lng: number } {
    // Fallback to center of Manhattan if no specific coordinates
    return { lat: 40.7589, lng: -73.9851 };
  }

  private generateLoopNetUrl(tract: TractResult): string {
    const locationQuery = encodeURIComponent(tract.nta_name || 'NYC');
    return `https://www.loopnet.com/search/commercial-real-estate/${locationQuery.toLowerCase().replace(/\s+/g, '-')}/`;
  }
}