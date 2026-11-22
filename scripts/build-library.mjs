import fs from "fs";
import path from "path";

const OBJECTS = [
  { id: "book", ru: "Книга", file: "Книга.svg", tags: ["обучение", "книга", "знания", "чтение", "курс", "образование", "документация", "учеба", "теория"] },
  { id: "phone", ru: "Телефон", file: "Телефон.svg", tags: ["телефон", "смартфон", "приложение", "мобильный", "связь", "интерфейс", "онлайн", "экран", "чат"] },
  { id: "puzzle", ru: "Пазлы", file: "Пазлы.svg", tags: ["пазл", "решение", "интеграция", "логика", "команда", "система", "сборка", "компонент", "совместимость"] },
  { id: "coin", ru: "Монета", file: "Монета.svg", tags: ["монета", "деньги", "финансы", "оплата", "цена", "бонус", "бюджет", "доход", "инвестиции", "экономика"] },
  { id: "headphones", ru: "Наушники", file: "Наушники.svg", tags: ["наушники", "аудио", "музыка", "подкаст", "звук", "лекция", "поддержка", "фокус"] },
  { id: "lamp", ru: "Лампа", file: "Лампа.svg", tags: ["лампа", "идея", "свет", "работа", "офис", "вдохновение", "инсайт", "вечер", "творчество"] },
  { id: "vase", ru: "Цветы", file: "Цветы.svg", tags: ["цветы", "ваза", "рост", "развитие", "забота", "экология", "красотa", "жизнь", "праздник", "комфорт"] },
  { id: "wallet", ru: "Кошелек", file: "Кошелек.svg", tags: ["кошелек", "покупки", "карта", "сбережения", "финансы", "бизнес", "подписка", "траты", "кэшбэк"] },
  { id: "folder", ru: "Папка", file: "Папка.svg", tags: ["папка", "файлы", "документы", "архив", "проект", "организация", "портфолио", "база", "структура"] },
  { id: "pen", ru: "Ручка", file: "Ручка.svg", tags: ["ручка", "письмо", "заметки", "подпись", "контракт", "дизайн", "копирайтинг", "текст", "редактор"] },
];

const COLOR_MAP = {
  "#181817": "{{ink}}",
  "#000000": "{{ink}}",
  "#000": "{{ink}}",
  "black": "{{ink}}",
  "#ffffff": "{{obj_light}}",
  "#fff": "{{obj_light}}",
  "white": "{{obj_light}}",
  "#d7cdf5": "{{bg_base}}",
  "#aa9bf0": "{{bg_mid}}",
  "#7864d7": "{{bg_dark}}",
  "#f9ecb0": "{{obj_1}}",
  "#f9a3aa": "{{obj_2}}",
  "#ffe3e1": "{{obj_3}}",
};

const unmapped = new Set();

function normalizeSvg(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const vbMatch = raw.match(/viewBox="([^"]+)"/);
  const [, , vw, vh] = vbMatch[1].split(/\s+/).map(Number);

  let inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();

  inner = inner.replace(/(fill|stroke)="([^"]+)"/gi, (full, attr, val) => {
    const low = val.trim().toLowerCase();
    if (low === "none" || low === "transparent") return full;
    if (COLOR_MAP[low]) return `${attr}="${COLOR_MAP[low]}"`;
    unmapped.add(`${filePath}: ${attr}="${val}"`);
    return full;
  });

  return { width: vw, height: vh, body: inner };
}

const items = OBJECTS.map((obj) => ({
  id: obj.id,
  name: obj.ru,
  tags: obj.tags,
  L: {
    main: normalizeSvg(path.join("raw-svg/L/main-object", obj.file)),
    bg: normalizeSvg(path.join("raw-svg/L/phone-object", obj.file)),
  },
  S: {
    main: normalizeSvg(path.join("raw-svg/S/main-object", obj.file)),
    bg: normalizeSvg(path.join("raw-svg/S/phone-object", obj.file)),
  },
}));

// Нормализуем реальный декор фона из raw-svg/L/phones/Фон.svg (убираем сплошной <rect 1000x1000>)
const rawBg = normalizeSvg("raw-svg/L/phones/Фон.svg");
const bgDecorBody = rawBg.body.replace(/<rect[^>]*width="1000"[^>]*height="1000"[^>]*\/?>/i, "").trim();

const tsOut = `// Автогенерировано из raw-svg скриптом scripts/build-library.mjs
export interface SvgVariant {
  width: number;
  height: number;
  body: string;
}

export interface LibraryItem {
  id: string;
  name: string;
  tags: string[];
  L: { main: SvgVariant; bg: SvgVariant };
  S: { main: SvgVariant; bg: SvgVariant };
}

export const BACKGROUND_DECOR: SvgVariant = ${JSON.stringify({ width: rawBg.width, height: rawBg.height, body: bgDecorBody }, null, 2)};

export const LIBRARY_ITEMS: LibraryItem[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync("src/data/library.ts", tsOut, "utf8");
console.log(`Объектов: ${items.length}, длина декора фона: ${bgDecorBody.length} симв., неизвестных цветов: ${unmapped.size}`);
