import { decodeHexString, encodeHexString } from "../utils.ts";
import { BSONTypeError } from "./error.ts";

// Validation regex for v4 uuid (validates with or without dashes)
const VALIDATION_REGEX =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15})$/i;

export const uuidValidateString = (str: string): boolean =>
  typeof str === "string" && VALIDATION_REGEX.test(str);

export const uuidHexStringToBuffer = (hexString: string): Uint8Array => {
  if (!uuidValidateString(hexString)) {
    throw new BSONTypeError(
      'UUID string representations must be a 32 or 36 character hex string (dashes excluded/included). Format: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" or "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".',
    );
  }

  const sanitizedHexString = hexString.replace(/-/g, "");
  return decodeHexString(sanitizedHexString);
};

const hexTable = new TextEncoder().encode("0123456789abcdef");
const textDecoder = new TextDecoder();

export const bufferToUuidHexString = (
  bytes: Uint8Array,
  includeDashes = true,
): string => {
  if (!includeDashes) return encodeHexString(bytes);
  const dst = new Uint8Array(36);
  let srcIndex = 0;
  let dstIndex = 0;
  while (srcIndex < bytes.length) {
    if (
      dstIndex === 8 || dstIndex === 13 || dstIndex === 18 || dstIndex === 23
    ) {
      dst[dstIndex] = 45;
      dstIndex++;
      continue;
    }
    const v = bytes[srcIndex];
    dst[dstIndex] = hexTable[v >> 4];
    dst[dstIndex + 1] = hexTable[v & 0x0f];
    dstIndex += 2;
    srcIndex++;
  }
  return textDecoder.decode(dst);
};
