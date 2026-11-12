import { create } from 'zustand';
import { Network } from '../../types';
import { fetchAngles } from '../../lib/api';

interface SuggestState {
  angles: string[];
  isLoading: boolean;
  lastFetchedInput: string;
  fetchSuggestions: (input: string, network: Network, language: string) => Promise<void>;
  clearSuggestions: () => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let currentAbort: AbortController | null = null;

export const useSuggestStore = create<SuggestState>((set, get) => ({
  angles: [],
  isLoading: false,
  lastFetchedInput: '',

  fetchSuggestions: async (input: string, network: Network, language: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const trimmed = input.trim();
    if (trimmed.length < 20) {
      set({ angles: [], isLoading: false, lastFetchedInput: '' });
      return;
    }

    if (trimmed === get().lastFetchedInput) {
      return;
    }

    debounceTimer = setTimeout(async () => {
      if (currentAbort) {
        currentAbort.abort();
      }
      currentAbort = new AbortController();

      set({ isLoading: true });
      try {
        const angles = await fetchAngles(trimmed, network, language, currentAbort.signal);
        set({ angles, isLoading: false, lastFetchedInput: trimmed });
      } catch {
        set({ isLoading: false });
      }
    }, 800); // 800ms debounce
  },

  clearSuggestions: () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (currentAbort) currentAbort.abort();
    set({ angles: [], isLoading: false, lastFetchedInput: '' });
  },
}));
