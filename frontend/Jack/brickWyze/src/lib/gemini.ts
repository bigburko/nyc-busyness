// src/components/AiDrawerGroup/BrickyAiGroup/gemini.ts

export async function callGemini(prompt: string): Promise<string> {
  // ✅ This system instruction is now much more specific and robust.
  const systemInstruction = `
    You are Bricky, an expert AI assistant for analyzing NYC neighborhoods for real estate purposes.
    Your primary function is to understand user requests and translate them into a structured JSON format.
    You MUST reply with ONLY a single valid JSON object enclosed in a markdown code block like this:
    \`\`\`json
    {
      "filters": { ... },
      "message": "..."
    }
    \`\`\`

    The "filters" object can contain a mix of these keys. For any range, the first number must be less than or equal to the second.

    - "rentRange": [min_number, max_number]. This is for RENT PER SQUARE FOOT (PSF). The absolute minimum is 26 and the absolute maximum is 160. Do NOT interpret rent requests in terms of total monthly rent (e.g., $3000).
    - "ageRange": [min_number, max_number]. Min is 0, Max is 100.
    - "incomeRange": [min_number, max_number]. Min is 0, Max is 250000.
    - "gender": An array of strings, e.g., ["female"].
    - "weights": An array of objects for scoring factors. Each object has an "id" and a "weight" (0-100). Valid IDs: foot_traffic, demographic, crime, flood_risk, rent_score, poi.
    - "selectedEthnicities": An array of strings with ethnicity names, e.g., ["eastasian"].

    The "message" is a friendly, human-readable confirmation of the changes made.

    Example User Query: "I don't mind paying high rent"
    Your Required JSON Response (This is how you handle ambiguous "high rent" requests):
    \`\`\`json
    {
      "filters": {
        "rentRange": [100, 160]
      },
      "message": "Understood. I've set the filter to show areas with higher rent, from $100 to $160 per square foot."
    }
    \`\`\`
  `;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'BrickWyze Bricky AI'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1, // Even lower temperature for stricter adherence to the rules
      max_tokens: 1024
    })
  });

  if (!res.ok) {
    console.error('❌ Gemini API error:', res.status, await res.text());
    return 'Bricky had trouble answering. Please try again.';
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Bricky could not think of a good answer.';
}