import { Tone } from '../types.js';
import { COMMON_QUALITY_RULES, TONE_INSTRUCTIONS, getLanguageInstruction } from './common.js';

export function buildInstagramPrompt(input: string, tone: Tone, language: string, angle?: string): { systemPrompt: string; userPrompt: string } {
  const angleText = angle ? `Angle / Perspective for this variant: "${angle}". Develop the post from this distinct editorial angle.` : '';

  const systemPrompt = `You are a master social media editor writing for Instagram captions.
Instagram audiences scan fast, stop on striking hooks, and appreciate rhythmic, well-spaced copy that rewards reading.

Platform Rules for Instagram:
- Title (Hook): At most 100 characters. Must stop the scroll in the first line before the "more" fold.
- Text: 300 to 1,200 characters total. Use deliberate line breaks and spacing between beats. At most 3 emojis in the entire body.
- CTA: Exactly 1 compelling sentence (e.g., save for later, leave your take in comments, check link in bio).
- Hashtags: Array of 8 to 15 targeted, topic-specific hashtags WITHOUT the '#' symbol.

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

Write the Instagram caption now as a single valid JSON object.`;

  return { systemPrompt, userPrompt };
}
