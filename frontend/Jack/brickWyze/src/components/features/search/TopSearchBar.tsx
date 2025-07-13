'use client';
import { Flex, IconButton, Button, Text } from '@chakra-ui/react';
import { FiSliders } from 'react-icons/fi';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useUiStore } from '@/stores/uiStore';
import { useFilterStore } from '@/stores/filterStore';

interface TopSearchBarProps {
  onFilterClick: () => void;
  isResultsViewActive?: boolean;
}

export const TOP_BAR_HEIGHT = 48;

export default function TopSearchBar({ onFilterClick, isResultsViewActive = false }: TopSearchBarProps) {
  const { viewState, searchQuery, focusSearch, clearSearch } = useUiStore();
  const areFiltersActive = useFilterStore(
    (state) => state.selectedEthnicities.length > 0
  );

  const isTyping = viewState === 'typing';
  const showCloseButton = isResultsViewActive;
  const showStaticQuery = isResultsViewActive && !isTyping;
  const showPlaceholder = !isResultsViewActive && !isTyping;

  return (
    <Flex align="center" gap="2" p={2} h={`${TOP_BAR_HEIGHT}px`}>
      <Button
        onClick={onFilterClick}
        leftIcon={<FiSliders />}
        variant="ghost"
        color={areFiltersActive ? 'orange.500' : 'gray.700'}
      >
        Filters
      </Button>
      <Flex flex="1" h="100%" align="center" onClick={focusSearch} cursor="pointer">
        {showStaticQuery && (
          <Text pl={2} noOfLines={1} fontWeight="medium">
            {searchQuery}
          </Text>
        )}
        {showPlaceholder && (
          <Text pl={2} color="gray.400">Ask Bricky...</Text>
        )}
      </Flex>
      <IconButton
        aria-label={showCloseButton ? 'Clear Search' : 'Search'}
        icon={showCloseButton ? <CloseIcon /> : <SearchIcon />}
        isRound
        variant="ghost"
        onClick={showCloseButton ? clearSearch : undefined}
        pointerEvents={showCloseButton ? 'auto' : 'none'}
      />
    </Flex>
  );
}