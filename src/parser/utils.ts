import { asciiToBytes } from "https://deno.land/std@0.117.0/node/internal_binding/_utils.ts";

/**
 * Normalizes our expected stringified form of a function across versions of node
 * @param fn - The function to stringify
 */
// deno-lint-ignore ban-types
export function normalizedFunctionString(fn: Function): string {
  return fn.toString().replace("function(", "function (");
}

export const randomBytes = (size: number) =>
  crypto.getRandomValues(new Uint8Array(size));

/**
 * @internal
 * this is to solve the `'someKey' in x` problem where x is unknown.
 * https://github.com/typescript-eslint/typescript-eslint/issues/1071#issuecomment-541955753
 */
export function isObjectLike(
  candidate: unknown,
): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null;
}

export function bytesCopy(
  target: Uint8Array,
  targetStart: number,
  source: Uint8Array,
  sourceStart: number,
  sourceEnd: number,
) {
  Uint8Array.prototype.set.call(
    target,
    source.subarray(sourceStart, sourceEnd),
    targetStart,
  );
}

function blitBuffer(
  src: number[] | Uint8Array,
  dst: Uint8Array,
  offset: number,
  length: number,
) {
  let i;
  for (i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) {
      break;
    }
    dst[i + offset] = src[i];
  }
  return i;
}

function utf8ToBytes(string: string, units: number) {
  units = units || Infinity;
  let codePoint;
  const length = string.length;
  let leadSurrogate = null;
  const bytes = [];
  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);
    if (codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1) {
            bytes.push(239, 191, 189);
          }
          continue;
        } else if (i + 1 === length) {
          if ((units -= 3) > -1) {
            bytes.push(239, 191, 189);
          }
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1) {
          bytes.push(239, 191, 189);
        }
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1) {
        bytes.push(239, 191, 189);
      }
    }
    leadSurrogate = null;
    if (codePoint < 128) {
      if ((units -= 1) < 0) {
        break;
      }
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0) {
        break;
      }
      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0) {
        break;
      }
      bytes.push(
        codePoint >> 12 | 224,
        codePoint >> 6 & 63 | 128,
        codePoint & 63 | 128,
      );
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0) {
        break;
      }
      bytes.push(
        codePoint >> 18 | 240,
        codePoint >> 12 & 63 | 128,
        codePoint >> 6 & 63 | 128,
        codePoint & 63 | 128,
      );
    } else {
      throw new Error("Invalid code point");
    }
  }
  return bytes;
}
export function writeToBytes(
  bytes: Uint8Array,
  data: string,
  offset: number,
  encoding: "utf8" | "ascii" | "latin1",
) {
  return blitBuffer(
    {
      ascii: asciiToBytes(data),
      utf8: utf8ToBytes(data, bytes.length - offset),
      latin1: asciiToBytes(data),
    }[encoding],
    bytes,
    offset,
    bytes.length,
  );
}
