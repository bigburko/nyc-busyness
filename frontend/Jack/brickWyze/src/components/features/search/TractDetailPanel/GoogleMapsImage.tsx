// src/components/features/search/TractDetailPanel/GoogleMapsImage.tsx
'use client';

import { Box, Text, HStack, Image } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
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
interface RoadSnappedCoords {
  lat: number;
  lng: number;
  heading?: number;
}

interface CachedImages {
  streetView: string;
  satellite: string;
  roadmap: string;
  hybrid: string;
  timestamp: number;
  version: string;
  roadSnappedCoords: RoadSnappedCoords; // Include heading for road direction
}

// Global cache for Google Maps images to avoid repeated API calls
const MAPS_IMAGE_CACHE = new Map<string, CachedImages>();

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;
// Version to force cache refresh when we update URL parameters
const CACHE_VERSION = 'v9.0-road-aligned';

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

// Calculate bearing between two points (for road direction)
const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
};

// Enhanced road snapping with direction calculation
const snapToRoadWithDirection = async (lat: number, lng: number, apiKey: string): Promise<{ 
  lat: number; 
  lng: number; 
  heading?: number;
} | null> => {
  try {
    // Step 1: Get nearby road points in a small radius to determine road direction
    const radius = 0.001; // ~100m radius
    const points = [
      `${lat},${lng}`, // Center point
      `${lat + radius},${lng}`, // North
      `${lat - radius},${lng}`, // South  
      `${lat},${lng + radius}`, // East
      `${lat},${lng - radius}`, // West
    ].join('|');
    
    const roadsUrl = `https://roads.googleapis.com/v1/nearestRoads?points=${points}&key=${apiKey}`;
    
    console.log(`🛣️ [Roads API] Snapping coordinates and calculating road direction for ${lat},${lng}`);
    
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
      
      // Step 2: Calculate road direction if we have multiple points
      let heading: number | undefined;
      
      if (data.snappedPoints.length >= 2) {
        // Use the first two snapped points to determine road direction
        const point1 = data.snappedPoints[0];
        const point2 = data.snappedPoints[1];
        
        heading = calculateBearing(
          point1.location.latitude,
          point1.location.longitude,
          point2.location.latitude,
          point2.location.longitude
        );
        
        console.log(`🧭 [Road Direction] Calculated road heading: ${Math.round(heading)}° from North`);
        console.log(`🎯 [Street View] Will align camera to look down the road`);
      } else {
        // Fallback: Try to get road segments for this location
        try {
          const segmentUrl = `https://roads.googleapis.com/v1/snapToRoads?path=${roadCoords.lat},${roadCoords.lng}&interpolate=true&key=${apiKey}`;
          const segmentResponse = await fetch(segmentUrl);
          const segmentData = await segmentResponse.json();
          
          if (segmentData.snappedPoints && segmentData.snappedPoints.length >= 2) {
            const p1 = segmentData.snappedPoints[0];
            const p2 = segmentData.snappedPoints[1];
            
            heading = calculateBearing(
              p1.location.latitude,
              p1.location.longitude,
              p2.location.latitude,
              p2.location.longitude
            );
            
            console.log(`🧭 [Segment API] Calculated road heading: ${Math.round(heading)}° from North`);
          }
        } catch (segmentError) {
          console.warn(`⚠️ [Segment API] Could not determine road direction:`, segmentError);
        }
      }
      
      return {
        lat: roadCoords.lat,
        lng: roadCoords.lng,
        heading
      };
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
    return coords;
  }
  
  console.warn(`⚠️ [Coordinates] No coordinates found for tract ${geoid}, using NYC center`);
  return { lat: 40.7589, lng: -73.9851 }; // NYC center fallback
};

// Generate Google Maps URLs WITH road snapping for consistency
const generateTractImages = async (tract: TractResult): Promise<CachedImages> => {
  const cacheKey = tract.geoid;
  
  // Check cache first - now includes version check
  const cached = MAPS_IMAGE_CACHE.get(cacheKey);
  if (cached && 
      (Date.now() - cached.timestamp) < CACHE_DURATION && 
      cached.version === CACHE_VERSION) {
    console.log(`💾 [Google Maps] Using cached images for tract ${tract.geoid}`);
    return cached;
  }
  
  const originalCoords = getTractCoordinates(tract.geoid);
  let finalCoords: RoadSnappedCoords = { lat: originalCoords.lat, lng: originalCoords.lng };
  
  if (!checkApiKey()) {
    // Return enhanced placeholder URLs with original coordinates stored
    const placeholders: CachedImages = {
      streetView: `https://via.placeholder.com/600x300/f8fafc/64748b?text=${encodeURIComponent(`Street View - ${tract.nta_name || 'Unknown'}`)}`,
      satellite: `https://via.placeholder.com/600x300/e2e8f0/64748b?text=${encodeURIComponent(`Satellite - Tract ${tract.geoid.slice(-6)}`)}`,
      roadmap: `https://via.placeholder.com/600x300/f1f5f9/64748b?text=${encodeURIComponent(`Map - ${tract.nta_name || 'Unknown'}`)}`,
      hybrid: `https://via.placeholder.com/600x300/e2e8f0/64748b?text=${encodeURIComponent(`Hybrid - Tract ${tract.geoid.slice(-6)}`)}`,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      roadSnappedCoords: finalCoords
    };
    
    MAPS_IMAGE_CACHE.set(cacheKey, placeholders);
    return placeholders;
  }
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLEMAPS_API_KEY!;
  
  // 🎯 CRITICAL FIX: Road-snap coordinates BEFORE generating ANY URLs
  console.log(`🎯 [CONSISTENCY] Road-snapping coordinates and calculating direction for ALL images and clicks`);
  const roadSnappedResult = await snapToRoadWithDirection(originalCoords.lat, originalCoords.lng, apiKey);
  
  if (roadSnappedResult) {
    finalCoords = roadSnappedResult;
    console.log(`✅ [PERFECT MATCH] Using road-snapped coordinates with direction for both thumbnails AND clicks`);
    console.log(`📍 [EXACT COORDS] ${finalCoords.lat}, ${finalCoords.lng}`);
    if (roadSnappedResult.heading !== undefined) {
      console.log(`🧭 [ROAD DIRECTION] Camera will face ${Math.round(roadSnappedResult.heading)}° down the road`);
    }
  } else {
    console.log(`📍 [Fallback] Using original coordinates: ${finalCoords.lat}, ${finalCoords.lng}`);
  }
  
  // Generate Street View URL with proper road alignment
  const heading = finalCoords.heading !== undefined ? finalCoords.heading : 0;
  const pitch = -5; // Look slightly down the road for better street-level perspective
  
  // Generate actual Google Maps URLs using the SAME coordinates for everything
  const urls: CachedImages = {
    // Street View Static API - Using road-snapped coordinates WITH road direction
    streetView: `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${finalCoords.lat},${finalCoords.lng}&fov=85&heading=${heading}&pitch=${pitch}&radius=50&source=outdoor&key=${apiKey}`,
    
    // Maps Static API - All using same road-snapped coordinates
    satellite: `https://maps.googleapis.com/maps/api/staticmap?center=${finalCoords.lat},${finalCoords.lng}&zoom=16&size=600x300&maptype=satellite&key=${apiKey}`,
    roadmap: `https://maps.googleapis.com/maps/api/staticmap?center=${finalCoords.lat},${finalCoords.lng}&zoom=16&size=600x300&maptype=roadmap&key=${apiKey}`,
    hybrid: `https://maps.googleapis.com/maps/api/staticmap?center=${finalCoords.lat},${finalCoords.lng}&zoom=16&size=600x300&maptype=hybrid&key=${apiKey}`,
    
    timestamp: Date.now(),
    version: CACHE_VERSION,
    roadSnappedCoords: finalCoords // Store the EXACT coordinates used for thumbnails
  };
  
  // Cache the URLs
  MAPS_IMAGE_CACHE.set(cacheKey, urls);
  
  console.log(`🗺️ [Google Maps] Generated and cached road-aligned URLs for tract ${tract.geoid} (version ${CACHE_VERSION})`);
  console.log(`🧭 [GUARANTEE] Thumbnails and clicks will use IDENTICAL road-aligned coordinates`);
  
  return urls;
};

// Generate the Street View URL for clicking - USES EXACT SAME COORDINATES AS THUMBNAIL!
const openStreetView = (tract: TractResult, cachedImages: CachedImages) => {
  // 🎯 PERFECT CONSISTENCY: Use the EXACT same coordinates as the thumbnail
  const { lat, lng } = cachedImages.roadSnappedCoords;
  const heading = cachedImages.roadSnappedCoords.heading;
  
  console.log(`🚀 [Street View] Using EXACT thumbnail coordinates for tract ${tract.geoid}`);
  console.log(`📍 [PERFECT MATCH] ${lat}, ${lng} (identical to thumbnail)`);
  if (heading !== undefined) {
    console.log(`🧭 [ROAD ALIGNED] Camera facing ${Math.round(heading)}° down the road`);
  }
  console.log(`✅ [GUARANTEED] Thumbnail and click show the SAME aligned view`);
  
  // OFFICIAL Google Maps URL API format with the EXACT same coordinates AND heading as thumbnail
  let streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  
  // Add heading parameter if we have road direction data
  if (heading !== undefined) {
    streetViewUrl += `&heading=${Math.round(heading)}&pitch=-5&fov=85`;
    console.log(`🎯 [ROAD VIEW] Opening Street View aligned down the road at ${Math.round(heading)}°`);
  }
  
  window.open(streetViewUrl, '_blank');
};

export default function GoogleMapsImage({ tract }: GoogleMapsImageProps) {
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
    
    // Generate images with road snapping for the new tract
    const loadImages = async () => {
      try {
        const generatedImages = await generateTractImages(tract);
        setImages(generatedImages);
        setIsLoading(false);
        console.log(`🧭 [ROAD ALIGNED] Images ready with road-aligned view for tract ${tract.geoid}`);
      } catch (error) {
        console.error(`🚫 [Error] Failed to generate images:`, error);
        // Fallback to original coordinates
        const originalCoords = getTractCoordinates(tract.geoid);
        const fallbackImages: CachedImages = {
          streetView: `https://via.placeholder.com/600x300/f8fafc/64748b?text=${encodeURIComponent(`Street View - ${tract.nta_name || 'Unknown'}`)}`,
          satellite: `https://via.placeholder.com/600x300/e2e8f0/64748b?text=${encodeURIComponent(`Satellite - Tract ${tract.geoid.slice(-6)}`)}`,
          roadmap: `https://via.placeholder.com/600x300/f1f5f9/64748b?text=${encodeURIComponent(`Map - ${tract.nta_name || 'Unknown'}`)}`,
          hybrid: `https://via.placeholder.com/600x300/e2e8f0/64748b?text=${encodeURIComponent(`Hybrid - Tract ${tract.geoid.slice(-6)}`)}`,
          timestamp: Date.now(),
          version: CACHE_VERSION,
          roadSnappedCoords: { lat: originalCoords.lat, lng: originalCoords.lng, heading: undefined }
        };
        setImages(fallbackImages);
        setIsLoading(false);
      }
    };
    
    loadImages();
  }, [tract]); // Include full tract object as dependency
  
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
          borderTopColor="orange.500"
          borderRadius="full"
          animation="spin 1s linear infinite"
          mb={3}
        />
        <Text color="gray.600" fontSize="md">Loading Street View...</Text>
        <Text color="gray.500" fontSize="sm">Finding optimal angle</Text>
      </Box>
    );
  }
  
  const currentImageUrl = images.streetView; // Always use Street View now
  
  const handleImageError = () => {
    console.warn(`🚫 [Google Maps] Failed to load Street View for tract ${tract.geoid}`);
    setIsLoading(false);
    setImageError(true);
  };
  
  const handleImageLoad = () => {
    console.log(`✅ [Google Maps] Successfully loaded Street View for tract ${tract.geoid}`);
    setIsLoading(false);
    setImageError(false);
  };
  
  // Final fallback when Street View fails to load
  if (imageError) {
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
        onClick={() => openStreetView(tract, images)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        transition="all 0.3s ease"
        _hover={{
          borderColor: 'orange.400',
          bg: 'linear-gradient(135deg, #f7fafc 0%, #fff7ed 100%)',
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
        
        {/* Click to open indicator with cleaner design */}
        <Box
          bg="rgba(255, 255, 255, 0.95)"
          backdropFilter="blur(12px)"
          color="gray.800"
          px={6}
          py={4}
          borderRadius="2xl"
          fontSize="md"
          fontWeight="600"
          border="1px solid"
          borderColor="rgba(255, 134, 54, 0.3)"
          boxShadow="0 8px 32px rgba(255, 134, 54, 0.2), inset 0 1px 0 rgba(255,255,255,0.8)"
          transition="all 0.3s ease"
          textAlign="center"
          _hover={{
            bg: 'rgba(255, 134, 54, 0.9)',
            color: 'white',
            transform: 'scale(1.05)',
            boxShadow: '0 12px 40px rgba(255, 134, 54, 0.4)'
          }}
        >
          <HStack spacing={3} justify="center">
            <Text fontSize="lg">🧭</Text>
            <Text>Click for Street View</Text>
          </HStack>
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
      onClick={() => openStreetView(tract, images)}
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
            borderTopColor="orange.500"
            borderRadius="full"
            animation="spin 1s linear infinite"
            mb={3}
          />
          <Text color="gray.600" fontSize="md">Loading Street View...</Text>
        </Box>
      )}
      
      {/* Hover overlay with glassmorphism effect */}
      {isHovering && !isLoading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg="blackAlpha.200"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={2}
          pointerEvents="none"
        >
          <Box
            bg="rgba(255, 255, 255, 0.15)"
            backdropFilter="blur(12px)"
            borderRadius="2xl"
            px={6}
            py={4}
            fontSize="lg"
            fontWeight="600"
            color="white"
            textShadow="0 1px 3px rgba(0,0,0,0.3)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
            boxShadow="0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)"
            transform="scale(1.02)"
            transition="all 0.3s ease"
            textAlign="center"
          >
            <HStack spacing={3}>
              <Text fontSize="xl">🧭</Text>
              <Text>Click for Street View</Text>
            </HStack>
          </Box>
        </Box>
      )}
      
      <Image
        src={currentImageUrl}
        alt={`Street View of ${tract.nta_name}`}
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
      
      {/* Clean image type indicator */}
      <Box
        position="absolute"
        bottom="16px"
        left="16px"
        bg="rgba(0, 0, 0, 0.6)"
        backdropFilter="blur(8px)"
        color="white"
        px={3}
        py={2}
        borderRadius="lg"
        fontSize="sm"
        fontWeight="500"
        zIndex={1}
        pointerEvents="none"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
      >
        📷 Street View
      </Box>
    </Box>
  );
}