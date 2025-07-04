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
      closeButton: true,
      closeOnClick: true,
      className: 'resilience-popup',
    });

    map.on('load', async () => {
      const cleaned = CleanGeojson(rawGeojson);
      const processed = ProcessGeojson(cleaned, { precision: 6 });

      const scores = await fetchResilienceScores();
      const scoreMap: { [key: string]: any } = {};
      scores.forEach((s) => {
        scoreMap[s.geoid.toString()] = s;
      });

      processed.features = processed.features.map((feat) => {
        const geoid = feat.properties?.GEOID?.toString();
        const scoreData = geoid ? scoreMap[geoid] : null;

        return {
          ...feat,
          properties: {
            ...feat.properties,
            ...scoreData,
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
        if (!e.features || !e.features.length) return;

        const feature = e.features[0];
        const props = feature.properties || {};
        const toScore = (val: any) => val !== null && val !== undefined ? Math.round(val * 10) : 'N/A';

        const content = `
          <div style="font-family: sans-serif; max-width: 240px;">
            <h3 style="margin: 0 0 8px; font-size: 16px;">📍 ${props.NTAName || 'Unknown Area'}</h3>
            <div style="font-size: 14px; margin-bottom: 12px;">
              <strong style="font-size: 24px; color: #1a9850;">${toScore(props.custom_score)}</strong><span style="font-size: 16px;"> /100</span>
              <div style="margin-top: 10px;">
                <div><strong>Low Crime:</strong> <span style="color:#1a9850">${toScore(props.crime_score)}/100</span></div>
                <div><strong>Foot Traffic:</strong> <span style="color:#fdae61">${toScore(props.foot_traffic_score)}/100</span></div>
                <div><strong>Flood Safety:</strong> <span style="color:#1a9850">${toScore(props.flood_safety_score)}/100</span></div>
                <div><strong>Rent Score:</strong> <span style="color:#fdae61">${toScore(props.rent_score)}/100</span></div>
                <div><strong>POI Score:</strong> <span style="color:#fdae61">${toScore(props.poi_score)}/100</span></div>
                <div><strong>Demographics:</strong> <span style="color:#1a9850">${toScore(props.demographic_score)}/100</span></div>
              </div>
            </div>
            <button style="background:#eee;border-radius:6px;border:none;padding:6px 12px;font-size:13px;cursor:pointer;">Save to Shortlist</button>
          </div>
        `;

        popup.setLngLat(e.lngLat).setHTML(content).addTo(map);
      });

      map.on('mouseleave', 'tracts-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('mouseenter', 'tracts-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
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
