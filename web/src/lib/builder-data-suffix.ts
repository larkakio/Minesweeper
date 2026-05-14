import type { Hex } from "viem";
import { Attribution } from "ox/erc8021";

/**
 * ERC-8021 calldata suffix for Base Builder Codes (see https://docs.base.org/base-chain/builder-codes/builder-codes).
 */
export function getBuilderDataSuffix(): Hex | undefined {
  const override = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX;
  if (override && /^0x[0-9a-fA-F]+$/.test(override)) {
    return override as Hex;
  }
  const code = process.env.NEXT_PUBLIC_BUILDER_CODE;
  if (!code) return undefined;
  return Attribution.toDataSuffix({ codes: [code] });
}
