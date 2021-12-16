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

function asciiToBytes(str: string) {
  const byteArray = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    byteArray[i] = str.charCodeAt(i) & 255;
  }
  return byteArray;
}

export const enum Encoding {
  Utf8 = 0,
  Ascii = 1,
}

export function writeToBytes(
  bytes: Uint8Array,
  data: string,
  offset: number,
  /** latin1 is ascii */
  encoding: Encoding,
) {
  const bytesLength = bytes.length;
  const src = encoding
    ? asciiToBytes(data)
    : utf8ToBytes(data, bytesLength - offset);

  let i;
  for (i = 0; i < bytesLength; ++i) {
    if (i + offset >= bytesLength || i >= src.length) {
      break;
    }
    bytes[i + offset] = src[i];
  }
  return i;
}

export function utf8Slice(buf: Uint8Array, start: number, end: number) {
  end = Math.min(buf.length, end);
  const res = [];
  let i = start;
  while (i < end) {
    const firstByte = buf[i];
    let codePoint = null;
    let bytesPerSequence = firstByte > 239
      ? 4
      : firstByte > 223
      ? 3
      : firstByte > 191
      ? 2
      : 1;
    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 128) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 192) === 128) {
            tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
            if (tempCodePoint > 127) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 12 |
              (secondByte & 63) << 6 | thirdByte & 63;
            if (
              tempCodePoint > 2047 &&
              (tempCodePoint < 55296 || tempCodePoint > 57343)
            ) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if (
            (secondByte & 192) === 128 && (thirdByte & 192) === 128 &&
            (fourthByte & 192) === 128
          ) {
            tempCodePoint = (firstByte & 15) << 18 |
              (secondByte & 63) << 12 | (thirdByte & 63) << 6 |
              fourthByte & 63;
            if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
              codePoint = tempCodePoint;
            }
          }
      }
    }
    if (codePoint === null) {
      codePoint = 65533;
      bytesPerSequence = 1;
    } else if (codePoint > 65535) {
      codePoint -= 65536;
      res.push(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    res.push(codePoint);
    i += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}

const MAX_ARGUMENTS_LENGTH = 4096;

function decodeCodePointsArray(codePoints: number[]) {
  const len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode(...codePoints);
  }
  let res = "";
  let i = 0;
  while (i < len) {
    res += String.fromCharCode(
      ...codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH),
    );
  }
  return res;
}
