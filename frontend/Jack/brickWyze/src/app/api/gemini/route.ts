import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, systemPrompt } = await req.json();

  console.log('✅ Gemini API route hit with message:', message);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Gemini error response:', errText);
      return NextResponse.json({ reply: null, error: errText }, { status: 500 });
    }

    const data = await response.json();
    console.log('🧠 Gemini raw data:', data);

    const reply = data.choices?.[0]?.message?.content || null;
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('❌ Gemini fetch failed:', error);
    return NextResponse.json({ reply: null, error: 'Gemini fetch failed' }, { status: 500 });
  }
}
