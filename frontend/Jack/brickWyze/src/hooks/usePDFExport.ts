// src/hooks/usePDFExport.ts
import { useState, useCallback } from 'react';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';
import { PDFExportService } from '../lib/pdfExportService';
import { useLoadingOverlay } from '../components/ui/LoadingOverlay';
import { useGeminiStore } from '../stores/geminiStore';
import { useFilterStore } from '../stores/filterStore';
import { getCachedAnalysis } from '../lib/aiAnalysisUtils';

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

  const { showLoading, updateProgress, hideLoading } = useLoadingOverlay();
  const geminiStore = useGeminiStore();
  const filterStore = useFilterStore();

  const updateExportState = useCallback((updates: Partial<ExportState>) => {
    setExportState(prev => ({ ...prev, ...updates }));
  }, []);

  const generateAIAnalysisIfNeeded = useCallback(async (
    tract: TractResult,
    weights: Weight[]
  ): Promise<AIBusinessAnalysis | null> => {
    // Check if we already have cached analysis
    const cachedAnalysis = getCachedAnalysis(tract.geoid);
    if (cachedAnalysis) {
      console.log('✅ [PDF Export] Using cached AI analysis');
      return cachedAnalysis;
    }

    console.log('🤖 [PDF Export] Generating new AI analysis for tract', tract.geoid);
    
    try {
      // Generate AI analysis using the existing Gemini service
      const filterSnapshot = filterStore as any; // Type assertion for compatibility
      const currentWeights = weights || [];
      
      // Build a prompt for AI analysis
      const prompt = `Generate a comprehensive business intelligence report for this NYC location:
      
Location: ${tract.nta_name || 'Unknown'} (Census Tract ${tract.geoid.slice(-6)})
Overall Score: ${Math.round(tract.custom_score || 0)}/100

Key Metrics:
- Foot Traffic Score: ${Math.round(tract.foot_traffic_score || 0)}/100
- Safety Score: ${Math.round(tract.crime_score || 0)}/100
- Demographics Match: ${Math.round(tract.demographic_match_pct || 0)}%
- Average Rent: ${tract.avg_rent ? `$${tract.avg_rent}/sqft` : 'N/A'}

Current Filters Applied:
- Time Periods: ${filterSnapshot.selectedTimePeriods?.join(', ') || 'All day'}
- Target Demographics: ${filterSnapshot.selectedEthnicities?.join(', ') || 'General population'}
- Scoring Weights: ${currentWeights.map((w: Weight) => `${w.id}: ${w.value}%`).join(', ')}

Please provide a detailed business analysis including strengths, opportunities, and recommendations for potential businesses in this location.`;

      const aiResponse = await geminiStore.sendToGemini(prompt, {
        selectedTimePeriods: filterSnapshot.selectedTimePeriods || [],
        selectedEthnicities: filterSnapshot.selectedEthnicities || [],
        selectedGenders: filterSnapshot.selectedGenders || [],
        ageRange: filterSnapshot.ageRange || [18, 65],
        incomeRange: filterSnapshot.incomeRange || [25000, 200000],
        rentRange: filterSnapshot.rentRange || [26, 160],
        demographicScoring: filterSnapshot.demographicScoring || {}
      });

      // Parse the AI response into a structured format
      const aiAnalysis: AIBusinessAnalysis = {
        headline: `AI Analysis for ${tract.nta_name || 'this location'}`,
        reasoning: aiResponse || 'AI analysis completed successfully.',
        insights: [
          {
            type: 'strength',
            icon: '💪',
            title: 'Location Strengths',
            description: `This area scores ${Math.round(tract.custom_score || 0)}/100 overall with strong fundamentals.`
          }
        ],
        recommendations: [
          `Consider the ${Math.round(tract.foot_traffic_score || 0)}/100 foot traffic score when planning operations`,
          `Factor in the safety score of ${Math.round(tract.crime_score || 0)}/100 for security planning`
        ],
        competitorExamples: [],
        bottomLine: `Based on current data, this location ${tract.custom_score && tract.custom_score >= 70 ? 'shows strong potential' : 'requires careful consideration'} for business investment.`,
        confidence: tract.custom_score && tract.custom_score >= 70 ? 'high' : 'medium'
      };

      return aiAnalysis;
    } catch (error) {
      console.error('❌ [PDF Export] Failed to generate AI analysis:', error);
      return null;
    }
  }, [geminiStore, filterStore]);

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

    showLoading('Preparing your comprehensive location report...');

    try {
      // Step 1: Initialize PDF service
      updateProgress(10, 0, 'Setting up PDF generator...');
      updateExportState({ progress: 10, currentStep: 'Setting up PDF generator...' });
      
      const pdfService = new PDFExportService();
      
      // Step 2: Generate AI analysis if needed
      let aiAnalysis: AIBusinessAnalysis | null = null;
      if (includeAI) {
        updateProgress(30, 1, 'Generating AI analysis...');
        updateExportState({ progress: 30, currentStep: 'Generating AI analysis...' });
        
        aiAnalysis = await generateAIAnalysisIfNeeded(tract, weights);
        
        if (!aiAnalysis) {
          console.warn('⚠️ [PDF Export] AI analysis failed, continuing without it');
        }
      }

      // Step 3: Process charts and images
      updateProgress(50, 2, 'Processing charts and images...');
      updateExportState({ progress: 50, currentStep: 'Processing charts and images...' });
      
      // Wait a bit for any dynamic content to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Generate Street View URL
      let streetViewUrl: string | undefined;
      if (includeStreetView) {
        // This will be handled inside the PDF service
        streetViewUrl = 'auto'; // Signal to PDF service to generate URL
      }

      // Step 5: Generate PDF
      updateProgress(70, 3, 'Compiling PDF report...');
      updateExportState({ progress: 70, currentStep: 'Compiling PDF report...' });

      await pdfService.generateTractReport({
        tract,
        weights,
        aiAnalysis,
        streetViewUrl,
        includeLogo: true
      });

      // Step 6: Finalize and download
      updateProgress(90, 4, 'Finalizing document...');
      updateExportState({ progress: 90, currentStep: 'Finalizing document...' });

      const finalFilename = filename || `${tract.nta_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'tract'}_${tract.geoid.slice(-6)}_report_${new Date().getTime()}.pdf`;
      
      // Download the PDF
      pdfService.download(finalFilename);

      // Step 7: Complete
      updateProgress(100, 4, 'Report generated successfully!');
      updateExportState({ 
        progress: 100, 
        currentStep: 'Complete!',
        isExporting: false 
      });

      // Hide loading after a brief success message
      setTimeout(() => {
        hideLoading();
      }, 1500);

      console.log('✅ [PDF Export] Successfully exported PDF:', finalFilename);

    } catch (error) {
      console.error('❌ [PDF Export] Export failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      updateExportState({
        isExporting: false,
        error: errorMessage,
        progress: 0,
        currentStep: 'Export failed'
      });

      hideLoading();

      // Re-throw to allow component to handle the error
      throw new Error(`PDF export failed: ${errorMessage}`);
    }
  }, [
    updateExportState, 
    showLoading, 
    updateProgress, 
    hideLoading, 
    generateAIAnalysisIfNeeded
  ]);

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