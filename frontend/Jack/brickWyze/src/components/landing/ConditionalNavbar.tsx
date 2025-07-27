// src/components/ConditionalNavbar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/landing/Navbar';

const ConditionalNavbar: React.FC = () => {
  const pathname = usePathname();
  
  // Hide navbar on map page for clean fullscreen experience
  const showNavbar = pathname !== '/map';
  
  return showNavbar ? <Navbar /> : null;
};

export default ConditionalNavbar;