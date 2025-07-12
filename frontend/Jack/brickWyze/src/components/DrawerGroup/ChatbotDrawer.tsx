'use client';

import {
  Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Box, Text, Flex, Input, IconButton, Collapse, Button, Spinner
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useRef, useState, useEffect } from 'react';
import { useGeminiStore } from './BrickyAiGroup/geminiStore';
import { useFilterStore, FilterState } from './filterStore';
import { getEthnicityGroups } from './BrickyAiGroup/ethnicityUtils';

const ETHNICITY_GROUPS = getEthnicityGroups();

const WEIGHT_KEY_MAP: Record<string, string> = {
  'foot_traffic': 'foot_traffic', 'crime': 'crime', 'crime_score': 'crime',
  'rent': 'rent_score', 'rent_score': 'rent_score', 'demographic': 'demographic',
  'demographics': 'demographic', 'flood': 'flood_risk', 'flood_risk': 'flood_risk',
  'poi': 'poi', 'points_of_interest': 'poi',
};

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

        // ✅ Clamp rent range
        if (aiFilters.rentRange && Array.isArray(aiFilters.rentRange)) {
          let [aiMin, aiMax] = aiFilters.rentRange;
          let newMin = Math.max(26, aiMin || 26);
          let newMax = Math.min(160, aiMax || 160);
          if (newMin > newMax) newMin = newMax - 5;
          updates.rentRange = [Math.max(26, newMin), newMax];
        }

        if (aiFilters.ageRange && Array.isArray(aiFilters.ageRange)) {
          let [minAge, maxAge] = aiFilters.ageRange;
          const MIN_AGE = 0;
          const MAX_AGE = 100;
          const MIN_GAP = 2;

          minAge = typeof minAge === 'number' ? minAge : MIN_AGE;
          maxAge = typeof maxAge === 'number' ? maxAge : MAX_AGE;

          minAge = Math.max(MIN_AGE, Math.min(minAge, MAX_AGE));
          maxAge = Math.max(MIN_AGE, Math.min(maxAge, MAX_AGE));

          if (maxAge - minAge < MIN_GAP) {
            if (minAge + MIN_GAP <= MAX_AGE) {
              maxAge = minAge + MIN_GAP;
            } else {
              minAge = maxAge - MIN_GAP;
            }
          }

          updates.ageRange = [minAge, maxAge];
        }


        // ✅ Clamp income range
       if (aiFilters.incomeRange && Array.isArray(aiFilters.incomeRange)) {
          let [minIncome, maxIncome] = aiFilters.incomeRange;
          const MIN_INCOME = 0;
          const MAX_INCOME = 100_000;
          const MIN_GAP = 5000;

          // Defaults
          minIncome = typeof minIncome === 'number' ? minIncome : MIN_INCOME;
          maxIncome = typeof maxIncome === 'number' ? maxIncome : MAX_INCOME;

          // Clamp to bounds
          minIncome = Math.max(MIN_INCOME, Math.min(minIncome, MAX_INCOME));
          maxIncome = Math.max(MIN_INCOME, Math.min(maxIncome, MAX_INCOME));

          // Enforce minimum gap
          if (maxIncome - minIncome < MIN_GAP) {
            if (minIncome + MIN_GAP <= MAX_INCOME) {
              maxIncome = minIncome + MIN_GAP;
            } else {
              minIncome = maxIncome - MIN_GAP;
            }
          }

          updates.incomeRange = [minIncome, maxIncome];
        }


        // ✅ Gender normalization
        if (aiFilters.selectedGenders) {
          const normalize = (g: string) => {
            const val = g.toLowerCase();
            if (['female', 'woman', 'f'].includes(val)) return 'female';
            if (['male', 'man', 'm'].includes(val)) return 'male';
            return null;
          };
          updates.selectedGenders = aiFilters.selectedGenders.map(normalize).filter(Boolean);
        }

        // ✅ Ethnicity resolution
        if (aiFilters.selectedEthnicities) {
          const resolved = aiFilters.selectedEthnicities.flatMap(
            (eth: string) => ETHNICITY_GROUPS[eth.toLowerCase().replace(/[^a-z]/g, '')] || []
          );
          updates.selectedEthnicities = Array.from(new Set(resolved));
        }

        // ✅ Weight mapping
        if (aiFilters.weights && Array.isArray(aiFilters.weights)) {
          const newWeights = [...currentState.weights];
          aiFilters.weights.forEach((aiWeight: { id: string; weight: number }) => {
            const targetId = WEIGHT_KEY_MAP[aiWeight.id.toLowerCase()] || aiWeight.id;
            const weightIndex = newWeights.findIndex(w => w.id === targetId);
            if (weightIndex !== -1) {
              newWeights[weightIndex].value = Math.round(aiWeight.weight);
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
