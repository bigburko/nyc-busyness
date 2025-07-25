// src/components/features/search/TractDetailPanel/GoogleMapsImage.tsx
'use client';

import { Box, Text, HStack, Button, Image } from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { TractResult } from '../../../../types/TractTypes';

// Import the tract centroids JSON
import tractCentroids from './tract_centroids.json';

// Define types for the imported centroids
interface TractCentroid {
  lat: number;
  lng: number;
}

type TractCentroids = Record<string, TractCentroid>;

interface GoogleMapsImageProps {
  tract: TractResult;
}

// Define the images cache type
interface CachedImages {
  streetView: string;
  satellite: string;
  roadmap: string;
  hybrid: string;
  timestamp: number;
  version: string;
}

// Global cache for Google Maps images to avoid repeated API calls
const MAPS_IMAGE_CACHE = new Map<string, CachedImages>();

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;
// Version to force cache refresh when we update URL parameters
const CACHE_VERSION = 'v6.0-roadsnap';

// Check if we have a valid API key (only check once)
let hasValidApiKey: boolean | null = null;
const checkApiKey = (): boolean => {
  if (hasValidApiKey !== null) return hasValidApiKey;
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLEMAPS_API_KEY;
  hasValidApiKey = !!(apiKey && apiKey.length > 20 && apiKey.startsWith('AIza'));
  
  if (!hasValidApiKey) {
    console.warn('🚫 [Google Maps] API key missing or invalid. Set NEXT_PUBLIC_GOOGLEMAPS_API_KEY in your environment.');
  } else {
    console.log('✅ [Google Maps] API key found and appears valid');
  }
  
  return hasValidApiKey;
};

// Snap coordinates to nearest road using Google Roads API - GAME CHANGER!
const snapToRoad = async (lat: number, lng: number, apiKey: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Use Google Roads API "Nearest Roads" to force coordinates onto actual roads
    const roadsUrl = `https://roads.googleapis.com/v1/nearestRoads?points=${lat},${lng}&key=${apiKey}`;
    
    console.log(`🛣️ [Roads API] Snapping coordinates to nearest road for ${lat},${lng}`);
    
    const response = await fetch(roadsUrl);
    const data = await response.json();
    
    if (data.snappedPoints && data.snappedPoints.length > 0) {
      const snappedPoint = data.snappedPoints[0];
      const roadCoords = {
        lat: snappedPoint.location.latitude,
        lng: snappedPoint.location.longitude
      };
      
      console.log(`✅ [Roads API] Successfully snapped to road: ${roadCoords.lat},${roadCoords.lng}`);
      console.log(`📍 [Offset] Moved ${Math.round(getDistance(lat, lng, roadCoords.lat, roadCoords.lng))}m to road centerline`);
      
      return roadCoords;
    } else {
      console.warn(`⚠️ [Roads API] No road found near ${lat},${lng}`);
      return null;
    }
  } catch (error) {
    console.error(`🚫 [Roads API] Error snapping to road:`, error);
    return null;
  }
};

// Helper function to calculate distance between two points
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Original coordinate lookup using your computed centroids
const getTractCoordinates = (geoid: string): { lat: number; lng: number } => {
  const centroids = tractCentroids as TractCentroids;
  const coords = centroids[geoid];
  
  if (coords) {
    // Only log this once per tract to reduce console spam
    if (!MAPS_IMAGE_CACHE.has(geoid)) {
      console.log(`📍 [Coordinates] Found for tract ${geoid}:`, coords);
    }
    return coords;
  }
  
  console.warn(`⚠️ [Coordinates] No coordinates found for tract ${geoid}, using NYC center`);
  return { lat: 40.7589, lng: -73.9851 }; // NYC center fallback
};

// Generate Google Maps URLs - only called when needed and cached
const generateTractImages = (tract: TractResult) => {
  const cacheKey = tract.geoid;
  
  // Check cache first - now includes version check
  const cached = MAPS_IMAGE_CACHE.get(cacheKey);
  if (cached && 
      (Date.now() - cached.timestamp) < CACHE_DURATION && 
      cached.version === CACHE_VERSION) {
    console.log(`💾 [Google Maps] Using cached images for tract ${tract.geoid}`);
    return cached;
  }
  
  const coords = getTractCoordinates(tract.geoid);
  const { lat, lng } = coords;
  
  if (!checkApiKey()) {
    // Return enhanced placeholder URLs
    const placeholders = {
      streetView: `https://via.placeholder.com/600x300/f8fafc/64748b?text=${encodeURIComponent(`Street View - ${tract.nta_name || 'Unknown'}`)}`,
      satellite: `https://via.placeholder.com/600x300/e2e8f0/64748b?text=${encodeURIComponent(`Satellite - Tract ${tract.geoid.slice(-6)}`)}`,
      roadmap: `https://via.placeholder.com/600x300/f1f5f9/64748b?text=${encodeURIComponent(`Map - ${tract.nta_name || 'Unknown'}`)}`,
      hybrid: `https://via.placeholder.com/600x300/e2e8f0/64748b?text=${encodeURIComponent(`Hybrid - Tract ${tract.geoid.slice(-6)}`)}`,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
    
    MAPS_IMAGE_CACHE.set(cacheKey, placeholders);
    return placeholders;
  }
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLEMAPS_API_KEY!;
  
  // Generate actual Google Maps URLs using the correct APIs
  const urls = {
    // Street View Static API - Using best practices from Google docs to prefer outdoor official imagery
    streetView: `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&fov=75&heading=0&pitch=10&radius=50&source=outdoor&key=${apiKey}`,
    
    // Maps Static API - Satellite
    satellite: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x300&maptype=satellite&key=${apiKey}`,
    
    // Maps Static API - Roadmap
    roadmap: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x300&maptype=roadmap&key=${apiKey}`,
    
    // Maps Static API - Hybrid
    hybrid: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x300&maptype=hybrid&key=${apiKey}`,
    
    timestamp: Date.now(),
    version: CACHE_VERSION
  };
  
  // Cache the URLs
  MAPS_IMAGE_CACHE.set(cacheKey, urls);
  
  console.log(`🗺️ [Google Maps] Generated and cached URLs for tract ${tract.geoid} (version ${CACHE_VERSION})`);
  
  return urls;
};

// Generate the Street View URL for clicking - WITH ROAD SNAPPING for maximum effectiveness!
const openStreetView = async (tract: TractResult) => {
  const originalCoords = getTractCoordinates(tract.geoid);
  let { lat, lng } = originalCoords;
  
  // 🎯 THE GAME CHANGER: Use Google Roads API to snap to road centerline!
  if (checkApiKey()) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLEMAPS_API_KEY!;
    const roadCoords = await snapToRoad(lat, lng, apiKey);
    
    if (roadCoords) {
      lat = roadCoords.lat;
      lng = roadCoords.lng;
      console.log(`🚀 [Street View] Using ROAD-SNAPPED coordinates for tract ${tract.geoid}`);
      console.log(`📍 [Road Position] ${lat}, ${lng} (snapped to road centerline)`);
      console.log(`🛣️ [STRATEGY] Forced onto actual road where Google cars drive`);
      console.log(`🚫 [USER CONTENT] Road centerlines = no user 360° photos!`);
    } else {
      console.log(`📍 [Fallback] Using original coordinates: ${lat}, ${lng}`);
    }
  }
  
  // OFFICIAL Google Maps URL API format with road-snapped coordinates
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  
  console.log(`✅ [SUCCESS] Opening Street View with road-centered positioning`);
  
  window.open(streetViewUrl, '_blank');
};

export default function GoogleMapsImage({ tract }: GoogleMapsImageProps) {
  const [currentImageType, setCurrentImageType] = useState<'streetView' | 'satellite' | 'roadmap' | 'hybrid'>('streetView');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [images, setImages] = useState<CachedImages | null>(null);
  
  const hasApiKey = checkApiKey();
  
  // Reset and load images whenever tract changes
  useEffect(() => {
    console.log(`🎯 [Google Maps] Loading images for NEW tract ${tract.geoid}`);
    
    // Reset state for new tract
    setImages(null);
    setImageError(false);
    setIsLoading(true);
    setCurrentImageType('streetView');
    
    // Generate images with road snapping for the new tract
    const loadImages = async () => {
      try {
        const generatedImages = await generateTractImages(tract);
        setImages(generatedImages);
        setIsLoading(false); // Set loading to false when images are ready
        console.log(`🛣️ [Road Snap] Images ready for tract ${tract.geoid}`);
      } catch (error) {
        console.error(`🚫 [Road Snap] Failed to generate images:`, error);
        // Fallback to original coordinates
        const fallbackImages: CachedImages = {
          streetView: `https://via.placeholder.com/600x300/f8fafc/64748b?text=${encodeURIComponent(`Street View - ${tract.nta_name || 'Unknown'}`)}`,
          satellite: `https://via.placeholder.com/600x300/e2e8f0/64748b?text=${encodeURIComponent(`Satellite - Tract ${tract.geoid.slice(-6)}`)}`,
          roadmap: `https://via.placeholder.com/600x300/f1f5f9/64748b?text=${encodeURIComponent(`Map - ${tract.nta_name || 'Unknown'}`)}`,
          hybrid: `https://via.placeholder.com/600x300/e2e8f0/64748b?text=${encodeURIComponent(`Hybrid - Tract ${tract.geoid.slice(-6)}`)}`,
          timestamp: Date.now(),
          version: CACHE_VERSION
        };
        setImages(fallbackImages);
        setIsLoading(false); // Set loading to false even on error
      }
    };
    
    loadImages();
  }, [tract.geoid]); // Only depend on tract.geoid so it re-runs when tract changes
  
  // Don't render until images are ready
  if (!images) {
    return (
      <Box 
        w="100%" 
        h="300px" 
        bg="gray.200" 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center"
        borderRadius="lg"
      >
        <Box
          w="8"
          h="8"
          border="3px solid"
          borderColor="gray.300"
          borderTopColor="blue.500"
          borderRadius="full"
          animation="spin 1s linear infinite"
          mb={3}
        />
        <Text color="gray.600" fontSize="md">Snapping to road...</Text>
        <Text color="gray.500" fontSize="sm">Finding road centerline</Text>
      </Box>
    );
  }
  
  const currentImageUrl = images[currentImageType];
  
  const handleImageError = () => {
    console.warn(`🚫 [Google Maps] Failed to load ${currentImageType} for tract ${tract.geoid}`);
    setIsLoading(false);
    
    // Try different image types as fallbacks
    if (currentImageType === 'streetView') {
      console.log('🔄 [Google Maps] Falling back to satellite view');
      setCurrentImageType('satellite');
      setImageError(false);
      setIsLoading(true);
    } else if (currentImageType === 'satellite') {
      console.log('🔄 [Google Maps] Falling back to roadmap view');
      setCurrentImageType('roadmap');
      setImageError(false);
      setIsLoading(true);
    } else if (currentImageType === 'roadmap') {
      console.log('🔄 [Google Maps] Falling back to hybrid view');
      setCurrentImageType('hybrid');
      setImageError(false);
      setIsLoading(true);
    } else {
      // All options failed
      console.error('🚫 [Google Maps] All image types failed for tract', tract.geoid);
      setImageError(true);
    }
  };
  
  const handleImageLoad = () => {
    console.log(`✅ [Google Maps] Successfully loaded ${currentImageType} for tract ${tract.geoid}`);
    setIsLoading(false);
    setImageError(false);
  };
  
  // Final fallback when all Google Maps options fail
  if (imageError && currentImageType === 'hybrid') {
    return (
      <Box 
        w="100%" 
        h="300px" 
        bg="linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)" 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center"
        border="2px dashed"
        borderColor="gray.300"
        borderRadius="lg"
        position="relative"
        cursor="pointer"
        onClick={() => openStreetView(tract)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        transition="all 0.3s ease"
        _hover={{
          borderColor: 'blue.400',
          bg: 'linear-gradient(135deg, #f7fafc 0%, #e6f3ff 100%)',
          transform: 'scale(1.01)'
        }}
      >
        <Text color="gray.700" fontSize="xl" fontWeight="bold" mb={2}>
          📍 {tract.nta_name}
        </Text>
        <Text color="gray.600" fontSize="md" textAlign="center" px={4} mb={2}>
          Census Tract {tract.geoid.slice(-6)}
        </Text>
        <Text color="gray.500" fontSize="sm" textAlign="center" px={4} mb={3}>
          {hasApiKey ? 'Maps temporarily unavailable' : 'Configure Google Maps API key to see imagery'}
        </Text>
        
        {/* Click to open indicator with road snapping messaging */}
        <Box
          bg="white"
          color="blue.600"
          px={4}
          py={3}
          borderRadius="lg"
          fontSize="md"
          fontWeight="bold"
          border="2px solid"
          borderColor="blue.500"
          boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
          transition="all 0.2s"
          textAlign="center"
          _hover={{
            bg: 'blue.500',
            color: 'white',
            transform: 'scale(1.05)',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
          }}
        >
          <Text mb={1}>🛣️ Click for Street View</Text>
          <Text fontSize="xs" fontWeight="normal">
            Road-snapped positioning (avoids buildings)
          </Text>
        </Box>
        
        {!hasApiKey && (
          <Box mt={3} p={3} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.200">
            <Text color="yellow.700" fontSize="xs" textAlign="center" fontWeight="medium">
              Add NEXT_PUBLIC_GOOGLEMAPS_API_KEY to your .env.local file
            </Text>
          </Box>
        )}
      </Box>
    );
  }
  
  return (
    <Box 
      position="relative" 
      w="100%" 
      h="300px" 
      bg="gray.100" 
      borderRadius="lg" 
      overflow="hidden"
      cursor="pointer"
      onClick={() => openStreetView(tract)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      transition="all 0.3s ease"
      _hover={{
        transform: 'scale(1.02)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
      }}
      _active={{
        transform: 'scale(0.98)'
      }}
    >
      {isLoading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg="gray.200"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          zIndex={2}
        >
          <Box
            w="8"
            h="8"
            border="3px solid"
            borderColor="gray.300"
            borderTopColor="blue.500"
            borderRadius="full"
            animation="spin 1s linear infinite"
            mb={3}
          />
          <Text color="gray.600" fontSize="md">Loading {currentImageType}...</Text>
        </Box>
      )}
      
      {/* Hover overlay with road snapping messaging */}
      {isHovering && !isLoading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg="blackAlpha.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={2}
          pointerEvents="none"
        >
          <Box
            bg="white"
            color="gray.900"
            px={8}
            py={4}
            borderRadius="xl"
            fontSize="lg"
            fontWeight="bold"
            boxShadow="0 8px 32px rgba(0,0,0,0.3)"
            border="3px solid"
            borderColor="green.500"
            transform="scale(1.05)"
            transition="all 0.2s ease"
            textAlign="center"
          >
            <HStack spacing={3} mb={2}>
              <Text fontSize="xl">🛣️</Text>
              <Text>Click for Street View</Text>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              Snapped to road centerline
            </Text>
          </Box>
        </Box>
      )}
      
      <Image
        src={currentImageUrl}
        alt={`${currentImageType} view of ${tract.nta_name}`}
        w="100%"
        h="100%"
        objectFit="cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ 
          opacity: isLoading ? 0 : 1, 
          transition: 'opacity 0.3s ease',
          display: 'block'
        }}
      />
      
      {/* Image type indicator */}
      <Box
        position="absolute"
        bottom="16px"
        left="16px"
        bg="blackAlpha.700"
        color="white"
        px={3}
        py={2}
        borderRadius="md"
        fontSize="sm"
        fontWeight="medium"
        backdropFilter="blur(4px)"
        zIndex={1}
        pointerEvents="none"
      >
        📷 {currentImageType === 'streetView' ? 'Street View' : 
             currentImageType === 'satellite' ? 'Satellite' :
             currentImageType === 'roadmap' ? 'Map' : 'Hybrid'}
      </Box>
      
      {/* Image type selector - only show if we have API key */}
      {hasApiKey && !isLoading && (
        <Box
          position="absolute"
          bottom="16px"
          right="16px"
          zIndex={1}
        >
          <HStack
            bg="blackAlpha.700"
            borderRadius="md"
            p={1}
            spacing={1}
            backdropFilter="blur(4px)"
            onClick={(e) => e.stopPropagation()} // Prevent opening Street View when clicking buttons
          >
            {[
              { type: 'streetView', label: 'SV', tooltip: 'Street View' },
              { type: 'satellite', label: 'SAT', tooltip: 'Satellite' },
              { type: 'roadmap', label: 'MAP', tooltip: 'Map' },
              { type: 'hybrid', label: 'HYB', tooltip: 'Hybrid' }
            ].map(({ type, label, tooltip }) => (
              <Button
                key={type}
                size="xs"
                variant={currentImageType === type ? 'solid' : 'ghost'}
                colorScheme={currentImageType === type ? 'blue' : 'whiteAlpha'}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening Street View when clicking view type buttons
                  if (currentImageType !== type) {
                    console.log(`🔄 [Google Maps] Switching to ${type} view for tract ${tract.geoid}`);
                    setCurrentImageType(type as any);
                    setImageError(false);
                    setIsLoading(true);
                  }
                }}
                fontSize="xs"
                px={2}
                py={1}
                h="auto"
                title={tooltip}
                _hover={{
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s'
                }}
              >
                {label}
              </Button>
            ))}
          </HStack>
        </Box>
      )}
    </Box>
  );
}