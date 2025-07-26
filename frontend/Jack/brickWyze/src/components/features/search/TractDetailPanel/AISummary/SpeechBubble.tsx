// src/components/features/search/TractDetailPanel/components/SpeechBubble.tsx

import { Box } from '@chakra-ui/react';

interface SpeechBubbleProps {
  children: React.ReactNode;
  bg?: string;
  borderColor?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  direction?: "left" | "right";
}

export const SpeechBubble = ({ 
  children, 
  bg = "rgba(255,255,255,0.9)", 
  borderColor = "rgba(255,255,255,0.3)", 
  color = "white", 
  size = "md", 
  direction = "right" 
}: SpeechBubbleProps) => {
  const sizes = {
    sm: { padding: "12px 16px", fontSize: "sm", minW: "120px" },
    md: { padding: "16px 20px", fontSize: "md", minW: "180px" },
    lg: { padding: "20px 24px", fontSize: "lg", minW: "220px" }
  };

  const currentSize = sizes[size];

  // Different SVG paths for left vs right direction
  const bubblePath = direction === "left" 
    ? `M 20 10 
       L 180 10 
       Q 190 10 190 20 
       L 190 60 
       Q 190 70 180 70 
       L 20 70 
       Q 10 70 10 60 
       L 10 20 
       Q 10 10 20 10 Z
       M 10 45
       L -5 50
       L 10 55 Z`  // Left-pointing tail
    : `M 20 10 
       L 180 10 
       Q 190 10 190 20 
       L 190 60 
       Q 190 70 180 70 
       L 110 70
       L 95 85
       L 100 70
       L 20 70 
       Q 10 70 10 60 
       L 10 20 
       Q 10 10 20 10 Z`; // Down-right pointing tail

  return (
    <Box position="relative" display="inline-block">
      {/* Speech Bubble SVG Background */}
      <Box position="absolute" top="0" left="0" w="100%" h="100%" zIndex={1}>
        <svg
          width="100%"
          height="100%"
          viewBox={direction === "left" ? "-5 0 205 80" : "0 0 200 120"}
          preserveAspectRatio="none"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
        >
          <path
            d={bubblePath}
            fill={bg}
            stroke={borderColor}
            strokeWidth="2"
            style={{ backdropFilter: 'blur(10px)' }}
          />
        </svg>
      </Box>
      
      {/* Content */}
      <Box
        position="relative"
        zIndex={2}
        padding={currentSize.padding}
        color={color}
        fontSize={currentSize.fontSize}
        fontWeight="medium"
        textAlign="left"
        minW={currentSize.minW}
        maxW="280px"
        lineHeight="1.4"
        pb={direction === "right" ? "20px" : "12px"}
      >
        {children}
      </Box>
    </Box>
  );
};