// components/MapGroup/Legend.tsx

import mapboxgl from 'mapbox-gl';

/**
 * Creates the legend DOM element and appends it to the map container.
 */
export const createLegend = (map: mapboxgl.Map) => {
  const existing = document.getElementById('map-legend');
  if (existing) return;

  const legend = document.createElement('div');
  legend.id = 'map-legend';
  legend.style.display = 'none';
  legend.innerHTML = `
    <div style="
      position: absolute;
      bottom: 30px;
      right: 10px;
      background: white;
      padding: 10px;
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      font-family: sans-serif;
      font-size: 12px;
      z-index: 10;
    ">
      <div style="font-weight: bold; margin-bottom: 5px;">Resilience Score</div>
      <div style="display: flex; align-items: center; margin: 2px 0;">
        <div style="width: 20px; height: 10px; background: #1a9850; margin-right: 5px;"></div>
        <span>High (80–100)</span>
      </div>
      <div style="display: flex; align-items: center; margin: 2px 0;">
        <div style="width: 20px; height: 10px; background: #91bfdb; margin-right: 5px;"></div>
        <span>Good (60–80)</span>
      </div>
      <div style="display: flex; align-items: center; margin: 2px 0;">
        <div style="width: 20px; height: 10px; background: #fee08b; margin-right: 5px;"></div>
        <span>Fair (40–60)</span>
      </div>
      <div style="display: flex; align-items: center; margin: 2px 0;">
        <div style="width: 20px; height: 10px; background: #fc8d59; margin-right: 5px;"></div>
        <span>Low (20–40)</span>
      </div>
      <div style="display: flex; align-items: center; margin: 2px 0;">
        <div style="width: 20px; height: 10px; background: #d73027; margin-right: 5px;"></div>
        <span>Very Low (0–20)</span>
      </div>
    </div>
  `;
  map.getContainer().appendChild(legend);
};

/**
 * Makes the legend visible after the first successful search.
 */
export const showLegend = () => {
  const legend = document.getElementById('map-legend');
  if (legend) {
    legend.style.display = 'block';
  }
};
