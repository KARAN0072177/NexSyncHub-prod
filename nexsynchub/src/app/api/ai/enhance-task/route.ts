import { handleApiError } from '@/lib/api-error';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const systemPrompt = `
You are an expert project manager's assistant. Your task is to refine a raw task description into a clear, concise, and actionable format.

Follow these rules for the output:
1.  **Summary:** Start with a single, impactful sentence that summarizes the core goal of the task.
2.  **Key Objectives/Steps:** Use a markdown bulleted list (using '-') for the main objectives or action items.
3.  **Concise:** Keep the entire output brief and to the point. Avoid jargon and unnecessary words.
4.  **Format:** Use only markdown for formatting. Do not use headings.

Example Input:
"we need to fix the login page, it's not working on mobile and also the password reset is broken. users are complaining. also maybe update the button colors to match the new branding."

Example Output:
Resolve critical login issues and update UI to align with new branding.
- Fix login functionality on mobile devices.
- Repair the broken password reset flow.
- Update button colors to match the new brand guidelines.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Refine this task description: "${text}"` },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    const enhancedText = completion.choices[0].message.content?.trim();

    return NextResponse.json({ text: enhancedText });

  } catch (error) {
    console.error('AI ENHANCE API ERROR:', error);

    return handleApiError(
      error
    );
    return NextResponse.json({ error: 'Failed to enhance description with AI.' }, { status: 500 });
  }
}