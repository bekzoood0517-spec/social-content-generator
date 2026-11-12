import { describe, it, expect } from 'vitest';
import { Post, Network } from '../types.js';

function formatWholePost(post: Post, network: Network, excludedHashtags: string[] = []): string {
  const activeHashtags = post.hashtags.filter(tag => !excludedHashtags.includes(tag));
  const tagsFormatted = activeHashtags.map(t => `#${t.replace(/^#+/, '')}`).join(' ');

  const titlePart = post.title.trim();
  const textPart = post.text.trim();
  const ctaPart = post.cta.trim();

  const parts: string[] = [];

  if (titlePart) parts.push(titlePart);
  if (textPart) parts.push(textPart);
  if (ctaPart) parts.push(ctaPart);
  if (tagsFormatted) parts.push(tagsFormatted);

  return parts.join('\n\n');
}

describe('Clipboard Post Formatter', () => {
  const samplePost: Post = {
    title: 'Warm Sourdough Friday',
    text: 'Crisp crust, naturally fermented for 36 hours.',
    cta: 'Reserve your loaf today.',
    hashtags: ['bread', 'sourdough', 'tashkent'],
  };

  it('formats whole post according to SPEC rules with double newlines', () => {
    const formatted = formatWholePost(samplePost, 'telegram');
    expect(formatted).toBe(
      'Warm Sourdough Friday\n\nCrisp crust, naturally fermented for 36 hours.\n\nReserve your loaf today.\n\n#bread #sourdough #tashkent'
    );
  });

  it('filters out user-excluded hashtags before copying', () => {
    const formatted = formatWholePost(samplePost, 'instagram', ['tashkent']);
    expect(formatted).toBe(
      'Warm Sourdough Friday\n\nCrisp crust, naturally fermented for 36 hours.\n\nReserve your loaf today.\n\n#bread #sourdough'
    );
  });

  it('handles missing or empty fields cleanly', () => {
    const partialPost: Post = {
      title: 'Only Title',
      text: '',
      cta: 'Only CTA',
      hashtags: [],
    };
    const formatted = formatWholePost(partialPost, 'youtube');
    expect(formatted).toBe('Only Title\n\nOnly CTA');
  });
});
