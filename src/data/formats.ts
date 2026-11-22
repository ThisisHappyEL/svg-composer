import type { CanvasFormat, FormatId, LayoutPresetId } from "../types/composer";

export const CANVAS_FORMATS: Record<FormatId, CanvasFormat> = {
  banner: {
    id: "banner",
    name: "Баннер 1200×630",
    width: 1200,
    height: 630,
    baseScaleL: 0.32,
  },
  square: {
    id: "square",
    name: "Квадрат 1000×1000",
    width: 1000,
    height: 1000,
    baseScaleL: 0.4,
  },
  vertical: {
    id: "vertical",
    name: "Вертикаль 640×960",
    width: 640,
    height: 960,
    baseScaleL: 0.33,
  },
};

export const LAYOUT_PRESETS: Array<{ id: LayoutPresetId; name: string; desc: string }> = [
  { id: "clustered", name: "Собранно", desc: "Сбалансированная сцена по центру" },
  { id: "offset", name: "Со смещением", desc: "Диагональная динамика" },
  { id: "headline", name: "Под заголовок", desc: "Свободное место слева под текст" },
];

interface SlotPoint {
  nx: number;
  ny: number;
  rot?: number;
}

const SLOT_MAP: Record<FormatId, Record<LayoutPresetId, SlotPoint[]>> = {
  banner: {
    clustered: [
      { nx: 0.56, ny: 0.36, rot: 0 },
      { nx: 0.36, ny: 0.54, rot: 0 },
      { nx: 0.68, ny: 0.6, rot: 0 },
      { nx: 0.5, ny: 0.72, rot: -4 },
      { nx: 0.25, ny: 0.32, rot: 0 },
      { nx: 0.78, ny: 0.34, rot: 0 },
    ],
    offset: [
      { nx: 0.28, ny: 0.42, rot: 0 },
      { nx: 0.54, ny: 0.58, rot: 0 },
      { nx: 0.76, ny: 0.4, rot: 0 },
      { nx: 0.38, ny: 0.72, rot: 5 },
      { nx: 0.68, ny: 0.74, rot: -6 },
      { nx: 0.18, ny: 0.68, rot: 0 },
    ],
    headline: [
      { nx: 0.72, ny: 0.34, rot: 0 },
      { nx: 0.6, ny: 0.58, rot: 0 },
      { nx: 0.84, ny: 0.58, rot: 0 },
      { nx: 0.7, ny: 0.76, rot: -5 },
      { nx: 0.52, ny: 0.32, rot: 0 },
      { nx: 0.86, ny: 0.3, rot: 0 },
    ],
  },
  square: {
    clustered: [
      { nx: 0.46, ny: 0.36, rot: 0 },
      { nx: 0.36, ny: 0.6, rot: 0 },
      { nx: 0.68, ny: 0.58, rot: 0 },
      { nx: 0.52, ny: 0.78, rot: 0 },
      { nx: 0.24, ny: 0.34, rot: 0 },
      { nx: 0.76, ny: 0.32, rot: 0 },
    ],
    offset: [
      { nx: 0.3, ny: 0.3, rot: 0 },
      { nx: 0.58, ny: 0.48, rot: 0 },
      { nx: 0.34, ny: 0.72, rot: 0 },
      { nx: 0.72, ny: 0.74, rot: -5 },
      { nx: 0.72, ny: 0.26, rot: 0 },
      { nx: 0.22, ny: 0.54, rot: 0 },
    ],
    headline: [
      { nx: 0.66, ny: 0.44, rot: 0 },
      { nx: 0.44, ny: 0.66, rot: 0 },
      { nx: 0.74, ny: 0.7, rot: 0 },
      { nx: 0.54, ny: 0.84, rot: 0 },
      { nx: 0.32, ny: 0.44, rot: 0 },
      { nx: 0.8, ny: 0.3, rot: 0 },
    ],
  },
  vertical: {
    clustered: [
      { nx: 0.52, ny: 0.34, rot: 0 },
      { nx: 0.38, ny: 0.54, rot: 0 },
      { nx: 0.66, ny: 0.62, rot: 0 },
      { nx: 0.44, ny: 0.78, rot: 0 },
      { nx: 0.32, ny: 0.24, rot: 0 },
      { nx: 0.72, ny: 0.26, rot: 0 },
    ],
    offset: [
      { nx: 0.34, ny: 0.28, rot: 0 },
      { nx: 0.62, ny: 0.48, rot: 0 },
      { nx: 0.34, ny: 0.66, rot: 0 },
      { nx: 0.66, ny: 0.8, rot: -5 },
      { nx: 0.7, ny: 0.24, rot: 0 },
      { nx: 0.28, ny: 0.84, rot: 0 },
    ],
    headline: [
      { nx: 0.56, ny: 0.46, rot: 0 },
      { nx: 0.36, ny: 0.64, rot: 0 },
      { nx: 0.68, ny: 0.68, rot: 0 },
      { nx: 0.48, ny: 0.83, rot: 0 },
      { nx: 0.74, ny: 0.38, rot: 0 },
      { nx: 0.28, ny: 0.44, rot: 0 },
    ],
  },
};

export function getSlotPosition(
  formatId: FormatId,
  presetId: LayoutPresetId,
  index: number
): { x: number; y: number; rotation: number } {
  const fmt = CANVAS_FORMATS[formatId];
  const slots = SLOT_MAP[formatId][presetId];
  const s = slots[index % slots.length];
  const jitter = index >= slots.length ? (index - slots.length + 1) * 28 : 0;
  return {
    x: Math.round(s.nx * fmt.width + jitter),
    y: Math.round(s.ny * fmt.height + jitter),
    rotation: s.rot ?? 0,
  };
}
