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
  Tooltip,
} from '@chakra-ui/react';
import { useState } from 'react';
import { IoIosInformationCircle } from 'react-icons/io';

interface Props {
  heading?: string;
  unFilledTrack?: string;
  filledTrack?: string;
  boxSize?: number;
  defaultRange?: [number, number];
  min?: number;
  max?: number;
  step?: number;
}

export default function MyRangeSlider({
  heading = 'Range Slider',
  unFilledTrack = 'black',
  filledTrack = '#FE4A2C',
  boxSize = 7,
  defaultRange = [26, 160],
  min = 26,
  max = 160,
  step = 1,
}: Props) {
  const MIN_GAP = 5;
  const [range, setRange] = useState<[number, number]>(defaultRange);
  const [minInput, setMinInput] = useState(`${range[0]}`);
  const [maxInput, setMaxInput] = useState(`${range[1]}`);
  const [isDragging, setIsDragging] = useState(false);

  const clampRange = (val: [number, number]): [number, number] => {
    let [minVal, maxVal] = val;
    if (maxVal - minVal < MIN_GAP) {
      if (minVal !== range[0]) {
        minVal = maxVal - MIN_GAP;
      } else {
        maxVal = minVal + MIN_GAP;
      }
    }
    minVal = Math.max(min, minVal);
    maxVal = Math.min(max, maxVal);
    return [minVal, maxVal];
  };

  const handleSliderChange = (val: [number, number]) => {
    const clamped = clampRange(val);
    setRange(clamped);
    setMinInput(`${clamped[0]}`);
    setMaxInput(`${clamped[1]}`);
  };

  const handleInputCommit = (val: string, index: 0 | 1) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return;

    let temp = [...range] as [number, number];
    temp[index] = num;

    const clamped = clampRange(temp);
    setRange(clamped);
    setMinInput(`${clamped[0]}`);
    setMaxInput(`${clamped[1]}`);
  };

  return (
    <Box bg="#FFDED8" p={4} borderRadius="md" mb={6} w="100%">
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Heading as="h4" size="md">
          {heading}
        </Heading>
        <Tooltip label="Hello world!" hasArrow>
          <Box as="span" cursor="pointer">
            <IoIosInformationCircle />
          </Box>
        </Tooltip>
      </Box>

      <Box position="relative">
        <RangeSlider
          min={min}
          max={max}
          step={step}
          value={range}
          onChange={handleSliderChange}
          onChangeStart={() => setIsDragging(true)}
          onChangeEnd={() => setIsDragging(false)}
        >
          <RangeSliderTrack bg={unFilledTrack} h="4px">
            <RangeSliderFilledTrack bg={filledTrack} />
          </RangeSliderTrack>

          <RangeSliderThumb
            index={0}
            boxSize={boxSize}
            bg="white"
            border={`2px solid ${filledTrack}`}
          >
            {isDragging && (
              <Box
                position="absolute"
                top="-35px"
                left="50%"
                transform="translateX(-50%)"
                bg="gray.700"
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="sm"
                whiteSpace="nowrap"
              >
                ${range[0]}
                <Box
                  position="absolute"
                  bottom="-4px"
                  left="50%"
                  transform="translateX(-50%)"
                  width="0"
                  height="0"
                  borderLeft="4px solid transparent"
                  borderRight="4px solid transparent"
                  borderTop="4px solid"
                  borderTopColor="gray.700"
                />
              </Box>
            )}
          </RangeSliderThumb>

          <RangeSliderThumb
            index={1}
            boxSize={boxSize}
            bg="white"
            border={`2px solid ${filledTrack}`}
          >
            {isDragging && (
              <Box
                position="absolute"
                top="-35px"
                left="50%"
                transform="translateX(-50%)"
                bg="gray.700"
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="sm"
                whiteSpace="nowrap"
              >
                ${range[1]}
                <Box
                  position="absolute"
                  bottom="-4px"
                  left="50%"
                  transform="translateX(-50%)"
                  width="0"
                  height="0"
                  borderLeft="4px solid transparent"
                  borderRight="4px solid transparent"
                  borderTop="4px solid"
                  borderTopColor="gray.700"
                />
              </Box>
            )}
          </RangeSliderThumb>
        </RangeSlider>
      </Box>

      <Flex justify="space-between" mt={4}>
        <Box textAlign="center">
          <Text fontSize="xs" mb={1} color="gray.600">
            Min
          </Text>
          <Input
            value={`$${parseInt(minInput || '0').toLocaleString()}`}
            onChange={(e) => setMinInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => handleInputCommit(minInput, 0)}
            onKeyDown={(e) => e.key === 'Enter' && handleInputCommit(minInput, 0)}
            textAlign="center"
            borderRadius="full"
            bg="white"
            w="80px"
            size="sm"
          />
        </Box>

        <Box textAlign="center">
          <Text fontSize="xs" mb={1} color="gray.600">
            Max
          </Text>
          <Input
            value={`$${parseInt(maxInput || '0').toLocaleString()}`}
            onChange={(e) => setMaxInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => handleInputCommit(maxInput, 1)}
            onKeyDown={(e) => e.key === 'Enter' && handleInputCommit(maxInput, 1)}
            textAlign="center"
            borderRadius="full"
            bg="white"
            w="80px"
            size="sm"
          />
        </Box>
      </Flex>
    </Box>
  );
}
