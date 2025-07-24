// components/MapGroup/Legend.tsx

import mapboxgl from 'mapbox-gl';

/**
 * Creates the modern legend DOM element and appends it to the map container.
 */
export const createLegend = (map: mapboxgl.Map) => {
  const existing = document.getElementById('map-legend');
  if (existing) return;

  const legend = document.createElement('div');
  legend.id = 'map-legend';
  legend.style.display = 'none';
  
  // Add modern styles
  const styles = `
    <style>
      #map-legend {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .legend-container {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 16px;
        min-width: 160px;
        z-index: 1000;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .legend-title {
        font-weight: 600;
        font-size: 14px;
        color: #1f2937;
        margin-bottom: 12px;
        letter-spacing: -0.025em;
      }
      .legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        transition: all 0.2s ease;
      }
      .legend-item:last-child {
        margin-bottom: 0;
      }
      .legend-item:hover {
        transform: translateX(2px);
      }
      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        margin-right: 10px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
      }
      .legend-label {
        font-size: 13px;
        color: #374151;
        font-weight: 500;
      }
      .legend-range {
        font-size: 12px;
        color: #6b7280;
        margin-left: 4px;
        font-weight: 400;
      }
      
      /* Smooth fade-in animation */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .legend-container.animate {
        animation: fadeIn 0.3s ease-out;
      }
    </style>
  `;
  
  legend.innerHTML = `
    ${styles}
    <div class="legend-container">
      <div class="legend-title">Resilience Score</div>
      
      <div class="legend-item">
        <div class="legend-color" style="background: #22c55e;"></div>
        <div>
          <span class="legend-label">High</span>
          <span class="legend-range">(80–100)</span>
        </div>
      </div>
      
      <div class="legend-item">
        <div class="legend-color" style="background: #7dd3fc;"></div>
        <div>
          <span class="legend-label">Good</span>
          <span class="legend-range">(60–80)</span>
        </div>
      </div>
      
      <div class="legend-item">
        <div class="legend-color" style="background: #fbbf24;"></div>
        <div>
          <span class="legend-label">Fair</span>
          <span class="legend-range">(40–60)</span>
        </div>
      </div>
      
      <div class="legend-item">
        <div class="legend-color" style="background: #fb923c;"></div>
        <div>
          <span class="legend-label">Low</span>
          <span class="legend-range">(20–40)</span>
        </div>
      </div>
      
      <div class="legend-item">
        <div class="legend-color" style="background: #ef4444;"></div>
        <div>
          <span class="legend-label">Very Low</span>
          <span class="legend-range">(0–20)</span>
        </div>
      </div>
    </div>
  `;
  
  map.getContainer().appendChild(legend);
};

/**
 * Makes the legend visible with modern animation after the first successful search.
 */
export const showLegend = () => {
  const legend = document.getElementById('map-legend');
  if (legend) {
    legend.style.display = 'block';
    
    // Add animation class for smooth fade-in
    const container = legend.querySelector('.legend-container');
    if (container) {
      container.classList.add('animate');
    }
  }
};

/**
 * Hides the legend (useful for resetting or clearing map)
 */
export const hideLegend = () => {
  const legend = document.getElementById('map-legend');
  if (legend) {
    legend.style.display = 'none';
  }
};