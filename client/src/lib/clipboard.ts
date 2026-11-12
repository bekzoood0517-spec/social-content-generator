import { Post, Network } from '../types';

export function formatWholePost(post: Post, network: Network, excludedHashtags: string[] = []): string {
  const activeHashtags = post.hashtags.filter(tag => !excludedHashtags.includes(tag));
  const tagsFormatted = activeHashtags.map(t => `#${t.replace(/^#+/, '')}`).join(' ');

  const titlePart = post.title.trim();
  const textPart = post.text.trim();
  const ctaPart = post.cta.trim();

  const parts: string[] = [];

  if (network === 'youtube') {
    // YouTube: Title at top, description with timestamps, CTA, tags
    if (titlePart) parts.push(titlePart);
    if (textPart) parts.push(textPart);
    if (ctaPart) parts.push(ctaPart);
    if (tagsFormatted) parts.push(tagsFormatted);
  } else {
    // Telegram and Instagram: Headline/Hook, Body, CTA, Hashtags
    if (titlePart) parts.push(titlePart);
    if (textPart) parts.push(textPart);
    if (ctaPart) parts.push(ctaPart);
    if (tagsFormatted) parts.push(tagsFormatted);
  }

  return parts.join('\n\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Try modern navigator.clipboard
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // Fallback to execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}
