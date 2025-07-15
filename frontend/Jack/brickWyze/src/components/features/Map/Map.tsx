'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// ✅ FIXED: Correct relative imports for Map.tsx location
import rawGeojson from './manhattan_census_tracts.json';
import { CleanGeojson, PotentiallyNonStandardFeatureCollection } from './CleanGeojson';
import { ResilienceScore } from './fetchResilienceScores';
import { ProcessGeojson } from './ProcessGeojson';
import { addTractLayers, updateTractData } from './TractLayer';
import { createLegend, showLegend } from './Legend';

// ✅ Global type declaration
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

const EDGE_FUNCTION_URL =
  'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience';

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
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentGeoJson, setCurrentGeoJson] = useState<any>(null);

  // ✅ Function to gently center map on a specific tract (with proper validation)
  const centerOnTract = useCallback((tractId: string) => {
    const map = mapRef.current;
    if (!map || !currentGeoJson) {
      console.warn('🚫 [Map] Cannot center - map or geojson not ready:', { map: !!map, geojson: !!currentGeoJson });
      return;
    }

    console.log('🔍 [Map] Searching for tract:', tractId, 'in', currentGeoJson.features.length, 'features');
    
    // Try multiple ID formats to find the tract
    const searchIds = [
      tractId,
      tractId.padStart(11, '0'),
      tractId.toString(),
      tractId.toString().padStart(11, '0')
    ];
    
    let tract = null;
    for (const searchId of searchIds) {
      tract = currentGeoJson.features.find((feature: any) => {
        const featureId = feature.properties?.GEOID?.toString();
        return featureId === searchId || featureId?.padStart(11, '0') === searchId;
      });
      if (tract) {
        console.log('✅ [Map] Found tract with ID format:', searchId);
        break;
      }
    }

    if (tract && tract.geometry && tract.geometry.coordinates) {
      console.log('🎯 [Map] Gently centering on tract:', tractId);
      
      try {
        // Calculate the center point of the tract
        const coords = tract.geometry.coordinates[0]; // Assuming polygon
        if (coords && coords.length > 0) {
          // ✅ VALIDATE COORDINATES - Check if they're valid numbers
          let totalLng = 0;
          let totalLat = 0;
          let validCoords = 0;
          
          coords.forEach((coord: [number, number]) => {
            if (coord && coord.length === 2 && 
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
            
            // ✅ VALIDATE FINAL COORDINATES
            if (!isNaN(centerLng) && !isNaN(centerLat) && 
                centerLng >= -180 && centerLng <= 180 && 
                centerLat >= -90 && centerLat <= 90) {
              
              // ✅ ONLY PAN - NO ZOOM, NO ROTATION, NO PITCH CHANGES
              map.panTo([centerLng, centerLat], {
                duration: 600,
              });
              
              console.log('✅ [Map] Successfully panned to tract center:', [centerLng, centerLat]);
            } else {
              console.error('❌ [Map] Invalid calculated coordinates:', [centerLng, centerLat]);
            }
          } else {
            console.error('❌ [Map] No valid coordinates found in tract geometry');
          }
        } else {
          console.error('❌ [Map] Tract geometry has no coordinates');
        }
      } catch (error) {
        console.error('❌ [Map] Error centering on tract:', error);
      }
    } else {
      console.error('❌ [Map] Tract not found or invalid geometry:', tractId);
      console.log('📋 [Map] Available tract IDs (first 10):', 
        currentGeoJson.features.slice(0, 10).map((f: any) => f.properties?.GEOID)
      );
    }
  }, [currentGeoJson]);

  // ✅ Function to zoom to show top tracts after search (preserve original style)
  const zoomToTopTracts = useCallback((zones: ResilienceScore[]) => {
    const map = mapRef.current;
    if (!map || !currentGeoJson || zones.length === 0) return;

    const topTracts = zones.slice(0, 5);
    const bounds = new mapboxgl.LngLatBounds();
    let foundTracts = 0;

    topTracts.forEach(zone => {
      const tract = currentGeoJson.features.find((feature: any) => 
        feature.properties?.GEOID?.toString().padStart(11, '0') === zone.geoid?.toString().padStart(11, '0')
      );

      if (tract && tract.geometry) {
        const coords = tract.geometry.coordinates[0];
        if (coords && coords.length > 0) {
          coords.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
          foundTracts++;
        }
      }
    });

    if (foundTracts > 0) {
      console.log('🔍 [Map] Zooming to show top tracts (preserving original rotation/pitch)');
      // ✅ PRESERVE ORIGINAL PITCH AND BEARING - Don't touch the map style
      map.fitBounds(bounds, {
        padding: 100,
        duration: 1200,
        maxZoom: 13
        // ✅ NO pitch or bearing specified - keeps your original map rotation/tilt
      });
    }
  }, [currentGeoJson]);

  const fetchAndApplyScores = useCallback(async () => {
    const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
    const processed = ProcessGeojson(cleaned, { precision: 6 });

    // ✅ STRICTER CHECK - Don't auto-load, wait for actual search
    if (!weights || weights.length === 0 || !rentRange || !selectedEthnicities || !selectedGenders || !ageRange || !incomeRange) {
      console.log('⏭️ [Map] Skipping score fetch - filters not ready or no search performed');
      
      // ✅ Just load the base map without scores
      setCurrentGeoJson(processed);
      updateTractData(mapRef.current, processed);
      return;
    }

    if (DEBUG_MODE) {
      console.log('📤 Sending to edge function:', {
        weights,
        rentRange,
        ethnicities: selectedEthnicities,
        genders: selectedGenders,
        ageRange,
        incomeRange,
        topN
      });
    }

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          weights,
          rentRange,
          ethnicities: selectedEthnicities,
          genders: selectedGenders,
          ageRange,
          incomeRange,
          topN,
          crimeYears: [
            'year_2021',
            'year_2022', 
            'year_2023',
            'year_2024',
            'pred_2025',
            'pred_2026',
            'pred_2027'
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Edge error ${response.status}:`, errorText);
        throw new Error(`Edge function failed: ${errorText}`);
      }

      interface ApiResponse {
        zones: ResilienceScore[];
        debug?: Record<string, unknown>;
      }

      const { zones, debug } = (await response.json()) as ApiResponse;

      if (DEBUG_MODE) {
        console.log('📥 Edge function returned zones:', zones.length);
        console.log('[✅ DEBUG] Data received by edge function:', debug);
      }

      // ✅ Add rankings to zones
      const zonesWithRankings: ResilienceScoreWithRanking[] = zones.map((zone, index) => ({
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
          const rawGEOID = feat.properties?.GEOID;
          const geoid = rawGEOID?.toString().padStart(11, '0');
          const match = scoreMap[geoid];
          const featProps = feat.properties as any; // Type assertion for GeoJSON properties
          
          return {
            ...feat,
            properties: {
              ...feat.properties,
              ...(match || { custom_score: 0, ranking: null }),
              ...match,
              hasScore: !!match,
              // ✅ FIX: Ensure NTA names are properly set from GeoJSON (with proper typing)
              nta_name: match?.nta_name || featProps?.NTAName || featProps?.nta_name || 'Unknown Neighborhood',
              tract_name: match?.tract_name || featProps?.tract_name || `Tract ${rawGEOID}`,
              display_name: match?.display_name || featProps?.NTAName || `Tract ${rawGEOID}`,
            },
          };
        }),
      };

      // ✅ Store current geojson for centering functionality
      setCurrentGeoJson(updated);

      if (DEBUG_MODE) {
        console.log('🧠 Updated GeoJSON with scores and rankings applied.');
      }

      updateTractData(mapRef.current, updated);
      showLegend();

      // ✅ Pass enhanced search results to parent (AFTER everything is created)
      if (onSearchResults) {
        console.log('📊 [Map] Passing search results to parent:', zones.length, 'tracts');
        
        // ✅ FIX: Enhance zones with proper NTA names from GeoJSON before passing to parent
        const enhancedZones = zones.map(zone => {
          const tract = updated.features.find((feature: any) => 
            feature.properties?.GEOID?.toString().padStart(11, '0') === zone.geoid?.toString().padStart(11, '0')
          );
          
          // ✅ Get the actual NTAName from the GeoJSON (with proper typing)
          const tractProps = tract?.properties as any;
          const neighborhoodName = tractProps?.NTAName || 
                                  tractProps?.nta_name || 
                                  zone.nta_name || 
                                  'Unknown Neighborhood';
          
          return {
            ...zone,
            nta_name: neighborhoodName,
            tract_name: zone.tract_name || `Tract ${zone.geoid}`,
            display_name: neighborhoodName,
          };
        });
        
        // ✅ Simple debug log AFTER array is created
        if (DEBUG_MODE) {
          console.log('🏘️ [Map] Enhanced', enhancedZones.length, 'zones with neighborhood names');
        }
        
        onSearchResults(enhancedZones);
      }

      setTimeout(() => {
        zoomToTopTracts(zones);
      }, 800);

    } catch (err) {
      console.error('[Error fetching and applying scores]', err);
    }
  }, [weights, rentRange, selectedEthnicities, selectedGenders, ageRange, incomeRange, topN, onSearchResults, zoomToTopTracts]);

  // ✅ Map initialization
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
      setIsMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      window._brickwyzeMapRef = undefined;
      delete window.centerMapOnTract;
    };
  }, []);

  // ✅ Set up global centering function when map loads (prevent loops)
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      // Set up the global centering function
      window.centerMapOnTract = (tractId: string) => {
        console.log('🌍 [Map] Global centerMapOnTract called for:', tractId);
        centerOnTract(tractId);
      };
      
      console.log('🌍 [Map] Global centerMapOnTract function set up');
    }
  }, [isMapLoaded]); // ✅ ONLY depend on isMapLoaded, not centerOnTract

  // ✅ NO POPUP - Click handlers WITHOUT popup, just opens results panel
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const handleClick = (e: MapLayerMouseEvent) => {
      const tractId = e.features?.[0]?.properties?.GEOID;
      const hasScore = e.features?.[0]?.properties?.hasScore;
      const resilienceScore = e.features?.[0]?.properties?.custom_score;
      
      // ✅ NO POPUP - just open results panel and select tract
      if (tractId && hasScore && resilienceScore && resilienceScore > 0) {
        console.log('🗺️ [Map] Tract clicked with score:', tractId, '- NO POPUP');
        
        if (window.openResultsPanel) {
          window.openResultsPanel();
        }
        
        if (window.selectTractFromResultsPanel) {
          window.selectTractFromResultsPanel(tractId);
        }
      } else {
        console.log('⏭️ [Map] Tract has no resilience score, ignoring click');
      }
    };

    const handleMouseEnter = () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = '';
    };

    map.on('click', 'tracts-fill', handleClick);
    map.on('mouseenter', 'tracts-fill', handleMouseEnter);
    map.on('mouseleave', 'tracts-fill', handleMouseLeave);

    return () => {
      map.off('click', 'tracts-fill', handleClick);
      map.off('mouseenter', 'tracts-fill', handleMouseEnter);
      map.off('mouseleave', 'tracts-fill', handleMouseLeave);
    };
  }, [weights, selectedEthnicities, selectedGenders, isMapLoaded]);

  // ✅ Effect to handle tract centering from results panel clicks (simplified)
  useEffect(() => {
    if (selectedTractId && isMapLoaded) {
      console.log('🗺️ [Map] Centering on selected tract via prop change:', selectedTractId);
      
      const timeoutId = setTimeout(() => {
        const map = mapRef.current;
        if (!map || !currentGeoJson) return;

        // Find the tract
        const tract = currentGeoJson.features.find((feature: any) => {
          const featureId = feature.properties?.GEOID?.toString();
          return featureId === selectedTractId || featureId?.padStart(11, '0') === selectedTractId;
        });

        if (tract && tract.geometry && tract.geometry.coordinates) {
          const coords = tract.geometry.coordinates[0];
          if (coords && coords.length > 0) {
            // Calculate center with validation
            let totalLng = 0;
            let totalLat = 0;
            let validCoords = 0;
            
            coords.forEach((coord: [number, number]) => {
              if (coord && Array.isArray(coord) && coord.length >= 2) {
                const lng = coord[0];
                const lat = coord[1];
                
                // ✅ VALIDATE COORDINATES - Check if they're valid numbers
                if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                  totalLng += lng;
                  totalLat += lat;
                  validCoords++;
                }
              }
            });
            
            if (validCoords > 0) {
              const centerLng = totalLng / validCoords;
              const centerLat = totalLat / validCoords;
              
              // ✅ FINAL VALIDATION - Ensure coordinates are valid and in reasonable range
              if (!isNaN(centerLng) && !isNaN(centerLat) && 
                  isFinite(centerLng) && isFinite(centerLat) &&
                  centerLng >= -180 && centerLng <= 180 && 
                  centerLat >= -90 && centerLat <= 90) {
                
                // ✅ SIMPLE OFFSET - Just shift east to account for side panel
                const offsetLng = centerLng + 0.01; // Simple eastward offset
                
                // ✅ VALIDATE OFFSET TOO
                if (!isNaN(offsetLng) && isFinite(offsetLng) && offsetLng >= -180 && offsetLng <= 180) {
                  map.panTo([offsetLng, centerLat], { duration: 600 });
                  console.log('✅ [Map] Panned to tract with side panel offset:', [offsetLng, centerLat]);
                } else {
                  console.warn('❌ [Map] Invalid offset coordinates:', [offsetLng, centerLat]);
                }
              } else {
                console.warn('❌ [Map] Invalid calculated center coordinates:', [centerLng, centerLat]);
              }
            } else {
              console.warn('❌ [Map] No valid coordinates found in tract geometry');
            }
          } else {
            console.warn('❌ [Map] Tract geometry has no coordinate array');
          }
        } else {
          console.warn('❌ [Map] Tract not found or has invalid geometry for ID:', selectedTractId);
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedTractId, isMapLoaded]);

  useEffect(() => {
    if (isMapLoaded) {
      // ✅ ONLY fetch scores when we have meaningful filter data
      const hasFilters = weights && weights.length > 0;
      if (hasFilters) {
        console.log('🔍 [Map] Fetching scores with filters:', { weights: weights.length, topN });
        fetchAndApplyScores();
      } else {
        console.log('⏭️ [Map] No filters set, loading base map only');
        // Load base map without scores
        const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
        const processed = ProcessGeojson(cleaned, { precision: 6 });
        setCurrentGeoJson(processed);
        updateTractData(mapRef.current, processed);
      }
    }
  }, [isMapLoaded, weights, rentRange, selectedEthnicities, selectedGenders, ageRange, incomeRange, topN]); // ✅ EXPLICIT DEPS instead of function reference

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