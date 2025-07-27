// src/lib/pdfExportService.ts - FIXED VERSION
import jsPDF from 'jspdf';
// 🔄 FIXED: Use default import for autoTable with newer versions
import autoTable from 'jspdf-autotable';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';

// 🔄 FIXED: Extended type declaration for newer versions
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

interface ExportOptions {
  tract: TractResult;
  weights: Weight[];
  aiAnalysis?: AIBusinessAnalysis | null;
  includeCharts?: boolean;
  includeStreetView?: boolean;
  filename?: string;
}

export class PDFExportService {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number = 210; // A4 width in mm
  private margin: number = 20;
  private contentWidth: number = 170; // pageWidth - 2*margin

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    // 🔄 FIXED: Manually attach autoTable function for compatibility
    (this.doc as any).autoTable = autoTable.bind(null, this.doc);
  }

  async generateLocationReport(options: ExportOptions): Promise<void> {
    const { tract, weights, aiAnalysis, includeCharts = true, includeStreetView = true, filename } = options;

    try {
      // Header
      this.addHeader(tract);
      this.addSpace(10);

      // Executive Summary
      this.addExecutiveSummary(tract, weights);
      this.addSpace(10);

      // Key Metrics Table
      this.addKeyMetricsTable(tract);
      this.addSpace(10);

      // Weights Configuration
      this.addWeightsSection(weights);
      this.addSpace(10);

      // AI Business Analysis (if available)
      if (aiAnalysis) {
        this.checkPageBreak(40);
        this.addAIAnalysisSection(aiAnalysis);
        this.addSpace(10);
      }

      // Location Details
      this.checkPageBreak(30);
      this.addLocationDetails(tract);
      this.addSpace(10);

      // Trend Analysis
      this.addTrendAnalysis(tract);
      this.addSpace(10);

      // Street View & Property Links
      if (includeStreetView) {
        this.checkPageBreak(20);
        this.addPropertyLinks(tract);
      }

      // Footer
      this.addFooter();

      // Save the PDF
      const finalFilename = filename || `location-report-${tract.geoid}.pdf`;
      this.doc.save(finalFilename);

      console.log('✅ [PDF Export] PDF generated successfully:', finalFilename);
    } catch (error) {
      console.error('❌ [PDF Export] PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addHeader(tract: TractResult): void {
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 82, 156); // Blue color
    this.doc.text('📍 Location Intelligence Report', this.margin, this.currentY);
    this.currentY += 15;

    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`${tract.nta_name || 'NYC Location'} • Census Tract ${tract.geoid.slice(-6)}`, this.margin, this.currentY);
    this.currentY += 8;

    // Date and Score
    this.doc.setFontSize(12);
    this.doc.setTextColor(60, 60, 60);
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    this.doc.text(`Generated: ${today}`, this.margin, this.currentY);
    
    // Overall Score Badge
    const score = Math.round(tract.custom_score || 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    
    // Score background color based on score
    let bgColor: [number, number, number] = [239, 68, 68]; // Red
    if (score >= 80) bgColor = [16, 185, 129]; // Green
    else if (score >= 60) bgColor = [59, 130, 246]; // Blue
    else if (score >= 40) bgColor = [245, 158, 11]; // Orange
    
    this.doc.setFillColor(...bgColor);
    this.doc.roundedRect(this.pageWidth - 50, this.currentY - 8, 30, 12, 3, 3, 'F');
    this.doc.text(`${score}/100`, this.pageWidth - 35, this.currentY - 1);
    
    this.currentY += 10;

    // Horizontal line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 5;
  }

  private addExecutiveSummary(tract: TractResult, weights: Weight[]): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 82, 156);
    this.doc.text('📊 Executive Summary', this.margin, this.currentY);
    this.currentY += 8;

    const summary = this.generateExecutiveSummary(tract, weights);
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    const lines = this.doc.splitTextToSize(summary, this.contentWidth);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 5;
  }

  private generateExecutiveSummary(tract: TractResult, weights: Weight[]): string {
    const score = Math.round(tract.custom_score || 0);
    const footTraffic = Math.round(tract.foot_traffic_score || 0);
    const safety = Math.round(tract.crime_score || 0);
    const demographics = Math.round(tract.demographic_match_pct || 0);
    const rent = tract.avg_rent ? `$${tract.avg_rent}/sqft` : 'N/A';

    let assessment = 'challenging';
    if (score >= 70) assessment = 'excellent';
    else if (score >= 50) assessment = 'moderate';

    return `This ${tract.nta_name} location shows ${assessment} business potential with an overall score of ${score}/100. 

Key Highlights:
• Foot Traffic: ${footTraffic}/100 - ${footTraffic >= 70 ? 'High activity area' : footTraffic >= 50 ? 'Moderate activity' : 'Lower foot traffic'}
• Safety Score: ${safety}/100 - ${safety >= 70 ? 'Very safe area' : safety >= 50 ? 'Generally safe' : 'Safety considerations needed'}
• Demographics Match: ${demographics}% - ${demographics >= 25 ? 'Strong target alignment' : demographics >= 15 ? 'Moderate alignment' : 'Limited target match'}
• Rent: ${rent} - Market positioning for commercial space

The analysis is weighted based on your priorities: ${weights.slice(0, 3).map(w => `${w.id} (${w.value}%)`).join(', ')}. This comprehensive evaluation considers local market dynamics, foot traffic patterns, safety metrics, and demographic alignment to provide actionable business intelligence.`;
  }

  private addKeyMetricsTable(tract: TractResult): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 82, 156);
    this.doc.text('📈 Key Performance Metrics', this.margin, this.currentY);
    this.currentY += 10;

    const tableData = [
      ['Overall Business Score', `${Math.round(tract.custom_score || 0)}/100`, this.getScoreDescription(tract.custom_score || 0)],
      ['Foot Traffic Score', `${Math.round(tract.foot_traffic_score || 0)}/100`, this.getScoreDescription(tract.foot_traffic_score || 0)],
      ['Safety Score', `${Math.round(tract.crime_score || 0)}/100`, this.getScoreDescription(tract.crime_score || 0)],
      ['Demographics Match', `${Math.round(tract.demographic_match_pct || 0)}%`, this.getDemographicsDescription(tract.demographic_match_pct || 0)],
      ['Average Rent', tract.avg_rent ? `$${tract.avg_rent}/sqft` : 'N/A', tract.avg_rent ? this.getRentDescription(tract.avg_rent) : 'Data unavailable'],
      ['Resilience Score', `${Math.round(tract.resilience_score || 0)}/100`, 'Long-term stability indicator']
    ];

    // 🔄 FIXED: Use the bound autoTable function
    (this.doc as any).autoTable({
      startY: this.currentY,
      head: [['Metric', 'Value', 'Assessment']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 82, 156], textColor: 255, fontSize: 12, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10, textColor: 60 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 70 }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
  }

  private addWeightsSection(weights: Weight[]): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 82, 156);
    this.doc.text('⚖️ Your Priority Weights', this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    this.doc.text('How different factors were weighted in this analysis:', this.margin, this.currentY);
    this.currentY += 8;

    const weightsData = weights.map(weight => [
      this.formatWeightLabel(weight.id),
      `${weight.value}%`,
      this.getWeightDescription(weight.id)
    ]);

    (this.doc as any).autoTable({
      startY: this.currentY,
      head: [['Factor', 'Weight', 'Impact']],
      body: weightsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 11, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10, textColor: 60 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 95 }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
  }

  private addAIAnalysisSection(aiAnalysis: AIBusinessAnalysis): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 82, 156);
    this.doc.text('🤖 AI Business Intelligence', this.margin, this.currentY);
    this.currentY += 10;

    // Headline
    if (aiAnalysis.headline) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(34, 197, 94); // Green
      const headlineLines = this.doc.splitTextToSize(aiAnalysis.headline, this.contentWidth);
      this.doc.text(headlineLines, this.margin, this.currentY);
      this.currentY += headlineLines.length * 6 + 5;
    }

    // Reasoning
    if (aiAnalysis.reasoning) {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(60, 60, 60);
      const reasoningLines = this.doc.splitTextToSize(aiAnalysis.reasoning, this.contentWidth);
      this.doc.text(reasoningLines, this.margin, this.currentY);
      this.currentY += reasoningLines.length * 5 + 8;
    }

    // Key Insights
    if (aiAnalysis.insights && aiAnalysis.insights.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(41, 82, 156);
      this.doc.text('Key Insights:', this.margin, this.currentY);
      this.currentY += 8;

      aiAnalysis.insights.forEach((insight, index) => {
        this.checkPageBreak(15);
        
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(60, 60, 60);
        this.doc.text(`• ${insight.title}`, this.margin + 5, this.currentY);
        this.currentY += 5;

        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(80, 80, 80);
        const descLines = this.doc.splitTextToSize(insight.description, this.contentWidth - 10);
        this.doc.text(descLines, this.margin + 8, this.currentY);
        this.currentY += descLines.length * 4 + 3;
      });

      this.currentY += 5;
    }

    // Business Recommendations
    if (aiAnalysis.businessTypes && aiAnalysis.businessTypes.length > 0) {
      this.checkPageBreak(20);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(41, 82, 156);
      this.doc.text('Recommended Business Types:', this.margin, this.currentY);
      this.currentY += 8;

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(60, 60, 60);
      this.doc.text(aiAnalysis.businessTypes.join(' • '), this.margin + 5, this.currentY);
      this.currentY += 8;
    }

    // Market Strategy
    if (aiAnalysis.marketStrategy) {
      this.checkPageBreak(15);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(41, 82, 156);
      this.doc.text('Market Strategy:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(60, 60, 60);
      const strategyLines = this.doc.splitTextToSize(aiAnalysis.marketStrategy, this.contentWidth);
      this.doc.text(strategyLines, this.margin + 5, this.currentY);
      this.currentY += strategyLines.length * 5 + 5;
    }

    // Bottom Line
    if (aiAnalysis.bottomLine) {
      this.checkPageBreak(15);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(245, 158, 11); // Orange
      this.doc.text('Bottom Line:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(60, 60, 60);
      const bottomLines = this.doc.splitTextToSize(aiAnalysis.bottomLine, this.contentWidth);
      this.doc.text(bottomLines, this.margin + 5, this.currentY);
      this.currentY += bottomLines.length * 5;
    }
  }

  private addLocationDetails(tract: TractResult): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 82, 156);
    this.doc.text('📍 Location Details', this.margin, this.currentY);
    this.currentY += 10;

    const locationData = [
      ['Census Tract', tract.geoid],
      ['Neighborhood', tract.nta_name || 'N/A'],
      ['Display Name', tract.display_name || 'N/A'],
      ['Tract Name', tract.tract_name || 'N/A']
    ];

    (this.doc as any).autoTable({
      startY: this.currentY,
      body: locationData,
      theme: 'plain',
      bodyStyles: { fontSize: 11, textColor: 60 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold', textColor: 40 },
        1: { cellWidth: 120 }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
  }

  private addTrendAnalysis(tract: TractResult): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 82, 156);
    this.doc.text('📈 Trend Analysis', this.margin, this.currentY);
    this.currentY += 10;

    // Crime Trends
    if (tract.crime_trend_direction) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(60, 60, 60);
      this.doc.text('Crime Trends:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      const crimeText = `Direction: ${tract.crime_trend_direction}${tract.crime_trend_change ? ` (${tract.crime_trend_change})` : ''}`;
      this.doc.text(crimeText, this.margin + 5, this.currentY);
      this.currentY += 8;
    }

    // Foot Traffic Trends
    if (tract.foot_traffic_trend_direction) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(60, 60, 60);
      this.doc.text('Foot Traffic Trends:', this.margin, this.currentY);
      this.currentY += 6;

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      const trafficText = `Direction: ${tract.foot_traffic_trend_direction}${tract.foot_traffic_trend_change ? ` (${tract.foot_traffic_trend_change})` : ''}`;
      this.doc.text(trafficText, this.margin + 5, this.currentY);
      this.currentY += 8;
    }

    // Add note if no trend data
    if (!tract.crime_trend_direction && !tract.foot_traffic_trend_direction) {
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('No trend data available for this location.', this.margin + 5, this.currentY);
      this.currentY += 8;
    }
  }

  private addPropertyLinks(tract: TractResult): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 82, 156);
    this.doc.text('🏢 Property Research Links', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    const linksText = `Explore available properties and street views for this location:

• Google Street View: Search "${tract.nta_name}, NYC" in Google Maps
• LoopNet Commercial Properties: www.loopnet.com (search by neighborhood)
• NYC Property Data: nyc.gov/property (search by address)
• Commercial Real Estate: Visit commercial brokers in the area

Geographic Coordinates: Census Tract ${tract.geoid}
Neighborhood: ${tract.nta_name || 'N/A'}`;

    const lines = this.doc.splitTextToSize(linksText, this.contentWidth);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 5;
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(this.margin, 280, this.pageWidth - this.margin, 280);
      
      // Footer text
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(120, 120, 120);
      this.doc.text('Generated by BrickWyze • NYC Commercial Intelligence Platform', this.margin, 285);
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 20, 285);
      
      // Timestamp
      const timestamp = new Date().toLocaleString();
      this.doc.text(`Generated: ${timestamp}`, this.margin, 290);
    }
  }

  // Utility methods
  private addSpace(height: number): void {
    this.currentY += height;
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > 270) { // 270mm is near bottom of A4
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  private getScoreDescription(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    if (score >= 20) return 'Below Average';
    return 'Poor';
  }

  private getDemographicsDescription(percent: number): string {
    if (percent >= 30) return 'High target match';
    if (percent >= 20) return 'Moderate match';
    if (percent >= 15) return 'Some alignment';
    return 'Limited match';
  }

  private getRentDescription(rent: number): string {
    if (rent < 30) return 'Very affordable';
    if (rent < 50) return 'Affordable';
    if (rent < 80) return 'Moderate pricing';
    if (rent < 120) return 'Premium pricing';
    return 'High-end market';
  }

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