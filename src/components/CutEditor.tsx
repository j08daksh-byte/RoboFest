"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { useCutJobStore } from '@/lib/cutting/cutJobStore';
import { detectMarkedRects, hexToRgb, rgbToHex } from '@/lib/cutting/imageMarks';
import { snapRect, validateRect } from '@/lib/cutting/rectLayout';
import type { RawRect } from '@/lib/cutting/rectLayout';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const SAMPLE_WIDTH = 600;

const PRESETS: Array<{ label: string; hex: string | null }> = [
  { label: 'Auto', hex: null },
  { label: 'Magenta', hex: '#ff00ff' },
  { label: 'Red', hex: '#ff0000' },
  { label: 'Green', hex: '#00ff00' },
  { label: 'Blue', hex: '#0000ff' },
  { label: 'Yellow', hex: '#ffff00' },
  { label: 'Black', hex: '#000000' },
];

interface PixelSample {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function loadPixels(url: string): Promise<PixelSample> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = Math.min(SAMPLE_WIDTH, img.naturalWidth);
      const height = Math.max(1, Math.round((img.naturalHeight * width) / img.naturalWidth));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ data: ctx.getImageData(0, 0, width, height).data, width, height });
    };
    img.onerror = () => reject(new Error('Could not read the photo'));
    img.src = url;
  });
}

export function CutEditor() {
  const mission = usePlatformStore((s) => s.mission);
  const {
    imageUrl, imageName, board, rects, markerColor, notice, setPhoto, addRect, removeRect, clearRects,
    setMarkerColor, setNotice, setRects, loadDemo,
  } = useCutJobStore();

  const locked = mission.status === 'IN_PROGRESS' || mission.status === 'INTERRUPTED';
  const overlayRef = useRef<SVGSVGElement>(null);
  const pixelsRef = useRef<PixelSample | null>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pixelsRef.current = null;
    if (!imageUrl) return;
    let alive = true;
    loadPixels(imageUrl).then((p) => { if (alive) pixelsRef.current = p; }).catch(() => undefined);
    return () => { alive = false; };
  }, [imageUrl]);

  const toBoard = useCallback((e: React.PointerEvent) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * board.width,
      y: ((e.clientY - rect.top) / rect.height) * board.height,
    };
  }, [board]);

  const ensurePixels = async (): Promise<PixelSample | null> => {
    if (pixelsRef.current) return pixelsRef.current;
    if (!imageUrl) return null;
    try {
      pixelsRef.current = await loadPixels(imageUrl);
      return pixelsRef.current;
    } catch {
      return null;
    }
  };

  const onPointerDown = async (e: React.PointerEvent) => {
    if (locked) return;
    const p = toBoard(e);
    if (picking) {
      const px = await ensurePixels();
      if (!px) return;
      const ix = Math.min(px.width - 1, Math.max(0, Math.floor((p.x / board.width) * px.width)));
      const iy = Math.min(px.height - 1, Math.max(0, Math.floor((p.y / board.height) * px.height)));
      const i = (iy * px.width + ix) * 4;
      const hex = rgbToHex({ r: px.data[i], g: px.data[i + 1], b: px.data[i + 2] });
      setMarkerColor(hex);
      setPicking(false);
      setNotice({ kind: 'info', text: `Marker colour set to ${hex}. Press "Detect cuts from marks".` });
      return;
    }
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toBoard(e);
    setDrag({ ...drag, x1: p.x, y1: p.y });
  };

  const onPointerUp = () => {
    if (!drag) return;
    const raw = snapRect({ x: drag.x0, y: drag.y0, w: drag.x1 - drag.x0, h: drag.y1 - drag.y0 }, board);
    setDrag(null);
    if (raw.w < 1 && raw.h < 1) return; // a plain click
    addRect(raw);
  };

  const preview: RawRect | null = drag ? snapRect({ x: drag.x0, y: drag.y0, w: drag.x1 - drag.x0, h: drag.y1 - drag.y0 }, board) : null;
  const previewOk = preview ? validateRect(preview, rects, board).ok : false;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || locked) return;
    if (!file.type.startsWith('image/')) {
      setNotice({ kind: 'error', text: 'Please choose an image file.' });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setNotice({ kind: 'error', text: 'Photo must be under 8 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const img = new Image();
      img.onload = () => {
        setPhoto(url, file.name, img.naturalWidth, img.naturalHeight);
        setNotice({ kind: 'info', text: 'Photo loaded. Mark the parts to cut with a colour, then press "Detect cuts from marks" - or just drag rectangles on the photo.' });
      };
      img.onerror = () => setNotice({ kind: 'error', text: 'Could not read this image.' });
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const detect = async () => {
    setBusy(true);
    const px = await ensurePixels();
    if (!px) {
      setNotice({ kind: 'error', text: 'Could not read the photo pixels.' });
      setBusy(false);
      return;
    }
    const res = detectMarkedRects(px.data, px.width, px.height, {
      board,
      target: markerColor ? hexToRgb(markerColor) : null,
    });
    if (res.rects.length > 0) {
      setRects(res.rects);
      if (!markerColor && res.marker) setMarkerColor(rgbToHex(res.marker));
      setNotice({ kind: 'info', text: res.message });
    } else {
      setNotice({ kind: 'error', text: res.message });
    }
    setBusy(false);
  };

  const btn: React.CSSProperties = {
    padding: '6px 10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem',
  };
  const primary: React.CSSProperties = { ...btn, background: 'var(--accent)', color: '#06121a', border: 'none', fontWeight: 600 };

  return (
    <div className="ui-panel" id="cut-editor">
      <div className="ui-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="heading-technical" style={{ margin: 0, border: 'none' }}>CUT PLAN FROM SHIP PHOTO</h2>
        <span className="status-badge simulated">{rects.length} {rects.length === 1 ? 'PIECE' : 'PIECES'}</span>
      </div>
      <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-12)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <label htmlFor="cut-photo-input" style={{ ...primary, display: 'inline-block' }}>
            Upload ship photo
          </label>
          <input id="cut-photo-input" type="file" accept="image/*" onChange={onFile} disabled={locked} style={{ display: 'none' }} />
          <button id="cut-load-sample" style={btn} disabled={locked} onClick={() => loadDemo(false)}>Sample ship</button>
          <button id="cut-load-marked" style={btn} disabled={locked} onClick={() => loadDemo(true)}>Sample with marks</button>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{imageName}</span>
        </div>

        <div
          style={{
            position: 'relative', width: '100%', aspectRatio: `${board.width} / ${board.height}`, background: '#0b1218',
            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            opacity: locked ? 0.75 : 1,
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img id="cut-photo" src={imageUrl} alt="Ship photo to cut" draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', userSelect: 'none' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Upload a ship photo to start
            </div>
          )}
          <svg
            id="cut-overlay"
            ref={overlayRef}
            viewBox={`0 0 ${board.width} ${board.height}`}
            preserveAspectRatio="none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: locked ? 'not-allowed' : picking ? 'copy' : 'crosshair', touchAction: 'none' }}
          >
            {rects.map((r) => (
              <g key={r.id}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(249,115,22,0.28)" stroke="#f97316" strokeWidth={0.45} vectorEffect="non-scaling-stroke" />
                <text x={r.x + 0.8} y={r.y + 2.6} fontSize={2.4} fill="#fff" stroke="#000" strokeWidth={0.12} paintOrder="stroke">{r.id}</text>
              </g>
            ))}
            {preview && (
              <rect x={preview.x} y={preview.y} width={preview.w} height={preview.h}
                fill={previewOk ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.3)'} stroke={previewOk ? '#22c55e' : '#ef4444'} strokeWidth={0.4} strokeDasharray="1.2 0.8" />
            )}
          </svg>
          {locked && (
            <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 8px', fontSize: '0.65rem', background: 'rgba(0,0,0,0.65)', color: 'var(--warning)', borderRadius: 4 }}>
              LOCKED WHILE CUTTING
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Marker colour:</span>
          {PRESETS.map((p) => {
            const active = p.hex === markerColor;
            return (
              <button key={p.label} id={`cut-marker-${p.label.toLowerCase()}`} disabled={locked} onClick={() => setMarkerColor(p.hex)}
                style={{ ...btn, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 5, outline: active ? '1px solid var(--accent)' : 'none' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, border: '1px solid #fff4', background: p.hex ?? 'conic-gradient(#f0f,#f00,#ff0,#0f0,#0ff,#00f,#f0f)' }} />
                {p.label}
              </button>
            );
          })}
          <button id="cut-pick-color" disabled={locked} onClick={() => setPicking((v) => !v)}
            style={{ ...btn, padding: '3px 8px', outline: picking ? '1px solid var(--accent)' : 'none' }}>
            {picking ? 'Click the photo...' : 'Pick from photo'}
          </button>
          {markerColor && !PRESETS.some((p) => p.hex === markerColor) && (
            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, background: markerColor, border: '1px solid #fff4', borderRadius: 2 }} />{markerColor}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button id="cut-detect" style={primary} disabled={locked || busy || !imageUrl} onClick={detect}>
            {busy ? 'Detecting...' : 'Detect cuts from marks'}
          </button>
          <button id="cut-clear" style={btn} disabled={locked || rects.length === 0} onClick={clearRects}>Clear all</button>
        </div>

        {notice && (
          <div id="cut-notice" role="status" style={{ fontSize: '0.75rem', color: notice.kind === 'error' ? 'var(--critical)' : 'var(--accent)' }}>
            {notice.text}
          </div>
        )}

        {rects.length > 0 && (
          <ul id="cut-rect-list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 6 }}>
            {rects.map((r) => (
              <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', fontSize: '0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <span><strong>{r.id}</strong> {r.w === r.h ? 'square' : 'rect'} {r.w}x{r.h} @ ({r.x},{r.y})</span>
                <button aria-label={`Remove ${r.id}`} disabled={locked} onClick={() => removeRect(r.id)} style={{ ...btn, padding: '0 6px' }}>x</button>
              </li>
            ))}
          </ul>
        )}

        <div style={{ padding: 'var(--sp-12)', border: '1px solid rgba(56,189,248,0.2)', background: 'rgba(56,189,248,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent)' }}>HOW IT WORKS</strong>
          <ol style={{ margin: '6px 0 0 18px', padding: 0, lineHeight: 1.6 }}>
            <li>Upload the ship photo. Paint (filled) or outline the parts to remove with a bright marker colour, then press <strong>Detect cuts from marks</strong>. You can also drag rectangles straight on the photo.</li>
            <li>The robot moves <strong>only in straight lines</strong>. It turns at corners but the torch is <strong>off</strong> while turning and travelling, so only squares and rectangles are cut.</li>
            <li>Only the marked area is cut. When a piece is cut free on all four sides it drops down in the 3D view.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
