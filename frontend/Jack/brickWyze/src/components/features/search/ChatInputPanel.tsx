'use client';

import { useRef, useEffect, useState } from 'react';
import { 
  Box, Input, IconButton, Spinner, Text, Flex, Button, VStack
} from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { useFilterStore } from '@/stores/filterStore';
import { resolveEthnicities } from '@/lib/resolveEthnicities';
import { useGeminiStore } from '@/stores/geminiStore';

export default function ChatInputPanel({
  onSearchSubmit,
  onResetRequest,
}: {
  onSearchSubmit: (filters: any) => void;
  onResetRequest: () => void;
}) {
  // ✅ USE PERSISTENT STORE for messages (survives panel open/close)
  const messages = useGeminiStore((s) => s.messages);
  const setMessages = useGeminiStore((s) => s.setMessages);
  const input = useGeminiStore((s) => s.input);
  const setInput = useGeminiStore((s) => s.setInput);
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  const resetChat = useGeminiStore((s) => s.resetChat);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { setFilters, reset } = useFilterStore();

  // ✅ Track loading state locally (doesn't need to persist)
  const [isLoading, setIsLoading] = useState(false);

  const formatFiltersForSubmission = () => {
    const currentState = useFilterStore.getState();
    return {
      weights: currentState.weights || [],
      rentRange: currentState.rentRange || [26, 160],
      selectedEthnicities: currentState.selectedEthnicities || [],
      selectedGenders: currentState.selectedGenders || ['male', 'female'],
      ageRange: currentState.ageRange || [0, 100],
      incomeRange: currentState.incomeRange || [0, 250000],
    };
  };

  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg || isLoading) return;

    // Add user message to persistent store with correct typing
    setMessages([...messages, { role: 'user' as const, content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const currentState = useFilterStore.getState();
      const reply = await sendToGemini(userMsg, currentState);
      
      const match = reply.match(/```json\s*([\s\S]*?)\s*```/);
      let parsed: any = {};
      try {
        parsed = JSON.parse(match ? match[1] : reply);
      } catch (e) {
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
        const updates: any = {};
        let changeDescription = '';
        
        if (parsed.weights) {
          updates.weights = parsed.weights;
          const topWeight = parsed.weights.reduce((max: any, w: any) => w.value > max.value ? w : max, parsed.weights[0]);
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
          const finalState = useFilterStore.getState();
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
    } catch (err: any) {
      console.error('❌ [ChatInputPanel] Error:', err);
      setMessages([...messages, 
        { role: 'user' as const, content: userMsg },
        { role: 'assistant' as const, content: "Sorry, I had trouble with that request. Try asking me something like 'increase foot traffic' or 'add Korean ethnicity'." }
      ]);
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    reset();
    resetChat();
    const formattedFilters = formatFiltersForSubmission();
    onSearchSubmit(formattedFilters);
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <Box bg="white" borderRadius="lg" overflow="hidden">
      {/* ✅ IMPROVED: Chat History with Better Design */}
      <Box 
        ref={chatBodyRef} 
        overflowY="auto" 
        maxH="320px" 
        p={4}
        bg="gray.50"
        css={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: '3px' }
        }}
      >
        {messages.length === 0 ? (
          <VStack spacing={3} py={6} textAlign="center">
            <Text fontSize="md" fontWeight="semibold" color="gray.600">
              👋 Hi! I'm Bricky
            </Text>
            <Text fontSize="sm" color="gray.500" lineHeight="tall">
              Your NYC neighborhood assistant. Try asking me about safe areas, busy locations, or specific demographics.
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

      {/* ✅ IMPROVED: Input Area with Better Styling */}
      <Box p={4} bg="white" borderTop="1px solid" borderColor="gray.200">
        <Flex gap={3} align="flex-end">
          <Box flex="1">
            <Input
              placeholder="Ask about neighborhoods, filters, or demographics..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              size="md"
              borderRadius="lg"
              bg="gray.50"
              border="2px solid"
              borderColor="gray.200"
              _focus={{ 
                borderColor: '#FF492C',
                bg: 'white',
                boxShadow: '0 0 0 1px #FF492C'
              }}
              _placeholder={{ color: 'gray.500' }}
            />
          </Box>
          <IconButton
            aria-label="Send"
            icon={<ArrowUpIcon />}
            onClick={handleSend}
            isDisabled={!input.trim() || isLoading}
            bg="#FF492C"
            color="white"
            _hover={{ bg: '#E53E3E' }}
            _active={{ bg: '#C53030' }}
            size="md"
            borderRadius="lg"
            boxShadow="md"
          />
        </Flex>

        {/* ✅ IMPROVED: Quick Actions with Better Layout */}
        <Flex gap={2} mt={3} wrap="wrap">
          <Button 
            size="xs" 
            variant="outline" 
            borderColor="gray.300"
            color="gray.600"
            _hover={{ bg: 'gray.50', borderColor: '#FF492C', color: '#FF492C' }}
            onClick={() => setInput("Show me safe neighborhoods")}
            borderRadius="full"
          >
            🛡️ Safe Areas
          </Button>
          <Button 
            size="xs" 
            variant="outline" 
            borderColor="gray.300"
            color="gray.600"
            _hover={{ bg: 'gray.50', borderColor: '#FF492C', color: '#FF492C' }}
            onClick={() => setInput("High foot traffic areas")}
            borderRadius="full"
          >
            🚶 Busy Areas
          </Button>
          <Button 
            size="xs" 
            variant="outline" 
            borderColor="gray.300"
            color="gray.600"
            _hover={{ bg: 'gray.50', borderColor: '#FF492C', color: '#FF492C' }}
            onClick={() => setInput("Add Korean ethnicity")}
            borderRadius="full"
          >
            🌍 Korean Areas
          </Button>
        </Flex>

        {/* ✅ IMPROVED: Reset Button - triggers parent confirmation */}
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