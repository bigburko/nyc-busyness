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
  heading: string;
  icon: string;
  filledTrack: string;
  defaultValue: number;
  onChange: (val: number) => void;
  onRemove: () => void;
  boxSize?: number;
}

export default function MySlider({
  heading,
  icon,
  filledTrack,
  defaultValue,
  onChange,
  onRemove,
  boxSize = 6,
}: Props) {
  const [sliderValue, setSliderValue] = useState(defaultValue);

  useEffect(() => {
    setSliderValue(defaultValue);
  }, [defaultValue]);

  const handleChange = (val: number) => {
    setSliderValue(val);
    onChange(Math.round(val)); // round to nearest integer
  };

  return (
    <Box
      bg="white"
      borderRadius="md"
      p={2}
      boxShadow="sm"
      position="relative"
    >
      <Flex align="center" justify="space-between" mb={1}>
        <Flex align="center" gap={2}>
          <Box
            bg={filledTrack}
            borderRadius="full"
            boxSize={boxSize}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="sm"
          >
            {icon}
          </Box>
          <Text fontWeight="medium">{heading}</Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Text fontSize="sm">{sliderValue}%</Text>
          <CloseButton size="sm" onClick={onRemove} />
        </Flex>
      </Flex>
      <Slider
        value={sliderValue}
        onChange={handleChange}
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
