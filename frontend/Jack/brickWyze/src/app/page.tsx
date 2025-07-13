// src/app/page.tsx
'use client';

import { Box } from '@chakra-ui/react';
import MapContainer from '../components/features/Map/MapContainer';
import SidePanel from '@/components/features/search/SidePanel';
import TopLeftUI from '@/components/features/search/TopLeftUI';

export default function Home() {
  return (
    <Box position="relative" w="100vw" h="100vh" overflow="hidden">
      {/* Base Layer */}
      <MapContainer />

      {/* The results panel, which slides in from the side */}
      <SidePanel />
      
      {/* The entire top-left floating UI (search, chat, close button) */}
      <TopLeftUI />
    </Box>
  );
}