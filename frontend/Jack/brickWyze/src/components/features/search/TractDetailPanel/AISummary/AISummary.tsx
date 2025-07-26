// src/components/features/search/TractDetailPanel/AISummary.tsx
'use client';

import { Box, VStack, Text, HStack, Spinner } from '@chakra-ui/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TractResult } from '../../../../../types/TractTypes';
import { useFilterStore } from '../../../../../stores/filterStore';
import { useGeminiStore } from '../../../../../stores/geminiStore';
import { Weight } from '../../../../../types/WeightTypes';

// Import modular components
import { AIAnalysisHeader } from './AIAnalysisHeader';
import { HeadlineSection } from './HeadlineSection';
import { BusinessInsightCard } from './BusinessInsightCard';
import { BusinessRecommendations } from './BusinessRecommendations';
import { BottomLineSection } from './BottomLineSection';

// Import utility functions and types
import { 
  AIBusinessAnalysis, 
  FilterStoreSlice 
} from '../../../../../types/AIAnalysisTypes';

import { 
  getCachedAnalysis,
  setCachedAnalysis,
  extractTrendInsights,
  buildBusinessIntelligencePrompt,
  parseAIResponse,
  getWeightLabel
} from '../../../../../lib/aiAnalysisUtils';

interface AISummaryProps {
  tract: TractResult;
  weights: Weight[];
  isVisible?: boolean; // Only trigger when visible/scrolled
}

export function AISummary({ tract, weights, isVisible = false }: AISummaryProps) {
  const filterStore = useFilterStore();
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  
  const [analysis, setAnalysis] = useState<AIBusinessAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  
  // Stable snapshot of filter data to prevent constant re-renders
  const filterSnapshot = useRef<FilterStoreSlice | null>(null);
  const weightsSnapshot = useRef<Weight[] | null>(null);
  
  const generateAIAnalysis = useCallback(async () => {
    const tractId = tract.geoid;
    
    // First check cache
    const cachedResult = getCachedAnalysis(tractId);
    if (cachedResult) {
      setAnalysis(cachedResult);
      setHasTriggered(true);
      return;
    }
    
    // Prevent multiple API calls for the same tract
    if (loading || hasTriggered || !isVisible) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setHasTriggered(true);
      
      console.log('🧠 [AI Summary] Starting analysis for tract:', tractId);
      
      // Use snapshots to avoid dependency issues
      const currentFilter = filterSnapshot.current || (filterStore as FilterStoreSlice);
      const currentWeights = weightsSnapshot.current || weights;
      
      // Extract trend insights using TrendIndicators logic
      const trendInsights = extractTrendInsights(tract);
      
      // Build comprehensive business intelligence prompt
      const businessPrompt = buildBusinessIntelligencePrompt(tract, currentWeights, trendInsights, currentFilter);
      
      console.log('📤 [AI Summary] Sending business intelligence prompt to Gemini');
      
      // Convert Weight[] to expected format for sendToGemini
      const geminiWeights = currentWeights.map(w => ({ 
        id: w.id, 
        value: w.value, 
        label: getWeightLabel(w),
        icon: '', 
        color: '' 
      }));
      
      // Call Gemini API for real AI analysis
      const aiResponse = await sendToGemini(businessPrompt, {
        weights: geminiWeights,
        selectedTimePeriods: currentFilter.selectedTimePeriods,
        selectedEthnicities: currentFilter.selectedEthnicities,
        selectedGenders: currentFilter.selectedGenders,
        ageRange: currentFilter.ageRange,
        incomeRange: currentFilter.incomeRange,
        rentRange: currentFilter.rentRange || [26, 160],
        demographicScoring: currentFilter.demographicScoring
      });
      
      console.log('📥 [AI Summary] Received AI response length:', aiResponse.length);
      
      // Parse the AI response into structured business analysis
      const businessAnalysis = parseAIResponse(aiResponse, tract);
      
      // Cache the result for future use
      setCachedAnalysis(tractId, businessAnalysis);
      
      setAnalysis(businessAnalysis);
      
      console.log('✅ [AI Summary] Analysis complete:', businessAnalysis.headline);
      
    } catch (err) {
      console.error('❌ [AI Summary] Error generating analysis:', err);
      setError('Failed to generate AI business analysis');
      setHasTriggered(false); // Allow retry on error
    } finally {
      setLoading(false);
    }
  }, [tract.geoid, isVisible, loading, hasTriggered, sendToGemini]);
  
  // Update snapshots when props change but only once
  useEffect(() => {
    filterSnapshot.current = filterStore as FilterStoreSlice;
    weightsSnapshot.current = weights;
  }, [filterStore, weights]);
  
  // Reset state when tract changes
  useEffect(() => {
    const tractId = tract.geoid;
    
    // Check if we have cached results first
    const cachedResult = getCachedAnalysis(tractId);
    if (cachedResult) {
      console.log('💾 [AI Summary] Loading cached analysis for tract:', tractId);
      setAnalysis(cachedResult);
      setHasTriggered(true);
      setError(null);
      setLoading(false);
    } else {
      // Reset for new tract
      setHasTriggered(false);
      setAnalysis(null);
      setError(null);
      setLoading(false);
    }
  }, [tract.geoid]);
  
  // Only trigger when becomes visible and hasn't been triggered yet
  useEffect(() => {
    if (isVisible && !hasTriggered && !loading && !analysis) {
      generateAIAnalysis();
    }
  }, [isVisible, hasTriggered, loading, analysis, generateAIAnalysis]);
  
  // Show placeholder when not visible yet
  if (!isVisible) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <VStack spacing={4} align="center" py={8}>
          <VStack spacing={2}>
            <HStack spacing={3} align="center">
              <Text fontSize="lg">🦉</Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Scroll down to see Bricky's AI business analysis
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </Box>
    );
  }
  
  if (loading) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <VStack spacing={4} align="center" py={8}>
          <HStack spacing={3}>
            <Spinner size="sm" color="#FF492C" />
            <Text fontSize="md">🦉</Text>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              Bricky is crafting your personalized analysis...
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.500" textAlign="center" maxW="300px">
            Analyzing location data and your business needs to provide tailored insights
          </Text>
        </VStack>
      </Box>
    );
  }
  
  if (error || !analysis) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <VStack spacing={2} align="center" py={4}>
          <HStack spacing={2} align="center">
            <Text fontSize="md">🦉</Text>
            <Text fontSize="sm" color="gray.600">
              Unable to generate personalized analysis
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Please try refreshing or check your connection
          </Text>
        </VStack>
      </Box>
    );
  }
  
  return (
    <Box bg="white" borderRadius="2xl" p={0} boxShadow="lg" border="1px solid" borderColor="gray.100" overflow="hidden">
      <VStack spacing={0} align="stretch">
        {/* AI Analysis Header with Bricky and Speech Bubble */}
        <AIAnalysisHeader 
          tract={tract}
          analysis={analysis}
          filterStore={filterSnapshot.current || (filterStore as FilterStoreSlice)}
        />

        <Box p={6}>
          <VStack spacing={6} align="stretch">
            {/* Headline & Reasoning Section */}
            <HeadlineSection 
              analysis={analysis}
            />
            
            {/* Key Business Insights */}
            <VStack spacing={4} align="stretch">
              <HStack spacing={2} align="center">
                <Box w="4px" h="6" bg="purple.500" borderRadius="full" />
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Key Business Insights
                </Text>
              </HStack>
              
              <VStack spacing={3} align="stretch">
                {analysis.insights.map((insight, index) => (
                  <BusinessInsightCard 
                    key={index}
                    index={index}
                    insight={insight}
                  />
                ))}
              </VStack>
            </VStack>
            
            {/* Business Types & Market Strategy */}
            <BusinessRecommendations 
              analysis={analysis}
            />
            
            {/* Bottom Line */}
            <BottomLineSection 
              analysis={analysis}
            />
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}