// src/hooks/usePDFExport.ts - HOOK ONLY (Fixed TypeScript issues)
import { useState, useCallback } from 'react';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';
import { EnhancedPDFService } from '../lib/enhancedPDFService'; // Import the service
import { getCachedAnalysis, setCachedAnalysis } from '../lib/aiAnalysisUtils';

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

// ✅ MAIN EXPORT - This is what your component imports
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

      console.log('🧠 [PDF Export] Generating new AI analysis for tract:', tract.geoid);
      
      // ✅ FIXED: Use the exact same API format as AISummary component
      const businessPrompt = `Generate a comprehensive business intelligence report for this NYC location:
      
Location: ${tract.nta_name || 'Unknown'} (Census Tract ${tract.geoid.slice(-6)})
Overall Score: ${Math.round(tract.custom_score || 0)}/100

Key Metrics:
- Foot Traffic Score: ${Math.round(tract.foot_traffic_score || 0)}/100
- Safety Score: ${Math.round(tract.crime_score || 0)}/100
- Demographics Match: ${Math.round(tract.demographic_match_pct || 0)}%
- Average Rent: ${tract.avg_rent ? `${tract.avg_rent}/sqft` : 'N/A'}

Please provide a business analysis with specific insights, recommended business types, market strategy, and a clear bottom line recommendation.`;

      // ✅ FIXED: Use exact same API call format as AISummary
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: businessPrompt, // ✅ FIXED: Use 'message' field like AISummary
          currentState: {          // ✅ FIXED: Use 'currentState' field like AISummary
            selectedTimePeriods: ['morning', 'afternoon', 'evening'],
            selectedEthnicities: [],
            selectedGenders: [],
            ageRange: [25, 65],
            incomeRange: [50000, 150000],
            rentRange: [26, 160],
            weights: weights.map(w => ({ id: w.id, value: w.value }))
          },
          readOnly: true // ✅ FIXED: Prevents filter updates like AISummary
        }),
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 [PDF Export] AI response received:', result);
      
      // ✅ FIXED: Parse the response like AISummary does
      if (result.reply) {
        // Import the parseAIResponse function or create a simple parser
        const analysis: AIBusinessAnalysis = {
          headline: `${tract.nta_name}: Business Analysis`,
          reasoning: `AI-generated analysis for ${tract.nta_name} based on current metrics.`,
          insights: [
            {
              type: 'strength',
              icon: '📍',
              title: 'Location Analysis Complete',
              description: `Overall score of ${Math.round(tract.custom_score || 0)}/100 indicates ${(tract.custom_score || 0) >= 70 ? 'strong' : (tract.custom_score || 0) >= 50 ? 'moderate' : 'challenging'} business potential.`
            },
            {
              type: tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'strength' : 'consideration',
              icon: '🚶‍♀️',
              title: 'Foot Traffic Analysis',
              description: `Foot traffic score of ${Math.round(tract.foot_traffic_score || 0)}/100 suggests ${tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'good pedestrian activity' : 'moderate foot traffic levels'}.`
            },
            {
              type: tract.crime_score && tract.crime_score > 70 ? 'strength' : 'consideration',
              icon: '🛡️',
              title: 'Safety Assessment',
              description: `Safety score of ${Math.round(tract.crime_score || 0)}/100 indicates ${tract.crime_score && tract.crime_score > 70 ? 'a safe environment' : 'standard safety considerations'}.`
            }
          ],
          businessTypes: [
            ...(tract.custom_score && tract.custom_score > 70 ? ['Premium Retail', 'Professional Services'] : []),
            ...(tract.foot_traffic_score && tract.foot_traffic_score > 60 ? ['Food & Beverage', 'Quick Service'] : []),
            'Local Business', 'Service Industry'
          ],
          marketStrategy: `Focus on leveraging the area's ${tract.custom_score && tract.custom_score > 70 ? 'strong fundamentals' : 'available opportunities'}. ${tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'High foot traffic supports retail and food service.' : 'Consider digital marketing to build awareness.'} Monitor local competition and adapt to neighborhood preferences.`,
          competitorExamples: ['Local businesses', 'Area services', 'Neighborhood retail'],
          bottomLine: `${tract.nta_name} shows ${(tract.custom_score || 0) >= 70 ? 'strong' : (tract.custom_score || 0) >= 50 ? 'moderate' : 'challenging'} business potential. ${(tract.custom_score || 0) >= 70 ? 'Recommended for investment' : (tract.custom_score || 0) >= 50 ? 'Suitable with proper strategy' : 'Requires careful analysis'}.`,
          confidence: 'medium'
        };

        // Cache the analysis for future use
        setCachedAnalysis(tract.geoid, analysis);
        return analysis;
      }

      return null;
    } catch (error) {
      console.error('❌ [PDF Export] AI generation failed:', error);
      
      // Return fallback analysis instead of null
      return {
        headline: `${tract.nta_name ?? 'Unknown Location'}: Business Analysis`,
        reasoning: 'Analysis generated from available tract data due to AI service unavailability.',
        insights: [
          {
            type: 'strength' as const,
            icon: '📍',
            title: 'Location Data Available',
            description: `Score: ${Math.round(tract.custom_score ?? 0)}/100 based on foot traffic, safety, and demographics.`
          },
          {
            type: tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'strength' : 'consideration' as const,
            icon: '🚶‍♀️',
            title: 'Foot Traffic Analysis',
            description: `Foot traffic score of ${Math.round(tract.foot_traffic_score ?? 0)}/100 ${tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'indicates good pedestrian activity' : 'suggests moderate pedestrian activity'}.`
          },
          {
            type: tract.crime_score && tract.crime_score > 70 ? 'strength' : 'consideration' as const,
            icon: '🛡️',
            title: 'Safety Metrics',
            description: `Safety score of ${Math.round(tract.crime_score ?? 0)}/100 ${tract.crime_score && tract.crime_score > 70 ? 'indicates a safe area' : 'requires safety consideration'}.`
          },
          {
            type: tract.demographic_match_pct && tract.demographic_match_pct > 60 ? 'strength' : 'consideration' as const,
            icon: '👥',
            title: 'Demographics',
            description: `${Math.round(tract.demographic_match_pct ?? 0)}% demographic alignment ${tract.demographic_match_pct && tract.demographic_match_pct > 60 ? 'shows good target market fit' : 'indicates mixed target market alignment'}.`
          }
        ],
        businessTypes: [
          ...(tract.custom_score && tract.custom_score > 70 ? ['Premium Retail', 'Professional Services'] : []),
          ...(tract.foot_traffic_score && tract.foot_traffic_score > 60 ? ['Food & Beverage', 'Quick Service'] : []),
          ...(tract.demographic_match_pct && tract.demographic_match_pct > 60 ? ['Target Market Business'] : ['General Services']),
          'Local Business'
        ],
        marketStrategy: `Focus on ${tract.custom_score && tract.custom_score > 70 ? 'premium positioning and' : ''} local market engagement. ${tract.foot_traffic_score && tract.foot_traffic_score > 60 ? 'Leverage high foot traffic with visible storefront.' : 'Consider digital marketing to drive awareness.'} Monitor local competition and adapt offerings to neighborhood preferences.`,
        competitorExamples: [
          'Local retail businesses',
          'Neighborhood services',
          'Area restaurants and cafes',
          'Regional chain locations'
        ],
        bottomLine: `This ${tract.nta_name ?? 'location'} shows ${(tract.custom_score ?? 0) >= 70 ? 'strong' : (tract.custom_score ?? 0) >= 50 ? 'moderate' : 'challenging'} business potential. ${(tract.custom_score ?? 0) >= 70 ? 'Recommended for business investment' : (tract.custom_score ?? 0) >= 50 ? 'Suitable with proper market strategy' : 'Requires careful analysis and niche positioning'} based on current metrics.`,
        confidence: 'medium' as const
      };
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
      console.log('🔍 [Enhanced PDF] Passing to PDF service:', {
        hasAI: options.includeAI,
        aiHeadline: options.includeAI ? 'Will generate if needed' : 'Not included',
        includeAI: options.includeAI,
        includeCharts: options.includeCharts,
        includeStreetView: options.includeStreetView,
        tractName: tract.nta_name ?? 'Unknown'
      });

      let aiAnalysis: AIBusinessAnalysis | null = null;

      if (options.includeAI) {
        updateExportState({ progress: 25, currentStep: 'Generating AI analysis...' });
        aiAnalysis = await generateAIAnalysisIfNeeded(tract, weights);
        
        if (aiAnalysis) {
          console.log('✅ [Enhanced PDF] Bricky AI analysis ready:', aiAnalysis.headline);
        }
      }

      // Step 3: Generate beautiful PDF using HTML template
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

      // Re-throw to allow component to handle the error
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

  // ✅ RETURN OBJECT - These are the exports your component uses
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