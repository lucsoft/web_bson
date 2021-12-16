import { Buffer } from "../../deps.ts";
export const assertArrayEqual = (array1: [], array2: []) => {
  if (array1.length !== array2.length) return false;
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) return false;
  }

  return true;
};

// String to arraybuffer
export const stringToArrayBuffer = (string: string) => {
  const dataBuffer = new Uint8Array(new ArrayBuffer(string.length));
  // Return the strings
  for (let i = 0; i < string.length; i++) {
    dataBuffer[i] = string.charCodeAt(i);
  }
  // Return the data buffer
  return dataBuffer;
};

// String to arraybuffer
export const stringToArray = (string: string) => {
  const dataBuffer = new Array(string.length);
  // Return the strings
  for (let i = 0; i < string.length; i++) {
    dataBuffer[i] = string.charCodeAt(i);
  }
  // Return the data buffer
  return dataBuffer;
};

export const Utf8 = { // public => method for url encoding
  encode: (string: string) => {
    string = string.replace(/\r\n/g, "\n");
    let utftext = "";

    for (let n = 0; n < string.length; n++) {
      const c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else {
        if (c > 127 && c < 2048) {
          utftext += String.fromCharCode((c >> 6) | 192);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        }
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  },

  // public method for url decoding
  decode: (utftext: string) => {
    let string = "";
    let i = 0;
    let c = 0;
    let c2 = 0;
    let c3 = 0;

    while (i < utftext.length) {
      c = utftext.charCodeAt(i);
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(
          ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63),
        );
        i += 3;
      }
    }
    return string;
  },
};
/**
 * A helper to turn hex string sequences into BSON.
 * Omit the first 8 hex digits for the document it will be calculated
 * As well as the BSON document's null terminator '00'
 *
 * @example
 * ```js
 * const bytes = bufferFromHexArray([
 *   '10', // int32 type
 *   '6100', // 'a' key with key null terminator
 *   '01000000' // little endian int32
 * ])
 * serialize(bytes) // { a: 1 }
 * ```
 */
export const bufferFromHexArray = (array: string[]) => {
  const string = array.concat(["00"]).join("");
  const size = string.length / 2 + 4;

  const byteLength = [
    size & 0xff,
    (size >> 8) & 0xff,
    (size >> 16) & 0xff,
    (size >> 24) & 0xff,
  ]
    .map((n) => {
      const hexCode = n.toString(16);
      return hexCode.length === 2 ? hexCode : "0" + hexCode;
    })
    .join("");

  return Buffer.from(byteLength + string, "hex");
};

/** =>
 * A helper to calculate the byte size of a string (including null)
 *
 * ```js
 * const x = stringToUTF8HexBytes('ab') // { x: '03000000616200' }
 */
export const stringToUTF8HexBytes = (str: string) => {
  const b = Buffer.from(str, "utf8");
  const len = b.byteLength;
  const out = Buffer.alloc(len + 4 + 1);
  out.writeInt32LE(len + 1, 0);
  out.set(b, 4);
  out[len + 1] = 0x00;
  return out.toString("hex");
};
