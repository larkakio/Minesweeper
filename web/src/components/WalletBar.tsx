"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { base } from "viem/chains";
import {
  useConnect,
  useConnection,
  useDisconnect,
  useConnectors,
  useSwitchChain,
} from "wagmi";

export function WalletBar() {
  const { address, isConnected, chainId, status } = useConnection();
  const connectors = useConnectors();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // One-shot client mount for createPortal(document.body); avoids SSR flash.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration gate
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!sheetOpen || !mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen, mounted]);

  const wrongNetwork = isConnected && chainId !== base.id;

  const short = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  const handlePick = useCallback(
    async (connector: (typeof connectors)[number]) => {
      await connectAsync({ connector, chainId: base.id });
      setSheetOpen(false);
    },
    [connectAsync],
  );

  const sheet =
    mounted && sheetOpen ? (
      <div
        className="fixed inset-0 z-[9999] flex flex-col justify-end bg-black/70 backdrop-blur-sm"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setSheetOpen(false);
        }}
        onTouchStart={(e) => {
          if (e.target === e.currentTarget) setSheetOpen(false);
        }}
      >
        <div
          className="max-h-[min(70vh,520px)] overflow-hidden rounded-t-2xl border border-cyan-500/40 bg-[#070010] p-4 shadow-[0_0_40px_rgba(0,255,240,0.15)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-sheet-title"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2
              id="wallet-sheet-title"
              className="font-mono text-sm font-semibold tracking-wide text-cyan-200"
            >
              Connect wallet
            </h2>
            <button
              type="button"
              className="rounded-lg border border-fuchsia-500/50 px-3 py-1 text-xs text-fuchsia-200 hover:bg-fuchsia-500/10"
              aria-label="Close wallet picker"
              onClick={() => setSheetOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {connectors.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No wallet connectors in this environment. Open in the Base App
                browser or install a wallet extension.
              </p>
            ) : (
              connectors.map((c) => (
                <button
                  key={c.uid}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-left text-sm text-cyan-50 hover:border-cyan-400/60 hover:bg-cyan-500/10"
                  onClick={() => void handlePick(c)}
                >
                  <span className="font-mono">{c.name}</span>
                  <span className="text-xs text-cyan-300/70">Base</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {wrongNetwork ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100">
          <span>Wrong network</span>
          <button
            type="button"
            disabled={isSwitching}
            className="rounded-md border border-amber-300/60 bg-amber-400/20 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide hover:bg-amber-400/30 disabled:opacity-50"
            onClick={() => switchChain({ chainId: base.id })}
          >
            {isSwitching ? "Switching…" : "Switch to Base"}
          </button>
        </div>
      ) : null}
      {isConnected ? (
        <>
          <span className="font-mono text-xs text-cyan-200/90">{short}</span>
          <button
            type="button"
            className="rounded-lg border border-fuchsia-500/50 px-3 py-1.5 text-xs text-fuchsia-100 hover:bg-fuchsia-500/10"
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={status === "connecting"}
          className="rounded-lg border border-cyan-400/70 bg-cyan-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100 shadow-[0_0_20px_rgba(0,255,240,0.25)] hover:bg-cyan-500/25 disabled:opacity-50"
          onClick={() => setSheetOpen(true)}
        >
          {status === "connecting" ? "Connecting…" : "Connect wallet"}
        </button>
      )}
      {sheet ? createPortal(sheet, document.body) : null}
    </div>
  );
}
