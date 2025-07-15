// components/MyAgeSlider.tsx
'use client';

import { Box } from '@chakra-ui/react';
import MyRangeSlider from '../../../ui/MyRangeSlider';

export default function MyAgeSlider({
  value,
  onChangeEnd,
}: {
  value: [number, number];
  onChangeEnd: (range: [number, number]) => void;
}) {
  return (
    <Box 
      bg="white" 
      borderRadius="xl" 
      p={4} 
      w="full"
      border="1px solid rgba(255, 73, 44, 0.1)"
    >
      <MyRangeSlider
        heading="Age Range"
        defaultRange={value}
        min={0}
        max={100}
        step={1}
        filledTrack="#90CDF4"
        unFilledTrack="#E2E8F0"
        showSymbol={true}
        symbol="yrs"
        toolTipText="Filter census tracts where the selected age group is most represented."
        onChangeEnd={onChangeEnd}
      />
    </Box>
  );
}