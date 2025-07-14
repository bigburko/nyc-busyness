// src/types/global.d.ts (create this file if it doesn't exist)
export {};

declare global {
  interface Window {
    _brickwyzeMapRef?: mapboxgl.Map;
  }
}
