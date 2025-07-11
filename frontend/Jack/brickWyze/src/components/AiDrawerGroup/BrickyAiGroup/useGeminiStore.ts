// src/components/AiDrawerGroup/geminiStore.ts
import { create } from 'zustand';

interface GeminiStore {
  lastMessage: string;
  sendToGemini: (message: string) => void;
}

export const useGeminiStore = create<GeminiStore>((set) => ({
  lastMessage: '',
  sendToGemini: async (message: string) => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    set({ lastMessage: data.reply });
  },
}));
