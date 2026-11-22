import { useRef, useState, type FC, type PointerEvent } from "react";
import { CANVAS_FORMATS } from "../data/formats";
import type {
  BackgroundStyle,
  FormatId,
  Palette,
  SceneObject,
  SizeMode,
} from "../types/composer";
import {
  buildBackgroundMarkup,
  colorizeSvgBody,
  getEffectiveScale,
  getLibraryItem,
} from "../utils/svgCompiler";

interface CanvasStageProps {
  formatId: FormatId;
  sizeMode: SizeMode;
  palette: Palette;
  bgStyle: BackgroundStyle;
  objects: SceneObject[];
  selectedUid: string | null;
  onSelect: (uid: string | null) => void;
  onMoveObject: (uid: string, x: number, y: number) => void;
}

export const CanvasStage: FC<CanvasStageProps> = ({
  formatId,
  sizeMode,
  palette,
  bgStyle,
  objects,
  selectedUid,
  onSelect,
  onMoveObject,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragState, setDragState] = useState<{
    uid: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const fmt = CANVAS_FORMATS[formatId];
  const bgMarkup = buildBackgroundMarkup(fmt.width, fmt.height, palette, bgStyle);

  const handlePointerDown = (e: PointerEvent, obj: SceneObject) => {
    e.stopPropagation();
    onSelect(obj.uid);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDragState({
      uid: obj.uid,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: obj.x,
      origY: obj.y,
    });
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragState || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleX = fmt.width / rect.width;
    const scaleY = fmt.height / rect.height;

    const dx = (e.clientX - dragState.startClientX) * scaleX;
    const dy = (e.clientY - dragState.startClientY) * scaleY;

    onMoveObject(
      dragState.uid,
      Math.round(dragState.origX + dx),
      Math.round(dragState.origY + dy)
    );
  };

  const handlePointerUp = () => {
    setDragState(null);
  };

  return (
    <div
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-100 p-4 md:p-8"
      onClick={() => onSelect(null)}
    >
      <div
        className="relative flex max-h-full max-w-full items-center justify-center rounded-xl shadow-xl ring-1 ring-slate-900/10"
        style={{
          aspectRatio: `${fmt.width} / ${fmt.height}`,
          width: fmt.width >= fmt.height ? "min(100%, 860px)" : "auto",
          height: fmt.height > fmt.width ? "min(100%, 660px)" : "auto",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${fmt.width} ${fmt.height}`}
          className="h-full w-full select-none rounded-xl"
          style={{ touchAction: "none" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <clipPath id="stage-clip">
              <rect width={fmt.width} height={fmt.height} />
            </clipPath>
          </defs>

          <g clipPath="url(#stage-clip)">
            <g dangerouslySetInnerHTML={{ __html: bgMarkup }} />

            {objects.map((obj) => {
              const item = getLibraryItem(obj.itemId);
              if (!item) return null;
              const variant = item[sizeMode][obj.role];
              const scale = getEffectiveScale(item, sizeMode, formatId);
              const colorized = colorizeSvgBody(variant.body, palette, obj.role);
              const cx = variant.width / 2;
              const cy = variant.height / 2;
              const isSelected = obj.uid === selectedUid;
              const boxW = variant.width * scale;
              const boxH = variant.height * scale;

              return (
                <g
                  key={obj.uid}
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => handlePointerDown(e, obj)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <g
                    transform={`translate(${obj.x} ${obj.y}) rotate(${obj.rotation}) scale(${scale}) translate(-${cx} -${cy})`}
                    dangerouslySetInnerHTML={{ __html: colorized }}
                  />
                  {isSelected && (
                    <g transform={`translate(${obj.x} ${obj.y}) rotate(${obj.rotation})`}>
                      <rect
                        x={-boxW / 2 - 6}
                        y={-boxH / 2 - 6}
                        width={boxW + 12}
                        height={boxH + 12}
                        rx={8}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth={3}
                        strokeDasharray="8 6"
                        pointerEvents="none"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {fmt.width}×{fmt.height} • Детализация {sizeMode} • Вектор SVG
        </div>
      </div>
    </div>
  );
};
