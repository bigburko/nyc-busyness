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
  onChangeEnd?: (range: [number, number]) => void; // ✅ 1. Add onChangeEnd here
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
  unFilledTrack = 'black',
  filledTrack = '#FE4A2C',
  boxSize = 6,
  defaultRange = [26, 160],
  min = 26,
  max = 160,
  step = 1,
  toolTipText,
  onChange,
  onChangeEnd, // ✅ 2. Destructure the new prop
  showSymbol = true,
  symbol = '$',
}: Props) {
  const MIN_GAP = 5;
  const [range, setRange] = useState<[number, number]>(defaultRange);

  // ❌ 3. REMOVE the problematic useEffect. It caused excessive updates.
  // useEffect(() => {
  //   onChange?.(range);
  // }, [range, onChange]);

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

  // This function now only updates the local state for instant UI feedback
  const handleChange = (val: [number, number]) => {
    setRange(clamp(val));
    // We can still call the original onChange if provided, for live updates
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
      // Also trigger onChangeEnd when an input is manually changed
      if (onChangeEnd) {
        onChangeEnd(clamped);
      }
    }
  };

  return (
    <Box bg="#FFDED8" p={4} borderRadius="md" mb={6} w="100%">
      <Flex align="center" gap={2} mb={3}>
        <Heading as="h4" size="md" color="black">
          {heading}
        </Heading>
        <MyToolTip>{toolTipText}</MyToolTip>
      </Flex>

      <RangeSlider
        min={min}
        max={max}
        step={step}
        value={range}
        onChange={handleChange} // Updates local UI instantly
        onChangeEnd={onChangeEnd} // ✅ 4. Pass onChangeEnd to the Chakra component to update global state
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

      <Flex justify="space-between" mt={4}>
        {['Min', 'Max'].map((label, idx) => (
          <Box textAlign="center" key={label}>
            <Text fontSize="xs" mb={1} color="black">
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
              color="black"
              w="80px"
              size="sm"
            />
          </Box>
        ))}
      </Flex>
    </Box>
  );
}
