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

// Animation keyframes
const thinkingPulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const dots = keyframes`
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
`;

export function AISummary({ tract, weights, isVisible = false }: AISummaryProps) {
  const filterStore = useFilterStore();
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  
  const [analysis, setAnalysis] = useState<AIBusinessAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  
  const filterSnapshot = useRef<FilterStoreSlice | null>(null);
  const weightsSnapshot = useRef<Weight[] | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Typing effect function
  const typeText = useCallback((text: string, speed: number = 50) => {
    setTypedText('');
    let i = 0;
    
    const typeChar = () => {
      if (i < text.length) {
        setTypedText(text.slice(0, i + 1));
        i++;
        typingTimeoutRef.current = setTimeout(typeChar, speed);
      } else {
        // Typing complete, hide cursor and show results after a brief pause
        setTyping(false);
        setTimeout(() => setShowResults(true), 500);
      }
    };
    
    typeChar();
  }, []);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  const generateAIAnalysis = useCallback(async () => {
    const tractId = tract.geoid;
    
    // First check cache
    const cachedResult = getCachedAnalysis(tractId);
    if (cachedResult) {
      setAnalysis(cachedResult);
      setHasTriggered(true);
      
      // For cached results, skip animations and show final state immediately
      const currentFilter = filterSnapshot.current || (filterStore as FilterStoreSlice);
      const speechText = generatePersonalizedSpeechText(cachedResult, tract, currentFilter);
      setTypedText(speechText); // Set full text immediately
      setTyping(false); // No typing animation
      setShowResults(true); // Show results immediately
      return;
    }
    
    if (loading || hasTriggered || !isVisible) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setHasTriggered(true);
      
      console.log('🧠 [AI Summary] Starting analysis for tract:', tractId);
      
      const currentFilter = filterSnapshot.current || (filterStore as FilterStoreSlice);
      const currentWeights = weightsSnapshot.current || weights;
      
      const trendInsights = extractTrendInsights(tract);
      const businessPrompt = buildBusinessIntelligencePrompt(tract, currentWeights, trendInsights, currentFilter);
      
      console.log('📤 [AI Summary] Sending business intelligence prompt to Gemini');
      
      const geminiWeights = currentWeights.map(w => ({ 
        id: w.id, 
        value: w.value, 
        label: getWeightLabel(w),
        icon: '', 
        color: '' 
      }));
      
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
      
      const businessAnalysis = parseAIResponse(aiResponse, tract);
      setCachedAnalysis(tractId, businessAnalysis);
      setAnalysis(businessAnalysis);
      
      console.log('✅ [AI Summary] Analysis complete:', businessAnalysis.headline);
      
      // Start typing effect
      setLoading(false);
      setTyping(true);
      const speechText = generatePersonalizedSpeechText(businessAnalysis, tract, currentFilter);
      typeText(speechText);
      
    } catch (err) {
      console.error('❌ [AI Summary] Error generating analysis:', err);
      setError('Failed to generate AI business analysis');
      setHasTriggered(false);
      setLoading(false);
    }
  }, [tract.geoid, isVisible, loading, hasTriggered, sendToGemini, typeText, filterStore, weights]);
  
  // Update snapshots when props change
  useEffect(() => {
    filterSnapshot.current = filterStore as FilterStoreSlice;
    weightsSnapshot.current = weights;
  }, [filterStore, weights]);
  
  // Reset state when tract changes
  useEffect(() => {
    const tractId = tract.geoid;
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    const cachedResult = getCachedAnalysis(tractId);
    if (cachedResult) {
      console.log('💾 [AI Summary] Loading cached analysis for tract:', tractId);
      setAnalysis(cachedResult);
      setHasTriggered(true);
      setError(null);
      setLoading(false);
      setTyping(false);
      
      // For cached results, show final state immediately with no animations
      const currentFilter = filterSnapshot.current || (filterStore as FilterStoreSlice);
      const speechText = generatePersonalizedSpeechText(cachedResult, tract, currentFilter);
      setTypedText(speechText); // Set full text immediately
      setShowResults(true); // Show results immediately
    } else {
      // Reset for new tract
      setHasTriggered(false);
      setAnalysis(null);
      setError(null);
      setLoading(false);
      setTyping(false);
      setTypedText('');
      setShowResults(false);
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

  // Enhanced loading state with thinking Bricky
  if (loading) {
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
          {/* Title Section */}
          <VStack spacing={2} w="full">
            <Text fontSize="2xl" fontWeight="bold" lineHeight="1.2" textAlign="center" w="full">
              Bricky's Business Intelligence
            </Text>
            <Text fontSize="md" opacity={0.9} lineHeight="1.3" textAlign="center" w="full">
              AI-powered market analysis for {tract.nta_name}
            </Text>
          </VStack>
          
          {/* Consistent Speech Bubble Layout */}
          <VStack spacing={1} align="center" w="full">
            {/* Same Speech Bubble with Loading Message */}
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
            
            {/* Thinking Bricky with pulse animation */}
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
  if (error) {
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

  // Success state with typing effect
  if (analysis && (typing || showResults)) {
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
              {/* Title Section */}
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
                      {typing && (
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

          {/* Results Section with Staggered Animation */}
          {showResults && (
            <Box p={6}>
              <VStack spacing={6} align="stretch">
                {/* Headline Section */}
                <Box
                  sx={{
                    animation: `${fadeInUp} 0.6s ease-out`,
                    animationDelay: "0.2s",
                    animationFillMode: "both"
                  }}
                >
                  <HeadlineSection analysis={analysis} />
                </Box>
                
                {/* Key Business Insights */}
                <Box
                  sx={{
                    animation: `${fadeInUp} 0.6s ease-out`,
                    animationDelay: "0.4s",
                    animationFillMode: "both"
                  }}
                >
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={2} align="center">
                      <Box w="4px" h="6" bg="purple.500" borderRadius="full" />
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        Key Business Insights
                      </Text>
                    </HStack>
                    
                    <VStack spacing={3} align="stretch">
                      {analysis.insights.map((insight, index) => (
                        <Box
                          key={index}
                          sx={{
                            animation: `${fadeInUp} 0.6s ease-out`,
                            animationDelay: `${0.6 + (index * 0.1)}s`,
                            animationFillMode: "both"
                          }}
                        >
                          <BusinessInsightCard 
                            index={index}
                            insight={insight}
                          />
                        </Box>
                      ))}
                    </VStack>
                  </VStack>
                </Box>
                
                {/* Business Recommendations */}
                <Box
                  sx={{
                    animation: `${fadeInUp} 0.6s ease-out`,
                    animationDelay: "1s",
                    animationFillMode: "both"
                  }}
                >
                  <BusinessRecommendations analysis={analysis} />
                </Box>
                
                {/* Bottom Line */}
                <Box
                  sx={{
                    animation: `${fadeInUp} 0.6s ease-out`,
                    animationDelay: "1.2s",
                    animationFillMode: "both"
                  }}
                >
                  <BottomLineSection analysis={analysis} />
                </Box>
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    );
  }

  // Fallback
  return null;
}