// src/lib/emotionCache.ts
import createCache from '@emotion/cache';

export const emotionCache = createCache({
  key: 'css',
  prepend: true,
});
