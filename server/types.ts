export type Network = 'telegram' | 'instagram' | 'youtube';
export type Tone = 'neutral' | 'friendly' | 'expert' | 'bold';

export interface GenerateRequest {
  input: string;            // 5..1000 chars
  network: Network;
  tone: Tone;
  language: string;          // ISO code or name, default 'en'
  variants: 1 | 2 | 3 | 4;
  angles?: string[];         // optional, from /suggest
}

export interface Post {
  title: string;
  text: string;
  cta: string;
  hashtags: string[];        // without '#', UI adds it
}

export interface Variant {
  id: string;
  index: number;
  angle?: string;
  status: 'pending' | 'streaming' | 'done' | 'error';
  post: Post;                // partial while streaming
  error?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  network: Network;
  input: string;
  tone: Tone;
  language: string;
  variants: Post[];
  selectedIndex: number;     // variant shown in list
  updatedAt: number;
  deleted?: boolean;         // soft delete (tombstone) so deletions can sync
  deviceId: string;          // random id generated once per browser
  schemaVersion: 1;
}

export interface SuggestRequest {
  input: string;
  network: Network;
  language?: string;
}

export interface SuggestResponse {
  angles: string[];
}
