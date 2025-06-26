'use client';

import MyDrawer from '@/components/MyDrawer';
import MyToolTip from '@/components/MyToolTip';
import { Box, Heading, Tooltip } from '@chakra-ui/react';
import MySlider from '@/components/MySlider';


export default function Page() {

  return (
      <>
      <Heading>Hello</Heading>
      <Heading>Hello</Heading>
      <MySlider></MySlider>
      <MyToolTip label='100'></MyToolTip>
      </>
  
  );
}
