// src/hooks/usePDFExport.ts - Enhanced with Forced Bricky AI Generation
import { useState, useCallback } from 'react';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis, FilterStoreSlice } from '../types/AIAnalysisTypes';
import { PDFExportService } from '../lib/pdfExportService';
import { useGeminiStore } from '../stores/geminiStore';
import { useFilterStore } from '../stores/filterStore';

// Import the exact same AI utility functions that AISummary uses
import { 
  getCachedAnalysis,
  setCachedAnalysis,
  extractTrendInsights,
  buildBusinessIntelligencePrompt,
  parseAIResponse
} from '../lib/aiAnalysisUtils';

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

  const geminiStore = useGeminiStore();
  const filterStore = useFilterStore();

  const updateExportState = useCallback((updates: Partial<ExportState>) => {
    setExportState(prev => ({ ...prev, ...updates }));
  }, []);

  // 🚀 EXACT SAME AI GENERATION as AISummary component
  const forceBrickyAIGeneration = useCallback(async (
    tract: TractResult,
    weights: Weight[]
  ): Promise<AIBusinessAnalysis | null> => {
    const tractId = tract.geoid;
    
    console.log('🧠 [PDF Export] Using EXACT AISummary logic for tract:', tractId);
    
    // Step 1: Check cache first (identical to AISummary)
    const cachedAnalysis = getCachedAnalysis(tractId);
    if (cachedAnalysis) {
      console.log('💾 [PDF Export] Using existing cached analysis from AISummary');
      return cachedAnalysis;
    }

    // Step 2: Generate using EXACT same logic as AISummary component
    try {
      console.log('🔄 [PDF Export] Cache miss - generating with AISummary logic...');
      
      // EXACT SAME: Create filter snapshots (identical to AISummary)
      const currentFilter = { ...filterStore as FilterStoreSlice };
      const currentWeights = [...weights];
      
      // EXACT SAME: Use identical utility functions as AISummary
      const trendInsights = extractTrendInsights(tract);
      const businessPrompt = buildBusinessIntelligencePrompt(tract, currentWeights, trendInsights, currentFilter);
      
      console.log('📤 [PDF Export] Using EXACT same Gemini route as AISummary');
      
      // EXACT SAME: callGeminiReadOnly implementation from AISummary
      const callGeminiReadOnly = async (prompt: string, context: Record<string, unknown>): Promise<string> => {
        console.log('🔒 [PDF Export] Using AISummary Gemini route in READ-ONLY mode - NO filter updates');
        
        try {
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: prompt,
              currentState: context,
              readOnly: true // 🔒 CRITICAL: This prevents filter updates
            })
          });

          if (!response.ok) {
            throw new Error(`Gemini API failed with status ${response.status}`);
          }

          const data = await response.json();
          console.log('🔒 [PDF Export] Read-only response received:', data.readOnlyMode);
          
          return data.reply || 'Unable to generate analysis';
          
        } catch (error) {
          console.error('❌ [PDF Export] Read-only API call failed:', error);
          throw error;
        }
      };
      
      // EXACT SAME: API call with identical context as AISummary
      const aiResponse = await callGeminiReadOnly(businessPrompt, {
        selectedTimePeriods: currentFilter.selectedTimePeriods,
        selectedEthnicities: currentFilter.selectedEthnicities,
        selectedGenders: currentFilter.selectedGenders,
        ageRange: currentFilter.ageRange,
        incomeRange: currentFilter.incomeRange,
        rentRange: currentFilter.rentRange || [26, 160],
        demographicScoring: currentFilter.demographicScoring
      });
      
      console.log('📥 [PDF Export] Received AISummary-style response length:', aiResponse.length);
      console.log('🔒 [PDF Export] NO FILTER UPDATES APPLIED - completely isolated');
      
      // EXACT SAME: Parse using identical function as AISummary
      const businessAnalysis = parseAIResponse(aiResponse, tract);
      
      // EXACT SAME: Cache using identical function as AISummary
      setCachedAnalysis(tractId, businessAnalysis);
      
      console.log('✅ [PDF Export] AISummary-style analysis complete:', businessAnalysis.headline);
      
      return businessAnalysis;
      
    } catch (error) {
      console.error('❌ [PDF Export] Failed to generate AISummary-style analysis:', error);
      
      // Return a fallback analysis rather than null
      return {
        headline: `📍 Business Analysis for ${tract.nta_name ?? 'Unknown Location'}`,
        reasoning: `Analysis based on location metrics for this NYC area. Overall score: ${Math.round(tract.custom_score || 0)}/100`,
        insights: [
          {
            type: 'consideration' as const,
            icon: '📊',
            title: 'Location Data Available',
            description: `This location has comprehensive data with ${Math.round(tract.custom_score || 0)}/100 overall score.`
          }
        ],
        businessTypes: ['Consider detailed market research for specific recommendations'],
        marketStrategy: 'Conduct thorough market analysis based on local conditions and competition.',
        competitorExamples: [],
        bottomLine: 'Manual market research recommended for this location.',
        confidence: 'medium' as const
      };
    }
  }, [filterStore]);

  // Enhanced PDF export with forced AI generation
  const exportToPDF = useCallback(async (
    tract: TractResult,
    weights: Weight[],
    options: ExportOptions = {}
  ): Promise<void> => {
    const {
      includeAI = true,
      includeCharts = true,
      includeStreetView = true,
      filename
    } = options;

    // Reset state
    updateExportState({ 
      isExporting: true, 
      error: null, 
      progress: 0, 
      currentStep: 'Initializing export...' 
    });

    try {
      console.log('📄 [PDF Export] Starting enhanced export for:', tract.nta_name);
      
      // Step 1: Initialize PDF service
      updateExportState({ progress: 10, currentStep: 'Setting up PDF generator...' });
      const pdfService = new PDFExportService();
      
      // Step 2: Force Bricky AI analysis if needed
      let aiAnalysis: AIBusinessAnalysis | null = null;
      if (includeAI) {
        updateExportState({ progress: 30, currentStep: 'Generating Bricky AI analysis...' });
        
        // 🚀 FORCE Bricky AI to run using exact same logic
        aiAnalysis = await forceBrickyAIGeneration(tract, weights);
        
        if (aiAnalysis) {
          console.log('✅ [PDF Export] Bricky AI analysis ready:', aiAnalysis.headline);
        } else {
          console.warn('⚠️ [PDF Export] AI analysis failed, continuing without it');
        }
      }

      // Step 3: Process charts and images
      updateExportState({ progress: 50, currentStep: 'Processing charts and images...' });
      
      // Wait a bit for any dynamic content to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Generate PDF using the actual working interface (options-based)
      updateExportState({ progress: 70, currentStep: 'Compiling PDF report...' });

      const finalFilename = filename || 
        `${(tract.nta_name ?? 'tract').replace(/[^a-zA-Z0-9]/g, '_')}_${tract.geoid.slice(-6)}_${includeAI ? 'full' : 'quick'}_report_${new Date().getTime()}.pdf`;

      // Step 5: Generate PDF using the existing generateLocationReport method
      updateExportState({ progress: 90, currentStep: 'Finalizing document...' });
      
      // ✅ FIXED: Use existing generateLocationReport method with proper options object
      await pdfService.generateLocationReport({
        tract,
        weights,
        aiAnalysis,
        includeCharts,
        includeStreetView,
        filename: finalFilename
      });

      // Step 6: Complete (PDF already saved by generateLocationReport)
      updateExportState({ 
        progress: 100, 
        currentStep: 'Report generated successfully!',
        isExporting: false 
      });

      console.log('✅ [PDF Export] Successfully exported PDF with Bricky AI:', finalFilename);

      // Reset state after showing success
      setTimeout(() => {
        updateExportState({
          isExporting: false,
          error: null,
          progress: 0,
          currentStep: ''
        });
      }, 2000);

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
  }, [updateExportState, forceBrickyAIGeneration]);

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
    resetExportState,
    
    // New: Direct access to force AI generation
    forceBrickyAIGeneration
  };
}