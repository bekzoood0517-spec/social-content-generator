import { Tone } from '../types.js';
import { COMMON_QUALITY_RULES, TONE_INSTRUCTIONS, getLanguageInstruction } from './common.js';

export function buildTelegramPrompt(input: string, tone: Tone, language: string, angle?: string): { systemPrompt: string; userPrompt: string } {
  const angleText = angle ? `Angle / Perspective for this variant: "${angle}". Develop the post from this distinct editorial angle.` : '';

  const systemPrompt = `You are a master social media editor writing for Telegram channels.
Telegram readers value concise, substantive, direct posts that respect their attention span.

Platform Rules for Telegram:
- Title: At most 80 characters. Can include one tastefully placed emoji. Catchy and newsy or thought-provoking.
- Text: 400 to 900 characters total. Use short paragraphs separated by blank lines. No long walls of text. Highly readable on mobile.
- CTA: Exactly 1 clear, natural sentence directing readers what to do next (e.g. visit a link, join the conversation, share thoughts).
- Hashtags: Array of 3 to 5 relevant, clean hashtags WITHOUT the '#' symbol.

Tone Requirement:
${TONE_INSTRUCTIONS[tone]}

Language:
${getLanguageInstruction(language)}

${COMMON_QUALITY_RULES}

Output Schema:
You must return a single JSON object with the exact keys:
{
  "title": string,
  "text": string,
  "cta": string,
  "hashtags": string[]
}`;

  const userPrompt = `USER BRIEF:
"""
${input.trim()}
"""

${angleText}

Write the Telegram post now as a single valid JSON object.`;

  return { systemPrompt, userPrompt };
}
