'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Box, Input, IconButton, Spinner, Text, Flex, Button, VStack
} from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { useFilterStore, FilterState } from '@/stores/filterStore';
import { resolveEthnicities } from '@/lib/resolveEthnicities';
import { useGeminiStore } from '@/stores/geminiStore';

interface ParsedResponse {
  intent?: string;
  message?: string;
  weights?: Array<{ id: string; label: string; value: number; icon: string; color: string }>;
  selectedEthnicities?: string[];
  selectedTimePeriods?: string[];
  rentRange?: [number, number];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  selectedGenders?: string[];
}

interface FilterUpdates {
  weights?: Array<{ id: string; label: string; value: number; icon: string; color: string }>;
  selectedEthnicities?: string[];
  selectedTimePeriods?: string[];
  rentRange?: [number, number];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  selectedGenders?: string[];
}

// ✅ FIXED: Match the EdgeFunctionResponse interface from TopLeftUI
interface MapSearchResult {
  geoid: string;
  tract_name?: string;
  display_name?: string;
  nta_name?: string;
  custom_score: number;
  resilience_score?: number;
  avg_rent?: number;
  demographic_score?: number;
  foot_traffic_score?: number;
  crime_score?: number;
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  crime_timeline?: {
    year_2020?: number;
    year_2021?: number;
    year_2022?: number;
    year_2023?: number;
    year_2024?: number;
    pred_2025?: number;
    pred_2026?: number;
    pred_2027?: number;
  };
  foot_traffic_timeline?: {
    '2019'?: number;
    '2020'?: number;
    '2021'?: number;
    '2022'?: number;
    '2023'?: number;
    '2024'?: number;
    'pred_2025'?: number;
    'pred_2026'?: number;
    'pred_2027'?: number;
  };
  foot_traffic_by_period?: {
    morning?: Record<string, number>;
    afternoon?: Record<string, number>;
    evening?: Record<string, number>;
  };
  foot_traffic_timeline_metadata?: Record<string, unknown>;
  crime_timeline_metadata?: Record<string, unknown>;
  foot_traffic_periods_used?: string[];
  [key: string]: unknown;
}

interface EdgeFunctionResponse {
  zones: MapSearchResult[];
  total_zones_found: number;
  top_zones_returned: number;
  top_percentage: number;
  demographic_scoring_applied?: boolean;
  foot_traffic_periods_used?: string[];
  debug?: Record<string, unknown>;
}

// ✅ FIXED: SubmissionData interface to match what TopLeftUI expects
interface SubmissionData extends FilterState {
  topN?: number;
}

// ✅ FIXED: Update props interface to match exactly what TopLeftUI is passing
export default function ChatInputPanel({
  onSearchSubmit,
  onResetRequest,
  searchResults,
  lastQuery: _lastQuery, // eslint-disable-line @typescript-eslint/no-unused-vars
  aiReasoning: _aiReasoning,
  isSearchLoading = false
}: {
  onSearchSubmit: (filters: SubmissionData) => void; // ✅ FIXED: TopLeftUI passes SubmissionData
  onResetRequest: () => void;
  searchResults?: EdgeFunctionResponse | null; // ✅ FIXED: TopLeftUI passes EdgeFunctionResponse
  lastQuery?: string; // ✅ FIXED: TopLeftUI tries to pass this
  aiReasoning?: string; // ✅ FIXED: TopLeftUI tries to pass this
  isSearchLoading?: boolean;
}) {
  const messages = useGeminiStore((s) => s.messages);
  const setMessages = useGeminiStore((s) => s.setMessages);
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  
  const [localInput, setLocalInput] = useState('');
  
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { setFilters, reset, demographicScoring } = useFilterStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  // ✅ NEW: Track if we've shown results for current search
  const lastResultsShown = useRef<number>(0);

  const handleInputFocus = () => {
    console.log('🔍 [ChatInputPanel] Chat input focused - keeping tract panel open for now');
  };

  // ✅ FIXED: Return SubmissionData instead of FilterState
  const formatFiltersForSubmission = (): SubmissionData => {
    const currentState = useFilterStore.getState();
    return {
      ...currentState,
      topN: 10 // Default topN value
    };
  };

  // ✅ NEW: Generate rich justification message based on search results
  const generateJustificationMessage = (userQuery: string, updates: FilterUpdates): string => {
    const businessType = detectBusinessType(userQuery);
    const customerProfile = analyzeCustomerProfile(updates);
    
    let response = `🤖 **Business Intelligence Analysis:**\n\n`;
    
    // Business type detection
    if (businessType) {
      response += `🎯 **Detected:** ${businessType.type}\n`;
      response += `📊 **Strategy:** ${businessType.strategy}\n\n`;
    }
    
    // Customer targeting analysis
    if (customerProfile.demographics) {
      response += `👥 **Target Demographics:**\n${customerProfile.demographics}\n\n`;
    }
    
    // Location strategy
    if (updates.selectedTimePeriods) {
      const timeStrategy = analyzeTimeStrategy(updates.selectedTimePeriods);
      response += `🕐 **Timing Strategy:** ${timeStrategy}\n\n`;
    }
    
    // Budget and location insights
    if (updates.rentRange) {
      const budgetStrategy = analyzeBudgetStrategy(updates.rentRange);
      response += `💰 **Location Budget:** ${budgetStrategy}\n\n`;
    }
    
    // Add AI reasoning if available
    if (_aiReasoning) {
      response += `🧠 **AI Reasoning:** ${_aiReasoning}\n\n`;
    }
    
    response += `⚡ **Searching for optimized locations...**`;
    
    return response;
  };

  // ✅ FIXED: Wrapped in useCallback to prevent dependency changes and handle EdgeFunctionResponse
  const generateResultsMessage = useCallback((): string => {
    console.log('🔍 [ChatInputPanel] Generating results message:', {
      hasSearchResults: !!searchResults,
      zonesLength: searchResults?.zones?.length,
      searchResults: searchResults
    });
    
    if (!searchResults?.zones?.length) {
      console.log('❌ [ChatInputPanel] No search results available for message generation');
      return "❌ No locations found matching your criteria. Try adjusting your filters or ask me to broaden the search.";
    }

    const topZone = searchResults.zones[0];
    const averageScore = searchResults.zones.reduce((sum, zone) => sum + zone.custom_score, 0) / searchResults.zones.length;
    
    let response = `✅ **Found ${searchResults.zones.length} Perfect Locations!**\n\n`;
    
    // Top recommendation
    response += `🏆 **Top Recommendation:**\n`;
    response += `📍 ${topZone.display_name || topZone.tract_name}\n`;
    response += `⭐ Score: ${topZone.custom_score.toFixed(1)}/100\n`;
    
    if (topZone.demographic_match_pct) {
      response += `👥 Customer Match: ${topZone.demographic_match_pct.toFixed(1)}%\n`;
    }
    if (topZone.foot_traffic_score) {
      response += `🚶 Foot Traffic: ${topZone.foot_traffic_score.toFixed(1)}/100\n`;
    }
    if (topZone.avg_rent) {
      response += `💵 Avg Rent: ${topZone.avg_rent}/sqft\n`;
    }
    
    response += `\n📊 **Results Summary:**\n`;
    response += `• ${searchResults.zones.length} locations analyzed\n`;
    response += `• Average quality score: ${averageScore.toFixed(1)}/100\n`;
    response += `• Showing top ${searchResults.top_percentage}% of matches\n\n`;
    
    // Demographic insights
    if (demographicScoring.reasoning) {
      response += `🎯 **Why These Locations:**\n${demographicScoring.reasoning}\n\n`;
    }
    
    // Strategy explanation
    const currentState = useFilterStore.getState();
    if (currentState.weights?.length) {
      const topWeight = currentState.weights.reduce((max, w) => w.value > max.value ? w : max);
      response += `⚖️ **Strategy Focus:** Prioritizing ${topWeight.label.toLowerCase()} (${topWeight.value}%)\n\n`;
    }
    
    response += `💡 **Want me to:**\n`;
    response += `• Analyze different customer segments?\n`;
    response += `• Adjust age/income targeting?\n`;
    response += `• Explore different neighborhoods?\n`;
    response += `• Focus on specific business factors?`;
    
    console.log('✅ [ChatInputPanel] Generated results message successfully');
    return response;
  }, [searchResults, demographicScoring.reasoning]);

  // ✅ NEW: Business type detection
  const detectBusinessType = (query: string): { type: string; strategy: string } | null => {
    const q = query.toLowerCase();
    
    if (q.includes('cocktail') || q.includes('bar') || q.includes('speakeasy')) {
      return {
        type: "Nightlife/Bar",
        strategy: "Evening-focused with young professional targeting"
      };
    }
    if (q.includes('coffee') || q.includes('cafe')) {
      return {
        type: "Cafe/Coffee Shop", 
        strategy: "Morning/afternoon focus with diverse age appeal"
      };
    }
    if (q.includes('restaurant') || q.includes('trattoria')) {
      return {
        type: "Restaurant",
        strategy: "Lunch/dinner periods with cultural demographic matching"
      };
    }
    if (q.includes('boutique') || q.includes('fashion') || q.includes('clothing')) {
      return {
        type: "Retail/Fashion",
        strategy: "Demographic-focused with lifestyle targeting"
      };
    }
    if (q.includes('consignment') || q.includes('luxury')) {
      return {
        type: "Luxury Retail",
        strategy: "High-income targeting with premium location focus"
      };
    }
    
    return null;
  };

  // ✅ NEW: Customer profile analysis
  const analyzeCustomerProfile = (updates: FilterUpdates): { demographics: string } => {
    let demographics = "";
    
    if (updates.ageRange) {
      const [min, max] = updates.ageRange;
      if (max <= 30) {
        demographics += "• Young adults & students (Gen Z/Millennial)\n";
      } else if (min >= 45) {
        demographics += "• Mature professionals & empty nesters (Gen X+)\n";
      } else {
        demographics += `• Working-age population (${min}-${max} years)\n`;
      }
    }
    
    if (updates.incomeRange) {
      const [min, max] = updates.incomeRange;
      const minK = Math.round(min/1000);
      const maxK = Math.round(max/1000);
      
      if (maxK <= 50) {
        demographics += `• Budget-conscious customers ($${minK}K-${maxK}K)\n`;
      } else if (minK >= 100) {
        demographics += `• Affluent customers with high spending power ($${minK}K-${maxK}K)\n`;
      } else {
        demographics += `• Middle-income range ($${minK}K-${maxK}K)\n`;
      }
    }
    
    if (updates.selectedEthnicities?.length) {
      demographics += `• Cultural focus: ${updates.selectedEthnicities.join(', ')} communities\n`;
    }
    
    return { demographics };
  };

  // ✅ NEW: Time strategy analysis
  const analyzeTimeStrategy = (timePeriods: string[]): string => {
    if (timePeriods.includes('evening') && timePeriods.length === 1) {
      return "Evening-only focus for nightlife and social dining";
    }
    if (timePeriods.includes('morning') && timePeriods.includes('afternoon')) {
      return "Daytime business model (breakfast, lunch, coffee culture)";
    }
    if (timePeriods.length === 3) {
      return "All-day operation maximizing foot traffic across time periods";
    }
    return `Selected periods: ${timePeriods.join(', ')}`;
  };

  // ✅ NEW: Budget strategy analysis
  const analyzeBudgetStrategy = (rentRange: [number, number]): string => {
    const [min, max] = rentRange;
    if (min <= 40) {
      return `Budget-conscious location strategy ($${min}-${max} PSF) - maximizing value`;
    } else if (max >= 120) {
      return `Premium location strategy ($${min}-${max} PSF) - targeting high-visibility areas`;
    } else {
      return `Mid-tier location strategy ($${min}-${max} PSF) - balanced approach`;
    }
  };

  // Enhanced filter context creation with age/income focus
  const createFilterContext = (state: FilterState) => {
    return {
      weights: state.weights,
      rentRange: state.rentRange,
      selectedEthnicities: state.selectedEthnicities,
      selectedGenders: state.selectedGenders,
      selectedTimePeriods: state.selectedTimePeriods,
      ageRange: state.ageRange,
      incomeRange: state.incomeRange,
      demographicScoring: state.demographicScoring ? {
        weights: state.demographicScoring.weights,
        thresholdBonuses: Object.entries(state.demographicScoring.thresholdBonuses || {}).map(([condition, bonus]) => ({
          condition,
          bonus: typeof bonus === 'number' ? bonus : 0,
          description: `${condition} bonus`
        })),
        penalties: Object.entries(state.demographicScoring.penalties || {}).map(([condition, penalty]) => ({
          condition,
          penalty: typeof penalty === 'number' ? penalty : 0,
          description: `${condition} penalty`
        }))
      } : undefined
    };
  };

  const handleSend = async () => {
    const userMsg = localInput.trim();
    if (!userMsg || isLoading) return;

    // Close tract detail panel when user actively searches
    if (window.closeTractDetailPanel) {
      window.closeTractDetailPanel();
      console.log('❌ [ChatInputPanel] Closed tract detail panel - user is actively searching');
    }

    setShowSuggestions(false);

    setMessages([...messages, { role: 'user' as const, content: userMsg }]);
    setLocalInput('');
    setIsLoading(true);

    try {
      const currentState = useFilterStore.getState();
      const filterContext = createFilterContext(currentState);
      const reply = await sendToGemini(userMsg, filterContext);
      
      const match = reply.match(/```json\s*([\s\S]*?)\s*```/);
      let parsed: ParsedResponse = {};
      try {
        parsed = JSON.parse(match ? match[1] : reply);
      } catch {
        parsed = { intent: 'none', message: reply };
      }

      if (parsed.intent === 'reset') {
        reset();
        setMessages([...messages, 
          { role: 'user' as const, content: userMsg }, 
          { role: 'assistant' as const, content: '🔄 **Reset Complete!**\n\nAll filters have been reset to defaults. I\'m ready to help you find the perfect business location with fresh customer targeting analysis!\n\n💡 **Try asking me about:**\n• Specific business types\n• Target customer demographics\n• Age and income preferences\n• Neighborhood characteristics' }
        ]);
        setTimeout(() => {
          const formattedFilters = formatFiltersForSubmission();
          onSearchSubmit(formattedFilters);
        }, 300);
      } else if (parsed.weights || parsed.selectedEthnicities || parsed.selectedTimePeriods || parsed.rentRange || parsed.ageRange || parsed.incomeRange || parsed.selectedGenders) {
        // ✅ UPDATED: Generate rich justification message
        const updates: FilterUpdates = {};
        
        if (parsed.weights) updates.weights = parsed.weights;
        if (parsed.ageRange) updates.ageRange = parsed.ageRange;
        if (parsed.incomeRange) updates.incomeRange = parsed.incomeRange;
        if (parsed.selectedTimePeriods) updates.selectedTimePeriods = parsed.selectedTimePeriods;
        if (parsed.selectedEthnicities) updates.selectedEthnicities = resolveEthnicities(parsed.selectedEthnicities);
        if (parsed.rentRange) updates.rentRange = parsed.rentRange;
        if (parsed.selectedGenders) updates.selectedGenders = parsed.selectedGenders;

        setFilters(updates);

        // ✅ NEW: Generate rich justification message
        const richMessage = generateJustificationMessage(userMsg, updates);
        
        const newMessages = [...messages, 
          { role: 'user' as const, content: userMsg },
          { role: 'assistant' as const, content: richMessage }
        ];
        setMessages(newMessages);

        // Auto-submit with slight delay for better UX
        setTimeout(() => {
          const formattedFilters = formatFiltersForSubmission();
          onSearchSubmit(formattedFilters);
          
          // ✅ FIXED: Don't try to show results immediately - wait for searchResults prop to update
          // The results message will be triggered by useEffect when searchResults changes
        }, 300);
      } else {
        // Handle general conversation with enhanced context
        const enhancedMessage = parsed.message || 
          "I'm Bricky, your Business Location AI! 🤖\n\nI specialize in:\n• 🎯 Customer demographic analysis\n• 💰 Income and spending pattern targeting\n• 👥 Age group optimization\n• 🏢 Business type intelligence\n• 📍 NYC neighborhood matching\n\nTell me about your business idea and I'll find the perfect locations with detailed reasoning!";
        
        setMessages([...messages, 
          { role: 'user' as const, content: userMsg },
          { role: 'assistant' as const, content: enhancedMessage }
        ]);
      }
    } catch (err: unknown) {
      console.error('❌ [ChatInputPanel] Error:', err);
      
      let errorMessage = "🚨 **Oops! Something went wrong.**\n\nI had trouble processing that request. Try asking me about:\n• Specific business types (e.g., 'coffee shop for students')\n• Customer demographics (e.g., 'young professionals')\n• Budget considerations (e.g., 'affordable restaurant location')";
      if (err instanceof Error) {
        errorMessage = `🚨 **Error:** ${err.message}\n\nPlease try again or ask me something different!`;
      }
      
      setMessages([...messages, 
        { role: 'user' as const, content: userMsg },
        { role: 'assistant' as const, content: errorMessage }
      ]);
    }

    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalInput(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, []);

  // ✅ FIXED: Moved generateResultsMessage inside useEffect dependencies and handle EdgeFunctionResponse
  useEffect(() => {
    const currentResultsCount = searchResults?.zones?.length || 0;
    const currentTotalFound = searchResults?.total_zones_found || 0;
    
    // Only proceed if we have results and haven't shown them for this search yet
    if (currentResultsCount > 0 && 
        currentTotalFound !== lastResultsShown.current) {
      
      // Check if we have messages and the last one was an analysis message
      const currentMessages = useGeminiStore.getState().messages;
      if (currentMessages.length > 0) {
        const lastMessage = currentMessages[currentMessages.length - 1];
        
        // Only add results if the last assistant message was an analysis (contains "Searching for optimized locations")
        if (lastMessage?.role === 'assistant' && 
            lastMessage.content.includes('⚡ **Searching for optimized locations...**')) {
          
          console.log('🔍 [ChatInputPanel] Search results received, generating results message:', {
            zonesCount: currentResultsCount,
            totalFound: currentTotalFound,
            lastShown: lastResultsShown.current
          });
          
          const resultsMessage = generateResultsMessage();
          
          // Use the store's setMessages directly to avoid stale closure
          const currentState = useGeminiStore.getState();
          currentState.setMessages([...currentState.messages, { 
            role: 'assistant' as const, 
            content: resultsMessage
          }]);
          
          // Track that we've shown results for this search
          lastResultsShown.current = currentTotalFound;
        }
      }
    }
  }, [searchResults?.zones?.length, searchResults?.total_zones_found, generateResultsMessage]);

  return (
    <Box bg="white" borderRadius="lg" overflow="hidden">
      {/* Enhanced age/income-focused suggestions */}
      {showSuggestions && messages.length === 0 && (
        <Box p={4} bg="#FFF5F5" borderBottom="1px solid" borderColor="rgba(255, 73, 44, 0.2)">
          <VStack spacing={3} align="center">
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              👥💰 Age & Income Intelligence Examples:
            </Text>
            <Flex gap={2} wrap="wrap" justify="center">
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("upscale Korean BBQ")}
                borderRadius="full"
                px={4}
              >
                💎 Upscale Korean BBQ
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("budget-friendly coffee shop")}
                borderRadius="full"
                px={4}
              >
                💵 Budget Coffee
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("young professional bar")}
                borderRadius="full"
                px={4}
              >
                🍻 Young Pro Bar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("family Indian restaurant")}
                borderRadius="full"
                px={4}
              >
                👨‍👩‍👧‍👦 Family Indian
              </Button>
            </Flex>
            <Flex gap={2} wrap="wrap" justify="center">
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("trendy boutique for millennials")}
                borderRadius="full"
                px={3}
              >
                👗 Millennial Boutique
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("luxury consignment shop")}
                borderRadius="full"
                px={3}
              >
                💍 Luxury Consignment
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("senior-friendly cafe")}
                borderRadius="full"
                px={3}
              >
                👴 Senior Cafe
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("student budget pizza")}
                borderRadius="full"
                px={3}
              >
                🍕 Student Pizza
              </Button>
            </Flex>
          </VStack>
        </Box>
      )}

      {/* Chat History */}
      <Box 
        ref={chatBodyRef} 
        overflowY="auto" 
        maxH="320px" 
        p={4}
        bg="#FFF5F5"
        css={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 73, 44, 0.3)', borderRadius: '3px' }
        }}
      >
        {messages.length === 0 ? (
          <VStack spacing={3} py={6} textAlign="center">
            <Text fontSize="md" fontWeight="semibold" color="gray.600">
              👥💰 Hi! I&apos;m Bricky, your Customer Intelligence AI
            </Text>
            <Text fontSize="sm" color="gray.500" lineHeight="tall">
              I specialize in age and income targeting - analyzing spending power, lifecycle stages, generational preferences, and customer behavior patterns to optimize your NYC business success.
            </Text>
          </VStack>
        ) : (
          <VStack spacing={3} align="stretch">
            {messages.map((msg, i) => (
              <Flex
                key={i}
                justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
              >
                <Box
                  bg={msg.role === 'user' ? '#FF492C' : 'white'}
                  color={msg.role === 'user' ? 'white' : 'gray.800'}
                  px={4}
                  py={3}
                  borderRadius="lg"
                  maxW="85%"
                  boxShadow="sm"
                  fontSize="sm"
                  lineHeight="tall"
                  borderWidth="1px"
                  borderColor={msg.role === 'user' ? '#FF492C' : 'gray.200'}
                >
                  {/* ✅ NEW: Format messages with markdown-style formatting */}
                  <Text 
                    whiteSpace="pre-line"
                    sx={{
                      '& strong': { fontWeight: 'bold' },
                      '& em': { fontStyle: 'italic' }
                    }}
                  >
                    {msg.content}
                  </Text>
                </Box>
              </Flex>
            ))}
            {isLoading && (
              <Flex justify="flex-start">
                <Flex align="center" gap={3} bg="white" px={4} py={3} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
                  <Spinner size="sm" color="#FF492C" />
                  <Text fontSize="sm" color="gray.600">Bricky is analyzing customer demographics...</Text>
                </Flex>
              </Flex>
            )}
            {/* ✅ NEW: Show search loading state in chat */}
            {isSearchLoading && (
              <Flex justify="flex-start">
                <Flex align="center" gap={3} bg="blue.50" px={4} py={3} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="blue.200">
                  <Spinner size="sm" color="blue.500" />
                  <Text fontSize="sm" color="blue.600">🔍 Finding optimized locations...</Text>
                </Flex>
              </Flex>
            )}
          </VStack>
        )}
      </Box>

      {/* Input Area */}
      <Box p={4} bg="white" borderTop="1px solid" borderColor="rgba(255, 73, 44, 0.2)">
        <Flex gap={3} align="flex-end">
          <Box flex="1">
            <Input
              ref={inputRef}
              placeholder="Ask about customer ages, income levels, or spending patterns..."
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              size="md"
              borderRadius="lg"
              bg="#FFF5F5"
              border="2px solid"
              borderColor="rgba(255, 73, 44, 0.2)"
              _focus={{ 
                borderColor: '#FF492C',
                bg: 'white',
                boxShadow: '0 0 0 1px rgba(255, 73, 44, 0.3)'
              }}
              _placeholder={{ color: 'gray.500' }}
            />
          </Box>
          <IconButton
            aria-label="Send"
            icon={<ArrowUpIcon />}
            onClick={handleSend}
            isDisabled={!localInput.trim() || isLoading}
            bg="#FF492C"
            color="white"
            _hover={{ bg: '#E53E3E' }}
            _active={{ bg: '#C53030' }}
            size="md"
            borderRadius="lg"
            boxShadow="md"
          />
        </Flex>

        {/* Reset Button */}
        <Button 
          size="sm" 
          mt={3} 
          w="full" 
          variant="ghost" 
          color="gray.500"
          _hover={{ bg: 'gray.100', color: 'gray.700' }}
          onClick={onResetRequest}
          borderRadius="lg"
        >
          🔄 Reset All Filters
        </Button>
      </Box>
    </Box>
  );
}