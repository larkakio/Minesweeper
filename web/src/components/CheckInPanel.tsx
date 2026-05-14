"use client";

import { useCallback, useState } from "react";
import { base } from "viem/chains";
import {
  useConnection,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { checkInAbi } from "@/lib/check-in-abi";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

function envAddress(): `0x${string}` | undefined {
  const raw = process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS;
  if (!raw || !raw.startsWith("0x") || raw.length !== 42) return undefined;
  if (raw.toLowerCase() === ZERO) return undefined;
  return raw as `0x${string}`;
}

export function CheckInPanel() {
  const { address, isConnected, chainId } = useConnection();
  const contract = envAddress();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const [msg, setMsg] = useState<string | null>(null);

  const { data: streakOnChain } = useReadContract({
    address: contract,
    abi: checkInAbi,
    functionName: "streak",
    args: address ? [address] : ["0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(contract && address && isConnected) },
  });

  const busy = isWriting || isSwitching;

  const onCheckIn = useCallback(async () => {
    setMsg(null);
    if (!contract || !address) {
      setMsg("Deploy the check-in contract and set NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS.");
      return;
    }
    const baseId = base.id;
    try {
      if (chainId !== baseId) {
        await switchChainAsync({ chainId: baseId });
      }
      await writeContractAsync({
        address: contract,
        abi: checkInAbi,
        functionName: "checkIn",
        chainId: baseId,
      });
      setMsg("Check-in confirmed on-chain.");
    } catch (e) {
      const err = e as Error;
      setMsg(err.message ?? "Transaction failed");
    }
  }, [
    address,
    chainId,
    contract,
    switchChainAsync,
    writeContractAsync,
  ]);

  if (!isConnected) {
    return (
      <section className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4">
        <h3 className="font-mono text-sm font-semibold text-violet-200">
          Daily on-chain check-in
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          Connect your wallet on Base to log a gas-only check-in once per UTC
          day. Builder code attribution is appended automatically when
          configured.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-950/40 to-black/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-mono text-sm font-semibold text-violet-200">
          Daily check-in
        </h3>
        {typeof streakOnChain === "bigint" ? (
          <span className="font-mono text-xs text-fuchsia-300">
            Streak: {streakOnChain.toString()}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        One check-in per calendar day on Base. No ETH is sent — you only pay
        L2 gas. Builder Code attribution is appended via wagmi{" "}
        <code className="text-cyan-300/90">dataSuffix</code> (see Base docs).
      </p>
      <button
        type="button"
        disabled={busy || !contract}
        onClick={() => void onCheckIn()}
        className="mt-3 w-full rounded-xl border border-fuchsia-500/50 bg-fuchsia-600/20 py-2.5 text-sm font-semibold text-fuchsia-100 hover:bg-fuchsia-600/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {!contract
          ? "Contract not configured"
          : busy
            ? "Working…"
            : "Check in on Base"}
      </button>
      {msg ? (
        <p className="mt-2 text-xs text-cyan-200/90" role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
