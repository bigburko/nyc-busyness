// Map.tsx - Complete fixed version with unified centering system

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

// Correct relative imports for Map.tsx location
import rawGeojson from './manhattan_census_tracts.json';
import { CleanGeojson, PotentiallyNonStandardFeatureCollection } from './CleanGeojson';
import { ResilienceScore, fetchResilienceScores } from './fetchResilienceScores';
import { ProcessGeojson } from './ProcessGeojson';
import { addTractLayers, updateTractData } from './TractLayer';
import { createLegend, showLegend } from './Legend';

// Import demographic scoring type
import { DemographicScoring } from '../../../stores/filterStore';

// Global type declaration
declare global {
  interface Window {
    _brickwyzeMapRef?: mapboxgl.Map;
    selectTractFromResultsPanel?: (tractId: string) => void;
    openResultsPanel?: () => void;
    centerMapOnTract?: (tractId: string) => void;
  }
}

const INITIAL_CENTER: [number, number] = [-73.9712, 40.7831];
const INITIAL_ZOOM = 12;

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

interface Weighting {
  id: string;
  label: string;
  value: number;
}

interface ResilienceScoreWithRanking extends ResilienceScore {
  ranking: number;
}

interface MapProps {
  weights?: Weighting[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  topN?: number;
  onSearchResults?: (results: ResilienceScore[]) => void;
  selectedTractId?: string | null;
  demographicScoring?: DemographicScoring;
}

// Extended map type for pulse interval
type ExtendedMap = mapboxgl.Map & { _pulseInterval?: NodeJS.Timeout };

// 🎯 SIMPLIFIED: Centering state management (removed complex blocking properties)
interface CenteringState {
  isAnimating: boolean;
  lastCenterTime: number;
  pendingTractId: string | null;
  source: 'map_click' | 'results_click' | 'prop_update';
}

export default function Map({
  weights,
  rentRange,
  selectedEthnicities,
  selectedGenders,
  ageRange,
  incomeRange,
  topN = 10,
  onSearchResults,
  selectedTractId,
  demographicScoring,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentGeoJson, setCurrentGeoJson] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
  const [highlightedTractId, setHighlightedTractId] = useState<string | null>(null);

  // 🎯 SIMPLIFIED: Unified centering state management
  const centeringStateRef = useRef<CenteringState>({
    isAnimating: false,
    lastCenterTime: 0,
    pendingTractId: null,
    source: 'prop_update'
  });

  // Function to add highlight layers for selected tract
  const addHighlightLayers = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource('highlighted-tract')) {
      // Add empty source for highlighted tract
      map.addSource('highlighted-tract', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add multiple highlight layers for floating effect
      // Base glow layer
      map.addLayer({
        id: 'highlighted-tract-glow',
        type: 'line',
        source: 'highlighted-tract',
        paint: {
          'line-color': '#FF6B35',
          'line-width': 8,
          'line-opacity': 0.4,
          'line-blur': 4
        }
      });

      // Pulsing outline layer
      map.addLayer({
        id: 'highlighted-tract-pulse',
        type: 'line',
        source: 'highlighted-tract',
        paint: {
          'line-color': '#FF6B35',
          'line-width': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 4,
            1, 6
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 0.8,
            1, 0.3
          ]
        }
      });

      // Main highlight outline
      map.addLayer({
        id: 'highlighted-tract-main',
        type: 'line',
        source: 'highlighted-tract',
        paint: {
          'line-color': '#FF6B35',
          'line-width': 3,
          'line-opacity': 1
        }
      });

      // Elevated fill for floating effect
      map.addLayer({
        id: 'highlighted-tract-fill',
        type: 'fill',
        source: 'highlighted-tract',
        paint: {
          'fill-color': '#FF6B35',
          'fill-opacity': 0.1
        }
      });

      console.log('✨ [Map] Added highlight layers for tract selection');
    }
  }, []);

  // 🎯 SIMPLIFIED: Single source of truth for centering logic
  const performCentering = useCallback((
    tractId: string, 
    source: 'map_click' | 'results_click' | 'prop_update',
    force: boolean = false
  ) => {
    const map = mapRef.current;
    const now = Date.now();
    
    if (!map || !currentGeoJson) {
      console.warn('🚫 [Map] Cannot center - map or geojson not ready');
      return false;
    }

    const state = centeringStateRef.current;
    
    // 🎯 SIMPLIFIED: Basic debouncing only
    if (!force) {
      // If we're already animating to the same tract, skip
      if (state.isAnimating && state.pendingTractId === tractId) {
        console.log('🚫 [Map] Already centering to tract:', tractId);
        return false;
      }
      
      // Simple debouncing - same for all sources
      const timeSinceLastCenter = now - state.lastCenterTime;
      if (timeSinceLastCenter < 300) { // Shorter debounce
        console.log('🚫 [Map] Blocking rapid centering');
        return false;
      }
    }

    // Find the tract geometry
    const searchIds = [
      tractId,
      tractId.padStart(11, '0'),
      tractId.toString(),
      tractId.toString().padStart(11, '0')
    ];
    
    let tract = null;
    for (const searchId of searchIds) {
      tract = currentGeoJson.features.find((feature: unknown) => {
        const typedFeature = feature as { properties?: { GEOID?: string | number } };
        const featureId = typedFeature.properties?.GEOID?.toString();
        return featureId === searchId || featureId?.padStart(11, '0') === searchId;
      });
      if (tract) break;
    }

    const typedTract = tract as { geometry?: { coordinates?: number[][][] | number[][][][] } };
    if (!typedTract?.geometry?.coordinates) {
      console.error('❌ [Map] Tract not found:', tractId);
      return false;
    }

    try {
      // Calculate center coordinates
      let coords: number[][];
      const coordinates = typedTract.geometry.coordinates;
      
      if (coordinates[0] && Array.isArray(coordinates[0][0])) {
        coords = coordinates[0][0] as number[][];
      } else if (coordinates[0]) {
        coords = coordinates[0] as number[][];
      } else {
        console.error('❌ [Map] Invalid coordinate structure');
        return false;
      }
      
      if (coords?.length > 0) {
        let totalLng = 0;
        let totalLat = 0;
        let validCoords = 0;
        
        coords.forEach((coord: number[]) => {
          if (coord?.length >= 2 && 
              typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
              !isNaN(coord[0]) && !isNaN(coord[1])) {
            totalLng += coord[0];
            totalLat += coord[1];
            validCoords++;
          }
        });
        
        if (validCoords > 0) {
          const centerLng = totalLng / validCoords;
          const centerLat = totalLat / validCoords;
          
          if (!isNaN(centerLng) && !isNaN(centerLat) && 
              centerLng >= -180 && centerLng <= 180 && 
              centerLat >= -90 && centerLat <= 90) {
            
            // 🎯 UPDATE STATE BEFORE ANIMATION
            state.isAnimating = true;
            state.pendingTractId = tractId;
            state.source = source;
            state.lastCenterTime = now;
            
            // Calculate offset for popup panel
            let adjustedCenterLng = centerLng;
            
            try {
              const bounds = map.getBounds();
              if (bounds) {
                const eastBound = bounds.getEast();
                const westBound = bounds.getWest();
                
                if (typeof eastBound === 'number' && typeof westBound === 'number') {
                  const mapContainer = map.getContainer();
                  const mapWidth = mapContainer.clientWidth;
                  const popupWidth = 450;
                  
                  const offsetX = -(popupWidth / 2);
                  const mapWidthInDegrees = eastBound - westBound;
                  const pixelsPerDegree = mapWidth / mapWidthInDegrees;
                  const longitudeOffset = offsetX / pixelsPerDegree;
                  
                  adjustedCenterLng = centerLng + longitudeOffset;
                }
              }
            } catch (error) {
              console.warn('⚠️ [Map] Error calculating offset, using basic centering:', error);
            }
            
            console.log('🎯 [Map] Centering:', {
              source,
              tractId,
              center: [adjustedCenterLng, centerLat],
              force
            });
            
            // 🎯 CONSISTENT: Always use 800ms duration and same easing
            map.panTo([adjustedCenterLng, centerLat], {
              duration: 800, // Same as results panel
              easing: (t: number) => t * (2 - t) // Same easing function
            });
            
            // 🎯 CONSISTENT: Same cleanup timing
            setTimeout(() => {
              state.isAnimating = false;
              if (state.pendingTractId === tractId) {
                state.pendingTractId = null;
              }
            }, 900); // Slightly longer than animation duration
            
            return true;
          }
        }
      }
    } catch (error) {
      console.error('❌ [Map] Error during centering:', error);
      state.isAnimating = false;
      state.pendingTractId = null;
      return false;
    }
    
    return false;
  }, [currentGeoJson]);

  // 🎯 ENHANCED: Simplified highlight function (no centering)
  const highlightTract = useCallback((tractId: string | null) => {
    const map = mapRef.current;
    if (!map || !currentGeoJson) return;

    if (!tractId) {
      // Clear highlight
      const source = map.getSource('highlighted-tract') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      setHighlightedTractId(null);
      console.log('🔄 [Map] Cleared tract highlight');
      return;
    }

    // Find the tract to highlight
    const searchIds = [
      tractId,
      tractId.padStart(11, '0'),
      tractId.toString(),
      tractId.toString().padStart(11, '0')
    ];
    
    let tract = null;
    for (const searchId of searchIds) {
      tract = currentGeoJson.features.find((feature: unknown) => {
        const typedFeature = feature as { properties?: { GEOID?: string | number } };
        const featureId = typedFeature.properties?.GEOID?.toString();
        return featureId === searchId || featureId?.padStart(11, '0') === searchId;
      });
      if (tract) break;
    }

    if (tract) {
      // Add pulsing animation property
      const highlightFeature = {
        ...tract,
        properties: {
          ...tract.properties,
          pulse: 0 // Will be animated
        }
      };

      const source = map.getSource('highlighted-tract') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [highlightFeature]
        });
        
        setHighlightedTractId(tractId);
        console.log('✨ [Map] Highlighted tract:', tractId);

        // Start pulsing animation
        let pulseValue = 0;
        const pulseInterval = setInterval(() => {
          pulseValue = (pulseValue + 0.1) % (Math.PI * 2);
          const normalizedPulse = (Math.sin(pulseValue) + 1) / 2; // 0 to 1
          
          const animatedFeature = {
            ...highlightFeature,
            properties: {
              ...highlightFeature.properties,
              pulse: normalizedPulse
            }
          };

          const currentSource = map.getSource('highlighted-tract') as mapboxgl.GeoJSONSource;
          if (currentSource && highlightedTractId === tractId) {
            currentSource.setData({
              type: 'FeatureCollection',
              features: [animatedFeature]
            });
          } else {
            clearInterval(pulseInterval);
          }
        }, 50); // 20fps animation
        
        // Store interval reference for cleanup
        (map as ExtendedMap)._pulseInterval = pulseInterval;
      }
    } else {
      console.warn('❌ [Map] Could not find tract to highlight:', tractId);
    }
  }, [currentGeoJson, highlightedTractId]);

  // Function to zoom to show top tracts after search (preserve original style)
  const zoomToTopTracts = useCallback((zones: ResilienceScore[]) => {
    const map = mapRef.current;
    if (!map || !currentGeoJson || zones.length === 0) return;

    const topTracts = zones.slice(0, 5);
    const bounds = new mapboxgl.LngLatBounds();
    let foundTracts = 0;

    topTracts.forEach(zone => {
      const tract = currentGeoJson.features.find((feature: unknown) => {
        const typedFeature = feature as { properties?: { GEOID?: string | number } };
        return typedFeature.properties?.GEOID?.toString().padStart(11, '0') === zone.geoid?.toString().padStart(11, '0');
      });

      const typedTract = tract as { geometry?: { coordinates?: number[][][] | number[][][][] } };
      if (typedTract?.geometry?.coordinates) {
        // Handle both Polygon and MultiPolygon geometries
        let coords: number[][];
        const coordinates = typedTract.geometry.coordinates;
        
        try {
          if (coordinates[0] && Array.isArray(coordinates[0][0])) {
            // MultiPolygon: [[[lng, lat], [lng, lat], ...]]
            coords = coordinates[0][0] as number[][];
          } else if (coordinates[0]) {
            // Polygon: [[lng, lat], [lng, lat], ...]
            coords = coordinates[0] as number[][];
          } else {
            console.warn('⚠️ [Map] Invalid coordinate structure for bounds');
            return;
          }
        } catch (e) {
          console.warn('⚠️ [Map] Could not parse tract geometry for zoom bounds:', e);
          return;
        }
        
        if (coords?.length > 0) {
          coords.forEach((coord: number[]) => {
            if (coord?.length >= 2) {
              bounds.extend([coord[0], coord[1]] as [number, number]);
            }
          });
          foundTracts++;
        }
      }
    });

    if (foundTracts > 0) {
      console.log('🔍 [Map] Zooming to show top tracts (preserving original rotation/pitch)');
      // PRESERVE ORIGINAL PITCH AND BEARING - Don't touch the map style
      map.fitBounds(bounds, {
        padding: 100,
        duration: 1200,
        maxZoom: 13
        // NO pitch or bearing specified - keeps your original map rotation/tilt
      });
    }
  }, [currentGeoJson]);

  // Store onSearchResults in a ref to avoid dependency issues
  const onSearchResultsRef = useRef(onSearchResults);
  useEffect(() => {
    onSearchResultsRef.current = onSearchResults;
  }, [onSearchResults]);

  // UPDATED: Use fetchResilienceScores function instead of inline fetch
  const fetchAndApplyScores = useCallback(async () => {
    const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
    const processed = ProcessGeojson(cleaned, { precision: 6 });

    // STRICTER CHECK - Don't auto-load, wait for actual search
    if (!weights?.length || !rentRange || !selectedEthnicities || !selectedGenders || !ageRange || !incomeRange) {
      console.log('⏭️ [Map] Skipping score fetch - filters not ready or no search performed');
      
      // Just load the base map without scores
      setCurrentGeoJson(processed);
      if (mapRef.current) {
        updateTractData(mapRef.current, processed);
      }
      return;
    }

    if (DEBUG_MODE) {
      console.log('📤 Sending to edge function:', {
        weights: weights.map(w => `${w.id}: ${w.value}%`),
        rentRange,
        ethnicities: selectedEthnicities,
        genders: selectedGenders,
        ageRange,
        incomeRange,
        topN,
        hasDemographicScoring: !!demographicScoring
      });
    }

    try {
      // UPDATED: Use the fetchResilienceScores function
      const zones = await fetchResilienceScores({
        weights, // This will be properly formatted by fetchResilienceScores
        rentRange,
        selectedEthnicities,
        selectedGenders,
        ageRange,
        incomeRange,
        demographicScoring // NEW: Pass demographic scoring
      });

      if (DEBUG_MODE) {
        console.log('📥 Edge function returned zones:', zones.length);
        console.log('[✅ DEBUG] Data received by edge function');
      }

      // SAFETY FIX: Cap all scores at 100 to prevent frontend multiplication issues
      const cappedZones = zones.map(zone => ({
        ...zone,
        custom_score: Math.min(Math.max(zone.custom_score || 0, 0), 100),
        // Also cap other scores if needed
        foot_traffic_score: Math.min(Math.max(zone.foot_traffic_score || 0, 0), 100),
        crime_score: Math.min(Math.max(zone.crime_score || 0, 0), 100),
        flood_risk_score: Math.min(Math.max(zone.flood_risk_score || 0, 0), 100),
        rent_score: Math.min(Math.max(zone.rent_score || 0, 0), 100),
        poi_score: Math.min(Math.max(zone.poi_score || 0, 0), 100),
      }));

      // Log any scores that were over 100
      const overScores = zones.filter(zone => (zone.custom_score || 0) > 100);
      if (overScores.length > 0) {
        console.warn('⚠️ [Map] Found scores over 100, capping them:', overScores.map(z => `${z.geoid}: ${z.custom_score}`));
      }

      const zonesWithRankings: ResilienceScoreWithRanking[] = cappedZones.map((zone, index) => ({
        ...zone,
        ranking: index + 1
      }));

      if (DEBUG_MODE) {
        console.log('🏆 Added rankings to zones:', zonesWithRankings.slice(0, 5));
      }

      const scoreMap: Record<string, ResilienceScoreWithRanking> = {};
      zonesWithRankings.forEach((score) => {
        if (score?.geoid) {
          scoreMap[score.geoid.toString().padStart(11, '0')] = score;
        }
      });

      const updated = {
        ...processed,
        features: processed.features.map((feat) => {
          const rawGEOID = (feat.properties as { GEOID?: string | number })?.GEOID;
          const geoid = rawGEOID?.toString().padStart(11, '0');
          const match = scoreMap[geoid || ''];
          const featProps = feat.properties as Record<string, unknown>;
          
          return {
            ...feat,
            properties: {
              ...feat.properties,
              ...(match || { custom_score: 0, ranking: null }),
              ...match,
              hasScore: !!match,
              // FIX: Ensure NTA names are properly set from GeoJSON (with proper typing)
              nta_name: match?.nta_name || featProps?.NTAName || featProps?.nta_name || 'Unknown Neighborhood',
              tract_name: match?.tract_name || featProps?.tract_name || `Tract ${rawGEOID}`,
              display_name: match?.display_name || featProps?.NTAName || `Tract ${rawGEOID}`,
            },
          };
        }),
      };

      // Store current geojson for centering functionality
      setCurrentGeoJson(updated);

      if (DEBUG_MODE) {
        console.log('🧠 Updated GeoJSON with scores and rankings applied.');
      }

      if (mapRef.current) {
        updateTractData(mapRef.current, updated);
        showLegend();
        
        // Add highlight layers if they don't exist
        addHighlightLayers(mapRef.current);
      }

      // Pass enhanced search results to parent using ref to avoid dependency loop
      if (onSearchResultsRef.current) {
        console.log('📊 [Map] Passing search results to parent:', cappedZones.length, 'tracts');
        
        // FIX: Enhance zones with proper NTA names from GeoJSON before passing to parent
        const enhancedZones = cappedZones.map(zone => {
          const tract = updated.features.find((feature: unknown) => {
            const typedFeature = feature as { properties?: { GEOID?: string | number } };
            return typedFeature.properties?.GEOID?.toString().padStart(11, '0') === zone.geoid?.toString().padStart(11, '0');
          });
          
          // Get the actual NTAName from the GeoJSON (with proper typing)
          const tractProps = (tract as { properties?: Record<string, unknown> })?.properties;
          const neighborhoodName = String(tractProps?.NTAName || 
                                  tractProps?.nta_name || 
                                  zone.nta_name || 
                                  'Unknown Neighborhood');
          
          return {
            ...zone,
            nta_name: neighborhoodName,
            tract_name: zone.tract_name || `Tract ${zone.geoid}`,
            display_name: neighborhoodName,
          };
        });
        
        // Simple debug log AFTER array is created
        if (DEBUG_MODE) {
          console.log('🏘️ [Map] Enhanced', enhancedZones.length, 'zones with neighborhood names');
        }
        
        onSearchResultsRef.current(enhancedZones);
      }

      setTimeout(() => {
        zoomToTopTracts(cappedZones);
      }, 800);

    } catch (err) {
      console.error('[Error fetching and applying scores]', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weights, rentRange, selectedEthnicities, selectedGenders, ageRange, incomeRange, topN, demographicScoring]); // 🔧 FIX: Functions excluded to prevent infinite loops

  // Memoize the base map loading function
  const loadBaseMap = useCallback(() => {
    console.log('⏭️ [Map] Loading base map only');
    const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
    const processed = ProcessGeojson(cleaned, { precision: 6 });
    setCurrentGeoJson(processed);
    if (mapRef.current) {
      updateTractData(mapRef.current, processed);
      // Add highlight layers even without scores
      addHighlightLayers(mapRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 🔧 FIX: Functions excluded to prevent infinite loops

  // Map initialization
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: 20,
      bearing: 29,
      antialias: true,
      style: 'mapbox://styles/mapbox/light-v11',
    });
    mapRef.current = map;
    
    window._brickwyzeMapRef = map;

    map.on('load', () => {
      addTractLayers(map);
      createLegend(map);
      const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
      const processed = ProcessGeojson(cleaned, { precision: 6 });
      updateTractData(mapRef.current, processed);
      setCurrentGeoJson(processed);
      
      // Add highlight layers on map load
      addHighlightLayers(map);
      
      setIsMapLoaded(true);
    });

    return () => {
      // Clean up pulse interval
      const mapWithInterval = map as ExtendedMap;
      if (mapWithInterval._pulseInterval) {
        clearInterval(mapWithInterval._pulseInterval);
      }
      map.remove();
      mapRef.current = null;
      window._brickwyzeMapRef = undefined;
      delete window.centerMapOnTract;
    };
  }, [addHighlightLayers]);

  // 🎯 ENHANCED: Global centering function setup
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      window.centerMapOnTract = (tractId: string) => {
        console.log('🌍 [Map] Global centerMapOnTract called:', tractId);
        
        highlightTract(tractId);
        performCentering(tractId, 'results_click', true); // Force centering from results panel
      };
      
      console.log('🌍 [Map] Global centerMapOnTract function set up');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded]); // 🔧 FIX: Functions excluded to prevent infinite loops

  // 🎯 SIMPLIFIED: Prop-based selection without complex blocking logic
  useEffect(() => {
    if (selectedTractId && selectedTractId !== highlightedTractId) {
      console.log('📍 [Map] Prop selected tract:', selectedTractId);
      
      // Always highlight immediately
      highlightTract(selectedTractId);
      
      // Simple centering - same function, same parameters as results panel
      performCentering(selectedTractId, 'prop_update');
      
    } else if (!selectedTractId && highlightedTractId) {
      highlightTract(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTractId, highlightedTractId]); // 🔧 FIX: Functions excluded to prevent infinite loops

  // 🎯 FIXED: Map click handler using unified React state path only
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const handleClick = (e: MapLayerMouseEvent) => {
      const tractId = e.features?.[0]?.properties?.GEOID;
      const hasScore = e.features?.[0]?.properties?.hasScore;
      const resilienceScore = e.features?.[0]?.properties?.custom_score;
      
      if (tractId && hasScore && resilienceScore && resilienceScore > 0) {
        const tractIdStr = tractId.toString();
        
        console.log('🗺️ [Map] TRUE UNIFIED: Map click using React state path only:', tractIdStr);
        
        // 🎯 UNIFIED PATH: Use ONLY React state, same as results panel
        // No direct operations, no timeouts, no blocking - just trigger the unified flow
        
        if (window.openResultsPanel) {
          window.openResultsPanel();
        }
        
        if (window.selectTractFromResultsPanel) {
          console.log('🎯 [Map] Calling selectTractFromResultsPanel immediately');
          window.selectTractFromResultsPanel(tractIdStr);
        }
        
        // That's it! Let the normal prop flow handle everything else
        
      } else {
        console.log('⏭️ [Map] Tract has no resilience score, ignoring click');
        highlightTract(null);
      }
    };

    const handleMouseEnter = () => {
      const canvas = map.getCanvas();
      if (canvas) canvas.style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      const canvas = map.getCanvas();
      if (canvas) canvas.style.cursor = '';
    };

    map.on('click', 'tracts-fill', handleClick);
    map.on('mouseenter', 'tracts-fill', handleMouseEnter);
    map.on('mouseleave', 'tracts-fill', handleMouseLeave);

    return () => {
      map.off('click', 'tracts-fill', handleClick);
      map.off('mouseenter', 'tracts-fill', handleMouseEnter);
      map.off('mouseleave', 'tracts-fill', handleMouseLeave);
    };
  }, [isMapLoaded]); // Simplified dependencies

  // Separated useEffect to prevent infinite loops
  useEffect(() => {
    if (isMapLoaded) {
      // ONLY fetch scores when we have meaningful filter data
      const hasFilters = weights && weights.length > 0;
      if (hasFilters) {
        console.log('🔍 [Map] Fetching scores with filters:', { weights: weights.length, topN });
        void fetchAndApplyScores();
      } else {
        loadBaseMap();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded, weights, rentRange, selectedEthnicities, selectedGenders, ageRange, incomeRange, topN, demographicScoring]); // 🔧 FIX: Functions excluded to prevent infinite loops
 
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        width: '100%',
        zIndex: 0,
        backgroundColor: '#e2e8f0',
      }}
    />
  );
}