import React from 'react';
import { Box, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@chakra-ui/react';

interface TopNSelectorProps {
  value: number;
  onChange: (value: number) => void;
  actualMatchingTracts?: number;
  totalTractsFound?: number;
  isLoading?: boolean;
}

const TopNSelector: React.FC<TopNSelectorProps> = ({ 
  value, 
  onChange, 
  actualMatchingTracts,
  totalTractsFound,
  isLoading = false 
}) => {
  // FIXED: Use actual search results instead of hardcoded NYC tract count
  const getDisplayText = () => {
    if (isLoading) {
      return "Loading results...";
    }
    
    // Use actual matching tracts if available, otherwise show percentage only
    if (actualMatchingTracts !== undefined && actualMatchingTracts > 0) {
      return `Show top ${value}% of matching tracts (${actualMatchingTracts} tracts)`;
    }
    
    if (totalTractsFound !== undefined && totalTractsFound > 0) {
      const estimatedCount = Math.ceil(totalTractsFound * (value / 100));
      return `Show top ${value}% of matching tracts (~${estimatedCount} tracts)`;
    }
    
    return `Show top ${value}% of matching tracts`;
  };

  const getProgressColor = () => {
    if (value <= 25) return 'red.400';
    if (value <= 50) return 'orange.400';
    if (value <= 75) return 'yellow.400';
    return 'green.400';
  };

  return (
    <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
      <Text fontSize="sm" fontWeight="bold" mb={2}>
        📊 Results Display
      </Text>
      
      <Text fontSize="xs" color="gray.600" mb={3}>
        {getDisplayText()}
      </Text>
      
      <Box>
        <Text fontSize="xs" color="gray.500" mb={2}>
          Top Percentage: {value}%
        </Text>
        
        <Slider
          value={value}
          onChange={onChange}
          min={1}
          max={100}
          step={1}
          colorScheme={getProgressColor().split('.')[0]}
        >
          <SliderTrack bg="gray.200">
            <SliderFilledTrack bg={getProgressColor()} />
          </SliderTrack>
          <SliderThumb boxSize={4} bg={getProgressColor()} />
        </Slider>
        
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Text fontSize="xs" color="gray.400">1%</Text>
          <Text fontSize="xs" color="gray.400">100%</Text>
        </Box>
      </Box>
      
      {actualMatchingTracts !== undefined && (
        <Text fontSize="xs" color="gray.500" mt={2}>
          {actualMatchingTracts > 0 
            ? `Based on ${actualMatchingTracts} zones matching your filters` 
            : "No zones match your current filters"
          }
        </Text>
      )}
    </Box>
  );
};

export default TopNSelector;