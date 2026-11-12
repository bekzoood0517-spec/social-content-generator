import { GenerateRequest, Post } from '../types';

export interface SSECallbacks {
  onVariantStart?: (data: { index: number; angle?: string }) => void;
  onDelta?: (data: { index: number; field: 'title' | 'text' | 'cta' | 'hashtags'; chunk: string }) => void;
  onVariantDone?: (data: { index: number; post: Post }) => void;
  onVariantError?: (data: { index: number; code: number; message: string }) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export async function startGenerateStream(
  requestData: GenerateRequest,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Too many requests. Please wait a moment.');
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.details?.[0]?.message || errorData.error || 'Invalid request';
        throw new Error(msg);
      }
      throw new Error(`Generation failed with HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No readable stream available in response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split SSE packets by double newline
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = 'message';
        let dataStr = '';

        const lines = part.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim();
          }
        }

        if (!dataStr) continue;

        try {
          const parsedData = JSON.parse(dataStr);

          if (eventType === 'variant_start') {
            callbacks.onVariantStart?.(parsedData);
          } else if (eventType === 'delta') {
            callbacks.onDelta?.(parsedData);
          } else if (eventType === 'variant_done') {
            callbacks.onVariantDone?.(parsedData);
          } else if (eventType === 'variant_error') {
            callbacks.onVariantError?.(parsedData);
          } else if (eventType === 'done') {
            callbacks.onDone?.();
          }
        } catch (parseErr) {
          console.warn('Failed to parse SSE event data JSON:', dataStr, parseErr);
        }
      }
    }

    callbacks.onDone?.();
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      // Aborted gracefully by user
      return;
    }
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}
