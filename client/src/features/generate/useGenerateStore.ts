import { create } from 'zustand';
import { Network, Tone, Variant, Post, GenerateRequest, HistoryEntry } from '../../types';
import { startGenerateStream } from '../../lib/sse';
import { getOrCreateDeviceId } from '../../lib/deviceId';
import { saveHistory } from '../../lib/db';

interface GenerateState {
  // Input fields
  input: string;
  network: Network;
  tone: Tone;
  language: string;
  variantsCount: 1 | 2 | 3 | 4;
  selectedAngles: string[];

  // Generation status
  status: 'idle' | 'generating' | 'done' | 'error';
  globalError: string | null;
  variants: Variant[];
  abortController: AbortController | null;

  // Actions
  setInput: (input: string) => void;
  setNetwork: (network: Network) => void;
  setTone: (tone: Tone) => void;
  setLanguage: (lang: string) => void;
  setVariantsCount: (count: 1 | 2 | 3 | 4) => void;
  toggleAngle: (angle: string) => void;
  clearSelectedAngles: () => void;

  startGeneration: () => Promise<void>;
  regenerateSingleVariant: (variantIndex: number) => Promise<void>;
  stopGeneration: () => void;
  updateVariantPost: (variantIndex: number, updated: Partial<Post>) => void;
  toggleExcludeHashtag: (variantIndex: number, tag: string) => void;
  loadFromHistory: (entry: HistoryEntry) => void;
}

export const useGenerateStore = create<GenerateState>((set, get) => ({
  input: '',
  network: 'telegram',
  tone: 'friendly',
  language: 'en',
  variantsCount: 3,
  selectedAngles: [],

  status: 'idle',
  globalError: null,
  variants: [],
  abortController: null,

  setInput: (input) => set({ input }),
  setNetwork: (network) => set({ network, selectedAngles: [] }),
  setTone: (tone) => set({ tone }),
  setLanguage: (language) => set({ language }),
  setVariantsCount: (variantsCount) => set({ variantsCount }),

  toggleAngle: (angle) => {
    const current = get().selectedAngles;
    if (current.includes(angle)) {
      set({ selectedAngles: current.filter(a => a !== angle) });
    } else {
      set({ selectedAngles: [...current, angle] });
    }
  },

  clearSelectedAngles: () => set({ selectedAngles: [] }),

  startGeneration: async () => {
    const { input, network, tone, language, variantsCount, selectedAngles, abortController: existingAbort } = get();

    if (input.trim().length < 5) {
      set({ globalError: 'Topic description must be at least 5 characters.' });
      return;
    }

    if (existingAbort) {
      existingAbort.abort();
    }

    const abortController = new AbortController();

    // Prepare initial variants
    const initialVariants: Variant[] = Array.from({ length: variantsCount }, (_, i) => ({
      id: `var-${Date.now()}-${i}`,
      index: i,
      angle: selectedAngles[i] || undefined,
      status: 'pending',
      post: { title: '', text: '', cta: '', hashtags: [] },
      excludedHashtags: [],
    }));

    set({
      status: 'generating',
      globalError: null,
      variants: initialVariants,
      abortController,
    });

    const requestData: GenerateRequest = {
      input: input.trim(),
      network,
      tone,
      language,
      variants: variantsCount,
      angles: selectedAngles.length > 0 ? selectedAngles : undefined,
    };

    await startGenerateStream(
      requestData,
      {
        onVariantStart: ({ index, angle }) => {
          set(state => {
            const next = [...state.variants];
            if (next[index]) {
              next[index] = {
                ...next[index],
                status: 'streaming',
                angle: angle || next[index].angle,
              };
            }
            return { variants: next };
          });
        },
        onDelta: ({ index, field, chunk }) => {
          set(state => {
            const next = [...state.variants];
            const v = next[index];
            if (!v) return state;

            const post = { ...v.post };
            if (field === 'hashtags') {
              // chunk is a single hashtag or tag name
              const cleanTag = chunk.replace(/^#+/, '').trim();
              if (cleanTag && !post.hashtags.includes(cleanTag)) {
                post.hashtags = [...post.hashtags, cleanTag];
              }
            } else {
              post[field] = (post[field] || '') + chunk;
            }

            next[index] = {
              ...v,
              status: 'streaming',
              post,
            };
            return { variants: next };
          });
        },
        onVariantDone: ({ index, post }) => {
          set(state => {
            const next = [...state.variants];
            if (next[index]) {
              next[index] = {
                ...next[index],
                status: 'done',
                post,
              };
            }
            return { variants: next };
          });
        },
        onVariantError: ({ index, code: _, message }) => {
          set(state => {
            const next = [...state.variants];
            if (next[index]) {
              next[index] = {
                ...next[index],
                status: 'error',
                error: message,
              };
            }
            return { variants: next };
          });
        },
        onDone: () => {
          const current = get();
          set({ status: 'done', abortController: null });

          // Save completed variants to IndexedDB history
          const doneVariants = current.variants.filter(v => v.status === 'done' || v.post.title || v.post.text);
          if (doneVariants.length > 0) {
            const entry: HistoryEntry = {
              id: 'hist_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              network: current.network,
              input: current.input.trim(),
              tone: current.tone,
              language: current.language,
              variants: doneVariants.map(v => v.post),
              selectedIndex: 0,
              deviceId: getOrCreateDeviceId(),
              schemaVersion: 1,
            };
            saveHistory(entry).catch(err => console.warn('Could not auto-save history entry:', err));
          }
        },
        onError: (err) => {
          set({
            status: 'error',
            globalError: err.message || "That didn't go through. Try again, or shorten the brief.",
            abortController: null,
          });
        },
      },
      abortController.signal
    );
  },

  regenerateSingleVariant: async (variantIndex: number) => {
    const { input, network, tone, language, variants } = get();
    if (!variants[variantIndex]) return;

    const abortController = new AbortController();

    set(state => {
      const next = [...state.variants];
      next[variantIndex] = {
        ...next[variantIndex],
        status: 'streaming',
        error: undefined,
        post: { title: '', text: '', cta: '', hashtags: [] },
      };
      return { variants: next };
    });

    const requestData: GenerateRequest = {
      input: input.trim(),
      network,
      tone,
      language,
      variants: 1,
      angles: variants[variantIndex].angle ? [variants[variantIndex].angle!] : undefined,
    };

    await startGenerateStream(
      requestData,
      {
        onDelta: ({ field, chunk }) => {
          set(state => {
            const next = [...state.variants];
            const v = next[variantIndex];
            if (!v) return state;

            const post = { ...v.post };
            if (field === 'hashtags') {
              const cleanTag = chunk.replace(/^#+/, '').trim();
              if (cleanTag && !post.hashtags.includes(cleanTag)) {
                post.hashtags = [...post.hashtags, cleanTag];
              }
            } else {
              post[field] = (post[field] || '') + chunk;
            }

            next[variantIndex] = {
              ...v,
              status: 'streaming',
              post,
            };
            return { variants: next };
          });
        },
        onVariantDone: ({ post }) => {
          set(state => {
            const next = [...state.variants];
            next[variantIndex] = {
              ...next[variantIndex],
              status: 'done',
              post,
            };
            return { variants: next };
          });
        },
        onVariantError: ({ message }) => {
          set(state => {
            const next = [...state.variants];
            next[variantIndex] = {
              ...next[variantIndex],
              status: 'error',
              error: message,
            };
            return { variants: next };
          });
        },
        onDone: () => {
          set(state => {
            const next = [...state.variants];
            if (next[variantIndex].status === 'streaming') {
              next[variantIndex].status = 'done';
            }
            return { variants: next };
          });
        },
      },
      abortController.signal
    );
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ status: 'done', abortController: null });
    }
  },

  updateVariantPost: (variantIndex, updated) => {
    set(state => {
      const next = [...state.variants];
      if (next[variantIndex]) {
        next[variantIndex] = {
          ...next[variantIndex],
          post: { ...next[variantIndex].post, ...updated },
        };
      }
      return { variants: next };
    });
  },

  toggleExcludeHashtag: (variantIndex, tag) => {
    set(state => {
      const next = [...state.variants];
      const v = next[variantIndex];
      if (!v) return state;

      const currentExcluded = v.excludedHashtags || [];
      const isExcluded = currentExcluded.includes(tag);
      const newExcluded = isExcluded
        ? currentExcluded.filter(t => t !== tag)
        : [...currentExcluded, tag];

      next[variantIndex] = {
        ...v,
        excludedHashtags: newExcluded,
      };
      return { variants: next };
    });
  },

  loadFromHistory: (entry) => {
    const loadedVariants: Variant[] = entry.variants.map((post, idx) => ({
      id: `hist-var-${entry.id}-${idx}`,
      index: idx,
      angle: undefined,
      status: 'done',
      post,
      excludedHashtags: [],
    }));

    set({
      input: entry.input,
      network: entry.network,
      tone: entry.tone,
      language: entry.language,
      variantsCount: entry.variants.length as 1 | 2 | 3 | 4,
      variants: loadedVariants,
      status: 'done',
      globalError: null,
    });
  },
}));
