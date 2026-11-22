import type { Palette, PaletteColors } from "../types/composer";

export const DEFAULT_PALETTES: Palette[] = [
  {
    id: "lavender",
    name: "Лаванда",
    colors: {
      bgBase: "#D7CDF5",
      bgMid: "#AA9BF0",
      bgDark: "#7864D7",
      ink: "#181817",
      obj1: "#F9ECB0",
      obj2: "#F9A3AA",
      obj3: "#FFE3E1",
      objLight: "#FFFFFF",
    },
  },
  {
    id: "peach",
    name: "Персик",
    colors: {
      bgBase: "#FDD7B9",
      bgMid: "#FAC896",
      bgDark: "#D27532",
      ink: "#181817",
      obj1: "#F9ECB0",
      obj2: "#80DADA",
      obj3: "#BEEBEB",
      objLight: "#FFFFFF",
    },
  },
  {
    id: "mint",
    name: "Мята",
    colors: {
      bgBase: "#BEEBEB",
      bgMid: "#80DADA",
      bgDark: "#5ABEBE",
      ink: "#181817",
      obj1: "#FFD4F2",
      obj2: "#6D7BFC",
      obj3: "#B6C6FE",
      objLight: "#FFFFFF",
    },
  },
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function parsePaletteJson(raw: string): { ok: true; palette: Palette } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    const src = parsed.colors ? parsed.colors : parsed;
    const required: (keyof PaletteColors)[] = [
      "bgBase",
      "bgMid",
      "bgDark",
      "ink",
      "obj1",
      "obj2",
      "obj3",
      "objLight",
    ];
    for (const k of required) {
      if (typeof src[k] !== "string" || !HEX_RE.test(src[k].trim())) {
        return { ok: false, error: `Поле "${k}" должно быть валидным HEX-цветом (например, #AABBCC)` };
      }
    }
    return {
      ok: true,
      palette: {
        id: `custom-${Date.now()}`,
        name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "Пользовательская",
        isCustom: true,
        colors: {
          bgBase: src.bgBase.trim().toUpperCase(),
          bgMid: src.bgMid.trim().toUpperCase(),
          bgDark: src.bgDark.trim().toUpperCase(),
          ink: src.ink.trim().toUpperCase(),
          obj1: src.obj1.trim().toUpperCase(),
          obj2: src.obj2.trim().toUpperCase(),
          obj3: src.obj3.trim().toUpperCase(),
          objLight: src.objLight.trim().toUpperCase(),
        },
      },
    };
  } catch {
    return { ok: false, error: "Некорректный JSON. Проверь синтаксис и скобки." };
  }
}
