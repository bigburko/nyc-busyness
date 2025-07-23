// Clean MySlider.tsx with debug logs removed
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
import { useState, useEffect, useCallback } from 'react';

export interface Props {
  label: string;
  icon: string;
  filledTrack: string;
  value: number;
  onChangeEnd: (val: number) => void;
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
  const [internalValue, setInternalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Sync internal value with external value ONLY when not dragging
  useEffect(() => {
    if (!isDragging) {
      setInternalValue(value);
    }
  }, [value, isDragging]);

  // Handle drag start
  const handleChangeStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle drag end - this triggers redistribution
  const handleChangeEnd = useCallback((val: number) => {
    setIsDragging(false);
    const roundedValue = Math.round(val);
    setInternalValue(roundedValue);
    onChangeEnd(roundedValue);
  }, [onChangeEnd]);

  // Handle ongoing drag - only update internal state
  const handleChange = useCallback((val: number) => {
    setInternalValue(val);
  }, []);

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
        onChange={handleChange}
        onChangeStart={handleChangeStart}
        onChangeEnd={handleChangeEnd}
        min={0}
        max={100}
        step={1}
      >
        <SliderTrack bg="gray.200">
          <SliderFilledTrack bg={filledTrack} />
        </SliderTrack>
        <SliderThumb tabIndex={-1} />
      </Slider>
    </Box>
  );
}