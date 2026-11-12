import { create } from 'zustand';
import { HistoryEntry } from '../../types';
import { getAllHistory, deleteHistory as dbDelete, clearAllHistory as dbClear } from '../../lib/db';

interface HistoryState {
  entries: HistoryEntry[];
  isOpen: boolean;
  searchQuery: string;
  expandedId: string | null;
  copiedId: string | null;
  isLoading: boolean;

  openLedger: () => void;
  closeLedger: () => void;
  toggleLedger: () => void;
  setSearchQuery: (query: string) => void;
  toggleExpand: (id: string) => void;
  setCopiedId: (id: string | null) => void;
  loadHistory: () => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  exportJSON: () => void;
  exportCSV: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  isOpen: false,
  searchQuery: '',
  expandedId: null,
  copiedId: null,
  isLoading: false,

  openLedger: () => {
    set({ isOpen: true });
    get().loadHistory();
  },
  closeLedger: () => set({ isOpen: false }),
  toggleLedger: () => {
    const next = !get().isOpen;
    set({ isOpen: next });
    if (next) get().loadHistory();
  },
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleExpand: (id) => set(state => ({ expandedId: state.expandedId === id ? null : id })),
  setCopiedId: (copiedId) => set({ copiedId }),

  loadHistory: async () => {
    set({ isLoading: true });
    try {
      const entries = await getAllHistory();
      set({ entries, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  removeEntry: async (id: string) => {
    await dbDelete(id);
    set(state => ({
      entries: state.entries.filter(e => e.id !== id),
      expandedId: state.expandedId === id ? null : state.expandedId,
    }));
  },

  clearAll: async () => {
    await dbClear();
    set({ entries: [], expandedId: null });
  },

  exportJSON: () => {
    const { entries } = get();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `social_posts_ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  exportCSV: () => {
    const { entries } = get();
    const headers = ['Date', 'Network', 'Tone', 'Language', 'Topic', 'Title', 'Text', 'CTA', 'Hashtags'];
    const rows = entries.map(e => {
      const post = e.variants[e.selectedIndex || 0] || e.variants[0];
      return [
        new Date(e.createdAt).toISOString(),
        e.network,
        e.tone,
        e.language,
        `"${(e.input || '').replace(/"/g, '""')}"`,
        `"${(post?.title || '').replace(/"/g, '""')}"`,
        `"${(post?.text || '').replace(/"/g, '""')}"`,
        `"${(post?.cta || '').replace(/"/g, '""')}"`,
        `"${(post?.hashtags?.join(' ') || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `social_posts_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },
}));
