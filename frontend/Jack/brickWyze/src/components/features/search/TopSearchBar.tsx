'use client';

import {
  Button,
  Flex,
  IconButton,
  Input,
  useDisclosure,
} from '@chakra-ui/react';
import { FiSliders } from 'react-icons/fi';
import { SearchIcon } from '@chakra-ui/icons';
import { useRef } from 'react';
import MyDrawer from './MyDrawer';
import ChatbotDrawer from './ChatbotDrawer';
import { Weighting } from '../filters/ScoreWeightingGroup/WeightingPanel';

interface SearchFilters {
  weights: Weighting[];
  rentRange: [number, number];
  selectedEthnicities: string[];
  selectedGenders: string[];
  ageRange: [number, number];
  incomeRange: [number, number];
}

export default function TopSearchBar({
  onSearchSubmit,
}: {
  onSearchSubmit: (filters: SearchFilters) => void;
}) {
  const {
    isOpen: isDrawerOpen,
    onOpen: openDrawer,
    onClose: closeDrawer,
  } = useDisclosure();

  const {
    isOpen: isChatbotOpen,
    onOpen: openChatbot,
    onClose: closeChatbot,
  } = useDisclosure();

  const filterButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Flex
        position="absolute"
        top="16px"
        left="16px"
        zIndex="overlay"
        bg="white"
        borderRadius="full"
        boxShadow="md"
        align="center"
        px={3}
        py={1}
        w="600px"
        maxW="95%"
      >
        {/* Filters Button */}
        <Button
          ref={filterButtonRef}
          onClick={openDrawer}
          leftIcon={<FiSliders />}
          borderRadius="full"
          variant="ghost"
          fontWeight="medium"
          px={4}
          mr={2}
        >
          Filters
        </Button>

        {/* Search Input */}
        <Input
          placeholder="Search BrickWyze..."
          border="none"
          _focus={{ outline: 'none' }}
          _placeholder={{ color: 'gray.500' }}
          onClick={openChatbot}
          cursor="pointer"
          bg="transparent"
          flex="1"
        />

        {/* Search Icon (optional trigger) */}
        <IconButton
          aria-label="Search"
          icon={<SearchIcon />}
          variant="ghost"
          borderRadius="full"
          ml={2}
        />
      </Flex>

      {/* Filters Drawer */}
      <MyDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onSearchSubmit={(filters) => {
          console.log('🔍 Submitted filters:', filters);
          onSearchSubmit(filters);
        }}
      />

      {/* Chatbot Drawer - FIX: Added missing isOpen and onClose props */}
      <ChatbotDrawer 
        isOpen={isChatbotOpen}
        onClose={closeChatbot}
        onSearchSubmit={(filters) => {
          console.log('🤖 Bricky submitted filters:', filters);
          onSearchSubmit(filters);
        }}
      />
    </>
  );
}