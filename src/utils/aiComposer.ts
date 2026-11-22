import { LIBRARY_ITEMS } from "../data/library";
import type {
  AICompositionPlan,
  LayoutPresetId,
  ObjectRole,
} from "../types/composer";

const SEMANTIC_RULES: Record<string, string[]> = {
  book: ["книг", "учеб", "знан", "курс", "обуч", "чтен", "теор", "лекц", "гайд", "инструкц", "образован", "школ", "универ", "студент", "метод", "правил", "book", "learn", "study", "course", "read", "guide"],
  phone: ["телеф", "смартф", "мобил", "прилож", "экран", "интерфейс", "онлайн", "чат", "мессендж", "уведомл", "сервис", "связ", "звон", "цифр", "диджитал", "phone", "app", "mobile", "chat"],
  puzzle: ["пазл", "решен", "систем", "интеграц", "логик", "сбор", "команд", "связк", "компонент", "конструкт", "задач", "алгоритм", "продукт", "архитект", "совмест", "игр", "puzzle", "team", "system", "solution"],
  coin: ["монет", "деньг", "финанс", "оплат", "цен", "стоим", "доход", "прибыл", "бюджет", "инвест", "бонус", "кэшбэк", "грамот", "экономи", "руб", "валют", "зарплат", "платеж", "coin", "money", "pay", "finance"],
  headphones: ["наушн", "аудио", "звук", "музык", "подкаст", "голос", "слуш", "фокус", "концентр", "поддержк", "саппорт", "созвон", "вебинар", "стрим", "audio", "music", "podcast", "sound"],
  lamp: ["ламп", "иде", "свет", "озарен", "инсайт", "креатив", "вдохнов", "творч", "офис", "стол", "рабоч", "мест", "ноч", "вечер", "стартап", "изобрет", "нейросет", "ии", "ai", "умн", "lamp", "idea", "light", "creative"],
  vase: ["цвет", "ваз", "рост", "развит", "забот", "красот", "гармон", "природ", "эколог", "жизн", "уют", "комфорт", "отдых", "здоров", "праздн", "подар", "flower", "growth", "life", "nature"],
  wallet: ["кошел", "карт", "покуп", "трат", "сбереж", "подписк", "бизнес", "счет", "банк", "кредит", "тариф", "выгод", "расход", "wallet", "bank", "card", "shop"],
  folder: ["папк", "файл", "документ", "архив", "проект", "портфол", "баз", "структур", "поряд", "хранен", "отчет", "каталог", "библиотек", "данн", "бумаг", "folder", "file", "doc", "project", "data"],
  pen: ["ручк", "пис", "замет", "текст", "копирайт", "стать", "блог", "договор", "контракт", "подпис", "рисов", "дизайн", "редакт", "автор", "заголов", "pen", "write", "note", "design", "edit"],
};

function choosePaletteLocal(text: string): string {
  const low = text.toLowerCase();
  if (/уют|тепл|кофе|дом|творч|осень|подар|комфорт|забот|вдохнов|праздн|кот/.test(low)) {
    return "peach";
  }
  if (/свеж|экол|здоров|природ|рост|музык|аудио|отдых|спокой|баланс|медитац/.test(low)) {
    return "mint";
  }
  return "lavender";
}

function chooseLayoutLocal(text: string): LayoutPresetId {
  const low = text.toLowerCase();
  if (/заголов|статья|блог|анонс|баннер|презентац|лендинг/.test(low)) return "headline";
  if (/динамик|движ|рост|путь|поток|процесс|игр|беспоряд|напад/.test(low)) return "offset";
  return "clustered";
}

export function composeByMetaphorLocal(prompt: string): AICompositionPlan {
  const clean = prompt.trim().toLowerCase();
  const scores: Array<{ id: string; score: number }> = LIBRARY_ITEMS.map((item) => {
    const stems = SEMANTIC_RULES[item.id] || [];
    let score = 0;
    for (const s of stems) {
      if (clean.includes(s)) score += 3;
    }
    for (const tag of item.tags) {
      if (clean.includes(tag.slice(0, 4))) score += 1;
    }
    return { id: item.id, score };
  });

  scores.sort((a, b) => b.score - a.score);
  let matched = scores.filter((s) => s.score > 0).map((s) => s.id);

  if (matched.length === 0) {
    const presets = [
      ["lamp", "puzzle", "book"],
      ["phone", "coin", "wallet"],
      ["book", "headphones", "pen"],
      ["folder", "lamp", "vase"],
    ];
    let hash = 0;
    for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
    matched = presets[hash % presets.length];
  }

  if (matched.length === 1) {
    const complement: Record<string, string[]> = {
      book: ["lamp", "pen"],
      phone: ["headphones", "puzzle"],
      coin: ["wallet", "phone"],
      wallet: ["coin", "folder"],
      lamp: ["book", "pen"],
      headphones: ["phone", "vase"],
      puzzle: ["lamp", "phone"],
      vase: ["book", "lamp"],
      folder: ["pen", "lamp"],
      pen: ["book", "folder"],
    };
    matched.push(...(complement[matched[0]] || ["lamp", "book"]));
  }

  const unique = [...new Set(matched)].slice(0, 4);

  const items = unique.map((itemId, idx): { itemId: string; role: ObjectRole } => {
    const role: ObjectRole = unique.length >= 3 && idx === 0 ? "bg" : "main";
    return { itemId, role };
  });

  items.sort((a, b) => (a.role === "bg" && b.role === "main" ? -1 : a.role === "main" && b.role === "bg" ? 1 : 0));

  const names = items
    .map((i) => {
      const found = LIBRARY_ITEMS.find((x) => x.id === i.itemId)?.name || i.itemId;
      return `${found} (${i.role === "bg" ? "фоновый" : "главный"})`;
    })
    .join(", ");

  return {
    source: "local",
    providerLabel: "Локальный семантический движок",
    reasoning: `Подобраны объекты под смысл фразы: ${names}.`,
    paletteId: choosePaletteLocal(prompt),
    layoutPreset: chooseLayoutLocal(prompt),
    items,
  };
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json\s*|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON не найден в ответе модели");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function sanitizePlan(raw: Record<string, unknown>, providerLabel: string): AICompositionPlan {
  const validIds = new Set(LIBRARY_ITEMS.map((i) => i.id));
  const validPalettes = new Set(["lavender", "peach", "mint"]);
  const validLayouts = new Set(["clustered", "offset", "headline"]);

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items = rawItems
    .filter((x): x is { itemId: string; role?: string } => Boolean(x && typeof x === "object" && "itemId" in x && validIds.has(String((x as { itemId: string }).itemId))))
    .slice(0, 5)
    .map((x) => ({
      itemId: x.itemId,
      role: (x.role === "bg" ? "bg" : "main") as ObjectRole,
    }));

  if (items.length === 0) throw new Error("Модель не вернула подходящие объекты");
  items.sort((a, b) => (a.role === "bg" && b.role === "main" ? -1 : a.role === "main" && b.role === "bg" ? 1 : 0));

  return {
    source: "llm",
    providerLabel,
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning : "Сцена собрана нейросетью.",
    paletteId: validPalettes.has(String(raw.paletteId)) ? String(raw.paletteId) : "lavender",
    layoutPreset: (validLayouts.has(String(raw.layoutPreset)) ? String(raw.layoutPreset) : "clustered") as LayoutPresetId,
    items,
  };
}

export async function composeByMetaphor(prompt: string): Promise<AICompositionPlan> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch("/api/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data?.content) {
        return sanitizePlan(extractJson(data.content), `OpenRouter LLM (${data.model || "free"})`);
      }
    }
  } catch {
    // На localhost или при таймауте бесшовно падаем в локальный семантический движок
  }

  return composeByMetaphorLocal(prompt);
}

export function parseComponentNamesPrompt(input: string): Array<{ itemId: string; role: ObjectRole }> {
  const parts = input
    .toLowerCase()
    .split(/[,;\n+]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: Array<{ itemId: string; role: ObjectRole }> = [];

  for (const part of parts) {
    const isBg = /(?:^|[^а-яёa-z])(фонов[а-яё]*|фон|back(?:ground)?|bg)(?:$|[^а-яёa-z])/i.test(part);
    const found = LIBRARY_ITEMS.find((item) => {
      const n = item.name.toLowerCase();
      return (
        part.includes(n.slice(0, 4)) ||
        part.includes(item.id) ||
        item.tags.some((t) => part.includes(t.slice(0, 4)))
      );
    });
    if (found) {
      result.push({ itemId: found.id, role: isBg ? "bg" : "main" });
    }
  }

  result.sort((a, b) => (a.role === "bg" && b.role === "main" ? -1 : a.role === "main" && b.role === "bg" ? 1 : 0));
  return result;
}
