'use client';

import {
  Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Box, Text, Flex, Input, IconButton, Collapse, Button, Spinner
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useRef, useState, useEffect } from 'react';
import { useGeminiStore } from './BrickyAiGroup/geminiStore';
import { useFilterStore, FilterState } from './filterStore';
import { resolveEthnicities } from './BrickyAiGroup/resolveEthnicities';

const WEIGHT_KEY_MAP: Record<string, string> = {
  'foot_traffic': 'foot_traffic', 'crime': 'crime', 'crime_score': 'crime',
  'rent': 'rent_score', 'rent_score': 'rent_score', 'demographic': 'demographic',
  'demographics': 'demographic', 'flood': 'flood_risk', 'flood_risk': 'flood_risk',
  'poi': 'poi', 'points_of_interest': 'poi',
};

// Weight normalization helper
function normalizeWeight(weight: number): number {
  // Handle decimal weights (0.75 → 75)
  if (weight <= 1) {
    return Math.round(weight * 100);
  }
  // Handle already normalized weights
  return Math.round(Math.min(100, Math.max(0, weight)));
}

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatbotDrawer({ isOpen, onClose }: ChatbotDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { sendToGemini } = useGeminiStore();
  const setFilters = useFilterStore((state: FilterState) => state.setFilters);

  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsCollapsed(false);
    setIsLoading(true);

    try {
      const reply = await sendToGemini(userMsg);
      console.log('[Gemini Raw Reply]', reply);
      const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch || !jsonMatch[1]) {
        throw new Error('No valid JSON code block found in AI response.');
      }

      const parsed = JSON.parse(jsonMatch[1]);
      console.log('[AI Parsed]', parsed);

      const currentState = useFilterStore.getState();
      const updates: Partial<FilterState> = {};

      if (parsed.filters) {
        const aiFilters = parsed.filters;
        console.log('[Gemini Filters]', aiFilters);

        if (aiFilters.rentRange && Array.isArray(aiFilters.rentRange)) {
          let [min, max] = aiFilters.rentRange;
          min = Math.max(26, min || 26);
          max = Math.min(160, max || 160);
          if (min > max) min = max - 5;
          updates.rentRange = [Math.max(26, min), max];
        }

        if (aiFilters.ageRange && Array.isArray(aiFilters.ageRange)) {
          let [min, max] = aiFilters.ageRange;
          const MIN = 0, MAX = 100, GAP = 2;
          min = Math.max(MIN, Math.min(min || MIN, MAX));
          max = Math.max(MIN, Math.min(max || MAX, MAX));
          if (max - min < GAP) max = Math.min(MAX, min + GAP);
          updates.ageRange = [min, max];
        }

        if (aiFilters.incomeRange && Array.isArray(aiFilters.incomeRange)) {
          let [min, max] = aiFilters.incomeRange;
          const MIN = 0, MAX = 100_000, GAP = 5000;
          min = Math.max(MIN, Math.min(min || MIN, MAX));
          max = Math.max(MIN, Math.min(max || MAX, MAX));
          if (max - min < GAP) max = Math.min(MAX, min + GAP);
          updates.incomeRange = [min, max];
        }

        // IMPROVED GENDER HANDLING - Always keep at least one selected
        if (aiFilters.selectedGenders && Array.isArray(aiFilters.selectedGenders)) {
          const normalize = (g: string) => {
            const val = g.toLowerCase();
            if (['female', 'woman', 'f'].includes(val)) return 'female';
            if (['male', 'man', 'm'].includes(val)) return 'male';
            return null;
          };
          
          const normalizedGenders = aiFilters.selectedGenders.map(normalize).filter(Boolean);
          
          // Ensure at least one gender is always selected
          if (normalizedGenders.length === 0) {
            // Don't update - keep current selection
            console.log('⏸️ AI returned empty genders - keeping current selection');
          } else {
            updates.selectedGenders = normalizedGenders;
            console.log('[📍Updated Genders]', normalizedGenders);
          }
        }

        // IMPROVED ETHNICITY HANDLING - Don't clear when AI asks questions
        if (aiFilters.selectedEthnicities) {
          console.log('[Raw Ethnicity Input]', aiFilters.selectedEthnicities);
          
          if (aiFilters.selectedEthnicities.length === 0) {
            // Don't update filters when AI returns empty array (asking for clarification)
            console.log('⏸️ AI returned empty ethnicities - not updating filters');
          } else {
            const resolved = resolveEthnicities(aiFilters.selectedEthnicities);
            
            if (resolved.length === 0) {
              // Fallback: warn user about unrecognized ethnicities
              console.warn('⚠️ No ethnicities were resolved from:', aiFilters.selectedEthnicities);
              setMessages((prev) => [...prev, {
                role: 'assistant', 
                content: `I couldn't recognize the ethnicity terms: ${aiFilters.selectedEthnicities.join(', ')}. Try terms like "South Asian", "Black", "Hispanic", etc.`
              }]);
            } else {
              // 🎯 REPLACE previous selection
              updates.selectedEthnicities = resolved;
              console.log('[📍Final Resolved Ethnicities (REPLACED)]', updates.selectedEthnicities);
            }
          }
        }

        // IMPROVED WEIGHT HANDLING
        if (aiFilters.weights && Array.isArray(aiFilters.weights)) {
          const newWeights = [...currentState.weights];
          aiFilters.weights.forEach((aiWeight: { id: string; weight: number }) => {
            const id = WEIGHT_KEY_MAP[aiWeight.id.toLowerCase()] || aiWeight.id;
            const normalizedWeight = normalizeWeight(aiWeight.weight);
            const i = newWeights.findIndex(w => w.id === id);
            if (i !== -1) {
              newWeights[i].value = normalizedWeight;
              console.log(`🎯 Normalized weight ${aiWeight.id}: ${aiWeight.weight} → ${normalizedWeight}`);
            }
          });
          updates.weights = newWeights;
        }
      }

      console.log('[SetFilters Payload]', updates);
      if (Object.keys(updates).length > 0) {
        setFilters(updates);
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: parsed.message || 'Filters updated!',
      }]);
    } catch (err) {
      console.error('[Bricky Drawer Error]', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Bricky had trouble understanding. Try rephrasing your request.',
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
            bg="#ffe8dc"
            color="black"
            fontWeight="bold"
            fontSize="md"
            borderRadius="lg"
            px={4}
            py={6}
            _hover={{ bg: '#ffd9c5' }}
            _active={{ bg: '#ffcbb3' }}
          >
            Ask Bricky anything about NYC neighborhoods...
          </Button>
          
          {/* Clear Filters Button */}
          <Button
            onClick={() => {
              useFilterStore.getState().reset();
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: 'All filters have been cleared! 🧹'
              }]);
            }}
            size="sm"
            colorScheme="gray"
            variant="outline"
            w="100%"
            mt={2}
          >
            Clear All Filters
          </Button>
        </Box>
        <Collapse in={!isCollapsed} animateOpacity>
          <DrawerBody display="flex" flexDirection="column" gap={4} pb={4}>
            <Box ref={chatBodyRef} flex="1" overflowY="auto" maxH="400px">
              {messages.length === 0 ? (
                <Text color="gray.500" textAlign="center" mt={10}>
                  No messages yet. Start chatting below.
                </Text>
              ) : (
                messages.map((msg, idx) => (
                  <Box key={idx} bg={msg.role === 'user' ? 'orange.100' : 'gray.100'} borderRadius="md" p={2} mb={2} maxW="80%" ml={msg.role === 'user' ? 'auto' : '0'}>
                    <Text>{msg.content}</Text>
                  </Box>
                ))
              )}
              {isLoading && (
                <Box textAlign="center" mt={2}>
                  <Spinner color="orange.400" size="sm" />
                </Box>
              )}
            </Box>
            <Flex gap={2}>
              <Input
                ref={inputRef}
                placeholder="Ask Bricky..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                bg="gray.50"
                borderRadius="full"
                px={4}
              />
              <IconButton
                icon={<SearchIcon />}
                aria-label="Send"
                onClick={handleSend}
                colorScheme="orange"
                borderRadius="full"
              />
            </Flex>
          </DrawerBody>
        </Collapse>
      </DrawerContent>
    </Drawer>
  );
}