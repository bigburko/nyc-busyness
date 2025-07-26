// MySlider.tsx with enhanced auto-balancing support
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
import { useState, useEffect, useCallback, useRef } from 'react';

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
  const lastExternalValue = useRef(value);

  // Sync internal value with external value when not dragging
  useEffect(() => {
    if (!isDragging && value !== lastExternalValue.current) {
      setInternalValue(value);
      lastExternalValue.current = value;
    }
  }, [value, isDragging]);

  // Handle drag start
  const handleChangeStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle drag end - this triggers auto-balancing
  const handleChangeEnd = useCallback((val: number) => {
    setIsDragging(false);
    const roundedValue = Math.round(val);
    setInternalValue(roundedValue);
    lastExternalValue.current = roundedValue;
    onChangeEnd(roundedValue);
  }, [onChangeEnd]);

  // Handle ongoing drag - only update internal state during drag
  const handleChange = useCallback((val: number) => {
    if (isDragging) {
      setInternalValue(val);
    }
  }, [isDragging]);

  // Display value - show internal value during drag, external value otherwise
  const displayValue = isDragging ? internalValue : value;

  return (
    <Box 
      bg="white" 
      borderRadius="md" 
      p={3} 
      boxShadow="sm" 
      w="100%"
      transition="all 0.2s ease"
      _hover={{
        boxShadow: "md",
      }}
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
            transition="all 0.2s ease"
          >
            {icon}
          </Box>
          <Text fontWeight="medium">{label}</Text>
        </Flex>
        <Flex align="center" gap={3}>
          <Text 
            fontSize="sm" 
            fontWeight="bold" 
            minW="40px" 
            textAlign="right"
            color={isDragging ? filledTrack : "gray.700"}
            transition="color 0.2s ease"
          >
            {Math.round(displayValue)}%
          </Text>
          {canBeRemoved && (
            <CloseButton 
              size="sm" 
              onClick={onRemove}
              _hover={{
                bg: "red.100",
                color: "red.600"
              }}
              transition="all 0.2s ease"
            />
          )}
        </Flex>
      </Flex>
      <Slider
        value={displayValue}
        onChange={handleChange}
        onChangeStart={handleChangeStart}
        onChangeEnd={handleChangeEnd}
        min={0}
        max={100}
        step={1}
        focusThumbOnChange={false}
      >
        <SliderTrack bg="gray.200" borderRadius="full">
          <SliderFilledTrack 
            bg={filledTrack} 
            borderRadius="full"
            transition="all 0.2s ease"
          />
        </SliderTrack>
        <SliderThumb 
          boxSize={4}
          bg={filledTrack}
          border="2px solid white"
          boxShadow="lg"
          _focus={{
            boxShadow: `0 0 0 3px ${filledTrack}40`
          }}
          transition="all 0.2s ease"
        />
      </Slider>
      
      {/* Visual feedback during auto-balancing */}
      {!isDragging && Math.abs(internalValue - value) > 0.1 && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(255, 255, 255, 0.8)"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
          opacity={0}
          animation="flash 0.3s ease-in-out"
          sx={{
            '@keyframes flash': {
              '0%': { opacity: 0 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0 }
            }
          }}
        >
          <Text fontSize="xs" color="gray.600" fontWeight="bold">
            Auto-balanced
          </Text>
        </Box>
      )}
    </Box>
  );
}