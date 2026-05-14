import { createConfig, createStorage, cookieStorage, http } from "wagmi";
import { base, mainnet } from "viem/chains";
import { baseAccount, injected } from "wagmi/connectors";
import { getBuilderDataSuffix } from "@/lib/builder-data-suffix";

const appName = "NeonSweep";

const connectors = [
  injected(),
  baseAccount({
    appName,
  }),
];

/** Appends ERC-8021 attribution to wallet txs (Base Builder Codes). */
const dataSuffix = getBuilderDataSuffix();

export const wagmiConfig = createConfig({
  chains: [base, mainnet],
  connectors,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  ...(dataSuffix ? { dataSuffix } : {}),
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
