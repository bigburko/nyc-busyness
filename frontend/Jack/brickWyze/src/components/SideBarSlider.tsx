import { Box, Container, Heading, Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "@chakra-ui/react"

interface Props {
  unFilledTrack?: string; // The bit the slider hasn't been pulled over
  filledTrack?: string; // The bit the slider has been pulled over
  boxSize?: number; // The actual circle thing you drag
}

export default function SideBarSlider({unFilledTrack='black', filledTrack='#FE4A2C', boxSize=7}:Props) {
  return (
      <Box>
        <Heading as="h4" size={"md"}>Slider</Heading>
      <Slider aria-label='slider-ex-2' defaultValue={boxSize}>
      <SliderTrack bg={unFilledTrack}>
          <SliderFilledTrack bg={filledTrack} />
      </SliderTrack>
      <SliderThumb boxSize={8}>

      </SliderThumb>
    </Slider>
    </Box>
  );
}

