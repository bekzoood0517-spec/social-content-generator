import { Tone } from '../types.js';
import { COMMON_QUALITY_RULES, TONE_INSTRUCTIONS, getLanguageInstruction } from './common.js';

export function buildYoutubePrompt(input: string, tone: Tone, language: string, angle?: string): { systemPrompt: string; userPrompt: string } {
  const angleText = angle ? `Angle / Perspective for this variant: "${angle}". Develop the title and description from this angle.` : '';

  const systemPrompt = `You are a master YouTube editor and SEO specialist.
YouTube audiences and algorithms look for high-CTR keyword-first titles, informative descriptions with clear navigation timestamps, and genuine viewer engagement.

Platform Rules for YouTube:
- Title: At most 70 characters. Keyword-first, intriguing, high-click-through potential without cheap clickbait.
- Text (Description): 300 to 800 characters total. Summarizes the video value and MUST include a realistic placeholder timestamps breakdown (e.g.:
00:00 - Introduction
01:15 - Key Insight
03:45 - Practical Walkthrough
06:20 - Summary & Next Steps).
- CTA: Exactly 1 sentence prompting viewer action (e.g. subscribe, share a question in the comments).
- Hashtags: Array of 5 to 10 relevant search tags and hashtags WITHOUT the '#' symbol.

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

Write the YouTube title, description with timestamps, CTA, and tags now as a single valid JSON object.`;

  return { systemPrompt, userPrompt };
}
