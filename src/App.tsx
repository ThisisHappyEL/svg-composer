import { useEffect, useState } from "react";
import { Check, Code2, Download, Trash2, X } from "lucide-react";
import { CanvasStage } from "./components/CanvasStage";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import { CANVAS_FORMATS, getSlotPosition } from "./data/formats";
import { DEFAULT_PALETTES } from "./data/palettes";
import type {
  AISettings,
  BackgroundStyle,
  FormatId,
  LayoutPresetId,
  ObjectRole,
  Palette,
  PaletteColors,
  SceneObject,
  SizeMode,
} from "./types/composer";
import { composeByMetaphor, parseComponentNamesPrompt } from "./utils/aiComposer";
import { buildExportSvg } from "./utils/svgCompiler";

function makeUid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildStarterScene(formatId: FormatId): SceneObject[] {
  const starter: Array<{ itemId: string; role: ObjectRole }> = [
    { itemId: "lamp", role: "bg" },
    { itemId: "book", role: "main" },
    { itemId: "phone", role: "main" },
  ];
  return starter.map((s, idx) => {
    const pos = getSlotPosition(formatId, "clustered", idx);
    return {
      uid: makeUid(),
      itemId: s.itemId,
      role: s.role,
      ...pos,
    };
  });
}

export function App() {
  const [formatId, setFormatId] = useState<FormatId>("banner");
  const [sizeMode, setSizeMode] = useState<SizeMode>("L");
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>("stripes");
  const [palettes, setPalettes] = useState<Palette[]>(DEFAULT_PALETTES);
  const [activePaletteId, setActivePaletteId] = useState<string>(DEFAULT_PALETTES[0].id);
  const [objects, setObjects] = useState<SceneObject[]>(() => buildStarterScene("banner"));
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem("svg_composer_ai");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { provider: "local", apiKey: "" };
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [svgModalOpen, setSvgModalOpen] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("svg_composer_ai", JSON.stringify(aiSettings));
    } catch {
      // ignore
    }
  }, [aiSettings]);

  const activePalette =
    palettes.find((p) => p.id === activePaletteId) || palettes[0];

  const handleChangeFormat = (nextFormat: FormatId) => {
    if (nextFormat === formatId) return;
    const prevFmt = CANVAS_FORMATS[formatId];
    const nextFmt = CANVAS_FORMATS[nextFormat];
    setObjects((prev) =>
      prev.map((obj) => ({
        ...obj,
        x: Math.round((obj.x / prevFmt.width) * nextFmt.width),
        y: Math.round((obj.y / prevFmt.height) * nextFmt.height),
      }))
    );
    setFormatId(nextFormat);
  };

  const handleApplyLayout = (preset: LayoutPresetId) => {
    setObjects((prev) =>
      prev.map((obj, idx) => {
        const pos = getSlotPosition(formatId, preset, idx);
        return { ...obj, ...pos };
      })
    );
  };

  const handleAddObject = (itemId: string, role: ObjectRole) => {
    const pos = getSlotPosition(formatId, "clustered", objects.length);
    const created: SceneObject = {
      uid: makeUid(),
      itemId,
      role,
      ...pos,
    };
    setObjects((prev) => (role === "bg" ? [created, ...prev] : [...prev, created]));
    setSelectedUid(created.uid);
  };

  const handleMoveObject = (uid: string, x: number, y: number) => {
    setObjects((prev) => prev.map((o) => (o.uid === uid ? { ...o, x, y } : o)));
  };

  const handleUpdateObject = (uid: string, patch: Partial<SceneObject>) => {
    setObjects((prev) => prev.map((o) => (o.uid === uid ? { ...o, ...patch } : o)));
  };

  const handleDuplicateObject = (uid: string) => {
    const found = objects.find((o) => o.uid === uid);
    if (!found) return;
    const copy: SceneObject = {
      ...found,
      uid: makeUid(),
      x: found.x + 36,
      y: found.y + 36,
    };
    setObjects((prev) => [...prev, copy]);
    setSelectedUid(copy.uid);
  };

  const handleDeleteObject = (uid: string) => {
    setObjects((prev) => prev.filter((o) => o.uid !== uid));
    if (selectedUid === uid) setSelectedUid(null);
  };

  const handleMoveLayer = (uid: string, dir: "up" | "down") => {
    setObjects((prev) => {
      const idx = prev.findIndex((o) => o.uid === uid);
      if (idx === -1) return prev;
      const target = dir === "up" ? idx + 1 : idx - 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const handleAddCustomPalette = (palette: Palette) => {
    setPalettes((prev) => [...prev, palette]);
    setActivePaletteId(palette.id);
  };

  const handleUpdateActivePaletteColor = (key: keyof PaletteColors, hex: string) => {
    setPalettes((prev) =>
      prev.map((p) =>
        p.id === activePalette.id
          ? { ...p, colors: { ...p.colors, [key]: hex.toUpperCase() } }
          : p
      )
    );
  };

  const handleComposeMetaphor = async (prompt: string) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const plan = await composeByMetaphor(prompt, aiSettings);
      const nextObjects: SceneObject[] = plan.items.map((item, idx) => {
        const pos = getSlotPosition(formatId, plan.layoutPreset, idx);
        return {
          uid: makeUid(),
          itemId: item.itemId,
          role: item.role,
          ...pos,
        };
      });
      setObjects(nextObjects);
      setActivePaletteId(plan.paletteId);
      setSelectedUid(null);
      setAiNote(`${plan.providerLabel}: ${plan.reasoning}`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Ошибка генерации");
    } finally {
      setAiLoading(false);
    }
  };

  const handleComposeByNames = (namesInput: string) => {
    setAiError(null);
    const parsed = parseComponentNamesPrompt(namesInput);
    if (parsed.length === 0) {
      setAiError("Не удалось распознать названия объектов. Попробуйте: книга, телефон, монета.");
      return;
    }
    const nextObjects: SceneObject[] = parsed.map((item, idx) => {
      const pos = getSlotPosition(formatId, "clustered", idx);
      return {
        uid: makeUid(),
        itemId: item.itemId,
        role: item.role,
        ...pos,
      };
    });
    setObjects(nextObjects);
    setSelectedUid(null);
    setAiNote(`Собрано по списку компонентов (${parsed.length} шт.).`);
  };

  const getExportMarkup = () =>
    buildExportSvg({
      formatId,
      sizeMode,
      palette: activePalette,
      bgStyle,
      objects,
    });

  const handleDownloadSvg = () => {
    const svgText = getExportMarkup();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `composition-${formatId}-${sizeMode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySvg = async () => {
    await navigator.clipboard.writeText(getExportMarkup());
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 1800);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 lg:h-screen lg:overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            SVG
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-slate-900">
              SVG Composer
            </h1>
            <p className="text-[11px] text-slate-500">
              Векторный конструктор композиций из библиотеки компонентов
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setObjects([]);
              setSelectedUid(null);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Очистить
          </button>

          <button
            type="button"
            onClick={() => setSvgModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Code2 className="h-3.5 w-3.5" /> Код SVG
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-600"
          >
            <Download className="h-3.5 w-3.5" /> Скачать SVG
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <LeftSidebar
          sizeMode={sizeMode}
          palette={activePalette}
          aiSettings={aiSettings}
          aiLoading={aiLoading}
          aiNote={aiNote}
          aiError={aiError}
          onChangeAiSettings={setAiSettings}
          onComposeMetaphor={handleComposeMetaphor}
          onComposeByNames={handleComposeByNames}
          onAddObject={handleAddObject}
        />

        <CanvasStage
          formatId={formatId}
          sizeMode={sizeMode}
          palette={activePalette}
          bgStyle={bgStyle}
          objects={objects}
          selectedUid={selectedUid}
          onSelect={setSelectedUid}
          onMoveObject={handleMoveObject}
        />

        <RightSidebar
          formatId={formatId}
          sizeMode={sizeMode}
          bgStyle={bgStyle}
          palettes={palettes}
          activePalette={activePalette}
          objects={objects}
          selectedUid={selectedUid}
          onChangeFormat={handleChangeFormat}
          onChangeSize={setSizeMode}
          onChangeBgStyle={setBgStyle}
          onApplyLayout={handleApplyLayout}
          onSelectPalette={setActivePaletteId}
          onAddCustomPalette={handleAddCustomPalette}
          onUpdateActivePaletteColor={handleUpdateActivePaletteColor}
          onSelectObject={setSelectedUid}
          onUpdateObject={handleUpdateObject}
          onDuplicateObject={handleDuplicateObject}
          onDeleteObject={handleDeleteObject}
          onMoveLayer={handleMoveLayer}
        />
      </div>

      {svgModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setSvgModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-800">
                Чистый векторный SVG-код (без растра)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  {copiedSvg ? <Check className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
                  {copiedSvg ? "Скопировано" : "Копировать"}
                </button>
                <button
                  type="button"
                  onClick={() => setSvgModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <pre className="overflow-auto bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-emerald-300">
              {getExportMarkup()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
