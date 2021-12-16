import { hex } from "./deps.ts";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function decodeHexString(hexString: string): Uint8Array {
  return hex.decode(textEncoder.encode(hexString));
}

export function encodeHexString(uint8Array: Uint8Array): string {
  return textDecoder.decode(hex.encode(uint8Array));
}
