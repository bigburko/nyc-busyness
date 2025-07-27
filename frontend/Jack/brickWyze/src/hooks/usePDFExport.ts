// src/hooks/usePDFExport.ts
import { useState, useCallback } from 'react';
import { TractResult } from '../types/TractTypes';
import { Weight } from '../types/WeightTypes';
import { AIBusinessAnalysis } from '../types/AIAnalysisTypes';
import { PDFExportService } from '../lib/pdfExportService';
import { useFilterStore } from '../stores/filterStore';
import { getCachedAnalysis } from '../lib/aiAnalysisUtils';

interface ExportState {
  isExporting: boolean;
  error: string | null;
  progress: number;
  currentStep: string;
}

interface ExportOptions {
  includeAI?: boolean;
  includeCharts?: boolean;
  includeStreetView?: boolean;
  filename?: string;
}

export function usePDFExport() {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    error: null,
    progress: 0,
    currentStep: ''
  });

  const filterStore = useFilterStore();

  const updateExportState = useCallback((updates: Partial<ExportState>) => {
    setExportState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetExportState = useCallback(() => {
    setExportState({
      isExporting: false,
      error: null,
      progress: 0,
      currentStep: ''
    });
  }, []);

  const generateAIAnalysisIfNeeded = useCallback(async (
    tract: TractResult,
    weights: Weight[]
  ): Promise<AIBusinessAnalysis | null> => {
    try {
      // Check if we already have cached analysis
      const cachedAnalysis = getCachedAnalysis(tract.geoid);
      if (cachedAnalysis) {
        console.log('✅ [PDF Export] Using cached AI analysis');
        return cachedAnalysis;
      }

      console.log('🤖 [PDF Export] Generating new AI analysis for tract', tract.geoid);
      
      updateExportState({
        progress: 20,
        currentStep: 'Generating AI business analysis...'
      });

      // Generate AI analysis prompt
      const prompt = `Generate a comprehensive business intelligence report for this NYC location:
      
Location: ${tract.nta_name || 'Unknown'} (Census Tract ${tract.geoid.slice(-6)})
Overall Score: ${Math.round(tract.custom_score || 0)}/100

Key Metrics:
- Foot Traffic Score: ${Math.round(tract.foot_traffic_score || 0)}/100
- Safety Score: ${Math.round(tract.crime_score || 0)}/100
- Demographics Match: ${Math.round(tract.demographic_match_pct || 0)}%
- Average Rent: ${tract.avg_rent ? `$${tract.avg_rent}/sqft` : 'N/A'}

Current Filter Weights:
${weights.map(w => `- ${w.id}: ${w.value}%`).join('\n')}

Please provide:
1. Business opportunity assessment
2. Target customer analysis
3. Competition landscape
4. Location advantages/challenges
5. Specific business type recommendations
6. Market entry strategy

Format as structured business analysis with clear sections.`;

      // Make API call to Gemini (simplified - you'd integrate with your existing Gemini service)
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BrickWyze Business Analysis'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp',
          messages: [
            {
              role: 'system',
              content: 'You are a business intelligence expert specializing in NYC commercial real estate. Provide detailed, actionable analysis.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No AI response received');
      }

      // Parse the response into structured analysis
      const analysis: AIBusinessAnalysis = {
        headline: `Business Intelligence for ${tract.nta_name}`,
        reasoning: aiResponse.substring(0, 300) + '...',
        insights: [
          {
            type: 'strength',
            icon: '💪',
            title: 'Location Analysis',
            description: `Overall score of ${Math.round(tract.custom_score || 0)}/100 indicates ${
              tract.custom_score >= 70 ? 'strong' : tract.custom_score >= 50 ? 'moderate' : 'challenging'
            } business potential.`
          }
        ],
        businessTypes: ['Retail', 'Food Service', 'Professional Services'],
        marketStrategy: 'Focus on local demographics and foot traffic patterns.',
        competitorExamples: [],
        bottomLine: aiResponse.substring(aiResponse.length - 200),
        confidence: 'medium'
      };

      updateExportState({
        progress: 40,
        currentStep: 'AI analysis complete - Processing data...'
      });

      return analysis;

    } catch (error) {
      console.error('❌ [PDF Export] AI analysis failed:', error);
      updateExportState({
        error: `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        currentStep: 'Error generating AI analysis'
      });
      
      // Return fallback analysis
      return {
        headline: `Location Analysis for ${tract.nta_name}`,
        reasoning: 'Basic analysis based on available metrics.',
        insights: [
          {
            type: 'strength',
            icon: '📊',
            title: 'Data Available',
            description: `Location has ${Math.round(tract.custom_score || 0)}/100 overall score.`
          }
        ],
        businessTypes: ['General Business'],
        marketStrategy: 'Conduct detailed market research.',
        competitorExamples: [],
        bottomLine: 'Consider additional research before proceeding.',
        confidence: 'low'
      };
    }
  }, [updateExportState]);

  const exportToPDF = useCallback(async (
    tract: TractResult,
    weights: Weight[],
    options: ExportOptions = {}
  ) => {
    try {
      updateExportState({
        isExporting: true,
        error: null,
        progress: 10,
        currentStep: 'Initializing export...'
      });

      let aiAnalysis: AIBusinessAnalysis | null = null;

      // Generate AI analysis if requested
      if (options.includeAI) {
        aiAnalysis = await generateAIAnalysisIfNeeded(tract, weights);
        if (exportState.error) return; // Exit if AI generation failed critically
      }

      updateExportState({
        progress: 60,
        currentStep: 'Preparing PDF document...'
      });

      // Generate the PDF
      const pdfService = new PDFExportService();
      const filename = options.filename || `location-report-${tract.geoid}.pdf`;

      updateExportState({
        progress: 80,
        currentStep: 'Compiling final report...'
      });

      await pdfService.generateLocationReport({
        tract,
        weights,
        aiAnalysis,
        includeCharts: options.includeCharts ?? true,
        includeStreetView: options.includeStreetView ?? true,
        filename
      });

      updateExportState({
        progress: 100,
        currentStep: 'Download complete!'
      });

      // Reset after a short delay
      setTimeout(() => {
        resetExportState();
      }, 2000);

    } catch (error) {
      console.error('❌ [PDF Export] Export failed:', error);
      updateExportState({
        error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        currentStep: 'Export failed'
      });
    }
  }, [exportState.error, generateAIAnalysisIfNeeded, resetExportState, updateExportState]);

  // Convenience methods for different export types
  const downloadWithAI = useCallback((tract: TractResult, weights: Weight[]) => {
    return exportToPDF(tract, weights, {
      includeAI: true,
      includeCharts: true,
      includeStreetView: true,
      filename: `full-location-report-${tract.geoid}.pdf`
    });
  }, [exportToPDF]);

  const downloadQuick = useCallback((tract: TractResult, weights: Weight[]) => {
    return exportToPDF(tract, weights, {
      includeAI: false,
      includeCharts: true,
      includeStreetView: true,
      filename: `quick-location-report-${tract.geoid}.pdf`
    });
  }, [exportToPDF]);

  return {
    // State
    isExporting: exportState.isExporting,
    error: exportState.error,
    progress: exportState.progress,
    currentStep: exportState.currentStep,
    
    // Actions
    downloadWithAI,
    downloadQuick,
    resetExportState,
    
    // Advanced
    exportToPDF
  };
}