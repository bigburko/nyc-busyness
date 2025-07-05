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

interface MapProps {
  weights?: any[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
}

export default function Map({
  weights,
  rentRange,
  selectedEthnicities,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const fetchAndProcessGeojson = async () => {
    const cleaned = CleanGeojson(rawGeojson);
    const processed = ProcessGeojson(cleaned, { precision: 6 });

    if (!weights || !rentRange || !selectedEthnicities) {
      console.warn('[Skipping Fetch] Missing filters:', {
        weights,
        rentRange,
        selectedEthnicities,
      });
      
      // Set default data without scores
      if (mapRef.current && mapRef.current.getSource('tracts')) {
        const source = mapRef.current.getSource('tracts');
        if (source && 'setData' in source) {
          (source as mapboxgl.GeoJSONSource).setData(processed);
        }
      }
      return;
    }

    console.log('[Sending to Edge Function]', {
      weights,
      rentRange,
      ethnicities: selectedEthnicities,
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
          ethnicities: selectedEthnicities,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function error ${response.status}: ${errorText}`);
      }

      const scores = await response.json();
      console.log('[Received scores]', scores.length, 'zones');
      
      // Check score distribution
      const scoreDistribution = scores.map((s: any) => s.custom_score).sort((a: number, b: number) => a - b);
      console.log('[Score distribution]', {
        min: Math.min(...scoreDistribution),
        max: Math.max(...scoreDistribution),
        median: scoreDistribution[Math.floor(scoreDistribution.length / 2)],
        sample: scoreDistribution.slice(0, 10)
      });
      
      const scoreMap: Record<string, any> = {};
      scores.forEach((s: any) => {
        if (s?.geoid) {
          const paddedGeoid = s.geoid.toString().padStart(11, '0');
          scoreMap[paddedGeoid] = s;
        }
      });

      const updatedGeojson = {
        ...processed,
        features: processed.features.map((feat) => {
          if (!feat.properties || !feat.properties.GEOID) {
            return feat;
          }

          const geoid = feat.properties.GEOID.toString().padStart(11, '0');
          const matched = scoreMap[geoid];

          if (matched) {
            return {
              ...feat,
              properties: {
                ...feat.properties,
                ...matched,
              },
            };
          }
          
          return {
            ...feat,
            properties: {
              ...feat.properties,
              custom_score: 0,
            },
          };
        }),
      };

      console.log('[Updated GeoJSON]', updatedGeojson);
      console.log('[Sample feature with scores]', updatedGeojson.features[0]?.properties);

      if (mapRef.current && mapRef.current.getSource('tracts')) {
        const source = mapRef.current.getSource('tracts');
        if (source && 'setData' in source) {
          (source as mapboxgl.GeoJSONSource).setData(updatedGeojson);
          console.log('[GeoJSON set on map]', updatedGeojson.features.length, 'features');
          
          // Force map to repaint
          mapRef.current.triggerRepaint();
        }
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
            ['has', 'custom_score'],
            [
              'interpolate',
              ['linear'],
              ['get', 'custom_score'],
              0, '#d73027',      // Dark red for 0
              0.2, '#fc8d59',    // Orange-red for 0.2
              0.4, '#fee08b',    // Yellow for 0.4
              0.6, '#d9ef8b',    // Light green for 0.6
              0.8, '#91bfdb',    // Light blue for 0.8
              1, '#1a9850'       // Dark green for 1.0
            ],
            '#cccccc' // Gray for no data
          ],
          'fill-opacity': 0.7,
        },
      });

      map.addLayer({
        id: 'tracts-outline',
        type: 'line',
        source: 'tracts',
        paint: {
          'line-color': '#333',
          'line-width': 0.5,
        },
      });

      // Add a legend
      const legend = document.createElement('div');
      legend.innerHTML = `
        <div style="position: absolute; bottom: 30px; right: 10px; background: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          <div style="font-weight: bold; margin-bottom: 5px;">Resilience Score</div>
          <div style="display: flex; align-items: center; margin: 2px 0;">
            <div style="width: 20px; height: 10px; background: #1a9850; margin-right: 5px;"></div>
            <span style="font-size: 12px;">High (80-100)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 2px 0;">
            <div style="width: 20px; height: 10px; background: #91bfdb; margin-right: 5px;"></div>
            <span style="font-size: 12px;">Good (60-80)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 2px 0;">
            <div style="width: 20px; height: 10px; background: #fee08b; margin-right: 5px;"></div>
            <span style="font-size: 12px;">Fair (40-60)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 2px 0;">
            <div style="width: 20px; height: 10px; background: #fc8d59; margin-right: 5px;"></div>
            <span style="font-size: 12px;">Low (20-40)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 2px 0;">
            <div style="width: 20px; height: 10px; background: #d73027; margin-right: 5px;"></div>
            <span style="font-size: 12px;">Very Low (0-20)</span>
          </div>
        </div>
      `;
      map.getContainer().appendChild(legend);

      map.on('click', 'tracts-fill', (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const props = feature.properties || {};

        const toScore = (val: any) => {
          if (val === null || val === undefined) return 'N/A';
          const score = parseFloat(val);
          return isNaN(score) ? 'N/A' : Math.round(score * 100);
        };

        const getScoreColor = (score: number) => {
          if (score >= 80) return '#1a9850';
          if (score >= 60) return '#91bfdb';
          if (score >= 40) return '#fee08b';
          if (score >= 20) return '#fc8d59';
          return '#d73027';
        };

        const overallScore = toScore(props.custom_score);
        const scoreColor = getScoreColor(overallScore === 'N/A' ? 0 : overallScore);

        const content = `
          <div style="font-family: sans-serif; max-width: 280px;">
            <h3 style="margin: 0 0 8px; font-size: 16px;">📍 ${props.NTAName || props.GEOID || 'Unknown Area'}</h3>
            <div style="font-size: 14px; margin-bottom: 12px;">
              <div style="background: #f0f0f0; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                <strong style="font-size: 24px; color: ${scoreColor};">
                  ${overallScore}
                </strong>
                <span style="font-size: 14px;"> /100 Overall Score</span>
              </div>
              <div style="margin-top: 10px; font-size: 13px;">
                <div style="margin: 4px 0;"><strong>Crime Safety:</strong> ${toScore(props.crime_score)}/100</div>
                <div style="margin: 4px 0;"><strong>Foot Traffic:</strong> ${toScore(props.foot_traffic_score)}/100</div>
                <div style="margin: 4px 0;"><strong>Flood Safety:</strong> ${toScore(props.flood_risk_score)}/100</div>
                <div style="margin: 4px 0;"><strong>Rent Value:</strong> ${toScore(props.rent_score)}/100</div>
                <div style="margin: 4px 0;"><strong>Points of Interest:</strong> ${toScore(props.poi_score)}/100</div>
                <div style="margin: 4px 0;"><strong>Demographics:</strong> ${toScore(props.demographic_score)}/100</div>
                ${props.rent_psf ? `<div style="margin: 4px 0;"><strong>Rent PSF:</strong> $${props.rent_psf}</div>` : ''}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
                <strong>Weights Applied:</strong>
                ${weights ? weights.map(w => `<div style="font-size: 11px; margin: 2px 0;">${w.label}: ${w.value}%</div>`).join('') : 'Default'}
              </div>
            </div>
          </div>
        `;

        new mapboxgl.Popup({ closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(map);
      });

      map.on('mouseenter', 'tracts-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'tracts-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      setIsMapLoaded(true);
    });

    return () => {
      map.remove();
      setIsMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (isMapLoaded && weights && rentRange && selectedEthnicities) {
      fetchAndProcessGeojson();
    }
  }, [isMapLoaded, weights, rentRange, selectedEthnicities]);

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
