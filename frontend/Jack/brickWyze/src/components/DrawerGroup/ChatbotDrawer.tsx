// ChatbotDrawer.tsx (final updated)
'use client';

import {
  Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Box, Text, Flex, Input, IconButton, Collapse, Button, Spinner
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useRef, useState } from 'react';
import { useGeminiStore } from './BrickyAiGroup/geminiStore';
import { useFilterStore } from '../DrawerGroup/filterStore';
import { getEthnicityGroups } from './BrickyAiGroup/ethnicityUtils';

const ETHNICITY_GROUPS = getEthnicityGroups();

// maps common keywords from AI to actual weighting keys
const WEIGHT_KEY_MAP: Record<string, string> = {
  'foot_traffic': 'foot_traffic',
  'crime': 'crime',
  'crime_score': 'crime',
  'rent': 'rent_score',
  'rent_score': 'rent_score',
  'demographic': 'demographic',
  'demographics': 'demographic',
  'flood': 'flood_risk',
  'flood_risk': 'flood_risk',
  'poi': 'poi',
  'points_of_interest': 'poi',
};

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatbotDrawer({ isOpen, onClose }: ChatbotDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { sendToGemini } = useGeminiStore();
  const { setFilters } = useFilterStore();

  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg) return;

    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsCollapsed(false);
    setIsLoading(true);

    try {
      const reply = await sendToGemini(userMsg);
      console.log('[🧠 Gemini Raw Reply]', reply);

      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON block found');

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[✅ Parsed JSON]', parsed);

      // 🧬 Ethnicity Resolution
      if (parsed.filters?.selectedEthnicities) {
        const raw = parsed.filters.selectedEthnicities;
        console.log('[🧬 Raw ethnicities]', raw);

        const resolved = raw.flatMap((ethnicity: string) => {
          const key = ethnicity.toLowerCase().replace(/[^a-z]/g, '');
          return ETHNICITY_GROUPS[key] || [];
        });

        parsed.filters.selectedEthnicities = resolved;
      }

      // 📊 Weight Mapping Fix
      if (parsed.filters?.weights) {
        parsed.filters.weights = parsed.filters.weights
          .map((w: { id: string; weight: number }) => {
            const normalizedId = WEIGHT_KEY_MAP[w.id.toLowerCase()];
            if (!normalizedId || isNaN(w.weight)) return null;

            return {
              id: normalizedId,
              value: Math.min(1, Math.max(0, w.weight / 100)), // convert 100 to 1.0 scale
            };
          })
          .filter(Boolean);
      }

      if (parsed.filters) {
        console.log('[🧠 Final parsed filters]', parsed.filters);
        setFilters(parsed.filters);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: parsed.message || 'Filters updated!' },
      ]);
    } catch (err) {
      console.error('[Gemini Error]', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Bricky had trouble understanding. Try rephrasing your request.',
        },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent
        mt="0"
        h="100%"
        borderTopLeftRadius="0"
        borderBottomLeftRadius="0"
        bg="white"
        borderRight="1px solid rgba(0,0,0,0.05)"
        display="flex"
        flexDirection="column"
      >
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
            <Box flex="1" overflowY="auto" maxH="400px">
              {messages.length === 0 ? (
                <Text color="gray.500" textAlign="center" mt={10}>
                  No messages yet. Start chatting below.
                </Text>
              ) : (
                messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    bg={msg.role === 'user' ? 'orange.100' : 'gray.100'}
                    borderRadius="md"
                    p={2}
                    mb={2}
                    maxW="80%"
                    ml={msg.role === 'user' ? 'auto' : '0'}
                  >
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
