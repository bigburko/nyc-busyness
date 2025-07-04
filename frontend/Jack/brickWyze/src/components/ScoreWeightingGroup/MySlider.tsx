// src/components/MySlider.tsx
'use client';

import {
  Box,
  Flex,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  CloseButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';

interface Props {
  label: string;
  icon: string;
  filledTrack: string;
  value: number;
  onChangeEnd: (val: number) => void; // Changed from onChange
  onRemove: () => void;
  canBeRemoved: boolean; // New prop
  boxSize?: number;
}

export default function MySlider({
  label,
  icon,
  filledTrack,
  value,
  onChangeEnd,
  onRemove,
  canBeRemoved,
  boxSize = 6,
}: Props) {
  // Internal state for smooth dragging without re-rendering the whole list
  const [sliderValue, setSliderValue] = useState(value);

  // Syncs the internal value if the parent's value changes
  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  return (
    <Box
      bg="white"
      borderRadius="md"
      p={3}
      boxShadow="sm"
      position="relative"
      w="100%"
    >
      <Flex align="center" justify="space-between" mb={2}>
        <Flex align="center" gap={2}>
          <Box
            bg={filledTrack}
            borderRadius="full"
            boxSize={boxSize}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="sm"
            color="white"
          >
            {icon}
          </Box>
          <Text fontWeight="medium">{label}</Text>
        </Flex>
        <Flex align="center" gap={3}>
          <Text fontSize="sm" fontWeight="bold" minW="40px" textAlign="right">
            {Math.round(sliderValue)}%
          </Text>
          {/* Close button is only shown if it can be removed */}
          {canBeRemoved && <CloseButton size="sm" onClick={onRemove} />}
        </Flex>
      </Flex>
      <Slider
        value={sliderValue}
        onChange={setSliderValue} // Updates local state while dragging
        onChangeEnd={onChangeEnd} // Updates parent state on release
        min={0}
        max={100}
        step={1}
      >
        <SliderTrack bg="gray.200">
          <SliderFilledTrack bg={filledTrack} />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </Box>
  );
}
