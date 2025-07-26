// src/hooks/usePDFExport.ts
import { useState, useCallback } from 'react';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';
import { PDFExportService } from '../lib/pdfExportService';
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
  currentStep: number; // ✅ FIXED: Changed from string to number (step index)
}

export function usePDFExport() {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    error: null,
    progress: 0,
    currentStep: 0 // ✅ FIXED: Initialize as number (step index)
  });

  const geminiStore = useGeminiStore();
  const filterStore = useFilterStore();

  const updateExportState = useCallback((updates: Partial<ExportState>) => {
    setExportState(prev => ({ ...prev, ...updates }));
  }, []);

  // ✅ FIXED: Single declaration of createFallbackAnalysis
  const createFallbackAnalysis = useCallback((tract: TractResult): AIBusinessAnalysis => {
    const score = Math.round(tract.custom_score || 0);
    return {
      headline: `${tract.nta_name} Location Analysis (Score: ${score}/100)`,
      reasoning: `Analysis based on location metrics including foot traffic (${Math.round(tract.foot_traffic_score || 0)}/100), safety (${Math.round(tract.crime_score || 0)}/100), and demographics.`,
      insights: [ // ✅ FIXED: Use 'insights' not 'keyInsights'
        {
          type: 'strength',
          icon: '📊',
          title: 'Overall Viability Score',
          description: `Location scores ${score}/100 indicating ${score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'limited'} business potential.`
        },
        {
          type: 'strength',
          icon: '🚶',
          title: 'Foot Traffic Analysis',
          description: `Foot traffic level of ${Math.round(tract.foot_traffic_score || 0)}/100 suggests ${tract.foot_traffic_score && tract.foot_traffic_score >= 70 ? 'high customer flow potential' : 'steady but moderate pedestrian activity'}.`
        },
        {
          type: tract.crime_score && tract.crime_score >= 70 ? 'strength' : 'consideration',
          icon: tract.crime_score && tract.crime_score >= 70 ? '🛡️' : '⚠️',
          title: 'Safety Environment',
          description: `Safety rating of ${Math.round(tract.crime_score || 0)}/100 ${tract.crime_score && tract.crime_score >= 70 ? 'provides a secure environment for business operations' : 'requires consideration in business planning'}.`
        }
      ],
      businessTypes: score >= 70 ? 
        ['Retail Store', 'Restaurant/Café', 'Service Business', 'Professional Office'] : 
        ['Low-overhead Business', 'Online/Delivery Business', 'Appointment-based Service'],
      marketStrategy: score >= 70 ? 
        'High-potential location suitable for customer-facing businesses. Focus on maximizing foot traffic conversion and creating strong local presence.' : 
        'Consider cost-effective business models with lower dependency on foot traffic. Emphasize online presence and efficient operations.',
      competitorExamples: [],
      bottomLine: `Location ${score >= 70 ? 'shows strong potential' : score >= 50 ? 'shows moderate potential' : 'requires careful consideration'} for business investment. ${tract.avg_rent ? `Rent of $${tract.avg_rent.toFixed(2)}/sqft should be factored into ROI calculations.` : ''}`,
      confidence: score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low'
    };
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
      // ✅ FIXED: Use the correct sendToGemini method
      const prompt = `Generate a comprehensive business intelligence report for this NYC location:
      
Location: ${tract.nta_name || 'Unknown'} (Census Tract ${tract.geoid.slice(-6)})
Overall Score: ${Math.round(tract.custom_score || 0)}/100

Key Metrics:
- Foot Traffic Score: ${Math.round(tract.foot_traffic_score || 0)}/100
- Safety Score: ${Math.round(tract.crime_score || 0)}/100
- Demographics Match: ${Math.round(tract.demographic_match_pct || 0)}%
- Average Rent: ${tract.avg_rent ? `$${tract.avg_rent.toFixed(2)}/sqft` : 'N/A'}

Please provide a JSON response with:
{
  "headline": "compelling business-focused title",
  "reasoning": "analysis methodology and context",
  "insights": [
    {"type": "strength|opportunity|consideration", "icon": "emoji", "title": "insight title", "description": "detailed description"}
  ],
  "businessTypes": ["recommended business type 1", "type 2"],
  "marketStrategy": "strategic recommendations",
  "competitorExamples": ["example 1", "example 2"],
  "bottomLine": "final assessment and recommendation",
  "confidence": "high|medium|low"
}`;

      // Call the AI service using sendToGemini
      const response = await geminiStore.sendToGemini(prompt);
      
      if (response) {
        console.log('✅ [PDF Export] AI analysis generated successfully');
        
        // Parse the response and convert to AIBusinessAnalysis format
        try {
          const parsedResponse = JSON.parse(response);
          const aiAnalysis: AIBusinessAnalysis = {
            headline: parsedResponse.headline || `${tract.nta_name} Business Analysis`,
            reasoning: parsedResponse.reasoning || 'Analysis based on location data and market trends.',
            insights: parsedResponse.insights || [ // ✅ FIXED: Use 'insights' not 'keyInsights'
              {
                type: 'strength',
                icon: '📈',
                title: 'Data-Driven Analysis',
                description: 'Comprehensive analysis based on foot traffic, safety, and demographic data.'
              }
            ],
            businessTypes: parsedResponse.businessTypes || ['General Business', 'Retail', 'Service'],
            marketStrategy: parsedResponse.marketStrategy || 'Focus on local market needs and competitive positioning.',
            competitorExamples: parsedResponse.competitorExamples || [],
            bottomLine: parsedResponse.bottomLine || `Location shows ${tract.custom_score && tract.custom_score >= 70 ? 'strong potential' : 'moderate potential'} for business investment.`,
            confidence: parsedResponse.confidence || (tract.custom_score && tract.custom_score >= 70 ? 'high' : 'medium')
          };
          
          return aiAnalysis;
        } catch (parseError) {
          console.warn('⚠️ [PDF Export] Failed to parse AI response as JSON, using fallback');
          // Create a fallback analysis based on the tract data
          return createFallbackAnalysis(tract);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ [PDF Export] Failed to generate AI analysis:', error);
      return null;
    }
  }, [geminiStore, createFallbackAnalysis]);

  const exportToPDF = useCallback(async (
    tract: TractResult, 
    weights: Weight[], 
    options: ExportOptions = {}
  ): Promise<void> => {
    const { includeAI = false, includeCharts = true, includeStreetView = true } = options;

    try {
      console.log('📄 [PDF Export] Starting export process...');
      
      // Step 0: Initialize
      updateExportState({ 
        isExporting: true, 
        error: null, 
        progress: 0, 
        currentStep: 0
      });

      // Step 1: Analyzing location data
      updateExportState({ progress: 10, currentStep: 0 });
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX

      let aiAnalysis: AIBusinessAnalysis | null = null;
      
      if (includeAI) {
        // Step 2: Processing AI insights
        updateExportState({ progress: 25, currentStep: 1 });
        console.log('🤖 [PDF Export] Generating AI analysis...');
        aiAnalysis = await generateAIAnalysisIfNeeded(tract, weights);
      }

      // Step 3: Capturing charts and images
      updateExportState({ progress: 50, currentStep: 2 });
      console.log('📊 [PDF Export] Initializing PDF service...');
      
      // Initialize PDF service
      const pdfService = new PDFExportService();
      
      // Step 4: Compiling PDF document
      updateExportState({ progress: 75, currentStep: 3 });
      console.log('📋 [PDF Export] Generating PDF...');
      
      // Generate filename
      const baseFilename = tract.nta_name || 'Location';
      const suffix = includeAI ? 'Full_Report' : 'Quick_Report';
      const date = new Date().toISOString().split('T')[0];
      const filename = `${baseFilename}_${suffix}_${date}.pdf`;
      
      // ✅ FIXED: Use the correct generateTractReport method
      await pdfService.generateTractReport(tract, weights, aiAnalysis, filename);
      
      // Step 5: Complete
      updateExportState({ 
        progress: 100, 
        currentStep: 4,
        isExporting: false 
      });

      console.log('✅ [PDF Export] Successfully exported PDF:', filename);

      // Reset after brief delay
      setTimeout(() => {
        updateExportState({
          progress: 0,
          currentStep: 0
        });
      }, 1000);

    } catch (error) {
      console.error('❌ [PDF Export] Export failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      updateExportState({
        isExporting: false,
        error: errorMessage,
        progress: 0,
        currentStep: 0
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
      currentStep: 0
    });
  }, [updateExportState]);

  return {
    // State
    isExporting: exportState.isExporting,
    error: exportState.error,
    progress: exportState.progress,
    currentStep: exportState.currentStep, // ✅ FIXED: Now returns number (step index)
    
    // Actions
    exportToPDF,
    downloadWithAI,
    downloadQuick,
    resetExportState
  };
}