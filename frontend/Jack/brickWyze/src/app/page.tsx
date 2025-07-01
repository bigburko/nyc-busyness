'use client';

import { Box } from '@chakra-ui/react';
import Map from '@/components/MapGroup/Map';  // or wherever your Map.tsx is located
import MyDrawer from '@/components/MyDrawer'; // optional: your overlay UI

export default function Page() {
  return (
    <Box
      position="relative"
      height="100vh"
      width="100vw"
      overflow="hidden"
    >
      <Map />
      <MyDrawer />
    </Box>
  );
}
