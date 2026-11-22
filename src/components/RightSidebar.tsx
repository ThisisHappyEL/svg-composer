import { useState, type ChangeEvent, type FC } from "react";
import {
  ArrowDown,
  ArrowUp,
  CopyPlus,
  Layers,
  Palette as PaletteIcon,
  RotateCw,
  Trash2,
  Upload,
} from "lucide-react";
import { CANVAS_FORMATS, LAYOUT_PRESETS } from "../data/formats";
import { parsePaletteJson } from "../data/palettes";
import type {
  BackgroundStyle,
  FormatId,
  LayoutPresetId,
  ObjectRole,
  Palette,
  PaletteColors,
  SceneObject,
  SizeMode,
} from "../types/composer";
import { getLibraryItem } from "../utils/svgCompiler";

interface RightSidebarProps {
  formatId: FormatId;
  sizeMode: SizeMode;
  bgStyle: BackgroundStyle;
  palettes: Palette[];
  activePalette: Palette;
  objects: SceneObject[];
  selectedUid: string | null;
  onChangeFormat: (f: FormatId) => void;
  onChangeSize: (s: SizeMode) => void;
  onChangeBgStyle: (b: BackgroundStyle) => void;
  onApplyLayout: (preset: LayoutPresetId) => void;
  onSelectPalette: (id: string) => void;
  onAddCustomPalette: (p: Palette) => void;
  onUpdateActivePaletteColor: (key: keyof PaletteColors, hex: string) => void;
  onSelectObject: (uid: string) => void;
  onUpdateObject: (uid: string, patch: Partial<SceneObject>) => void;
  onDuplicateObject: (uid: string) => void;
  onDeleteObject: (uid: string) => void;
  onMoveLayer: (uid: string, dir: "up" | "down") => void;
}

const BG_COLOR_LABELS: Array<{ key: keyof PaletteColors; label: string }> = [
  { key: "bgBase", label: "Фон базовый" },
  { key: "bgMid", label: "Фон средний" },
  { key: "bgDark", label: "Фон тёмный" },
  { key: "ink", label: "Обводка/тень" },
];

const OBJ_COLOR_LABELS: Array<{ key: keyof PaletteColors; label: string }> = [
  { key: "obj1", label: "Акцент 1" },
  { key: "obj2", label: "Акцент 2" },
  { key: "obj3", label: "Акцент 3" },
  { key: "objLight", label: "Светлый" },
];

export const RightSidebar: FC<RightSidebarProps> = ({
  formatId,
  sizeMode,
  bgStyle,
  palettes,
  activePalette,
  objects,
  selectedUid,
  onChangeFormat,
  onChangeSize,
  onChangeBgStyle,
  onApplyLayout,
  onSelectPalette,
  onAddCustomPalette,
  onUpdateActivePaletteColor,
  onSelectObject,
  onUpdateObject,
  onDuplicateObject,
  onDeleteObject,
  onMoveLayer,
}) => {
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const selectedObj = objects.find((o) => o.uid === selectedUid) || null;
  const selectedItem = selectedObj ? getLibraryItem(selectedObj.itemId) : null;

  const handleImportJson = () => {
    const res = parsePaletteJson(jsonInput);
    if (!res.ok) {
      setJsonError(res.error);
      return;
    }
    setJsonError(null);
    onAddCustomPalette(res.palette);
    setJsonInput("");
    setShowJsonImport(false);
  };

  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const res = parsePaletteJson(text);
      if (!res.ok) {
        setJsonError(res.error);
        setShowJsonImport(true);
      } else {
        setJsonError(null);
        onAddCustomPalette(res.palette);
        setShowJsonImport(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadPaletteJson = () => {
    const blob = new Blob([JSON.stringify(activePalette, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palette-${activePalette.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="flex w-full flex-col overflow-y-auto border-t border-slate-200 bg-white lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0">
      {/* Параметры сцены */}
      <div className="space-y-3 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Параметры сцены
          </h2>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            {(["L", "S"] as SizeMode[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSize(s)}
                title={s === "L" ? "Высокая детализация (L)" : "Упрощённая детализация для малых форматов (S)"}
                className={`rounded-md px-2.5 py-0.5 transition ${
                  sizeMode === s
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Размер {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(CANVAS_FORMATS) as FormatId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onChangeFormat(id)}
              className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition ${
                formatId === id
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {CANVAS_FORMATS[id].name.split(" ")[0]}
              <span className="block text-[9px] opacity-75">
                {CANVAS_FORMATS[id].width}×{CANVAS_FORMATS[id].height}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Фон холста</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => onChangeBgStyle("stripes")}
              className={`rounded-md px-2 py-0.5 ${
                bgStyle === "stripes" ? "bg-white font-semibold text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              С декором
            </button>
            <button
              type="button"
              onClick={() => onChangeBgStyle("solid")}
              className={`rounded-md px-2 py-0.5 ${
                bgStyle === "solid" ? "bg-white font-semibold text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              Сплошной
            </button>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[11px] font-medium text-slate-600">
            Авто-раскладка текущих слоёв
          </span>
          <div className="grid grid-cols-3 gap-1">
            {LAYOUT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onApplyLayout(p.id)}
                title={p.desc}
                className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Цветовая палитра */}
      <div className="space-y-3 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
            <PaletteIcon className="h-3.5 w-3.5 text-indigo-600" />
            Цветовая схема
          </h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleDownloadPaletteJson}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-100"
              title="Экспорт текущей палитры в JSON"
            >
              JSON ↓
            </button>
            <button
              type="button"
              onClick={() => setShowJsonImport((v) => !v)}
              className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-200"
            >
              <Upload className="h-2.5 w-2.5" /> Загрузить
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {palettes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPalette(p.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition ${
                activePalette.id === p.id
                  ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="flex h-3.5 w-5 overflow-hidden rounded border border-slate-300">
                <span className="w-1/2" style={{ backgroundColor: p.colors.bgBase }} />
                <span className="w-1/2" style={{ backgroundColor: p.colors.obj2 }} />
              </span>
              {p.name}
            </button>
          ))}
        </div>

        {showJsonImport && (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-slate-300 hover:bg-indigo-50">
              <Upload className="h-3 w-3" /> Выбрать .json файл
              <input type="file" accept=".json,application/json" onChange={handleFileImport} className="hidden" />
            </label>
            <textarea
              rows={3}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"name":"Неон","bgBase":"#E8E4FF","bgMid":"#B4A5FF","bgDark":"#5E4AE3","ink":"#181817","obj1":"#FFE066","obj2":"#FF6B9D","obj3":"#C3F8FF","objLight":"#FFFFFF"}'
              className="w-full rounded border border-slate-300 bg-white p-1.5 font-mono text-[10px]"
            />
            {jsonError && <p className="text-[11px] text-rose-600">{jsonError}</p>}
            <button
              type="button"
              onClick={handleImportJson}
              className="w-full rounded bg-slate-900 py-1 text-[11px] font-semibold text-white hover:bg-indigo-600"
            >
              Применить палитру из JSON
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="mb-1 block text-[10px] font-semibold text-slate-500">
              Цвета фона
            </span>
            <div className="space-y-1">
              {BG_COLOR_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>{label}</span>
                  <input
                    type="color"
                    value={activePalette.colors[key]}
                    onChange={(e) => onUpdateActivePaletteColor(key, e.target.value)}
                    className="h-5 w-7 cursor-pointer rounded border border-slate-300 bg-transparent p-0"
                  />
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-[10px] font-semibold text-slate-500">
              Цвета объектов
            </span>
            <div className="space-y-1">
              {OBJ_COLOR_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>{label}</span>
                  <input
                    type="color"
                    value={activePalette.colors[key]}
                    onChange={(e) => onUpdateActivePaletteColor(key, e.target.value)}
                    className="h-5 w-7 cursor-pointer rounded border border-slate-300 bg-transparent p-0"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[10px] leading-tight text-slate-400">
          Цвета объектов изолированы и никогда не применяются к фону или фоновым объектам.
        </p>
      </div>

      {/* Свойства выбранного объекта */}
      {selectedObj && selectedItem && (
        <div className="space-y-3 border-b border-slate-200 bg-indigo-50/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800">
              Выбран: {selectedItem.name}
            </h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onDuplicateObject(selectedObj.uid)}
                className="rounded p-1 text-slate-600 hover:bg-white hover:text-indigo-600"
                title="Дублировать"
              >
                <CopyPlus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteObject(selectedObj.uid)}
                className="rounded p-1 text-slate-600 hover:bg-white hover:text-rose-600"
                title="Удалить"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Состояние</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px]">
              {(["main", "bg"] as ObjectRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onUpdateObject(selectedObj.uid, { role: r })}
                  className={`rounded-md px-2 py-0.5 font-medium ${
                    selectedObj.role === r
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r === "main" ? "Главный" : "Фоновый"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <RotateCw className="h-3 w-3" /> Поворот
              </span>
              <span className="font-mono text-[11px]">{selectedObj.rotation}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={selectedObj.rotation}
              onChange={(e) =>
                onUpdateObject(selectedObj.uid, { rotation: Number(e.target.value) })
              }
              className="w-full accent-indigo-600"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Пропорции зафиксированы правилом библиотеки (меняется только L/S для всей сцены).
          </p>
        </div>
      )}

      {/* Порядок слоёв */}
      <div className="flex-1 p-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
          <Layers className="h-3.5 w-3.5 text-slate-600" />
          Слои ({objects.length})
        </h2>
        {objects.length === 0 ? (
          <p className="text-xs text-slate-400">
            Холст пуст. Добавьте объекты слева или соберите композицию по метафоре.
          </p>
        ) : (
          <div className="space-y-1">
            {[...objects].reverse().map((obj) => {
              const item = getLibraryItem(obj.itemId);
              const isSelected = obj.uid === selectedUid;
              return (
                <div
                  key={obj.uid}
                  onClick={() => onSelectObject(obj.uid)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        obj.role === "main" ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    />
                    <span className="truncate font-medium">{item?.name || obj.itemId}</span>
                    <span className="text-[10px] text-slate-400">
                      {obj.role === "main" ? "Главн." : "Фон"}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onMoveLayer(obj.uid, "up")}
                      className="rounded p-1 text-slate-500 hover:bg-slate-200/70"
                      title="Выше"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveLayer(obj.uid, "down")}
                      className="rounded p-1 text-slate-500 hover:bg-slate-200/70"
                      title="Ниже"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteObject(obj.uid)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Удалить"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
