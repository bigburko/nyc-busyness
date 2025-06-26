'use client';
import { useRef } from 'react';
import MyDrawer from '@/components/MyDrawer';
import MyToolTip from '@/components/MyToolTip';
import { Box, Heading, Tooltip } from '@chakra-ui/react';
import Head from 'next/head';

export default function Page() {

  return (
    <Heading size="md">
    Tool Tip
    <MyToolTip label='200'></MyToolTip>
    </Heading>
  );
}
