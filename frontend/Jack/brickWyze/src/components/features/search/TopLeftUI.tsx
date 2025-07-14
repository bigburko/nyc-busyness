'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, useDisclosure, Divider, Slide, VStack, Flex, Text, Input, Button, IconButton, Badge } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiSliders } from 'react-icons/fi';
import { uiStore, useUiStore } from '@/stores/uiStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useActiveFilters } from '@/hooks/useActiveFilters';
import ChatInputPanel from './ChatInputPanel';
import Sidepanel from './SidePanel';
import MyDrawer from './MyDrawer';

const UI_MARGIN = 16;
const SIDE_PANEL_WIDTH = 313;
const EXPANDED_SEARCH_AREA_HEIGHT = 130;

interface TopLeftUIProps {
  onFilterUpdate: (filters: any) => void;
}

export default function TopLeftUI({ onFilterUpdate }: TopLeftUIProps) {
  const viewState = useUiStore(s => s.viewState);
  const { isOpen: isFilterDrawerOpen, onOpen: openFilterDrawer, onClose: closeFilterDrawer } = useDisclosure();
  const [isInResultsFlow, setIsInResultsFlow] = useState(false);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  
  // ✅ Get active filter count
  const activeFilterCount = useActiveFilters();

  useEffect(() => {
    if (viewState === 'results') setIsInResultsFlow(true);
    else if (viewState === 'initial') setIsInResultsFlow(false);
  }, [viewState]);

  const handleOutsideClick = () => {
    if (viewState === 'typing' && !isFilterDrawerOpen) {
      uiStore.setState({ viewState: isInResultsFlow ? 'results' : 'initial' });
    }
  };

  useClickOutside(searchAreaRef as any, handleOutsideClick);

  const handleFilterSearch = (filters: any) => {
    console.log('🔍 [TopLeftUI] Received filters, passing to page:', filters);
    uiStore.setState({ viewState: 'results' });
    onFilterUpdate(filters);
  };

  const handleInputClick = () => {
    uiStore.setState({ viewState: 'typing' });
  };

  // ✅ Inline search bar component with filter badge
  const SearchBar = ({ isResultsView }: { isResultsView: boolean }) => (
    <Flex align="center" px={3} py={2} gap={2}>
      <Box position="relative">
        <Button
          leftIcon={<FiSliders />}
          onClick={openFilterDrawer}
          variant="ghost"
          size="sm"
          borderRadius="full"
          fontWeight="medium"
          colorScheme={activeFilterCount > 0 ? "orange" : "gray"}
          bg={activeFilterCount > 0 ? "orange.50" : "transparent"}
          _hover={{ 
            bg: activeFilterCount > 0 ? "orange.100" : "gray.100" 
          }}
        >
          Filters
        </Button>
        {activeFilterCount > 0 && (
          <Badge
            position="absolute"
            top="-2px"
            right="-2px"
            colorScheme="orange"
            borderRadius="full"
            fontSize="xs"
            minW="18px"
            h="18px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Box>
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

  const showResultsPanel = viewState === 'results' || (isInResultsFlow && viewState === 'typing');
  const isTypingForFirstTime = viewState === 'typing' && !isInResultsFlow;

  return (
    <>
      <Box position="absolute" top={0} left={0} zIndex={1400}>
        {showResultsPanel ? (
          <Slide in={true} direction="left" style={{ position: 'relative', width: `${SIDE_PANEL_WIDTH}px` }}>
            <Box h="100vh" w="100%" bg="white" boxShadow="xl" position="relative">
              <Box
                ref={searchAreaRef}
                position="absolute"
                top={0}
                left={0}
                right={0}
                zIndex={10}
                p={4}
                bg="white"
                borderBottomWidth="1px"
                borderColor="gray.200"
              >
                <Box
                  boxShadow="md"
                  borderRadius="xl"
                  overflow="hidden"
                  bg="white"
                >
                  <SearchBar isResultsView={true} />
                  
                  {/* ✅ SIMPLE: Just use opacity with fixed height container */}
                  <Box
                    height={viewState === 'typing' ? 'auto' : '0px'}
                    opacity={viewState === 'typing' ? 1 : 0}
                    overflow="hidden"
                    transition="opacity 150ms ease-out"
                  >
                    <Divider />
                    <Box 
                      transform={viewState === 'typing' ? 'translateY(0)' : 'translateY(-5px)'}
                      transition="transform 150ms ease-out"
                    >
                      <ChatInputPanel onSearchSubmit={handleFilterSearch} />
                    </Box>
                  </Box>
                </Box>
              </Box>
              <VStack
                align="stretch"
                spacing={0}
                h="100%"
                overflowY="auto"
                pt={`${EXPANDED_SEARCH_AREA_HEIGHT}px`}
              >
                <Flex align="center" px={4} pb={3}>
                  <Text fontSize="lg" fontWeight="semibold">Results</Text>
                </Flex>
                <Box flex="1" px={4} pb={4}>
                  <Sidepanel />
                </Box>
              </VStack>
            </Box>
          </Slide>
        ) : (
          <Box p={`${UI_MARGIN}px`} ref={searchAreaRef}>
            <Box
              bg="white"
              boxShadow="lg"
              borderRadius="xl"
              overflow="hidden"
            >
              <SearchBar isResultsView={false} />
              
              {/* ✅ SIMPLE: Same approach for initial state */}
              <Box
                height={isTypingForFirstTime ? 'auto' : '0px'}
                opacity={isTypingForFirstTime ? 1 : 0}
                overflow="hidden"
                transition="opacity 150ms ease-out"
              >
                <Divider />
                <Box 
                  transform={isTypingForFirstTime ? 'translateY(0)' : 'translateY(-5px)'}
                  transition="transform 150ms ease-out"
                >
                  <ChatInputPanel onSearchSubmit={handleFilterSearch} />
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <Box position="relative" zIndex={2000}>
        <MyDrawer
          isOpen={isFilterDrawerOpen}
          onClose={closeFilterDrawer}
          onSearchSubmit={handleFilterSearch}
        />
      </Box>
    </>
  );
}