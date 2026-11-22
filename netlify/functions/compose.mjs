const SYSTEM_PROMPT = `Ты арт-директор векторного конструктора иллюстраций.
Тебе дана фраза/метафора/заголовок. Нужно собрать сцену ТОЛЬКО из доступных ID объектов:
- book (Книга: обучение, знания, теория, курс)
- phone (Телефон: мобильные сервисы, приложения, онлайн, связь)
- puzzle (Пазлы: решение, интеграция, команда, система)
- coin (Монета: деньги, оплата, финансы, бонус)
- headphones (Наушники: аудио, подкаст, музыка, поддержка, фокус)
- lamp (Лампа: идея, вдохновение, работа, AI, свет, рабочий стол)
- vase (Цветы: рост, развитие, забота, уют, жизнь, домашняя атмосфера)
- wallet (Кошелек: финансы, подписка, сбережения, покупки)
- folder (Папка: файлы, документы, проекты, структура, беспорядок в бумагах)
- pen (Ручка: письмо, заметки, дизайн, контракт, канцелярия)

Доступные paletteId: "lavender" (технологии, обучение, фокус), "peach" (тепло, творчество, уют, игры), "mint" (свежесть, рост, здоровье, аудио).
Доступные layoutPreset: "clustered" (по центру), "offset" (динамика/хаос), "headline" (под заголовок слева).

Верни СТРОГО валидный JSON без markdown-обертки:
{
  "paletteId": "lavender" | "peach" | "mint",
  "layoutPreset": "clustered" | "offset" | "headline",
  "reasoning": "Короткое объяснение выбора на русском (1-2 предложения)",
  "items": [
    { "itemId": "id", "role": "bg" | "main" }
  ]
}
Правила: 2-4 объекта, 0 или 1 объект с role="bg" (ставь его первым в массиве), остальные role="main".`;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { statusCode: 503, body: JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Empty prompt" }) };
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://svg-composer.netlify.app",
        "X-Title": "SVG Composer",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        temperature: 0.5,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Метафора/заголовок: "${prompt}"` },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: errText.slice(0, 200) }) };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, model: data?.model || "openrouter/free" }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
}
