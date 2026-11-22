export type SizeMode = "L" | "S";
export type ObjectRole = "main" | "bg";
export type FormatId = "banner" | "square" | "vertical";
export type LayoutPresetId = "clustered" | "offset" | "headline";
export type BackgroundStyle = "solid" | "stripes";

export interface PaletteColors {
  bgBase: string;
  bgMid: string;
  bgDark: string;
  ink: string;
  obj1: string;
  obj2: string;
  obj3: string;
  objLight: string;
}

export interface Palette {
  id: string;
  name: string;
  isCustom?: boolean;
  colors: PaletteColors;
}

export interface SceneObject {
  uid: string;
  itemId: string;
  role: ObjectRole;
  x: number;
  y: number;
  rotation: number;
}

export interface CanvasFormat {
  id: FormatId;
  name: string;
  width: number;
  height: number;
  baseScaleL: number;
}

export type AIProvider = "local" | "openrouter" | "groq" | "gemini" | "mistral";

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
}

export interface AICompositionPlan {
  source: "llm" | "local";
  providerLabel: string;
  reasoning: string;
  paletteId: string;
  layoutPreset: LayoutPresetId;
  items: Array<{
    itemId: string;
    role: ObjectRole;
  }>;
}
