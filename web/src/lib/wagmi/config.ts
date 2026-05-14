import { createConfig, createStorage, cookieStorage, http } from "wagmi";
import { base, mainnet } from "viem/chains";
import { baseAccount, injected } from "wagmi/connectors";

const appName = "NeonSweep";

const connectors = [
  injected(),
  baseAccount({
    appName,
  }),
];

export const wagmiConfig = createConfig({
  chains: [base, mainnet],
  connectors,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
