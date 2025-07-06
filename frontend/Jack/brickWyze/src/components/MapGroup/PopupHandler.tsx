// components/MapGroup/PopupHandler.tsx

import mapboxgl from 'mapbox-gl';

export const renderPopup = (
  e: mapboxgl.MapLayerMouseEvent,
  weights?: any[],
  selectedEthnicities?: string[]
) => {
  if (!e.features?.length) return;
  const feature = e.features[0];
  const props = feature.properties || {};

  if (!props.hasScore) {
    const simpleContent = `
      <div style="font-family: sans-serif; max-width: 200px;">
        <h3 style="margin: 0 0 8px; font-size: 16px;">📍 ${props.NTAName || props.GEOID || 'Census Tract'}</h3>
        <p style="font-size: 14px; color: #666;">Click "Search" to see resilience scores</p>
      </div>
    `;
    new mapboxgl.Popup({ closeButton: true })
      .setLngLat(e.lngLat)
      .setHTML(simpleContent)
      .addTo(e.target);
    return;
  }

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
          ${
            props.demographic_match_pct !== null && props.demographic_match_pct !== undefined
              ? `<div style="margin: 4px 0; font-size: 11px; color: #666;">
                  (${props.demographic_match_pct.toFixed(1)}% match)
                </div>`
              : ''
          }
          ${
            props.avg_rent
              ? `<div style="margin: 4px 0;"><strong>Avg Rent:</strong> $${props.avg_rent}</div>`
              : ''
          }
        </div>
        ${
          weights && weights.length > 0
            ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
                <strong style="font-size: 12px;">Weights Applied:</strong>
                <div style="font-size: 11px; margin-top: 4px;">
                  ${weights
                    .map((w) => `<div style="margin: 2px 0;">${w.label}: ${w.value}%</div>`)
                    .join('')}
                </div>
              </div>`
            : ''
        }
        ${
          selectedEthnicities && selectedEthnicities.length > 0
            ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
                <strong style="font-size: 12px;">Selected Demographics:</strong>
                <div style="font-size: 11px; margin-top: 4px; max-height: 60px; overflow-y: auto;">
                  ${selectedEthnicities.join(', ')}
                </div>
              </div>`
            : ''
        }
      </div>
    </div>
  `;

  new mapboxgl.Popup({ closeButton: true })
    .setLngLat(e.lngLat)
    .setHTML(content)
    .addTo(e.target);
};
