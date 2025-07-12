import { create } from 'zustand';

interface GeminiStore {
  lastMessage: string;
  sendToGemini: (message: string) => Promise<string>;
}

export const useGeminiStore = create<GeminiStore>((set) => ({
  lastMessage: '',
  sendToGemini: async (message: string) => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      console.log('[📥 Gemini API Response]', data); // 🔍 Debug log

      const reply = data.reply ?? 'No reply received.';
      set({ lastMessage: reply });
      return reply;
    } catch (err) {
      console.error('[❌ Gemini Fetch Error]', err);
      return 'Sorry, something went wrong while fetching from Bricky.';
    }
  },
}));
