// src/components/DrawerGroup/BrickyAiGroup/geminiStore.ts

import { create } from 'zustand';

// Define the shape of the filter state we'll be passing
interface FilterState {
  // Add other filter properties if they exist
  selectedEthnicities?: string[];
  weights?: { id: string, value: number }[];
  ageRange?: [number, number];
  rentRange?: [number, number];
  incomeRange?: [number, number];
  selectedGenders?: string[];
}

interface GeminiState {
  lastMessage: string;
  // Update the function signature to accept the optional currentState
  sendToGemini: (message: string, currentState?: FilterState) => Promise<string>;
}

export const useGeminiStore = create<GeminiState>((set) => ({
  lastMessage: '',
  // --- 🎯 THE FIX IS HERE ---
  // The function now accepts 'currentState' and includes it in the request body.
  sendToGemini: async (message: string, currentState: FilterState = {}) => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, currentState }), // Pass both message and state
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to fetch from Gemini API");
    }

    const data = await res.json();
    set({ lastMessage: data.reply });
    return data.reply;
  },
}));