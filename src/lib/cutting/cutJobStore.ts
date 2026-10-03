import { create } from 'zustand';
import {
  BOARD_WIDTH,
  boardHeightFor,
  makeRect,
  rectsFromRaw,
  snapRect,
  validateRect,
} from './rectLayout';
import type { BoardSize, CutRect, RawRect } from './rectLayout';

export const DEMO_IMAGE = '/demo/ship-side.jpg';
export const DEMO_MARKED_IMAGE = '/demo/ship-marked.jpg';
export const DEMO_IMAGE_SIZE = { w: 1376, h: 768 };

/** Cut regions of the sample ship photo (bridge tower, hull panel and bow plate). */
export const DEMO_RECTS: RawRect[] = [
  { x: 69, y: 17, w: 18, h: 9 },
  { x: 47, y: 37, w: 31, h: 5 },
  { x: 18, y: 34, w: 7, h: 6 },
];

export type SimSpeed = 1 | 2 | 4;

interface CutJobState {
  imageUrl: string | null;
  imageName: string;
  board: BoardSize;
  rects: CutRect[];
  /** Marker colour used for photo detection (hex), or null for automatic. */
  markerColor: string | null;
  notice: { kind: 'info' | 'error'; text: string } | null;
  speed: SimSpeed;

  setPhoto: (url: string, name: string, imageWidth: number, imageHeight: number) => void;
  setRects: (raws: RawRect[]) => void;
  addRect: (raw: RawRect) => { ok: boolean; reason?: string };
  removeRect: (id: string) => void;
  clearRects: () => void;
  setMarkerColor: (hex: string | null) => void;
  setNotice: (n: CutJobState['notice']) => void;
  setSpeed: (s: SimSpeed) => void;
  loadDemo: (marked?: boolean) => void;
}

const demoBoard: BoardSize = { width: BOARD_WIDTH, height: boardHeightFor(DEMO_IMAGE_SIZE.w, DEMO_IMAGE_SIZE.h) };

export const useCutJobStore = create<CutJobState>((set, get) => ({
  imageUrl: DEMO_IMAGE,
  imageName: 'Sample cargo ship',
  board: demoBoard,
  rects: rectsFromRaw(DEMO_RECTS),
  markerColor: null,
  notice: null,
  speed: 1,

  setPhoto: (url, name, imageWidth, imageHeight) =>
    set({
      imageUrl: url,
      imageName: name,
      board: { width: BOARD_WIDTH, height: boardHeightFor(imageWidth, imageHeight) },
      rects: [],
      notice: null,
    }),

  setRects: (raws) => set({ rects: rectsFromRaw(raws) }),

  addRect: (raw) => {
    const { board, rects } = get();
    const snapped = snapRect(raw, board);
    const check = validateRect(snapped, rects, board);
    if (!check.ok) {
      set({ notice: { kind: 'error', text: check.reason } });
      return { ok: false, reason: check.reason };
    }
    set({ rects: [...rects, makeRect(snapped, rects)], notice: null });
    return { ok: true };
  },

  removeRect: (id) => set((s) => ({ rects: s.rects.filter((r) => r.id !== id) })),
  clearRects: () => set({ rects: [], notice: null }),
  setMarkerColor: (hex) => set({ markerColor: hex }),
  setNotice: (notice) => set({ notice }),
  setSpeed: (speed) => set({ speed }),

  loadDemo: (marked = false) =>
    set({
      imageUrl: marked ? DEMO_MARKED_IMAGE : DEMO_IMAGE,
      imageName: marked ? 'Sample photo with magenta cut marks' : 'Sample cargo ship',
      board: demoBoard,
      rects: marked ? [] : rectsFromRaw(DEMO_RECTS),
      markerColor: marked ? '#ff00ff' : null,
      notice: marked ? { kind: 'info', text: 'Marked sample loaded. Press "Detect cuts from marks".' } : null,
    }),
}));
