// components/AiDrawerGroup/BrickyAiGroup/gemini.ts

export async function callGemini(prompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000', // Change to your production URL later
      'X-Title': 'BrickWyze Bricky AI'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash', // Use any Gemini model from OpenRouter
      messages: [
        {
          role: 'system',
          content: 'You are Bricky, a helpful AI assistant for NYC entrepreneurs exploring neighborhood resilience. Keep responses brief and helpful.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!res.ok) {
    console.error('❌ Gemini API error:', res.status, await res.text());
    return 'Bricky had trouble answering. Please try again.';
  }

  const data = await res.json();

  return data.choices?.[0]?.message?.content || 'Bricky could not think of a good answer.';
}
