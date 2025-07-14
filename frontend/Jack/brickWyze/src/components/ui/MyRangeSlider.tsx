// src/components/MyRangeSlider.tsx

'use client';

import {
  Box,
  Heading,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Flex,
  Input,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import MyToolTip from './MyToolTip';

interface Props {
  heading?: string;
  unFilledTrack?: string;
  filledTrack?: string;
  boxSize?: number;
  toolTipText?: string;
  defaultRange?: [number, number];
  min?: number;
  max?: number;
  step?: number;
  onChange?: (range: [number, number]) => void;
  onChangeEnd?: (range: [number, number]) => void;
  showSymbol?: boolean;
  symbol?: string;
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return value.toString();
}

export default function MyRangeSlider({
  heading = 'Range Slider',
  unFilledTrack = 'gray.200',
  filledTrack = '#FE4A2C',
  boxSize = 6,
  defaultRange = [26, 160],
  min = 26,
  max = 160,
  step = 1,
  toolTipText,
  onChange,
  onChangeEnd,
  showSymbol = true,
  symbol = '$',
}: Props) {
  const MIN_GAP = 5;
  const [range, setRange] = useState<[number, number]>(defaultRange);

  const clamp = (val: [number, number]): [number, number] => {
    let [minVal, maxVal] = val;
    if (maxVal - minVal < MIN_GAP) {
      if (range[0] !== minVal) {
        minVal = maxVal - MIN_GAP;
      } else {
        maxVal = minVal + MIN_GAP;
      }
    }
    return [Math.max(min, minVal), Math.min(max, maxVal)];
  };

  const handleChange = (val: [number, number]) => {
    setRange(clamp(val));
    if (onChange) {
      onChange(clamp(val));
    }
  };

  const handleInput = (val: string, index: 0 | 1) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''));
    if (!isNaN(num)) {
      const updated = [...range] as [number, number];
      updated[index] = num;
      const clamped = clamp(updated);
      setRange(clamped);
      if (onChangeEnd) {
        onChangeEnd(clamped);
      }
    }
  };

  return (
    <Box w="100%">
      {/* Show heading and tooltip only if heading is provided */}
      {heading && (
        <Flex align="center" gap={2} mb={3}>
          <Heading as="h4" size="md" color="gray.800">
            {heading}
          </Heading>
          {toolTipText && <MyToolTip>{toolTipText}</MyToolTip>}
        </Flex>
      )}

      {/* Add padding around the slider */}
      <Box px={4} py={2}>
        <RangeSlider
          min={min}
          max={max}
          step={step}
          value={range}
          onChange={handleChange}
          onChangeEnd={onChangeEnd}
          mb={4}
        >
          <RangeSliderTrack bg={unFilledTrack} h="4px">
            <RangeSliderFilledTrack bg={filledTrack} />
          </RangeSliderTrack>

          {[0, 1].map((index) => (
            <RangeSliderThumb
              key={index}
              index={index}
              boxSize={boxSize}
              bg="white"
              border={`2px solid ${filledTrack}`}
            />
          ))}
        </RangeSlider>
      </Box>

      <Flex justify="space-between" mt={4}>
        {['Min', 'Max'].map((label, idx) => (
          <Box textAlign="center" key={label}>
            <Text fontSize="xs" mb={1} color="gray.600">
              {label}
            </Text>
            <Input
              value={
                showSymbol
                  ? symbol === '$'
                    ? `${symbol}${formatCompactNumber(range[idx])}`
                    : `${formatCompactNumber(range[idx])} ${symbol}`
                  : formatCompactNumber(range[idx])
              }
              onChange={(e) => handleInput(e.target.value, idx as 0 | 1)}
              onBlur={(e) => handleInput(e.target.value, idx as 0 | 1)}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                handleInput(e.currentTarget.value, idx as 0 | 1)
              }
              textAlign="center"
              borderRadius="full"
              bg="white"
              color="gray.800"
              w="80px"
              size="sm"
              border="1px solid rgba(255, 73, 44, 0.2)"
              _focus={{
                borderColor: "#FF492C",
                boxShadow: "0 0 0 1px #FF492C"
              }}
            />
          </Box>
        ))}
      </Flex>
    </Box>
  );
}