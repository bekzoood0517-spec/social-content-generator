import { Tone } from '../types.js';

export const BANNED_PHRASES = [
  "in today's fast-paced world",
  "in today's digital landscape",
  "unlock",
  "game-changer",
  "dive into",
  "let's dive in",
  "embark on",
  "seamlessly",
  "revolutionize",
  "supercharge",
  "harness the power of",
  "look no further",
  "without further ado",
  "testament to",
  "beacon of",
  "delve into",
  "tapestry",
  "crucial role",
  "at the forefront"
];

export const TONE_INSTRUCTIONS: Record<Tone, string> = {
  neutral: "Clear, factual, balanced, calm, and objective. State points plainly without exaggerated excitement.",
  friendly: "Warm, relatable, conversational, and encouraging, like talking to an intelligent colleague or neighbor.",
  expert: "Authoritative, insightful, precise, analytical, demonstrating genuine domain depth and practical wisdom.",
  bold: "Decisive, direct, high-conviction, punchy, and confident without becoming obnoxious or hyperbolic."
};

export const COMMON_QUALITY_RULES = `
Quality & Style Rules:
- Primary Language: You must generate output strictly in the requested language (default English).
- Grounding: Only use facts, features, and context present in the user brief. DO NOT invent prices, statistics, testimonials, or false guarantees.
- Banned AI Clichés: Strictly avoid all stock AI clichés and buzzwords, including: ${BANNED_PHRASES.map(p => `"${p}"`).join(', ')}.
- No Markdown Headers: Do NOT use markdown headers (#, ##, ###) inside post title or text. Use natural paragraphs and typographic spacing instead.
- Punctuation & Formatting: Clean typography. No excessive exclamation marks or cheesy rhetorical questions.
- Output strictly in valid JSON matching the exact schema requested.
`;

export function getLanguageInstruction(language: string): string {
  const lang = language.trim().toLowerCase();
  if (lang === 'en' || lang === 'english') {
    return 'Write strictly in crisp, natural, modern English.';
  }
  return `Write strictly in natural, fluent ${language}. Do not mix languages.`;
}
