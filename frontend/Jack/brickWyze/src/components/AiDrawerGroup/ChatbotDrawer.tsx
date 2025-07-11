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
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useRef, useState } from 'react';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatbotDrawer({ isOpen, onClose }: ChatbotDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages((prev) => [...prev, input]);
    setInput('');
    setIsCollapsed(false); // Auto-expand on message
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

        {/* Toggle styled like collapsible section */}
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
        <Collapse in={!isCollapsed} animateOpacity style={{ overflow: 'auto' }}>
          <DrawerBody display="flex" flexDirection="column" gap={4} pb={4}>
            {/* Message list */}
            <Box flex="1" overflowY="auto" maxH="400px">
              {messages.length === 0 ? (
                <Text color="gray.500" textAlign="center" mt={10}>
                  No messages yet. Start chatting below.
                </Text>
              ) : (
                messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    bg="orange.100"
                    borderRadius="md"
                    p={2}
                    mb={2}
                    maxW="80%"
                    ml="auto"
                  >
                    <Text>{msg}</Text>
                  </Box>
                ))
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
