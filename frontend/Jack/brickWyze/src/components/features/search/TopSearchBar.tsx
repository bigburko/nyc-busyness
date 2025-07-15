'use client';

import { Flex, Input, Button, IconButton } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiSliders } from 'react-icons/fi';
import { uiStore } from '@/stores/uiStore';

interface TopSearchBarProps {
  onFilterClick: () => void;
}

export default function TopSearchBar({ onFilterClick }: TopSearchBarProps) {
  const handleInputClick = () => {
    uiStore.setState({ viewState: 'typing' });
  };

  return (
    <Flex align="center" px={3} py={2} gap={2}>
      {/* Filter Button */}
      <Button
        leftIcon={<FiSliders />}
        onClick={onFilterClick}
        variant="ghost"
        size="sm"
        borderRadius="full"
        fontWeight="medium"
      >
        Filters
      </Button>

      {/* Search Input */}
      <Input
        placeholder="Ask Bricky about NYC neighborhoods..."
        onClick={handleInputClick}
        cursor="pointer"
        bg="transparent"
        border="none"
        _focus={{ outline: 'none' }}
        _placeholder={{ color: 'gray.500' }}
        flex="1"
        readOnly
      />

      {/* Search Icon */}
      <IconButton
        aria-label="Search"
        icon={<SearchIcon />}
        variant="ghost"
        size="sm"
        borderRadius="full"
        onClick={handleInputClick}
      />
    </Flex>
  );
}