'use client';

import {
  Box,
  Heading,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Flex,
} from '@chakra-ui/react';
import MyToolTip from './MyToolTip';

interface Props {
  heading?: string;
  unFilledTrack?: string;
  filledTrack?: string;
  boxSize?: string | number;
  defaultValue?: number;
  onChange?: (val: number) => void;
  toolTipText?: string; // ✅ Added this to match your usage
}

export default function MySlider({
  heading = 'Slider',
  unFilledTrack = 'black',
  filledTrack = '#FE4A2C',
  boxSize = '7',
  defaultValue = 50,
  onChange,
  toolTipText,
}: Props) {
  return (
    <Box bg="#FFDED8" p={4} borderRadius="md" mb={6} w="100%">
      <Flex alignItems="center" gap={2} mb={3}>
        <Heading as="h4" size="md">
          {heading}
        </Heading>
        {toolTipText && <MyToolTip>{toolTipText}</MyToolTip>}
      </Flex>

      <Slider
        aria-label="slider"
        defaultValue={defaultValue}
        onChange={onChange}
      >
        <SliderTrack bg={unFilledTrack}>
          <SliderFilledTrack bg={filledTrack} />
        </SliderTrack>
        <SliderThumb
          boxSize={boxSize}
          bg="white"
          borderWidth="2px"
          borderStyle="solid"
          borderColor={filledTrack}
        />
      </Slider>
    </Box>
  );
}
