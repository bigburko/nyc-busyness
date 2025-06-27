'use client';

import {
  Box,
  Heading,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import MyToolTip from './MyToolTip';
// import MyToolTip from './MyToolTip';

interface Props {
  heading?: string;
  unFilledTrack?: string;
  filledTrack?: string;
  boxSize?: string;
  defaultValue?: number;
}

export default function MySlider({
  heading = 'Slider',
  unFilledTrack = 'black',
  filledTrack = '#FE4A2C',
  boxSize = '7',
  defaultValue = 50,
}: Props) {
  return (
    <Box bg="#FFDED8" p={4} borderRadius="md" mb={6} w="100%">
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Heading as="h4" size="md">
          {heading}
        </Heading>
        <MyToolTip label="Lorem ipsum dolor sit amet consectetur adipisicing elit.`" />
      </Box>

      <Slider aria-label="slider" defaultValue={defaultValue}>
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
