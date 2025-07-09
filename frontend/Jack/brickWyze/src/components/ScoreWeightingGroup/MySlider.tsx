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

export interface Props {
  label: string;
  icon: string;
  filledTrack: string;
  value: number; // The "canonical" value from the parent
  onChangeEnd: (val: number) => void; // Notifies parent when dragging stops
  onRemove: () => void;
  canBeRemoved: boolean;
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
  // Internal state provides a smooth dragging experience without re-rendering the whole page
  const [internalValue, setInternalValue] = useState(value);

  // Syncs the slider if its value is changed externally (e.g., by another slider)
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <Box bg="white" borderRadius="md" p={3} boxShadow="sm" w="100%">
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
            {Math.round(internalValue)}%
          </Text>
          {canBeRemoved && <CloseButton size="sm" onClick={onRemove} />}
        </Flex>
      </Flex>
      <Slider
        value={internalValue}
        onChange={setInternalValue}
        onChangeEnd={onChangeEnd}
        min={0}
        max={100}
        step={1}
      >
        <SliderTrack bg="gray.200">
          <SliderFilledTrack bg={filledTrack} />
        </SliderTrack>
        <SliderThumb tabIndex={-1} /> {/* Prevents focus jumps */}
      </Slider>
    </Box>
  );
}
