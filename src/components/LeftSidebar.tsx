import { useState, type FC, type FormEvent } from "react";
import {
  ListPlus,
  Plus,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";
import { LIBRARY_ITEMS } from "../data/library";
import type {
  ObjectRole,
  Palette,
  SizeMode,
} from "../types/composer";
import { colorizeSvgBody } from "../utils/svgCompiler";

interface LeftSidebarProps {
  sizeMode: SizeMode;
  palette: Palette;
  aiLoading: boolean;
  aiNote: string | null;
  aiError: string | null;
  onComposeMetaphor: (prompt: string) => void;
  onComposeByNames: (namesInput: string) => void;
  onAddObject: (itemId: string, role: ObjectRole) => void;
}

const EXAMPLE_METAPHORS = [
  "Курс по финансовой грамотности с телефона",
  "Подкаст о дизайне и творческих идеях",
  "Командная работа над цифровым продуктом",
];

export const LeftSidebar: FC<LeftSidebarProps> = ({
  sizeMode,
  palette,
  aiLoading,
  aiNote,
  aiError,
  onComposeMetaphor,
  onComposeByNames,
  onAddObject,
}) => {
  const [metaphor, setMetaphor] = useState("");
  const [namesPrompt, setNamesPrompt] = useState("");
  const [search, setSearch] = useState("");

  const filteredItems = LIBRARY_ITEMS.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });

  const handleMetaphorSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!metaphor.trim()) return;
    onComposeMetaphor(metaphor.trim());
  };

  const handleNamesSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!namesPrompt.trim()) return;
    onComposeByNames(namesPrompt.trim());
  };

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      {/* Сценарий 1: Метафора / заголовок */}
      <div className="border-b border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Сценарий 1: По метафоре
          </h2>
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">AI</span>
        </div>

        <form onSubmit={handleMetaphorSubmit} className="space-y-2">
          <textarea
            rows={2}
            value={metaphor}
            onChange={(e) => setMetaphor(e.target.value)}
            placeholder="Введите заголовок или метафору..."
            className="w-full resize-none rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={aiLoading || !metaphor.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {aiLoading ? "Собираю композицию..." : "Собрать сцену"}
          </button>
        </form>

        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          <span className="w-full text-[10px] font-medium text-slate-400">Примеры метафор:</span>
          {EXAMPLE_METAPHORS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setMetaphor(ex);
                onComposeMetaphor(ex);
              }}
              className="rounded-md bg-slate-100 px-2 py-1 text-left text-[10px] text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
            >
              {ex}
            </button>
          ))}
        </div>

        {aiNote && (
          <p className="mt-2 rounded-md bg-indigo-50 p-2 text-[11px] leading-snug text-indigo-900">
            {aiNote}
          </p>
        )}
        {aiError && (
          <p className="mt-2 rounded-md bg-rose-50 p-2 text-[11px] leading-snug text-rose-700">
            {aiError}
          </p>
        )}
      </div>

      {/* Сценарий 2: Сборка по списку названий */}
      <div className="border-b border-slate-200 p-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
          <ListPlus className="h-3.5 w-3.5 text-emerald-600" />
          Сценарий 2: По названиям
        </h2>
        <form onSubmit={handleNamesSubmit} className="flex gap-1.5">
          <input
            type="text"
            value={namesPrompt}
            onChange={(e) => setNamesPrompt(e.target.value)}
            placeholder="книга, телефон, фоновая лампа"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!namesPrompt.trim()}
            className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Собрать
          </button>
        </form>
        <p className="mt-1 text-[10px] text-slate-400">
          Добавьте слово «фон» перед объектом для фоновой роли.
        </p>
      </div>

      {/* Библиотека компонентов */}
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Библиотека ({filteredItems.length})
          </h2>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            Размер {sizeMode}
          </span>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск объекта или тега..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-2.5 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const variant = item[sizeMode].main;
            const previewMarkup = colorizeSvgBody(variant.body, palette, "main");
            return (
              <div
                key={item.id}
                className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-2 transition hover:border-indigo-300 hover:bg-white"
              >
                <div
                  className="mb-1.5 flex h-16 items-center justify-center rounded-lg p-1.5"
                  style={{ backgroundColor: palette.colors.bgBase }}
                >
                  <svg
                    viewBox={`0 0 ${variant.width} ${variant.height}`}
                    className="h-full w-full"
                    dangerouslySetInnerHTML={{ __html: previewMarkup }}
                  />
                </div>
                <div className="mb-1.5 truncate text-center text-[11px] font-semibold text-slate-700">
                  {item.name}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onAddObject(item.id, "main")}
                    className="flex flex-1 items-center justify-center gap-0.5 rounded bg-slate-900 py-1 text-[10px] font-medium text-white hover:bg-indigo-600"
                    title="Добавить как Главный объект"
                  >
                    <Plus className="h-3 w-3" /> Главн.
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddObject(item.id, "bg")}
                    className="rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
                    title="Добавить как Фоновый объект"
                  >
                    Фон
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
