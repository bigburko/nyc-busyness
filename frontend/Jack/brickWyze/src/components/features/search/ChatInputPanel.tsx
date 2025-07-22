'use client';

import { useRef, useEffect, useState } from 'react';
import { 
  Box, Input, IconButton, Spinner, Text, Flex, Button, VStack
} from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { useFilterStore, FilterState } from '@/stores/filterStore';
import { resolveEthnicities } from '@/lib/resolveEthnicities';
import { useGeminiStore } from '@/stores/geminiStore';

// ✅ Type definitions for better type safety
interface ParsedResponse {
  intent?: string;
  message?: string;
  weights?: Array<{ id: string; label: string; value: number; icon: string; color: string }>;
  selectedEthnicities?: string[];
  rentRange?: [number, number];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  selectedGenders?: string[];
}

interface FilterUpdates {
  weights?: Array<{ id: string; label: string; value: number; icon: string; color: string }>;
  selectedEthnicities?: string[];
  rentRange?: [number, number];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  selectedGenders?: string[];
}

export default function ChatInputPanel({
  onSearchSubmit,
  onResetRequest,
}: {
  onSearchSubmit: (filters: FilterState) => void; // ✅ FIXED: Proper type instead of any
  onResetRequest: () => void;
}) {
  // ✅ USE PERSISTENT STORE for messages (survives panel open/close)
  const messages = useGeminiStore((s) => s.messages);
  const setMessages = useGeminiStore((s) => s.setMessages);
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  // ✅ REMOVED: resetChat is never used in this component

  // ✅ OPTIMIZED: Use local state for input to prevent store re-renders on every keystroke
  const [localInput, setLocalInput] = useState('');
  
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { setFilters, reset } = useFilterStore();

  // ✅ Track loading state locally (doesn't need to persist)
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // NEW: Handle input focus - only close tract panel if user starts typing
  const handleInputFocus = () => {
    // Don't automatically close tract detail panel just for focusing
    // Let user view tract details while potentially wanting to ask questions about it
    console.log('🔍 [ChatInputPanel] Chat input focused - keeping tract panel open for now');
  };

  const formatFiltersForSubmission = (): FilterState => {
    return useFilterStore.getState();
  };

  // 🔧 FIXED: Create proper FilterContext for sendToGemini
  const createFilterContext = (state: FilterState) => {
    return {
      weights: state.weights,
      rentRange: state.rentRange,
      selectedEthnicities: state.selectedEthnicities,
      selectedGenders: state.selectedGenders,
      selectedTimePeriods: state.selectedTimePeriods, // ✅ Include time periods
      ageRange: state.ageRange,
      incomeRange: state.incomeRange,
      // 🔧 FIXED: Convert both thresholdBonuses and penalties from object to array format
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

    // Close tract detail panel when user actually starts searching/asking questions
    if (window.closeTractDetailPanel) {
      window.closeTractDetailPanel();
      console.log('❌ [ChatInputPanel] Closed tract detail panel - user is actively searching');
    }

    // ✅ Hide suggestions after first interaction
    setShowSuggestions(false);

    // Add user message to persistent store with correct typing
    setMessages([...messages, { role: 'user' as const, content: userMsg }]);
    setLocalInput(''); // ✅ Clear local input
    setIsLoading(true);

    try {
      const currentState = useFilterStore.getState();
      // 🔧 FIXED: Use createFilterContext to convert state to expected format
      const filterContext = createFilterContext(currentState);
      const reply = await sendToGemini(userMsg, filterContext);
      
      const match = reply.match(/```json\s*([\s\S]*?)\s*```/);
      let parsed: ParsedResponse = {}; // ✅ FIXED: Proper type instead of any
      try {
        parsed = JSON.parse(match ? match[1] : reply);
      } catch {
        // ✅ FIXED: Removed unused 'e' parameter
        parsed = { intent: 'none', message: reply };
      }

      if (parsed.intent === 'reset') {
        reset();
        setMessages([...messages, 
          { role: 'user' as const, content: userMsg }, 
          { role: 'assistant' as const, content: '🔄 Reset all filters to defaults. Refreshing results...' }
        ]);
        setTimeout(() => {
          const formattedFilters = formatFiltersForSubmission();
          onSearchSubmit(formattedFilters);
        }, 300);
      } else if (parsed.weights || parsed.selectedEthnicities || parsed.rentRange || parsed.ageRange || parsed.incomeRange || parsed.selectedGenders) {
        // Handle filter updates with better messaging
        const updates: FilterUpdates = {}; // ✅ FIXED: Proper type instead of any
        let changeDescription = '';
        
        if (parsed.weights) {
          updates.weights = parsed.weights;
          const topWeight = parsed.weights.reduce((max, w) => w.value > max.value ? w : max, parsed.weights[0]); // ✅ FIXED: Proper typing
          changeDescription += `Prioritizing ${topWeight.label.toLowerCase()} (${topWeight.value}%). `;
        }
        
        if (parsed.rentRange) {
          updates.rentRange = parsed.rentRange;
          changeDescription += `Rent range: $${parsed.rentRange[0]}-${parsed.rentRange[1]} PSF. `;
        }
        
        if (parsed.ageRange) {
          updates.ageRange = parsed.ageRange;
          changeDescription += `Age range: ${parsed.ageRange[0]}-${parsed.ageRange[1]} years. `;
        }
        
        if (parsed.incomeRange) {
          updates.incomeRange = parsed.incomeRange;
          const [min, max] = parsed.incomeRange;
          changeDescription += `Income: $${(min/1000).toFixed(0)}K-${(max/1000).toFixed(0)}K. `;
        }
        
        if (parsed.selectedGenders) {
          updates.selectedGenders = parsed.selectedGenders;
          changeDescription += `Gender: ${parsed.selectedGenders.join(', ')}. `;
        }
        
        if (parsed.selectedEthnicities) {
          updates.selectedEthnicities = resolveEthnicities(parsed.selectedEthnicities);
          const ethnicityNames = parsed.selectedEthnicities.join(', ');
          changeDescription += `Added ${ethnicityNames} ethnicity. `;
        }

        setFilters(updates);

        // ✅ Enhanced message with change description
        const enhancedMessage = `${changeDescription}🔍 Searching neighborhoods...`;
        const newMessages = [...messages, 
          { role: 'user' as const, content: userMsg },
          { role: 'assistant' as const, content: parsed.message ? `${parsed.message} ${enhancedMessage}` : enhancedMessage }
        ];
        setMessages(newMessages);

        // Auto-submit with slight delay for better UX
        setTimeout(() => {
          // ✅ FIXED: Removed unused finalState variable
          const formattedFilters = formatFiltersForSubmission();
          onSearchSubmit(formattedFilters);
          
          // Add a follow-up message after search completes
          setTimeout(() => {
            setMessages([...newMessages, { 
              role: 'assistant' as const, 
              content: '✅ Results updated! Ask me to adjust any filters or try a different search.'
            }]);
          }, 1500);
        }, 300);
      } else {
        // Handle general conversation
        setMessages([...messages, 
          { role: 'user' as const, content: userMsg },
          { role: 'assistant' as const, content: parsed.message || "I'm here to help you find the perfect NYC neighborhood! Try asking me to adjust weights, change rent ranges, or add specific demographics." }
        ]);
      }
    } catch (err: unknown) { // ✅ FIXED: Changed from any to unknown
      console.error('❌ [ChatInputPanel] Error:', err);
      
      let errorMessage = "Sorry, I had trouble with that request. Try asking me something like 'increase foot traffic' or 'add Korean ethnicity'.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setMessages([...messages, 
        { role: 'user' as const, content: userMsg },
        { role: 'assistant' as const, content: errorMessage }
      ]);
    }

    setIsLoading(false);
  };

  // ✅ FIXED: Removed unused handleReset function (onResetRequest is used instead)

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

  // ✅ Simple auto-focus on mount
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);
  }, []);

  return (
    <Box bg="white" borderRadius="lg" overflow="hidden">
      {/* ✅ SUGGESTIONS: Above input, only when first opening */}
      {showSuggestions && messages.length === 0 && (
        <Box p={4} bg="#FFF5F5" borderBottom="1px solid" borderColor="rgba(255, 73, 44, 0.2)">
          <VStack spacing={3} align="center">
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              💡 Try asking me about:
            </Text>
            <Flex gap={2} wrap="wrap" justify="center">
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("Show me safe neighborhoods")}
                borderRadius="full"
                px={4}
              >
                🛡️ Safe Areas
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("High foot traffic areas")}
                borderRadius="full"
                px={4}
              >
                🚶 Busy Areas
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("Add Korean ethnicity")}
                borderRadius="full"
                px={4}
              >
                🌍 Korean Areas
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                borderColor="rgba(255, 73, 44, 0.3)"
                color="gray.600"
                bg="white"
                _hover={{ bg: '#FF492C', color: 'white', borderColor: '#FF492C' }}
                onClick={() => handleSuggestionClick("Show foot traffic trends")}
                borderRadius="full"
                px={4}
              >
                📊 Traffic Trends
              </Button>
            </Flex>
          </VStack>
        </Box>
      )}

      {/* ✅ IMPROVED: Chat History with Better Design */}
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
              👋 Hi! I&apos;m Bricky
            </Text>
            <Text fontSize="sm" color="gray.500" lineHeight="tall">
              Your NYC neighborhood assistant. Ask me about foot traffic trends or use the suggestions above!
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
                  <Text>{msg.content}</Text>
                </Box>
              </Flex>
            ))}
            {isLoading && (
              <Flex justify="flex-start">
                <Flex align="center" gap={3} bg="white" px={4} py={3} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
                  <Spinner size="sm" color="#FF492C" />
                  <Text fontSize="sm" color="gray.600">Bricky is thinking...</Text>
                </Flex>
              </Flex>
            )}
          </VStack>
        )}
      </Box>

      {/* ✅ Input Area */}
      <Box p={4} bg="white" borderTop="1px solid" borderColor="rgba(255, 73, 44, 0.2)">
        <Flex gap={3} align="flex-end">
          <Box flex="1">
            <Input
              ref={inputRef}
              placeholder="Ask about neighborhoods, filters, or demographics..."
              value={localInput} // ✅ Use local state
              onChange={(e) => setLocalInput(e.target.value)} // ✅ Update local state only
              onFocus={handleInputFocus} // NEW: Close tract detail panel on focus
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
            isDisabled={!localInput.trim() || isLoading} // ✅ Use local input
            bg="#FF492C"
            color="white"
            _hover={{ bg: '#E53E3E' }}
            _active={{ bg: '#C53030' }}
            size="md"
            borderRadius="lg"
            boxShadow="md"
          />
        </Flex>

        {/* ✅ Reset Button */}
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