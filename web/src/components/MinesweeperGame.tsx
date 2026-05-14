"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildEmptyGrid,
  chordCell,
  clearFlag,
  isWin,
  LEVELS,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
  type CellModel,
} from "@/lib/minesweeper";

const SWIPE_MIN = 36;
const TAP_MAX = 14;

type PointerStart = {
  r: number;
  c: number;
  x: number;
  y: number;
};

export function MinesweeperGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const isLast = levelIndex >= LEVELS.length - 1;

  return (
    <div className="relative mx-auto w-full max-w-lg select-none">
      <SectorBoard
        key={levelIndex}
        levelIndex={levelIndex}
        levelCount={LEVELS.length}
        isLastLevel={isLast}
        onNextSector={() => {
          if (!isLast) setLevelIndex((i) => i + 1);
          else setLevelIndex(0);
        }}
      />
    </div>
  );
}

type SectorBoardProps = {
  levelIndex: number;
  levelCount: number;
  isLastLevel: boolean;
  onNextSector: () => void;
};

function SectorBoard({
  levelIndex,
  levelCount,
  isLastLevel,
  onNextSector,
}: SectorBoardProps) {
  const spec = LEVELS[Math.min(levelIndex, LEVELS.length - 1)]!;
  const { rows, cols, mines, name } = spec;

  const [grid, setGrid] = useState<CellModel[]>(() => buildEmptyGrid(rows, cols));
  const [phase, setPhase] = useState<"play" | "won" | "lost">("play");
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const startRef = useRef<PointerStart | null>(null);

  const mineCount = useMemo(() => {
    const flagged = grid.filter((c) => c.flagged).length;
    return Math.max(0, mines - flagged);
  }, [grid, mines]);

  const applyReveal = useCallback(
    (r: number, c: number) => {
      if (phaseRef.current !== "play") return;
      setGrid((prev) => {
        if (phaseRef.current !== "play") return prev;
        const seeded = prev.some((x) => x.isMine);
        let g = prev;
        if (!seeded) {
          g = placeMines(buildEmptyGrid(rows, cols), rows, cols, mines, r, c);
        }
        const { grid: next, hitMine } = revealCell(g, rows, cols, r, c);
        if (hitMine) {
          setPhase("lost");
          return revealAllMines(next);
        }
        if (isWin(next)) setPhase("won");
        return next;
      });
    },
    [cols, mines, rows],
  );

  const applyChord = useCallback(
    (r: number, c: number) => {
      if (phaseRef.current !== "play") return;
      setGrid((prev) => {
        if (phaseRef.current !== "play") return prev;
        const { grid: next, hitMine } = chordCell(prev, rows, cols, r, c);
        if (hitMine) {
          setPhase("lost");
          return revealAllMines(next);
        }
        if (isWin(next)) setPhase("won");
        return next;
      });
    },
    [cols, rows],
  );

  const applyFlagToggle = useCallback(
    (r: number, c: number) => {
      if (phaseRef.current !== "play") return;
      setGrid((prev) => toggleFlag(prev, rows, cols, r, c));
    },
    [cols, rows],
  );

  const applyUnflag = useCallback(
    (r: number, c: number) => {
      if (phaseRef.current !== "play") return;
      setGrid((prev) => clearFlag(prev, rows, cols, r, c));
    },
    [cols, rows],
  );

  const onPointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (phaseRef.current !== "play") return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = {
      r,
      c,
      x: e.clientX,
      y: e.clientY,
    };
  };

  const onPointerUp = (r: number, c: number, e: React.PointerEvent) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start || start.r !== r || start.c !== c) return;
    if (phaseRef.current !== "play") return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= TAP_MAX) {
      applyReveal(r, c);
      return;
    }

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= SWIPE_MIN) {
      if (dx > 0) applyFlagToggle(r, c);
      else applyUnflag(r, c);
      return;
    }

    if (Math.abs(dy) > Math.abs(dx) && dy <= -SWIPE_MIN) {
      applyChord(r, c);
    }
  };

  return (
    <>
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/80">
            Neural grid
          </p>
          <h2 className="neon-text text-xl font-bold tracking-tight text-transparent">
            {name}
          </h2>
        </div>
        <div className="text-right font-mono text-xs text-fuchsia-300">
          <div>Mines {mineCount}</div>
          <div className="text-cyan-300/80">
            L{levelIndex + 1}/{levelCount}
          </div>
        </div>
      </div>

      <div
        className="cyber-frame relative overflow-hidden rounded-2xl p-[1px]"
        style={{ touchAction: "none" }}
      >
        <div
          className="grid gap-[3px] rounded-2xl bg-black/60 p-2"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((cell, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            return (
              <button
                key={i}
                type="button"
                className={cellClass(cell)}
                style={{ aspectRatio: "1" }}
                onPointerDown={(e) => onPointerDown(r, c, e)}
                onPointerUp={(e) => onPointerUp(r, c, e)}
                onPointerCancel={() => {
                  startRef.current = null;
                }}
              >
                {cellContent(cell)}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="mt-3 space-y-1 font-mono text-[10px] leading-relaxed text-zinc-400 sm:text-xs">
        <li>
          <span className="text-cyan-300">Tap</span> — reveal a cell (first tap
          is always safe).
        </li>
        <li>
          <span className="text-fuchsia-300">Swipe right</span> — place / toggle
          marker.
        </li>
        <li>
          <span className="text-fuchsia-300">Swipe left</span> — clear marker.
        </li>
        <li>
          <span className="text-amber-300">Swipe up</span> on a revealed number —
          chord when markers match the count.
        </li>
      </ul>

      {phase === "won" ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border border-cyan-400/50 bg-black/80 px-6 text-center backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="win-title"
        >
          <p
            id="win-title"
            className="neon-text text-2xl font-black uppercase tracking-widest"
          >
            Sector cleared
          </p>
          <p className="mt-2 max-w-xs text-sm text-zinc-300">
            Neural sweep complete. Advance to the next density field.
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl border border-cyan-400/60 bg-cyan-500/20 px-6 py-3 text-sm font-bold uppercase tracking-widest text-cyan-100 hover:bg-cyan-500/30"
            onClick={() => onNextSector()}
          >
            {isLastLevel ? "Restart protocol" : "Next sector"}
          </button>
        </div>
      ) : null}

      {phase === "lost" ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border border-red-500/50 bg-black/85 px-6 text-center backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <p className="text-2xl font-black uppercase tracking-widest text-red-400">
            Cascade breach
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Mine triggered. Grid exposed — redeploy the scan.
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl border border-red-400/60 bg-red-500/15 px-6 py-3 text-sm font-bold uppercase tracking-widest text-red-100 hover:bg-red-500/25"
            onClick={() => {
              setGrid(buildEmptyGrid(rows, cols));
              setPhase("play");
            }}
          >
            Retry sector
          </button>
        </div>
      ) : null}
    </>
  );
}

function cellClass(cell: CellModel) {
  const base =
    "relative flex min-h-0 min-w-0 items-center justify-center rounded-md border text-[clamp(9px,2.6vw,13px)] font-mono font-bold transition-colors duration-150 active:scale-[0.97]";
  if (cell.revealed) {
    if (cell.isMine) {
      return `${base} border-red-500/60 bg-red-950/80 text-red-300`;
    }
    return `${base} border-cyan-500/25 bg-cyan-950/30 text-cyan-100 shadow-[inset_0_0_12px_rgba(0,255,240,0.08)]`;
  }
  return `${base} border-cyan-500/40 bg-gradient-to-br from-indigo-950/90 to-black/80 text-cyan-50 shadow-[0_0_14px_rgba(120,0,255,0.12)] hover:border-fuchsia-400/50`;
}

function cellContent(cell: CellModel) {
  if (!cell.revealed) {
    if (cell.flagged) {
      return (
        <span className="text-fuchsia-400 drop-shadow-[0_0_6px_#ff00aa]">▲</span>
      );
    }
    return <span className="opacity-25">·</span>;
  }
  if (cell.isMine) {
    return <span className="animate-pulse text-lg">●</span>;
  }
  if (cell.adjacent === 0) return null;
  const colors = [
    "",
    "text-cyan-300",
    "text-emerald-400",
    "text-amber-300",
    "text-fuchsia-400",
    "text-orange-400",
    "text-rose-400",
    "text-violet-300",
    "text-sky-200",
  ];
  const cls = colors[cell.adjacent] ?? "text-white";
  return <span className={cls}>{cell.adjacent}</span>;
}
