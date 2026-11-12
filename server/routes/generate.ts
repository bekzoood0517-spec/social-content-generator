import { Request, Response } from 'express';
import { validateGenerateRequest, sanitizePost } from '../lib/validate.js';
import { generateVariantStream } from '../lib/gemini.js';
import { Post } from '../types.js';

const DEFAULT_ANGLES = [
  'Behind the craft and origin story',
  'Direct customer benefit and practical solution',
  'Contrarian angle and common myth busting',
  'Provocative question and community dialogue',
];

export async function handleGenerate(req: Request, res: Response): Promise<void> {
  const validation = validateGenerateRequest(req.body);
  if (!validation.valid) {
    res.status(400).json({
      error: 'Invalid request',
      details: validation.errors,
    });
    return;
  }

  const { input, network, tone, language, variants, angles } = validation.data;

  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const sendEvent = (event: string, data: unknown) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) {
      abortController.abort();
    }
  });

  const variantPromises: Promise<void>[] = [];

  for (let i = 0; i < variants; i++) {
    const variantIndex = i;
    const angle = (angles && angles[i]) || DEFAULT_ANGLES[i % DEFAULT_ANGLES.length];

    const promise = (async () => {
      sendEvent('variant_start', { index: variantIndex, angle });

      try {
        const post: Post = await generateVariantStream(
          input,
          network,
          tone,
          language,
          angle,
          {
            signal: abortController.signal,
            onDelta: (field, chunk) => {
              sendEvent('delta', { index: variantIndex, field, chunk });
            },
          }
        );

        const cleanPost = sanitizePost(post);
        sendEvent('variant_done', { index: variantIndex, post: cleanPost });
      } catch (err: any) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error(`Error generating variant ${variantIndex}:`, err?.message || err);
        const code = err?.code || 502;
        const message =
          code === 451
            ? 'This brief tripped a safety filter. Try rewording it.'
            : code === 429
            ? 'Too many requests in a row. Please wait a moment.'
            : "That didn't go through. Try again, or shorten the brief.";

        sendEvent('variant_error', { index: variantIndex, code, message });
      }
    })();

    variantPromises.push(promise);
  }

  try {
    await Promise.allSettled(variantPromises);
  } finally {
    if (!res.writableEnded) {
      sendEvent('done', {});
      res.end();
    }
  }
}
