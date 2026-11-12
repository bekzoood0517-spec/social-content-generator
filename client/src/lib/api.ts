import { Network } from '../types';

export async function fetchAngles(input: string, network: Network, language: string = 'en', signal?: AbortSignal): Promise<string[]> {
  try {
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, network, language }),
      signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.angles) ? data.angles : [];
  } catch {
    return [];
  }
}

export async function checkHealth(): Promise<{ status: string; geminiConfigured: boolean } | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
