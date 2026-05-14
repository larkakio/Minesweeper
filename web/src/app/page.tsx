import { CheckInPanel } from "@/components/CheckInPanel";
import { MinesweeperGame } from "@/components/MinesweeperGame";
import { WalletBar } from "@/components/WalletBar";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-black/55 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-fuchsia-400/90">
              Base // L2
            </p>
            <h1 className="neon-text text-lg font-black tracking-wide sm:text-xl">
              NeonSweep
            </h1>
          </div>
          <WalletBar />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <MinesweeperGame />
        <CheckInPanel />
      </main>

      <footer className="border-t border-violet-500/20 px-4 py-3 text-center font-mono text-[10px] text-zinc-500">
        Standard web app for Base · Swipe field controls · Builder Code via ox
        ERC-8021 suffix on check-in txs
      </footer>
    </div>
  );
}
