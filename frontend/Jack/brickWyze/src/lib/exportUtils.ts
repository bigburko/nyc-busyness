// src/lib/exportUtils.ts - Fixed with proper imports
import { EnhancedPDFService } from './enhancedPDFService';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';

export async function exportPDFWithAllCharts(
  tract: TractResult,
  weights: Weight[],
  aiAnalysis?: AIBusinessAnalysis,
  setIsExporting?: (exporting: boolean) => void
) {
  try {
    console.log('📊 [Export] Starting PDF export with all charts...');
    
    if (setIsExporting) {
      setIsExporting(true);
    }
    
    // Wait for all charts to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate PDF using enhanced service
    const enhancedService = new EnhancedPDFService();
    await enhancedService.generateLocationReport({
      tract,
      weights,
      aiAnalysis,
      includeCharts: true,
      includeStreetView: true,
      filename: `${tract.nta_name?.replace(/[^a-zA-Z0-9]/g, '_')}_${tract.geoid.slice(-6)}_charts_${Date.now()}.pdf`
    });
    
    console.log('✅ [Export] PDF generated successfully');
    
  } catch (error) {
    console.error('❌ [Export] PDF generation failed:', error);
    throw error;
  } finally {
    if (setIsExporting) {
      setIsExporting(false);
    }
  }
}