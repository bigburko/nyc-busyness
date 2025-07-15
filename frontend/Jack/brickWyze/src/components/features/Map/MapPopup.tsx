'use client';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

interface Props {
  map: mapboxgl.Map | null;
  coordinates: [number, number] | null; // [lng, lat]
  content: string | null;
}

const MapPopup = ({ map, coordinates, content }: Props) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!map || !coordinates || !content) return;

    // Remove previous popup
    popupRef.current?.remove();

    // Create new popup
    const popup = new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat(coordinates)
      .setHTML(content)
      .addTo(map);

    popupRef.current = popup;

    return () => {
      popup.remove();
    };
  }, [map, coordinates, content]);

  return null;
};

export default MapPopup;
