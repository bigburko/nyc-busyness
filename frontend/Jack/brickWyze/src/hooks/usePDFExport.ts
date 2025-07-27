// src/hooks/usePDFExport.ts - FIXED: Actually uses AI response instead of defaults
import { useState, useCallback } from 'react';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';
import { EnhancedPDFService } from '../lib/enhancedPDFService';
import { 
  getCachedAnalysis, 
  setCachedAnalysis,
  extractTrendInsights,
  buildBusinessIntelligencePrompt,
  parseAIResponse
} from '../lib/aiAnalysisUtils';
import { useFilterStore } from '../stores/filterStore';

interface ExportOptions {
  includeAI?: boolean;
  includeCharts?: boolean;
  includeStreetView?: boolean;
  filename?: string;
}

interface ExportState {
  isExporting: boolean;
  error: string | null;
  progress: number;
  currentStep: string;
}

export function usePDFExport() {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    error: null,
    progress: 0,
    currentStep: ''
  });

  const updateExportState = useCallback((updates: Partial<ExportState>) => {
    setExportState(prev => ({ ...prev, ...updates }));
  }, []);

  const generateAIAnalysisIfNeeded = useCallback(async (
    tract: TractResult,
    weights: Weight[]
  ): Promise<AIBusinessAnalysis | null> => {
    try {
      // Check if we already have cached analysis (from AISummary component)
      const cachedAnalysis = getCachedAnalysis(tract.geoid);
      if (cachedAnalysis) {
        console.log('💾 [PDF Export] Using existing cached analysis from AISummary');
        return cachedAnalysis;
      }

      console.log('🧠 [PDF Export] Using EXACT AISummary logic for tract:', tract.geoid);
      
      // ✅ FIXED: Use exact same logic as AISummary component
      
      // Step 1: Extract trend insights (like AISummary does)
      const trendInsights = extractTrendInsights(tract);
      console.log('📊 [PDF Export] Extracted trend insights');
      
      // Step 2: Get current filter context (like AISummary does)
      const currentFilter = useFilterStore.getState();
      console.log('🎯 [PDF Export] Got filter context');
      
      // Step 3: Build sophisticated prompt (like AISummary does)
      const businessPrompt = buildBusinessIntelligencePrompt(tract, weights, trendInsights, currentFilter);
      console.log('📤 [PDF Export] Using exact AISummary prompt and context');
      
      // Step 4: Make API call with exact same format as AISummary
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: businessPrompt, // ✅ FIXED: Use sophisticated prompt
          currentState: {          // ✅ FIXED: Use full filter context
            selectedTimePeriods: currentFilter.selectedTimePeriods,
            selectedEthnicities: currentFilter.selectedEthnicities,
            selectedGenders: currentFilter.selectedGenders,
            ageRange: currentFilter.ageRange,
            incomeRange: currentFilter.incomeRange,
            rentRange: currentFilter.rentRange || [26, 160],
            demographicScoring: currentFilter.demographicScoring,
            weights: weights.map(w => ({ id: w.id, value: w.value }))
          },
          readOnly: true // ✅ FIXED: Prevents filter updates like AISummary
        }),
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 [PDF Export] AI response received via AISummary logic');
      
      // ✅ FIXED: Actually parse the AI response (this was the missing piece!)
      if (result.reply) {
        console.log('🔄 [PDF Export] Parsing AI response with parseAIResponse function...');
        
        // This is what was missing - actually using the AI response!
        const businessAnalysis = parseAIResponse(result.reply, tract);
        
        console.log('✅ [PDF Export] Successfully parsed AI response:', {
          headline: businessAnalysis.headline,
          insightsCount: businessAnalysis.insights?.length || 0,
          businessTypesCount: businessAnalysis.businessTypes?.length || 0,
          hasStrategy: !!businessAnalysis.marketStrategy,
          confidence: businessAnalysis.confidence
        });
        
        // Cache the analysis for future use
        setCachedAnalysis(tract.geoid, businessAnalysis);
        
        console.log('✅ [PDF Export] Analysis generated using AISummary logic:', businessAnalysis.headline);
        return businessAnalysis;
      } else {
        console.warn('⚠️ [PDF Export] No reply in AI response, using fallback');
        throw new Error('No AI response received');
      }

    } catch (error) {
      console.error('❌ [PDF Export] AI generation failed:', error);
      
      // Return comprehensive fallback analysis instead of null
      const fallbackAnalysis: AIBusinessAnalysis = {
        headline: `${tract.nta_name ?? 'Unknown Location'}: Business Analysis`,
        reasoning: 'Analysis generated from available tract data due to AI service limitations.',
        insights: [
          {
            type: 'strength' as const,
            icon: '📊',
            title: 'Location Data Available',
            description: `Overall score: ${Math.round(tract.custom_score ?? 0)}/100 based on comprehensive metrics including foot traffic, safety, and demographics.`
          },
          {
            type: tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'strength' : 'consideration' as const,
            icon: '🚶‍♀️',
            title: 'Foot Traffic Analysis',
            description: `Foot traffic score of ${Math.round(tract.foot_traffic_score ?? 0)}/100 ${tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'indicates strong pedestrian activity' : 'suggests moderate pedestrian activity'}.`
          },
          {
            type: tract.crime_score && tract.crime_score > 70 ? 'strength' : 'consideration' as const,
            icon: '🛡️',
            title: 'Safety Assessment',
            description: `Safety score of ${Math.round(tract.crime_score ?? 0)}/100 ${tract.crime_score && tract.crime_score > 70 ? 'indicates a secure environment' : 'requires standard safety considerations'}.`
          },
          {
            type: tract.demographic_match_pct && tract.demographic_match_pct > 60 ? 'strength' : 'consideration' as const,
            icon: '👥',
            title: 'Demographics Analysis',
            description: `${Math.round(tract.demographic_match_pct ?? 0)}% demographic alignment ${tract.demographic_match_pct && tract.demographic_match_pct > 60 ? 'shows excellent target market fit' : 'indicates potential market opportunities'}.`
          }
        ],
        businessTypes: [
          ...(tract.custom_score && tract.custom_score > 70 ? ['Premium Retail', 'Professional Services'] : []),
          ...(tract.foot_traffic_score && tract.foot_traffic_score > 60 ? ['Food & Beverage', 'Quick Service'] : []),
          ...(tract.demographic_match_pct && tract.demographic_match_pct > 60 ? ['Target Market Business'] : ['General Services']),
          'Local Business', 'Community Services'
        ],
        marketStrategy: `Focus on ${tract.custom_score && tract.custom_score > 70 ? 'premium positioning and ' : ''}leveraging the area's demographic profile. ${tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'High foot traffic supports retail and food service operations.' : 'Consider digital marketing and community engagement to build awareness.'} Monitor local competition and adapt offerings to neighborhood preferences.`,
        competitorExamples: [
          'Local retail establishments',
          'Neighborhood service providers',
          'Area restaurants and cafes',
          'Regional business locations'
        ],
        bottomLine: `This ${tract.nta_name ?? 'location'} shows ${(tract.custom_score ?? 0) >= 70 ? 'strong' : (tract.custom_score ?? 0) >= 50 ? 'moderate' : 'developing'} business potential with an overall score of ${Math.round(tract.custom_score ?? 0)}/100. ${(tract.custom_score ?? 0) >= 70 ? 'Recommended for business investment with good fundamentals.' : (tract.custom_score ?? 0) >= 50 ? 'Suitable for business with proper market strategy and positioning.' : 'Requires careful analysis and may benefit from niche market positioning.'} Consider local market dynamics and competition before proceeding.`,
        confidence: 'medium' as const
      };
      
      console.log('🚀 [PDF Export] Using comprehensive fallback analysis:', fallbackAnalysis.headline);
      return fallbackAnalysis;
    }
  }, []);

  const exportToPDF = useCallback(async (
    tract: TractResult,
    weights: Weight[],
    options: ExportOptions = {}
  ) => {
    try {
      updateExportState({
        isExporting: true,
        error: null,
        progress: 0,
        currentStep: 'Initializing export...'
      });

      console.log('📊 [PDF Export] Starting export for tract:', tract.geoid);

      let aiAnalysis: AIBusinessAnalysis | null = null;

      if (options.includeAI) {
        updateExportState({ progress: 25, currentStep: 'Generating AI analysis...' });
        aiAnalysis = await generateAIAnalysisIfNeeded(tract, weights);
        
        if (aiAnalysis) {
          console.log('✅ [Enhanced PDF] Bricky AI analysis ready:', aiAnalysis.headline);
        }
      }

      // Generate PDF
      updateExportState({ progress: 75, currentStep: 'Creating beautiful document...' });
      
      const pdfService = new EnhancedPDFService();
      const finalFilename = options.filename || 
        `${tract.nta_name?.replace(/[^a-zA-Z0-9]/g, '_') ?? 'tract'}_${tract.geoid.slice(-6)}_${options.includeAI ? 'full' : 'quick'}_report_${Date.now()}.pdf`;

      await pdfService.generateLocationReport({
        tract,
        weights,
        aiAnalysis,
        includeCharts: options.includeCharts ?? true,
        includeStreetView: options.includeStreetView ?? true,
        filename: finalFilename
      });

      updateExportState({ 
        progress: 100, 
        currentStep: 'Download complete!',
        isExporting: false 
      });

      console.log('✅ [Enhanced PDF] Beautiful PDF generated:', finalFilename);

    } catch (error) {
      console.error('❌ [PDF Export] Export failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      updateExportState({
        isExporting: false,
        error: errorMessage,
        progress: 0,
        currentStep: 'Export failed'
      });

      throw new Error(`PDF export failed: ${errorMessage}`);
    }
  }, [updateExportState, generateAIAnalysisIfNeeded]);

  const downloadWithAI = useCallback(async (
    tract: TractResult, 
    weights: Weight[]
  ): Promise<void> => {
    return exportToPDF(tract, weights, { 
      includeAI: true, 
      includeCharts: true, 
      includeStreetView: true 
    });
  }, [exportToPDF]);

  const downloadQuick = useCallback(async (
    tract: TractResult, 
    weights: Weight[]
  ): Promise<void> => {
    return exportToPDF(tract, weights, { 
      includeAI: false, 
      includeCharts: true, 
      includeStreetView: true 
    });
  }, [exportToPDF]);

  const resetExportState = useCallback(() => {
    updateExportState({
      isExporting: false,
      error: null,
      progress: 0,
      currentStep: ''
    });
  }, [updateExportState]);

  return {
    // State
    isExporting: exportState.isExporting,
    error: exportState.error,
    progress: exportState.progress,
    currentStep: exportState.currentStep,
    
    // Actions
    exportToPDF,
    downloadWithAI,
    downloadQuick,
    resetExportState
  };
}