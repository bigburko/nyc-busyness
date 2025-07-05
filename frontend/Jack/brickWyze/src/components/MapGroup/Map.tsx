'use client';

import { useRef, useEffect } from 'react';
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

      console.log('[GeoJSON GEOIDs]', processed.features.map(f => f.properties?.GEOID));

      let scores: any[] = [];

      try {
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
          },
          body: JSON.stringify({
            weights: {
              footfall: 0.35,
              demographics: 0.25,
              safety: 0.15,
              flooding: 0.10,
              rent: 0.10,
              poi: 0.05,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Edge Function error ${response.status}: ${errorText}`);
        }

        scores = await response.json();

        console.log('[Edge Function GEOIDs]', scores.map(s => s.geoid));
      } catch (err) {
        console.error('[Edge Function Fetch Failed]', err);
        return;
      }

      const scoreMap: { [key: string]: any } = {};
      scores.forEach((s: any) => {
        const geoidStr = s?.geoid?.toString?.();
        if (geoidStr) {
          scoreMap[geoidStr] = s;
        }
      });

      processed.features = processed.features.map((feat) => {
        const geoid = feat.properties?.GEOID?.toString().padStart(11, '0');
        const scoreData = geoid ? scoreMap[geoid] : null;

        if (!scoreData) {
          console.warn(`[MISSING DATA] GEOID: ${geoid} not found in scoreMap`);
        }

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
            [
              'interpolate',
              ['linear'],
              ['get', 'custom_score'],
              0,
              '#d73027',
              5,
              '#fee08b',
              10,
              '#1a9850',
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

      map.on('click', 'tracts-fill', (e) => {
        if (!e.features || !e.features.length) return;

        const feature = e.features[0];
        const props = feature.properties || {};
        const toScore = (val: any) =>
          val !== null && val !== undefined ? Math.round(val * 10) : 'N/A';

        console.log('[Popup Feature]', props);

        const content = `
          <div style="font-family: sans-serif; max-width: 240px;">
            <h3 style="margin: 0 0 8px; font-size: 16px;">📍 ${props.NTAName || 'Unknown Area'}</h3>
            <div style="font-size: 14px; margin-bottom: 12px;">
              <strong style="font-size: 24px; color: #1a9850;">${toScore(
                props.custom_score
              )}</strong><span style="font-size: 16px;"> /100</span>
              <div style="margin-top: 10px;">
                <div><strong>Low Crime:</strong> <span style="color:#1a9850">${toScore(
                  props.crime_score
                )}/100</span></div>
                <div><strong>Foot Traffic:</strong> <span style="color:#fdae61">${toScore(
                  props.foot_traffic_score
                )}/100</span></div>
                <div><strong>Flood Safety:</strong> <span style="color:#1a9850">${toScore(
                  props.flood_risk_score
                )}/100</span></div>
                <div><strong>Rent Score:</strong> <span style="color:#fdae61">${toScore(
                  props.rent_score
                )}/100</span></div>
                <div><strong>POI Score:</strong> <span style="color:#fdae61">${toScore(
                  props.poi_score
                )}/100</span></div>
                <div><strong>Demographics:</strong> <span style="color:#1a9850">${toScore(
                  props.demographic_score
                )}/100</span></div>
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
