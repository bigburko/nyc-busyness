'use client';

import MyDrawer from '@/components/MyDrawer';
import MyToolTip from '@/components/MyToolTip';
import { Box, Button, Heading, Tooltip } from '@chakra-ui/react';
import MySlider from '@/components/MySlider';
import ClientOnly from '@/components/ClientOnly';


export default function Page() {

  return (
      <ClientOnly>
      <MyDrawer></MyDrawer>
      </ClientOnly>
      
  );
}
