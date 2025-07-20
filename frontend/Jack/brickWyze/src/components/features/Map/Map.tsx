// Map.tsx - Minimal orchestrator component (60 lines vs 800+ original!)

'use client';

import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useMapState } from '../../../hooks/useMapState';
import { useMapHighlight } from './MapHighlight';
import { useMapCentering } from './MapCentering';
import { useMapEventHandlers } from './MapEventHandlers';
import { useMapDataProcessor } from './MapDataProcessor';
import { useMapZoom } from './MapZoom';

import { ResilienceScore } from './fetchResilienceScores';
import { DemographicScoring } from '../../../stores/filterStore';

declare global {
  interface Window {
    _brickwyzeMapRef?: mapboxgl.Map;
    selectTractFromResultsPanel?: (tractId: string) => void;
    openResultsPanel?: () => void;
    centerMapOnTract?: (tractId: string) => void;
  }
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Weighting {
  id: string;
  label: string;
  value: number;
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

export default function Map(props: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { mapRef, isMapLoaded, currentGeoJson, setCurrentGeoJson, highlightedTractId, setHighlightedTractId, initializeMap } = useMapState(containerRef);
  const { addHighlightLayers, highlightTract, highlightTractRef } = useMapHighlight({ map: mapRef.current, currentGeoJson, highlightedTractId, setHighlightedTractId });
  const { performCentering } = useMapCentering({ map: mapRef.current, currentGeoJson });
  const { zoomToTopTracts } = useMapZoom({ map: mapRef.current, currentGeoJson });
  const { fetchAndApplyScores, loadBaseMap } = useMapDataProcessor({ map: mapRef.current, ...props, setCurrentGeoJson, addHighlightLayers, zoomToTopTracts });

  useMapEventHandlers({ map: mapRef.current, isMapLoaded, highlightTractRef });

  useEffect(() => initializeMap(addHighlightLayers), [initializeMap, addHighlightLayers]);

  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      window.centerMapOnTract = (tractId: string) => { highlightTract(tractId); performCentering(tractId, 'results_click', true); };
    }
  }, [isMapLoaded, highlightTract, performCentering]);

  useEffect(() => {
    if (props.selectedTractId && props.selectedTractId !== highlightedTractId) {
      highlightTract(props.selectedTractId);
      performCentering(props.selectedTractId, 'prop_update');
    } else if (!props.selectedTractId && highlightedTractId) {
      highlightTract(null);
    }
  }, [props.selectedTractId, highlightedTractId, highlightTract, performCentering]);

  useEffect(() => {
    if (isMapLoaded) {
      const hasFilters = props.weights && props.weights.length > 0;
      hasFilters ? void fetchAndApplyScores() : loadBaseMap();
    }
  }, [isMapLoaded, props.weights, props.rentRange, props.selectedEthnicities, props.selectedGenders, props.ageRange, props.incomeRange, props.topN, props.demographicScoring, fetchAndApplyScores, loadBaseMap]);
 
  return <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', width: '100%', zIndex: 0, backgroundColor: '#e2e8f0' }} />;
}