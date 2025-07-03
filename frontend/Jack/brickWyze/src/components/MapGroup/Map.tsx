'use client';

import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import rawGeojson from '@/components/MapGroup/manhattan_census_tracts.json';
import { CleanGeojson } from '@/components/MapGroup/CleanGeojson';
import { ProcessGeojson } from '@/components/MapGroup/ProcessGeojson';
import { fetchResilienceScores } from './fetchResilienceScores';

const INITIAL_CENTER: [number, number] = [-73.9712, 40.7831];
const INITIAL_ZOOM = 12;

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: 20,
      bearing: 29,
      antialias: true,
      style: 'mapbox://styles/mapbox/light-v11',
    });

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.on('load', async () => {
      console.log('[Mapbox] Map loaded successfully');

      // 🏙️ Add 3D buildings
      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6,
          },
        },
        'waterway-label'
      );

      const cleaned = CleanGeojson(rawGeojson);
      const processed = ProcessGeojson(cleaned, { precision: 6 });

      const scores = await fetchResilienceScores();
      console.debug('[DEBUG] Fetched scores:', scores);

      const scoreMap: { [key: string]: number } = {};
      scores.forEach((s) => {
        scoreMap[s.geoid.toString()] = s.custom_score;
      });

      const values = Object.values(scoreMap);
      const minScore = Math.min(...values);
      const maxScore = Math.max(...values);

      processed.features = processed.features.map((feat) => {
        const geoid = feat.properties?.GEOID?.toString();
        const rawScore = geoid ? scoreMap[geoid] : null;

        let normScore = null;
        if (rawScore !== null && rawScore !== undefined && maxScore > minScore) {
          normScore = (rawScore - minScore) / (maxScore - minScore);
        }

        return {
          ...feat,
          properties: {
            ...feat.properties,
            custom_score: normScore,
          },
        };
      });

      map.addSource('tracts', {
        type: 'geojson',
        data: processed,
      });

      map.addLayer({
        id: 'tracts-fill',
        type: 'fill',
        source: 'tracts',
        paint: {
          'fill-color': [
            'case',
            ['!=', ['get', 'custom_score'], null],
            [
              'interpolate',
              ['linear'],
              ['get', 'custom_score'],
              0, '#d73027',   // red
              0.5, '#fee08b', // yellow
              1, '#1a9850',   // green
            ],
            '#f0f0f0',
          ],
          'fill-opacity': 0.6,
        },
      });

      map.addLayer({
        id: 'tracts-outline',
        type: 'line',
        source: 'tracts',
        paint: {
          'line-color': '#000',
          'line-width': 1,
        },
      });

      // 🧠 Hover Tooltip
      map.on('mousemove', 'tracts-fill', (e) => {
        if (!e.features || !e.features.length) return;

        const feature = e.features[0];
        const props = feature.properties || {};
        const geoid = props.GEOID;
        const score = props.custom_score;

        const content = `<strong>GEOID:</strong> ${geoid}<br/><strong>Score:</strong> ${
          score !== null ? score.toFixed(2) : 'N/A'
        }`;

        popup.setLngLat((e.lngLat as any)).setHTML(content).addTo(map);
      });

      map.on('mouseleave', 'tracts-fill', () => {
        popup.remove();
      });
    });

    map.on('error', (e) => {
      console.error('[Mapbox ERROR]', e.error);
    });

    return () => map.remove();
  }, []);

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
