// components/MyIncomeSlider.tsx
'use client';

import { Box } from '@chakra-ui/react';
import MyRangeSlider from '../../../ui/MyRangeSlider';

export default function MyIncomeSlider({
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
        heading="Household Income"
        defaultRange={value}
        min={0}
        max={250000}
        step={5000}
        filledTrack="#68D391"
        unFilledTrack="#E2E8F0"
        showSymbol={true}
        symbol="$"
        toolTipText="Filter census tracts by household income range in USD"
        onChangeEnd={onChangeEnd}
      />
    </Box>
  );
}