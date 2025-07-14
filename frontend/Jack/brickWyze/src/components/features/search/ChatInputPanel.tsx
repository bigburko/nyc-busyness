'use client';

import { useRef, useEffect, useState } from 'react';
import { Box, Input, IconButton, Spinner, Text, Flex, Button } from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { useFilterStore } from '@/stores/filterStore';
import { resolveEthnicities } from '@/lib/resolveEthnicities';
import { useGeminiStore } from '@/stores/geminiStore';

export default function ChatInputPanel({
  onSearchSubmit,
}: {
  onSearchSubmit: (filters: any) => void;
}) {
  // ✅ USE PERSISTENT STORE for messages (survives panel open/close)
  const messages = useGeminiStore((s) => s.messages);
  const setMessages = useGeminiStore((s) => s.setMessages);
  const input = useGeminiStore((s) => s.input);
  const setInput = useGeminiStore((s) => s.setInput);
  const sendToGemini = useGeminiStore((s) => s.sendToGemini);
  const resetChat = useGeminiStore((s) => s.resetChat);

  // ✅ Keep loading state local (doesn't need to persist)
  const [isLoading, setIsLoading] = useState(false);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { setFilters, reset } = useFilterStore();

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

    // ✅ Add user message to persistent store with correct type
    const newUserMessage = { role: 'user' as const, content: userMsg };
    setMessages([...messages, newUserMessage]);
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
        const resetMessage = { role: 'assistant' as const, content: '🔄 Reset all filters to defaults. Refreshing results...' };
        setMessages([...messages, newUserMessage, resetMessage]);
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
        const assistantMessage = { 
          role: 'assistant' as const, 
          content: parsed.message ? `${parsed.message} ${enhancedMessage}` : enhancedMessage 
        };
        const currentMessages = [...messages, newUserMessage, assistantMessage];
        setMessages(currentMessages);

        // Auto-submit with slight delay for better UX
        setTimeout(() => {
          const finalState = useFilterStore.getState();
          const formattedFilters = formatFiltersForSubmission();
          onSearchSubmit(formattedFilters);
          
          // Add a follow-up message after search completes
          setTimeout(() => {
            const followUpMessage = { 
              role: 'assistant' as const, 
              content: '✅ Results updated! Ask me to adjust any filters or try a different search.'
            };
            setMessages([...currentMessages, followUpMessage]);
          }, 1500);
        }, 300);
      } else {
        // Handle general conversation
        const assistantMessage = { 
          role: 'assistant' as const, 
          content: parsed.message || "I'm here to help you find the perfect NYC neighborhood! Try asking me to adjust weights, change rent ranges, or add specific demographics." 
        };
        setMessages([...messages, newUserMessage, assistantMessage]);
      }
    } catch (err: any) {
      console.error('❌ [ChatInputPanel] Error:', err);
      const errorMessage = { 
        role: 'assistant' as const, 
        content: "Sorry, I had trouble with that request. Try asking me something like 'increase foot traffic' or 'add Korean ethnicity'." 
      };
      setMessages([...messages, newUserMessage, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    reset();
    resetChat(); // Clear persistent messages
    const formattedFilters = formatFiltersForSubmission();
    onSearchSubmit(formattedFilters);
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <Box>
      {/* Chat History */}
      <Box ref={chatBodyRef} overflowY="auto" maxH="300px" px={2} py={3}>
        {messages.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Text color="gray.400" fontSize="sm" mb={2}>
              👋 Hi! I'm Bricky, your NYC neighborhood assistant
            </Text>
            <Text color="gray.500" fontSize="xs">
              Try: "Show me safe areas" or "Add Korean restaurants"
            </Text>
          </Box>
        ) : (
          messages.map((msg, i) => (
            <Box
              key={i}
              bg={msg.role === 'user' ? 'orange.100' : 'gray.100'}
              p={3}
              mb={2}
              borderRadius="md"
              maxW="85%"
              ml={msg.role === 'user' ? 'auto' : '0'}
              mr={msg.role === 'assistant' ? 'auto' : '0'}
            >
              <Text fontSize="sm">{msg.content}</Text>
            </Box>
          ))
        )}
        {isLoading && (
          <Flex align="center" gap={2} justify="center" py={2}>
            <Spinner color="orange.400" size="sm" />
            <Text fontSize="sm" color="gray.500">Bricky is thinking...</Text>
          </Flex>
        )}
      </Box>

      {/* Input */}
      <Flex mt={3} gap={2}>
        <Input
          placeholder="Ask about neighborhoods, filters, or demographics..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          size="sm"
        />
        <IconButton
          aria-label="Send"
          icon={<ArrowUpIcon />}
          onClick={handleSend}
          isDisabled={!input.trim() || isLoading}
          colorScheme="orange"
          size="sm"
        />
      </Flex>

      {/* Quick Actions */}
      <Flex gap={1} mt={2} wrap="wrap">
        <Button size="xs" variant="ghost" onClick={() => setInput("Show me safe neighborhoods")}>
          🛡️ Safe Areas
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setInput("High foot traffic areas")}>
          🚶 Busy Areas
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setInput("Add Korean ethnicity")}>
          🌍 Korean Areas
        </Button>
      </Flex>

      {/* Reset Button */}
      <Button size="xs" mt={2} w="100%" variant="outline" onClick={handleReset}>
        🔄 Reset All Filters
      </Button>
    </Box>
  );
}