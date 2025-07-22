'use client';

import { useRef, useEffect, useState } from 'react';
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

export default function ChatInputPanel({
  onSearchSubmit,
  onResetRequest,
}: {
  onSearchSubmit: (filters: FilterState) => void;
  onResetRequest: () => void;
}) {
  const messages = useGeminiStore((s) => s.messages);
  const setMessages = useGeminiStore((s) => s.setMessages);
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  
  const [localInput, setLocalInput] = useState('');
  
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { setFilters, reset } = useFilterStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputFocus = () => {
    console.log('🔍 [ChatInputPanel] Chat input focused - keeping tract panel open for now');
  };

  const formatFiltersForSubmission = (): FilterState => {
    return useFilterStore.getState();
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
          { role: 'assistant' as const, content: '🔄 Reset all filters to defaults. Refreshing results...' }
        ]);
        setTimeout(() => {
          const formattedFilters = formatFiltersForSubmission();
          onSearchSubmit(formattedFilters);
        }, 300);
      } else if (parsed.weights || parsed.selectedEthnicities || parsed.selectedTimePeriods || parsed.rentRange || parsed.ageRange || parsed.incomeRange || parsed.selectedGenders) {
        // Enhanced filter updates with age/income intelligence descriptions
        const updates: FilterUpdates = {};
        let changeDescription = '';
        
        if (parsed.weights) {
          updates.weights = parsed.weights;
          const topWeight = parsed.weights.reduce((max, w) => w.value > max.value ? w : max, parsed.weights[0]);
          const secondWeight = parsed.weights.filter(w => w.id !== topWeight.id).reduce((max, w) => w.value > max.value ? w : max, {value: 0, label: ''});
          
          if (secondWeight.value > 0) {
            changeDescription += `Balancing ${topWeight.label.toLowerCase()} (${topWeight.value}%) with ${secondWeight.label.toLowerCase()} (${secondWeight.value}%). `;
          } else {
            changeDescription += `Focusing on ${topWeight.label.toLowerCase()} (${topWeight.value}%). `;
          }
        }
        
        // Enhanced age descriptions with lifecycle context
        if (parsed.ageRange) {
          updates.ageRange = parsed.ageRange;
          const [min, max] = parsed.ageRange;
          
          let ageContext = '';
          if (max <= 30) {
            ageContext = 'young adults & students';
          } else if (min >= 45) {
            ageContext = 'mature professionals & empty nesters';
          } else if (min <= 25 && max >= 45) {
            ageContext = 'broad working-age population';
          } else if (min >= 25 && max <= 40) {
            ageContext = 'young professionals & early families';
          } else {
            ageContext = 'family-building age group';
          }
          
          changeDescription += `Targeting ${ageContext} (${min}-${max} years). `;
        }
        
        // Enhanced income descriptions with spending power context
        if (parsed.incomeRange) {
          updates.incomeRange = parsed.incomeRange;
          const [min, max] = parsed.incomeRange;
          const minK = Math.round(min/1000);
          const maxK = Math.round(max/1000);
          
          let incomeContext = '';
          if (maxK <= 50) {
            incomeContext = 'budget-conscious customers';
          } else if (minK >= 100) {
            incomeContext = 'affluent customers with high spending power';
          } else if (maxK <= 80) {
            incomeContext = 'working-class to lower-middle income';
          } else if (minK >= 60 && maxK <= 150) {
            incomeContext = 'middle to upper-middle class';
          } else {
            incomeContext = 'broad middle-income range';
          }
          
          changeDescription += `${incomeContext} ($${minK}K-${maxK}K). `;
        }
        
        // Enhanced time period descriptions
        if (parsed.selectedTimePeriods) {
          updates.selectedTimePeriods = parsed.selectedTimePeriods;
          const timeDescriptions = {
            'morning': 'morning rush & opening hours',
            'afternoon': 'lunch crowds & peak business', 
            'evening': 'dinner & social hours'
          };
          const timeStr = parsed.selectedTimePeriods.map(t => timeDescriptions[t as keyof typeof timeDescriptions] || t).join(', ');
          changeDescription += `Operating focus: ${timeStr}. `;
        }
        
        // Enhanced demographic descriptions
        if (parsed.selectedEthnicities) {
          updates.selectedEthnicities = resolveEthnicities(parsed.selectedEthnicities);
          const ethnicityNames = parsed.selectedEthnicities.join(', ');
          if (parsed.selectedEthnicities.length > 1) {
            changeDescription += `Multi-cultural customer base: ${ethnicityNames}. `;
          } else {
            changeDescription += `Community focus: ${ethnicityNames}. `;
          }
        }
        
        if (parsed.rentRange) {
          updates.rentRange = parsed.rentRange;
          const [min, max] = parsed.rentRange;
          if (min <= 40) {
            changeDescription += `Budget-friendly location ($${min}-${max} PSF). `;
          } else if (max >= 120) {
            changeDescription += `Premium location ($${min}-${max} PSF). `;
          } else {
            changeDescription += `Mid-tier location ($${min}-${max} PSF). `;
          }
        }
        
        if (parsed.selectedGenders) {
          updates.selectedGenders = parsed.selectedGenders;
          if (parsed.selectedGenders.length === 1) {
            changeDescription += `${parsed.selectedGenders[0]}-focused strategy. `;
          }
        }

        setFilters(updates);

        const enhancedMessage = `${changeDescription}🎯 Optimizing customer demographics...`;
        const newMessages = [...messages, 
          { role: 'user' as const, content: userMsg },
          { role: 'assistant' as const, content: parsed.message ? `${parsed.message} ${enhancedMessage}` : enhancedMessage }
        ];
        setMessages(newMessages);

        // Auto-submit with slight delay for better UX
        setTimeout(() => {
          const formattedFilters = formatFiltersForSubmission();
          onSearchSubmit(formattedFilters);
          
          // Add a follow-up message after search completes
          setTimeout(() => {
            setMessages([...newMessages, { 
              role: 'assistant' as const, 
              content: '✅ Customer-optimized results ready! Want me to adjust the age groups, income targeting, or explore different customer segments?'
            }]);
          }, 1500);
        }, 300);
      } else {
        // Handle general conversation with age/income context
        setMessages([...messages, 
          { role: 'user' as const, content: userMsg },
          { role: 'assistant' as const, content: parsed.message || "I'm here to help you find the perfect business location with smart customer targeting! I analyze age groups, income levels, spending patterns, and lifestyle factors to optimize your business success in NYC." }
        ]);
      }
    } catch (err: unknown) {
      console.error('❌ [ChatInputPanel] Error:', err);
      
      let errorMessage = "Sorry, I had trouble with that request. Try asking me about specific customer types like 'young professional coffee shop' or 'family-friendly restaurant'.";
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
                  <Text>{msg.content}</Text>
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