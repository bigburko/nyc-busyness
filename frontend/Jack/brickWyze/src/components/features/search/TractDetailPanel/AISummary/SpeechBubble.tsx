// src/components/features/search/TractDetailPanel/AISummary/SpeechBubble.tsx

import { Box } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';

interface SpeechBubbleProps {
  children: React.ReactNode;
  bg?: string;
  borderColor?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  direction?: "left" | "right" | "down" | "up" | "none";
}

export const SpeechBubble = ({ 
  children, 
  bg = "rgba(99, 102, 241, 0.95)", 
  borderColor = "rgba(255,255,255,0.3)", 
  color = "white", 
  size = "md", 
  direction = "none" 
}: SpeechBubbleProps) => {
  const [bubbleHeight, setBubbleHeight] = useState(80);
  const textRef = useRef<HTMLDivElement>(null);

  const sizes = {
    sm: { 
      padding: "12px 16px", 
      fontSize: "xs", 
      minW: "200px",
      maxW: { base: "280px", sm: "320px", md: "360px" }
    },
    md: { 
      padding: "16px 20px", 
      fontSize: "sm", 
      minW: "250px",
      maxW: { base: "300px", sm: "400px", md: "450px", lg: "500px" }
    },
    lg: { 
      padding: "20px 24px", 
      fontSize: "md", 
      minW: "300px",
      maxW: { base: "350px", sm: "450px", md: "500px", lg: "550px" }
    }
  };

  const currentSize = sizes[size];

  // Measure text height and update bubble height
  useEffect(() => {
    if (textRef.current) {
      const textHeight = textRef.current.scrollHeight;
      const minHeight = 80;
      const padding = 40; // Top and bottom padding
      const newHeight = Math.max(minHeight, textHeight + padding);
      setBubbleHeight(newHeight);
    }
  }, [children]);

  // SVG path for speech bubble with dynamic height
  const getSVGPath = (height: number) => {
    const width = 380;
    const radius = 16;
    const tailStartX = width * 0.71;
    const tailEndX = width * 0.75;
    const tailTipX = width * 0.68;
    const tailTipY = height + 35;

    if (direction === "down") {
      return `
        M ${radius} 0
        L ${width - radius} 0
        Q ${width} 0 ${width} ${radius}
        L ${width} ${height - radius}
        Q ${width} ${height} ${width - radius} ${height}
        L ${tailEndX} ${height}
        C ${tailEndX - 2} ${height + 8} ${tailTipX + 12} ${height + 20} ${tailTipX} ${tailTipY}
        C ${tailTipX - 4} ${height + 22} ${tailStartX + 2} ${height + 8} ${tailStartX} ${height}
        L ${radius} ${height}
        Q 0 ${height} 0 ${height - radius}
        L 0 ${radius}
        Q 0 0 ${radius} 0
        Z
      `;
    }
    
    // Default rounded rectangle without tail
    return `
      M ${radius} 0
      L ${width - radius} 0
      Q ${width} 0 ${width} ${radius}
      L ${width} ${height - radius}
      Q ${width} ${height} ${width - radius} ${height}
      L ${radius} ${height}
      Q 0 ${height} 0 ${height - radius}
      L 0 ${radius}
      Q 0 0 ${radius} 0
      Z
    `;
  };

  return (
    <Box position="relative" display="inline-block" w="fit-content" h="fit-content">
      {/* SVG Speech Bubble - Dynamic height */}
      <Box position="relative" w="100%" maxW={currentSize.maxW} minW={currentSize.minW}>
        <svg
          width="100%"
          height="auto"
          viewBox={direction === "down" ? `0 0 380 ${bubbleHeight + 35}` : `0 0 380 ${bubbleHeight}`}
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
            display: 'block'
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={getSVGPath(bubbleHeight)}
            fill={bg}
            stroke={borderColor}
            strokeWidth="2"
          />
        </svg>
        
        {/* Responsive text container */}
        <Box
          position="absolute"
          top="10px"
          left="20px"
          right="20px"
          bottom={direction === "down" ? "40px" : "10px"}
          display="flex"
          alignItems="center"
          justifyContent="center"
          minH="40px"
          fontSize={currentSize.fontSize}
          fontWeight="medium"
          textAlign="center"
          lineHeight="1.4"
          color={color}
        >
          <Box 
            ref={textRef}
            whiteSpace="normal"
            wordBreak="break-word"
            overflowWrap="break-word"
            maxW="100%"
            w="100%"
            sx={{
              '& *': {
                color: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                textAlign: 'inherit',
                lineHeight: 'inherit'
              }
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};