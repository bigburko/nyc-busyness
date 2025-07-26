// src/components/features/search/TractDetailPanel/AISummary.tsx
'use client';

import { Box, VStack, Text, HStack } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TractResult } from '../../../../../types/TractTypes';
import { useFilterStore } from '../../../../../stores/filterStore';
import { useGeminiStore } from '../../../../../stores/geminiStore';
import { Weight } from '../../../../../types/WeightTypes';

// Import modular components
import { HeadlineSection } from './HeadlineSection';
import { BusinessInsightCard } from './BusinessInsightCard';
import { BusinessRecommendations } from './BusinessRecommendations';
import { BottomLineSection } from './BottomLineSection';
import { BrickyAvatar } from './BrickyAvatar';
import { SpeechBubble } from './SpeechBubble';

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
  getWeightLabel,
  generatePersonalizedSpeechText,
  getConfidenceColor
} from '../../../../../lib/aiAnalysisUtils';

interface AISummaryProps {
  tract: TractResult;
  weights: Weight[];
  isVisible?: boolean;
}

// Component states - using a single state object to prevent race conditions
type ComponentState = 'idle' | 'loading' | 'typing' | 'complete' | 'error';

// Animation keyframes
const thinkingPulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const dots = keyframes`
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
`;

export function AISummary({ tract, weights, isVisible = false }: AISummaryProps) {
  const filterStore = useFilterStore();
  const geminiStore = useGeminiStore();
  
  // Consolidated state management to prevent flashing
  const [state, setState] = useState<ComponentState>('idle');
  const [analysis, setAnalysis] = useState<AIBusinessAnalysis | null>(null);
  const [typedText, setTypedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Refs for managing async operations
  const filterSnapshot = useRef<FilterStoreSlice | null>(null);
  const weightsSnapshot = useRef<Weight[] | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTractRef = useRef<string>('');
  const isMountedRef = useRef(true);

  // Custom sendToGemini that prevents global state updates
  const sendToGeminiIsolated = useCallback(async (prompt: string, context: any) => {
    console.log('🔒 [AI Summary] Using isolated Gemini call - will prevent state updates');
    
    // Store current filter state before calling
    const originalFilters = { ...filterStore };
    
    try {
      // Call the real sendToGemini function
      const response = await geminiStore.sendToGemini(prompt, context);
      
      console.log('🔒 [AI Summary] Got response, now restoring original state');
      
      // Restore original filter state to prevent side effects
      filterStore.setFilters(originalFilters);
      
      return response;
    } catch (error) {
      // Restore state even on error
      filterStore.setFilters(originalFilters);
      throw error;
    }
  }, [geminiStore, filterStore]);

  // Cleanup function to prevent memory leaks and race conditions
  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Set mounted ref on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Safe state setter that only updates if component is still mounted
  const safeSetState = useCallback((newState: ComponentState) => {
    if (isMountedRef.current) {
      setState(newState);
    }
  }, []);

  // Typing effect function with better control
  const typeText = useCallback((text: string, speed: number = 50) => {
    if (!isMountedRef.current) return;
    
    cleanup(); // Clear any existing timeout
    setTypedText('');
    let i = 0;
    
    const typeChar = () => {
      if (!isMountedRef.current) return;
      
      if (i < text.length) {
        setTypedText(text.slice(0, i + 1));
        i++;
        typingTimeoutRef.current = setTimeout(typeChar, speed);
      } else {
        // Typing complete, transition to final state
        setTimeout(() => {
          if (isMountedRef.current) {
            safeSetState('complete');
          }
        }, 300);
      }
    };
    
    typeChar();
  }, [cleanup, safeSetState]);
  
  const generateAIAnalysis = useCallback(async () => {
    const tractId = tract.geoid;
    
    // Prevent multiple calls and race conditions
    if (!isMountedRef.current || !isVisible || state !== 'idle') {
      return;
    }
    
    // Check cache first
    const cachedResult = getCachedAnalysis(tractId);
    if (cachedResult) {
      console.log('💾 [AI Summary] Loading cached analysis for tract:', tractId);
      
      // For cached results, set everything immediately to prevent flashing
      const currentFilter = filterSnapshot.current || (filterStore as FilterStoreSlice);
      const speechText = generatePersonalizedSpeechText(cachedResult, tract, currentFilter);
      
      if (isMountedRef.current) {
        setAnalysis(cachedResult);
        setTypedText(speechText);
        setError(null);
        safeSetState('complete');
      }
      return;
    }
    
    // Start loading for new analysis
    if (isMountedRef.current) {
      safeSetState('loading');
      setError(null);
    }
    
    try {
      console.log('🧠 [AI Summary] Starting analysis for tract:', tractId);
      
      // Create isolated snapshots to prevent store interference with map
      const currentFilter = filterSnapshot.current ? { ...filterSnapshot.current } : { ...filterStore as FilterStoreSlice };
      const currentWeights = weightsSnapshot.current ? [...weightsSnapshot.current] : [...weights];
      
      const trendInsights = extractTrendInsights(tract);
      const businessPrompt = buildBusinessIntelligencePrompt(tract, currentWeights, trendInsights, currentFilter);
      
      console.log('📤 [AI Summary] Making isolated Gemini call');
      
      const geminiWeights = currentWeights.map(w => ({ 
        id: w.id, 
        value: w.value, 
        label: getWeightLabel(w),
        icon: '', 
        color: '' 
      }));
      
      // Use isolated call that prevents state updates
      const aiResponse = await sendToGeminiIsolated(businessPrompt, {
        weights: geminiWeights,
        selectedTimePeriods: currentFilter.selectedTimePeriods,
        selectedEthnicities: currentFilter.selectedEthnicities,
        selectedGenders: currentFilter.selectedGenders,
        ageRange: currentFilter.ageRange,
        incomeRange: currentFilter.incomeRange,
        rentRange: currentFilter.rentRange || [26, 160],
        demographicScoring: currentFilter.demographicScoring
      });
      
      // Check if component is still mounted and we're still on the same tract
      if (!isMountedRef.current || currentTractRef.current !== tractId) {
        return;
      }
      
      console.log('📥 [AI Summary] Received isolated response length:', aiResponse.length);
      
      const businessAnalysis = parseAIResponse(aiResponse, tract);
      setCachedAnalysis(tractId, businessAnalysis);
      
      console.log('✅ [AI Summary] Analysis complete - NO GLOBAL STATE UPDATED:', businessAnalysis.headline);
      
      // Set analysis and start typing effect
      if (isMountedRef.current) {
        setAnalysis(businessAnalysis);
        safeSetState('typing');
        
        const speechText = generatePersonalizedSpeechText(businessAnalysis, tract, currentFilter);
        typeText(speechText);
      }
      
    } catch (err) {
      console.error('❌ [AI Summary] Error generating analysis:', err);
      if (isMountedRef.current) {
        setError('Failed to generate AI business analysis');
        safeSetState('error');
      }
    }
  }, [tract.geoid, isVisible, state, sendToGeminiIsolated, typeText, filterStore, weights, safeSetState]);
  
  // Update snapshots when props change
  useEffect(() => {
    filterSnapshot.current = filterStore as FilterStoreSlice;
    weightsSnapshot.current = weights;
  }, [filterStore, weights]);
  
  // Handle tract changes with proper cleanup
  useEffect(() => {
    const tractId = tract.geoid;
    currentTractRef.current = tractId;
    
    // Always cleanup first to prevent conflicts
    cleanup();
    
    // Check for cached results
    const cachedResult = getCachedAnalysis(tractId);
    if (cachedResult) {
      console.log('💾 [AI Summary] Loading cached analysis for tract:', tractId);
      
      // Set everything immediately for cached results
      const currentFilter = filterSnapshot.current || (filterStore as FilterStoreSlice);
      const speechText = generatePersonalizedSpeechText(cachedResult, tract, currentFilter);
      
      setAnalysis(cachedResult);
      setTypedText(speechText);
      setError(null);
      setState('complete');
    } else {
      // Reset to idle state for new tract
      setAnalysis(null);
      setTypedText('');
      setError(null);
      setState('idle');
    }
  }, [tract.geoid, cleanup]);
  
  // Trigger analysis when becomes visible
  useEffect(() => {
    if (isVisible && state === 'idle' && !analysis) {
      // Keep original timing but add safeguards to prevent map interference
      const timer = setTimeout(() => {
        if (isMountedRef.current && currentTractRef.current === tract.geoid && state === 'idle') {
          console.log('🧠 [AI Summary] Starting analysis (original timing restored)');
          generateAIAnalysis();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, state, analysis, generateAIAnalysis, tract.geoid]);

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

  // Loading state
  if (state === 'loading') {
    return (
      <Box 
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
        borderRadius="2xl" 
        borderBottomRadius="xl"
        p={6} 
        boxShadow="lg" 
        border="1px solid" 
        borderColor="gray.100" 
        overflow="hidden"
        color="white"
      >
        <VStack spacing={6} align="center">
          <VStack spacing={2} w="full">
            <Text fontSize="2xl" fontWeight="bold" lineHeight="1.2" textAlign="center" w="full">
              Bricky's Business Intelligence
            </Text>
            <Text fontSize="md" opacity={0.9} lineHeight="1.3" textAlign="center" w="full">
              AI-powered market analysis for {tract.nta_name}
            </Text>
          </VStack>
          
          <VStack spacing={1} align="center" w="full">
            <Box maxW="450px" w="full" display="flex" justifyContent="center">
              <SpeechBubble
                bg="rgba(255, 255, 255, 0.15)"
                borderColor="rgba(255, 255, 255, 0.3)"
                color="white"
                size="md"
                direction="down"
              >
                <HStack spacing={2} justify="center" align="center">
                  <Text color="inherit" fontSize="inherit">Thinking about your tract</Text>
                  <Box
                    as="span"
                    sx={{
                      _after: {
                        content: '"..."',
                        animation: `${dots} 1.5s infinite`,
                        fontWeight: "bold"
                      }
                    }}
                  />
                </HStack>
              </SpeechBubble>
            </Box>
            
            <Box
              sx={{
                animation: `${thinkingPulse} 2s ease-in-out infinite`
              }}
            >
              <BrickyAvatar 
                size="lg" 
                withGlassBackground={true}
                showDebugInfo={false}
              />
            </Box>
          </VStack>
        </VStack>
      </Box>
    );
  }

  // Error state
  if (state === 'error') {
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

  // Success states (typing or complete)
  if (analysis && (state === 'typing' || state === 'complete')) {
    return (
      <Box bg="white" borderRadius="2xl" p={0} boxShadow="lg" border="1px solid" borderColor="gray.100" overflow="hidden">
        <VStack spacing={0} align="stretch">
          {/* Enhanced Header with Typing Effect */}
          <Box 
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
            p={6} 
            color="white"
          >
            <VStack spacing={6} align="center">
              <VStack spacing={2} w="full">
                <Text fontSize="2xl" fontWeight="bold" lineHeight="1.2" textAlign="center" w="full">
                  Bricky's Business Intelligence
                </Text>
                <Text fontSize="md" opacity={0.9} lineHeight="1.3" textAlign="center" w="full">
                  AI-powered market analysis for {tract.nta_name}
                </Text>
              </VStack>
              
              {/* Speech Bubble with Typing Effect */}
              <VStack spacing={1} align="center" w="full">
                <Box maxW="450px" w="full" display="flex" justifyContent="center">
                  <SpeechBubble
                    bg="rgba(255, 255, 255, 0.15)"
                    borderColor="rgba(255, 255, 255, 0.3)"
                    color="white"
                    size="md"
                    direction="down"
                  >
                    <Text color="inherit" fontSize="inherit">
                      {typedText}
                      {state === 'typing' && (
                        <Box 
                          as="span" 
                          opacity={0.7} 
                          sx={{
                            animation: `${thinkingPulse} 1s infinite`
                          }}
                        >
                          |
                        </Box>
                      )}
                    </Text>
                  </SpeechBubble>
                </Box>
                
                <Box>
                  <BrickyAvatar 
                    size="lg" 
                    withGlassBackground={true}
                    showDebugInfo={false}
                  />
                </Box>
              </VStack>
            </VStack>
          </Box>

          {/* Results Section - Only show when complete */}
          {state === 'complete' && (
            <Box p={6}>
              <VStack spacing={6} align="stretch">
                <HeadlineSection analysis={analysis} />
                
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
                
                <BusinessRecommendations analysis={analysis} />
                
                <BottomLineSection analysis={analysis} />
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    );
  }

  // Fallback - should rarely be reached with the new state management
  return null;
}