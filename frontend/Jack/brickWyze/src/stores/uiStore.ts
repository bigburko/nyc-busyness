// src/stores/uiStore.ts
import { create } from 'zustand';

// This defines the three possible states of our UI
type ViewState = 'initial' | 'typing' | 'results';

interface UiState {
  viewState: ViewState;
  searchQuery: string;
  focusSearch: () => void;
  performSearch: (query: string) => void;
  clearSearch: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  viewState: 'initial',
  searchQuery: '',

  // When user clicks the search bar: initial -> typing
  focusSearch: () => set({ viewState: 'typing' }),

  // When Bricky AI searches: typing -> results
  performSearch: (query) => set({ viewState: 'results', searchQuery: query }),

  // When user clicks the 'X' button: results -> initial
  clearSearch: () => set({ viewState: 'initial', searchQuery: '' }),
}));