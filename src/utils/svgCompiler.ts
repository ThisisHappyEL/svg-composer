import { BACKGROUND_DECOR, LIBRARY_ITEMS, type LibraryItem } from "../data/library";
import { CANVAS_FORMATS } from "../data/formats";
import type {
  BackgroundStyle,
  FormatId,
  ObjectRole,
  Palette,
  SceneObject,
  SizeMode,
} from "../types/composer";

const ITEM_MAP = new Map<string, LibraryItem>(LIBRARY_ITEMS.map((i) => [i.id, i]));

export function getLibraryItem(id: string): LibraryItem | undefined {
  return ITEM_MAP.get(id);
}

/**
 * Единый масштаб с сохранением взаимных пропорций объектов (L и S совпадают по визуальному размеру)
 */
export function getEffectiveScale(item: LibraryItem, sizeMode: SizeMode, formatId: FormatId): number {
  const baseL = CANVAS_FORMATS[formatId].baseScaleL;
  if (sizeMode === "L") return baseL;
  const ratio = item.L.main.width / item.S.main.width;
  return baseL * ratio;
}

/**
 * Подстановка HEX-цветов выбранной палитры внутрь векторного шаблона.
 * Для role === "bg" используются только фоновые цвета.
 */
export function colorizeSvgBody(body: string, palette: Palette, role: ObjectRole): string {
  const c = palette.colors;
  if (role === "bg") {
    return body
      .replaceAll("{{bg_base}}", c.bgBase)
      .replaceAll("{{bg_mid}}", c.bgMid)
      .replaceAll("{{bg_dark}}", c.bgDark)
      .replaceAll("{{ink}}", c.bgDark)
      .replaceAll("{{obj_1}}", c.bgBase)
      .replaceAll("{{obj_2}}", c.bgMid)
      .replaceAll("{{obj_3}}", c.bgBase)
      .replaceAll("{{obj_light}}", c.bgBase);
  }
  return body
    .replaceAll("{{bg_base}}", c.bgBase)
    .replaceAll("{{bg_mid}}", c.bgMid)
    .replaceAll("{{bg_dark}}", c.bgDark)
    .replaceAll("{{ink}}", c.ink)
    .replaceAll("{{obj_1}}", c.obj1)
    .replaceAll("{{obj_2}}", c.obj2)
    .replaceAll("{{obj_3}}", c.obj3)
    .replaceAll("{{obj_light}}", c.objLight);
}

export function buildBackgroundMarkup(
  width: number,
  height: number,
  palette: Palette,
  bgStyle: BackgroundStyle
): string {
  const c = palette.colors;
  const base = `<rect width="${width}" height="${height}" fill="${c.bgBase}" />`;
  if (bgStyle === "solid") return base;

  // Реальный декор из исходного Фон.svg (масштабируется пропорционально по центру холста)
  const decorColored = colorizeSvgBody(BACKGROUND_DECOR.body, palette, "bg");
  const scale = Math.min(width / BACKGROUND_DECOR.width, height / BACKGROUND_DECOR.height);
  const dx = ((width - BACKGROUND_DECOR.width * scale) / 2).toFixed(2);
  const dy = ((height - BACKGROUND_DECOR.height * scale) / 2).toFixed(2);
  return `${base}\n  <g transform="translate(${dx} ${dy}) scale(${scale.toFixed(4)})">\n${decorColored}\n  </g>`;
}

/**
 * Генерирует чистый автономный SVG-документ для экспорта (редактируемый в Figma / Illustrator)
 */
export function buildExportSvg(params: {
  formatId: FormatId;
  sizeMode: SizeMode;
  palette: Palette;
  bgStyle: BackgroundStyle;
  objects: SceneObject[];
}): string {
  const { formatId, sizeMode, palette, bgStyle, objects } = params;
  const fmt = CANVAS_FORMATS[formatId];

  const layers = objects
    .map((obj, idx) => {
      const item = getLibraryItem(obj.itemId);
      if (!item) return "";
      const variant = item[sizeMode][obj.role];
      const scale = getEffectiveScale(item, sizeMode, formatId);
      const colorized = colorizeSvgBody(variant.body, palette, obj.role);
      const cx = (variant.width / 2).toFixed(2);
      const cy = (variant.height / 2).toFixed(2);
      const transform = `translate(${obj.x.toFixed(1)} ${obj.y.toFixed(1)}) rotate(${obj.rotation.toFixed(1)}) scale(${scale.toFixed(4)}) translate(-${cx} -${cy})`;
      return `  <g id="layer-${idx + 1}-${obj.itemId}-${obj.role}" data-name="${item.name}" data-role="${obj.role}" transform="${transform}">\n${colorized}\n  </g>`;
    })
    .filter(Boolean)
    .join("\n");

  const bgMarkup = buildBackgroundMarkup(fmt.width, fmt.height, palette, bgStyle);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${fmt.width}" height="${fmt.height}" viewBox="0 0 ${fmt.width} ${fmt.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="canvas-clip">
      <rect width="${fmt.width}" height="${fmt.height}" />
    </clipPath>
  </defs>
  <g clip-path="url(#canvas-clip)">
    ${bgMarkup}
${layers}
  </g>
</svg>
`;
}
