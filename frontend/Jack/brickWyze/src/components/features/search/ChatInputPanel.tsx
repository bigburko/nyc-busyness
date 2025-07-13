// src/components/features/search/ChatInputPanel.tsx
'use client';

import { useState } from 'react';
import { Box, Input, IconButton } from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { useUiStore } from '@/stores/uiStore';

export default function ChatInputPanel() {
  const [input, setInput] = useState('');

  const handleSearch = () => {
    if (input.trim() !== '') {
      // ✅ FIX: Use the store's setState method to set the query and change the view.
      useUiStore.setState({
        searchQuery: input,
        viewState: 'results',
      });
      setInput(''); // Clear input after search
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box p={2} display="flex" alignItems="center">
      <Input
        placeholder="e.g., Show me areas with high foot traffic"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        variant="unstyled"
        autoFocus
      />
      <IconButton
        aria-label="Submit search"
        icon={<ArrowUpIcon />}
        isRound
        colorScheme="orange"
        onClick={handleSearch}
        isDisabled={!input.trim()}
      />
    </Box>
  );
}