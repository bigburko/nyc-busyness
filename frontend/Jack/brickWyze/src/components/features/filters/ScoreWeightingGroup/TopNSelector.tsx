'use client';

import { 
  Box, 
  Text
} from '@chakra-ui/react';
import MySlider from './MySlider';

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
    <Box>
      <Text fontSize="sm" color="gray.600" mb={3}>
        Show top {value}% of census tracts ({estimatedCount} tracts)
      </Text>
      
      {/* ✅ Use MySlider component with consistent styling */}
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
    </Box>
  );
}