'use client';

import { 
  Box, 
  Text, 
  Flex, 
  Button
} from '@chakra-ui/react';
import MySlider from './MySlider'; // ✅ Import MySlider from same directory

interface TopNSelectorProps {
  value: number;
  onChange: (value: number) => void;
  estimatedTotalTracts?: number;
}

export default function TopNSelector({ 
  value, 
  onChange, 
  estimatedTotalTracts = 310 
}: TopNSelectorProps) {
  const estimatedCount = Math.ceil(estimatedTotalTracts * (value / 100));

  return (
    <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
      <Text fontSize="md" fontWeight="semibold" mb={3} color="gray.700">
        📊 Results Display
      </Text>
      <Text fontSize="sm" color="gray.600" mb={3}>
        Show top {value}% of census tracts ({estimatedCount} tracts)
      </Text>
      
      {/* ✅ Use your MySlider component with consistent styling */}
      <MySlider
        label="Top Percentage"
        icon="📊"
        filledTrack="#FF492C"
        value={value}
        onChangeEnd={onChange}
        onRemove={() => {}} // No remove functionality for this slider
        canBeRemoved={false}
        boxSize={6}
      />
      
      {/* Quick preset buttons */}
      <Flex gap={2} mt={3} wrap="wrap">
        {[5, 10, 15, 20, 25].map(percent => (
          <Button
            key={percent}
            size="xs"
            variant={percent === value ? "solid" : "outline"}
            bg={percent === value ? "#FF492C" : "transparent"}
            color={percent === value ? "white" : "#FF492C"}
            borderColor="#FF492C"
            _hover={{ 
              bg: percent === value ? "#E53E3E" : "rgba(255, 73, 44, 0.1)"
            }}
            onClick={() => onChange(percent)}
            borderRadius="full"
          >
            {percent}%
          </Button>
        ))}
      </Flex>
      
      <Text fontSize="xs" color="gray.500" mt={2}>
        💡 Fewer tracts = better performance & cleaner map
      </Text>
    </Box>
  );
}