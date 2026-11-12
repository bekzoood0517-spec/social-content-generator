import { GenerateRequest, Post, Network, Tone } from '../types.js';

export interface ValidationError {
  field: string;
  message: string;
}

export function sanitizeText(str: string): string {
  // Strip dangerous control characters but preserve newlines, carriage returns, and tabs
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

export function validateGenerateRequest(body: unknown): { valid: true; data: GenerateRequest } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Request body must be a valid JSON object' }] };
  }

  const req = body as Partial<GenerateRequest>;

  // Input validation: 5..1000 characters
  if (typeof req.input !== 'string') {
    errors.push({ field: 'input', message: 'Input must be a string' });
  } else {
    const cleaned = sanitizeText(req.input.trim());
    if (cleaned.length < 5) {
      errors.push({ field: 'input', message: 'Topic description must be at least 5 characters' });
    } else if (cleaned.length > 1000) {
      errors.push({ field: 'input', message: 'Topic description cannot exceed 1,000 characters' });
    }
  }

  // Network validation
  const validNetworks: Network[] = ['telegram', 'instagram', 'youtube'];
  if (!req.network || !validNetworks.includes(req.network)) {
    errors.push({ field: 'network', message: 'Network must be one of: telegram, instagram, youtube' });
  }

  // Tone validation
  const validTones: Tone[] = ['neutral', 'friendly', 'expert', 'bold'];
  if (!req.tone || !validTones.includes(req.tone)) {
    errors.push({ field: 'tone', message: 'Tone must be one of: neutral, friendly, expert, bold' });
  }

  // Variants validation: 1..4
  const variants = Number(req.variants);
  if (![1, 2, 3, 4].includes(variants)) {
    errors.push({ field: 'variants', message: 'Variants must be a number between 1 and 4' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const cleanData: GenerateRequest = {
    input: sanitizeText((req.input as string).trim()),
    network: req.network as Network,
    tone: req.tone as Tone,
    language: typeof req.language === 'string' && req.language.trim() ? req.language.trim() : 'en',
    variants: variants as 1 | 2 | 3 | 4,
    angles: Array.isArray(req.angles) ? req.angles.filter(a => typeof a === 'string').map(a => sanitizeText(a.trim())) : undefined,
  };

  return { valid: true, data: cleanData };
}

export function validatePostSchema(parsed: unknown): parsed is Post {
  if (!parsed || typeof parsed !== 'object') return false;
  const p = parsed as Partial<Post>;

  if (typeof p.title !== 'string') return false;
  if (typeof p.text !== 'string') return false;
  if (typeof p.cta !== 'string') return false;
  if (!Array.isArray(p.hashtags)) return false;

  return p.hashtags.every(tag => typeof tag === 'string');
}

export function sanitizePost(post: Post): Post {
  return {
    title: sanitizeText(post.title).trim(),
    text: sanitizeText(post.text).trim(),
    cta: sanitizeText(post.cta).trim(),
    hashtags: post.hashtags
      .map(tag => sanitizeText(tag).replace(/^#+/, '').trim())
      .filter(tag => tag.length > 0 && tag.length <= 30)
      .slice(0, 30),
  };
}
