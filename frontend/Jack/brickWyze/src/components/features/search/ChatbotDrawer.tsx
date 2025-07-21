// src/components/features/search/ChatbotDrawer.tsx - FIXED TypeScript errors

'use client';

import {
  Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Box, Text, Flex, Input, IconButton, Collapse, Button, Spinner
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useRef, useState, useEffect } from 'react';
import { useGeminiStore } from '../../../stores/geminiStore';
import { useFilterStore, FilterState } from '../../../stores/filterStore';
import { resolveEthnicities } from '../../../lib/resolveEthnicities';

// ✅ FIXED: Use FilterState directly instead of creating incompatible type
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSubmit: (filters: FilterState) => void; // ✅ FIXED: Use FilterState type
}

export default function ChatbotDrawer({ isOpen, onClose, onSearchSubmit }: ChatbotDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { sendToGemini } = useGeminiStore();
  const { setFilters, ...currentState } = useFilterStore();
  const resetFilters = useFilterStore(state => state.reset);

  // This is the reset logic triggered by the button
  const handleReset = () => {
    resetFilters();
    setTimeout(() => {
      const resetState = useFilterStore.getState();
      console.log('🔄 [Bricky Reset] Submitting:', resetState);
      onSearchSubmit(resetState); // ✅ FIXED: Now compatible
    }, 300);
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: 'All filters have been reset to defaults! 🔄 Searching map...'
    }]);
  };

  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsCollapsed(false);
    setIsLoading(true);

    try {
      // ✅ FIXED: Create a simplified state object that matches what gemini expects
      const simpleState = {
        weights: currentState.weights || [],
        selectedEthnicities: currentState.selectedEthnicities || [],
        selectedGenders: currentState.selectedGenders || [],
        rentRange: currentState.rentRange || [26, 160],
        ageRange: currentState.ageRange || [0, 100], 
        incomeRange: currentState.incomeRange || [0, 250000]
      };
      
      const reply = await sendToGemini(userMsg, simpleState);
      console.log('[Gemini Raw Reply]', reply);

      // ✅ FIXED: Use proper typing for parsed response
      let parsed: Partial<FilterState> & { intent?: string; message?: string };
      try {
        const match = reply.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          parsed = JSON.parse(match[1]);
        } else {
          parsed = JSON.parse(reply);
        }
      } catch (e) {
        console.error("Failed to parse AI response. Raw reply:", reply, "Error:", e);
        throw new Error("Bricky had trouble formatting its response.");
      }
      console.log('[AI Parsed]', parsed);
      
      // Check for the special reset intent from the AI
      if (parsed.intent === 'reset') {
        console.log('🤖 AI triggered reset intent.');
        resetFilters(); 
        setTimeout(() => {
          const finalState = useFilterStore.getState();
          onSearchSubmit(finalState); // ✅ FIXED: Now compatible
        }, 300);
        setMessages((prev) => [...prev, { role: 'assistant', content: parsed.message || 'Reset complete!' }]);
        setIsLoading(false);
        return;
      }
      
      if (parsed.weights || parsed.selectedEthnicities) {
        const aiFilters = parsed;
        const updates: Partial<FilterState> = {};
        
        if (aiFilters.rentRange) updates.rentRange = aiFilters.rentRange;
        if (aiFilters.ageRange) updates.ageRange = aiFilters.ageRange;
        if (aiFilters.incomeRange) updates.incomeRange = aiFilters.incomeRange;
        if (aiFilters.selectedGenders) updates.selectedGenders = aiFilters.selectedGenders;
        if (aiFilters.selectedEthnicities) {
            updates.selectedEthnicities = resolveEthnicities(aiFilters.selectedEthnicities);
        }
        if (aiFilters.weights) {
           updates.weights = aiFilters.weights;
        }
        
        const hasChanged = JSON.stringify(updates) !== JSON.stringify(currentState);
        setFilters(updates);
        
        if (hasChanged) {
            setTimeout(() => {
                const finalState = useFilterStore.getState();
                onSearchSubmit(finalState); // ✅ FIXED: Now compatible
            }, 300);
        }
        
        const feedbackMessage = parsed.message || 'Filters updated!';
        setMessages((prev) => [...prev, {
            role: 'assistant',
            content: feedbackMessage + (hasChanged ? ' 🔍 Searching map...' : ''),
        }]);

      } else {
        setMessages((prev) => [...prev, {
            role: 'assistant',
            content: parsed.message || "I'm not sure how to help with that.",
        }]);
      }
    } catch (err: unknown) {
      console.error('[Bricky Drawer Error]', err);
      
      let errorMessage = 'Bricky had trouble understanding. Try rephrasing your request.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: errorMessage,
      }]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent mt="0" h="100%" bg="white" borderRight="1px solid rgba(0,0,0,0.05)" display="flex" flexDirection="column">
        <DrawerCloseButton />
        <Flex align="center" justify="space-between" px={4} pt={6} pb={2}>
          <Text fontSize="lg" fontWeight="bold">🧱 Bricky</Text>
        </Flex>
        <Box px={4} pb={4}>
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            w="100%"
            justifyContent="space-between"
            rightIcon={isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
            bg="#ffe8dc" color="black" fontWeight="bold" fontSize="md" borderRadius="lg"
            px={4} py={6} _hover={{ bg: '#ffd9c5' }} _active={{ bg: '#ffcbb3' }}
          >
            Ask Bricky anything about NYC neighborhoods...
          </Button>
          
          <Button onClick={handleReset} size="sm" colorScheme="gray" variant="outline" w="100%" mt={2}>
            Reset to Default Weights
          </Button>

          <Flex gap={2} mt={2} wrap="wrap">
            <Button size="xs" onClick={() => setInput("Show me diverse neighborhoods")} bg="blue.100" color="blue.800" _hover={{ bg: "blue.200" }}>🌍 Diverse</Button>
            <Button size="xs" onClick={() => setInput("Low crime areas")} bg="green.100" color="green.800" _hover={{ bg: "green.200" }}>🛡️ Safe</Button>
            <Button size="xs" onClick={() => setInput("High foot traffic")} bg="orange.100" color="orange.800" _hover={{ bg: "orange.200" }}>🚶 Busy</Button>
          </Flex>
        </Box>
        <Collapse in={!isCollapsed} animateOpacity><DrawerBody display="flex" flexDirection="column" gap={4} pb={4}><Box ref={chatBodyRef} flex="1" overflowY="auto" maxH="400px">{messages.length === 0 ? (<Text color="gray.500" textAlign="center" mt={10}>No messages yet. Start chatting below.</Text>) : (messages.map((msg, idx) => (<Box key={idx} bg={msg.role === 'user' ? 'orange.100' : 'gray.100'} borderRadius="md" p={2} mb={2} maxW="80%" ml={msg.role === 'user' ? 'auto' : '0'}><Text>{msg.content}</Text></Box>)))}{isLoading && (<Box textAlign="center" mt={2}><Spinner color="orange.400" size="sm" /></Box>)}</Box><Flex gap={2}><Input ref={inputRef} placeholder="Ask Bricky..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} bg="gray.50" borderRadius="full" px={4} /><IconButton icon={<SearchIcon />} aria-label="Send" onClick={handleSend} colorScheme="orange" borderRadius="full" /></Flex></DrawerBody></Collapse>
      </DrawerContent>
    </Drawer>
  );
}