'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import rawGeojson from '@/components/MapGroup/manhattan_census_tracts.json';
import { CleanGeojson } from '@/components/MapGroup/CleanGeojson';
import { ProcessGeojson } from '@/components/MapGroup/ProcessGeojson';

const INITIAL_CENTER: [number, number] = [-73.9712, 40.7831];
const INITIAL_ZOOM = 12;

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const EDGE_FUNCTION_URL =
  'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience';

export default function Map({ weights, rentRange, selectedEthnicities }: any) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [geojson, setGeojson] = useState<any>(null);

  const fetchAndProcessGeojson = async () => {
    const cleaned = CleanGeojson(rawGeojson);
    const processed = ProcessGeojson(cleaned, { precision: 6 });
    const geoids = processed.features.map((f) => f.properties?.GEOID);

    console.log('[Sending to Edge Function]', {
      weights,
      rentRange,
      selectedEthnicities,
      geoids,
    });

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
          selectedEthnicities,
          geoids,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function error ${response.status}: ${errorText}`);
      }

      const scores = await response.json();
      const scoreMap: Record<string, any> = {};
      scores.forEach((s: any) => {
        const geoid = s?.geoid?.toString?.();
        if (geoid) scoreMap[geoid] = s;
      });

      const updatedGeojson = {
        ...processed,
        features: processed.features.map((feat) => {
          const geoid = feat.properties?.GEOID?.toString().padStart(11, '0');
          return {
            ...feat,
            properties: {
              ...feat.properties,
              ...scoreMap[geoid],
            },
          };
        }),
      };

      setGeojson(updatedGeojson);

      if (mapRef.current && mapRef.current.getSource('tracts')) {
        const source = mapRef.current.getSource('tracts') as mapboxgl.GeoJSONSource;
        source.setData(updatedGeojson);
      }
    } catch (err) {
      console.error('[Edge Function Fetch Failed]', err);
    }
  };

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

    mapRef.current = map;

    map.on('load', () => {
      fetchAndProcessGeojson();

      map.addSource('tracts', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'tracts-fill',
        type: 'fill',
        source: 'tracts',
        paint: {
          'fill-color': [
            'case',
            ['!=', ['get', 'custom_score'], null],
            ['interpolate', ['linear'], ['get', 'custom_score'], 0, '#d73027', 5, '#fee08b', 10, '#1a9850'],
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

      map.on('click', 'tracts-fill', (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const props = feature.properties || {};

        const toScore = (val: any) =>
          val !== null && val !== undefined ? Math.round(val * 10) : 'N/A';

        const content = `
          <div style="font-family: sans-serif; max-width: 240px;">
            <h3 style="margin: 0 0 8px; font-size: 16px;">📍 ${props.NTAName || 'Unknown Area'}</h3>
            <div style="font-size: 14px; margin-bottom: 12px;">
              <strong style="font-size: 24px; color: #1a9850;">${toScore(
                props.custom_score
              )}</strong><span style="font-size: 16px;"> /100</span>
              <div style="margin-top: 10px;">
                <div><strong>Low Crime:</strong> ${toScore(props.crime_score)}/100</div>
                <div><strong>Foot Traffic:</strong> ${toScore(props.foot_traffic_score)}/100</div>
                <div><strong>Flood Safety:</strong> ${toScore(props.flood_risk_score)}/100</div>
                <div><strong>Rent Score:</strong> ${toScore(props.rent_score)}/100</div>
                <div><strong>POI Score:</strong> ${toScore(props.poi_score)}/100</div>
                <div><strong>Demographics:</strong> ${toScore(props.demographic_score)}/100</div>
              </div>
            </div>
          </div>
        `;

        new mapboxgl.Popup({ closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(map);
      });
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (weights && rentRange && selectedEthnicities) {
      fetchAndProcessGeojson();
    }
  }, [weights, rentRange, selectedEthnicities]);

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
