import { describe, it, expect } from 'vitest';
import { validateGenerateRequest, sanitizeText, sanitizePost } from '../lib/validate.js';
import { IncrementalPostParser } from '../lib/partialJson.js';
import { buildTelegramPrompt } from '../prompts/telegram.js';
import { buildInstagramPrompt } from '../prompts/instagram.js';
import { buildYoutubePrompt } from '../prompts/youtube.js';
import { BANNED_PHRASES } from '../prompts/common.js';

describe('Validation', () => {
  it('rejects short input (< 5 chars)', () => {
    const res = validateGenerateRequest({
      input: 'hi',
      network: 'telegram',
      tone: 'friendly',
      variants: 2,
    });
    expect(res.valid).toBe(false);
  });

  it('rejects invalid network', () => {
    const res = validateGenerateRequest({
      input: 'Valid topic description here',
      network: 'tiktok' as any,
      tone: 'friendly',
      variants: 2,
    });
    expect(res.valid).toBe(false);
  });

  it('accepts valid request and sanitizes control characters', () => {
    const res = validateGenerateRequest({
      input: 'A small bakery in Tashkent\x00 launching sourdough',
      network: 'telegram',
      tone: 'bold',
      language: 'en',
      variants: 3,
    });
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data.input).toBe('A small bakery in Tashkent launching sourdough');
      expect(res.data.variants).toBe(3);
    }
  });

  it('sanitizes post hashtags and removes leading #', () => {
    const clean = sanitizePost({
      title: 'Test Title',
      text: 'Test Text',
      cta: 'Click here',
      hashtags: ['#sourdough', 'bakery', '#tashkent#'],
    });
    expect(clean.hashtags).toEqual(['sourdough', 'bakery', 'tashkent#']);
  });
});

describe('IncrementalPostParser', () => {
  it('extracts partial strings and emits deltas as JSON streams in', () => {
    const parser = new IncrementalPostParser();

    const d1 = parser.feed('{"title": "Fresh');
    expect(d1).toEqual([{ field: 'title', chunk: 'Fresh' }]);

    const d2 = parser.feed(' Sourdough", "text": "Baked');
    expect(d2).toEqual([
      { field: 'title', chunk: ' Sourdough' },
      { field: 'text', chunk: 'Baked' },
    ]);

    const d3 = parser.feed(' at dawn.", "cta": "Order now", "hashtags": ["bread", "fresh"]}');
    expect(d3).toEqual([
      { field: 'text', chunk: ' at dawn.' },
      { field: 'cta', chunk: 'Order now' },
      { field: 'hashtags', chunk: 'bread' },
      { field: 'hashtags', chunk: 'fresh' },
    ]);

    const finalPost = parser.getFinalPost();
    expect(finalPost).toEqual({
      title: 'Fresh Sourdough',
      text: 'Baked at dawn.',
      cta: 'Order now',
      hashtags: ['bread', 'fresh'],
    });
  });
});

describe('Prompt Builders', () => {
  it('builds Telegram prompt with Telegram-specific rules', () => {
    const { systemPrompt, userPrompt } = buildTelegramPrompt(
      'Bakery launching sourdough',
      'expert',
      'en',
      'Behind the craft'
    );
    expect(systemPrompt).toContain('Telegram');
    expect(systemPrompt).toContain('80 characters');
    expect(userPrompt).toContain('Bakery launching sourdough');
    expect(userPrompt).toContain('Behind the craft');
  });

  it('builds Instagram prompt with Instagram-specific rules', () => {
    const { systemPrompt } = buildInstagramPrompt('Bakery launch', 'friendly', 'en');
    expect(systemPrompt).toContain('Instagram');
    expect(systemPrompt).toContain('8 to 15 targeted');
  });

  it('builds YouTube prompt with timestamps requirement', () => {
    const { systemPrompt } = buildYoutubePrompt('Bakery launch', 'bold', 'en');
    expect(systemPrompt).toContain('YouTube');
    expect(systemPrompt).toContain('timestamps');
  });

  it('includes banned phrases list in instructions', () => {
    expect(BANNED_PHRASES).toContain('in today\'s fast-paced world');
    expect(BANNED_PHRASES).toContain('game-changer');
  });
});
