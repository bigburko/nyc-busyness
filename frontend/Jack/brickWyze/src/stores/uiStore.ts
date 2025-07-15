import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

export type ViewState = 'initial' | 'typing' | 'results';

interface SearchResults {
  zones: Array<{
    geoid: string;
    tract_name: string;
    display_name: string;
    nta_name: string;
    custom_score: number;
    [key: string]: unknown;
  }>;
  total_zones_found?: number;
  top_zones_returned?: number;
  [key: string]: unknown;
}

interface UiState {
  viewState: ViewState;
  searchQuery: string;
  resultsData: SearchResults | null;

  focusSearch: () => void;
  performSearch: (query: string) => void;
  clearSearch: () => void;
  closeResultsPanel: () => void;
}

// ✅ Shared store (vanilla Zustand)
export const uiStore = createStore<UiState>((set) => ({
  viewState: 'initial',
  searchQuery: '',
  resultsData: null,

  focusSearch: () => set({ viewState: 'typing' }),

  performSearch: (query) =>
    set({
      viewState: 'results',
      searchQuery: query,
    }),

  clearSearch: () =>
    set({
      viewState: 'initial',
      searchQuery: '',
      resultsData: null,
    }),

  closeResultsPanel: () =>
    set({
      viewState: 'initial',
      resultsData: null,
    }),
}));

// ✅ Hook for React components — works with selector functions
export const useUiStore = <T>(selector: (state: UiState) => T) =>
  useStore(uiStore, selector);