'use client';

import {
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Box,
  Text,
  Flex,
  Input,
  IconButton,
  Collapse,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useRef, useState } from 'react';
import { useGeminiStore } from './BrickyAiGroup/geminiStore'; // ✅ Zustand Gemini store
import { useFilterStore } from '../DrawerGroup/filterStore';   // ✅ Zustand filter store

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
    console.log('[🧠 Gemini Reply]', reply);

    // Always show something
    const safeReply = typeof reply === 'string' ? reply : 'Bricky didn’t reply.';

    // Match logic
    const updatedFilters: any = {};
    const normalized = safeReply.toLowerCase();

    if (normalized.includes('asian')) {
      updatedFilters.selectedEthnicities = ['Asian'];
    }
    if (normalized.includes('young')) {
      updatedFilters.ageRange = [15, 30];
    }
    if (normalized.includes('middle-aged')) {
      updatedFilters.ageRange = [35, 55];
    }
    if (normalized.includes('elderly') || normalized.includes('seniors')) {
      updatedFilters.ageRange = [60, 100];
    }
    if (normalized.includes('low rent')) {
      updatedFilters.rentRange = [0, 2500];
    } else if (normalized.includes('medium rent')) {
      updatedFilters.rentRange = [2500, 5000];
    } else if (normalized.includes('high rent')) {
      updatedFilters.rentRange = [5000, 10000];
    }

    if (Object.keys(updatedFilters).length > 0) {
      setFilters(updatedFilters);
    }

    // ✅ Show reply in chat
    setMessages((prev) => [...prev, { role: 'assistant', content: safeReply }]);
  } catch (error) {
    console.error('[Gemini Error]', error);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Sorry, something went wrong trying to answer that.' },
    ]);
  }

  setIsLoading(false); // ✅ Always stop spinner
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

        {/* Header */}
        <Flex align="center" justify="space-between" px={4} pt={6} pb={2}>
          <Text fontSize="lg" fontWeight="bold">
            🧱 Bricky
          </Text>
        </Flex>

        {/* Toggle Button */}
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

        {/* Chat Body */}
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

            {/* Input */}
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
