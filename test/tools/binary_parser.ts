import { BSONError } from "../../src/bson.ts";

/**
 * Binary Parser.
 * Jonas Raoni Soares Silva
 * http://jsfromhell.com/classes/binary-parser [v1.0]
 */
const chr = String.fromCharCode;

const maxBits: number[] = [];
for (let i = 0; i < 64; i++) {
  maxBits[i] = Math.pow(2, i);
}
/**
 * BinaryParser buffer constructor.
 */
class BinaryParserBuffer {
  buffer: number[];
  bigEndian: number;
  constructor(bigEndian: number = 0, buffer?: string) {
    this.bigEndian = bigEndian;
    this.buffer = [];
    this.setBuffer(buffer);
  }

  setBuffer(data?: string) {
    let l;
    let i;
    let b;

    if (data) {
      i = l = data.length;
      b = this.buffer = new Array(l);
      for (; i; b[l - i] = data.charCodeAt(--i));
      this.bigEndian && b.reverse();
    }
  }
  hasNeededBits(neededBits: number) {
    return this.buffer.length >= -(-neededBits >> 3);
  }
  checkBuffer(neededBits: number) {
    if (!this.hasNeededBits(neededBits)) {
      throw new BSONError("checkBuffer::missing bytes");
    }
  }

  readBits(start: number, length: number) {
    //shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)

    function shl(a: number, b: number) {
      for (
        ;
        b--;
        a = ((a %= 0x7f_ff_ff_ff + 1) & 0x40_00_00_00) === 0x40000000
          ? a * 2
          : (a - 0x40_00_00_00) * 2 + 0x7f_ff_ff_ff + 1
      );
      return a;
    }

    if (start < 0 || length <= 0) {
      return 0;
    }

    this.checkBuffer(start + length);

    let offsetLeft;
    const offsetRight = start % 8;
    const curByte = this.buffer.length - (start >> 3) - 1;
    let lastByte = this.buffer.length + (-(start + length) >> 3);
    let diff = curByte - lastByte;
    let sum = ((this.buffer[curByte] >> offsetRight) &
      ((1 << (diff ? 8 - offsetRight : length)) - 1)) +
      (diff && (offsetLeft = (start + length) % 8)
        ? (this.buffer[lastByte++] & ((1 << offsetLeft) - 1)) <<
          ((diff-- << 3) - offsetRight)
        : 0);

    for (
      ;
      diff;
      sum += shl(this.buffer[lastByte++], (diff-- << 3) - offsetRight)
    );

    return sum;
  }
}

export const BinaryParser = new class {
  bigEndian?: number;
  allowExceptions: boolean;
  Buffer: BinaryParserBuffer;

  constructor(bigEndian?: number, allowExceptions?: boolean) {
    this.bigEndian = bigEndian;
    this.allowExceptions = allowExceptions ?? true;
    this.Buffer = new BinaryParserBuffer(bigEndian);
  }

  warn(msg: string) {
    if (this.allowExceptions) {
      throw new BSONError(msg);
    }
    return 1;
  }

  decodeFloat(
    data: string,
    precisionBits: number,
    exponentBits: number,
  ) {
    const b = new BinaryParserBuffer(this.bigEndian, data);

    b.checkBuffer(precisionBits + exponentBits + 1);

    const bias = maxBits[exponentBits - 1] - 1;
    const signal = b.readBits(precisionBits + exponentBits, 1);
    const exponent = b.readBits(precisionBits, exponentBits);
    let significand = 0;
    let divisor = 2;
    let curByte = b.buffer.length + (-precisionBits >> 3) - 1;
    const startBit = precisionBits % 8 || 8;
    do {
      for (
        let byteValue = b.buffer[++curByte], mask = 1 << startBit;
        (mask >>= 1);
        byteValue & mask && (significand += 1 / divisor), divisor *= 2
      );
    } while ((precisionBits -= startBit));

    return exponent === (bias << 1) + 1
      ? significand ? NaN : signal ? -Infinity : +Infinity
      : (1 + signal * -2) *
        (exponent || significand
          ? !exponent
            ? Math.pow(2, -bias + 1) * significand
            : Math.pow(2, exponent - bias) * (1 + significand)
          : 0);
  }
  decodeInt(
    data: string,
    bits: number,
    signed: boolean,
    forceBigEndian?: number,
  ) {
    const x = new BinaryParserBuffer(this.bigEndian || forceBigEndian!, data)
      .readBits(0, bits);
    const max = maxBits[bits]; //max = Math.pow( 2, bits );

    return signed && x >= max / 2 ? x - max : x;
  }

  encodeFloat(
    data: string,
    precisionBits: number,
    exponentBits: number,
  ) {
    const bias = maxBits[exponentBits - 1] - 1;
    const minExp = -bias + 1;
    const maxExp = bias;
    const minUnnormExp = minExp - precisionBits;
    let n = parseFloat(data);
    const status = isNaN(n) || n === -Infinity || n === +Infinity ? n : 0;
    let exp = 0;
    const len = 2 * bias + 1 + precisionBits + 3;
    const bin = new Array<number>(len);
    let signal = (n = status !== 0 ? 0 : n) < 0;
    let intPart = Math.floor(n = Math.abs(n));
    let floatPart = n - intPart;
    let lastBit;
    let rounded;
    let result;
    let i;
    let j;

    for (i = len; i; bin[--i] = 0);

    for (
      i = bias + 2;
      intPart && i;
      bin[--i] = intPart % 2, intPart = Math.floor(intPart / 2)
    );

    for (
      i = bias + 1;
      floatPart > 0 && i;
      (bin[++i] = Number((floatPart *= 2) >= 1) - 0) && --floatPart
    );

    for (i = -1; ++i < len && !bin[i];);

    if (
      bin[
        (lastBit = precisionBits -
          1 +
          (i = (exp = bias + 1 - i) >= minExp && exp <= maxExp
            ? i + 1
            : bias + 1 - (exp = minExp - 1))) + 1
      ]
    ) {
      if (!(rounded = bin[lastBit])) {
        for (j = lastBit + 2; !rounded && j < len; rounded = bin[j++]);
      }

      for (
        j = lastBit + 1;
        rounded && --j >= 0;
        (bin[j] = bin[j] - 0) && (rounded = 0)
      );
    }

    for (i = i - 2 < 0 ? -1 : i - 3; ++i < len && !bin[i];);

    if ((exp = bias + 1 - i) >= minExp && exp <= maxExp) {
      ++i;
    } else if (exp < minExp) {
      exp !== bias + 1 - len && exp < minUnnormExp &&
        this.warn("encodeFloat::float underflow");
      i = bias + 1 - (exp = minExp - 1);
    }

    if (intPart || status !== 0) {
      this.warn(
        intPart ? "encodeFloat::float overflow" : "encodeFloat::" + status,
      );
      exp = maxExp + 1;
      i = bias + 2;

      if (status === -Infinity) {
        signal = !!1;
      } else if (isNaN(status)) {
        bin[i] = 1;
      }
    }

    for (
      n = Math.abs(exp + bias), j = exponentBits + 1, result = "";
      --j;
      result = (n % 2) + result, n = n >>= 1
    );

    let r;
    for (
      n = 0,
        j = 0,
        i = (result = (signal ? "1" : "0") + result +
          bin.slice(i, i + precisionBits).join(""))
          .length,
        r = [];
      i;
      j = (j + 1) % 8
    ) {
      n += (1 << j) * Number(result.charAt(--i));
      if (j === 7) {
        r[r.length] = String.fromCharCode(n);
        n = 0;
      }
    }

    r[r.length] = n ? String.fromCharCode(n) : "";

    return (this.bigEndian ? r.reverse() : r).join("");
  }
  encodeInt(
    data: number,
    bits: number,
    _signed: boolean,
    forceBigEndian = false,
  ) {
    const max = maxBits[bits];

    if (data >= max || data < -(max / 2)) {
      this.warn("encodeInt::overflow");
      data = 0;
    }

    if (data < 0) {
      data += max;
    }

    for (
      var r = [];
      data;
      r[r.length] = String.fromCharCode(data % 256),
        data = Math.floor(data / 256)
    );

    for (bits = -(-bits >> 3) - r.length; bits--; r[r.length] = "\0");

    return (this.bigEndian || forceBigEndian ? r.reverse() : r).join("");
  }

  toSmall(data: string) {
    return this.decodeInt(data, 8, true);
  }
  fromSmall(data: number) {
    return this.encodeInt(data, 8, true);
  }
  toByte(data: string) {
    return this.decodeInt(data, 8, false);
  }
  fromByte(data: number) {
    return this.encodeInt(data, 8, false);
  }
  toShort(data: string) {
    return this.decodeInt(data, 16, true);
  }
  fromShort(data: number) {
    return this.encodeInt(data, 16, true);
  }
  toWord(data: string) {
    return this.decodeInt(data, 16, false);
  }
  fromWord(data: number) {
    return this.encodeInt(data, 16, false);
  }
  toInt(data: string) {
    return this.decodeInt(data, 32, true);
  }
  fromInt(data: number) {
    return this.encodeInt(data, 32, true);
  }
  toLong(data: string) {
    return this.decodeInt(data, 64, true);
  }
  fromLong(data: number) {
    return this.encodeInt(data, 64, true);
  }
  toDWord(data: string) {
    return this.decodeInt(data, 32, false);
  }
  fromDWord(data: number) {
    return this.encodeInt(data, 32, false);
  }
  toQWord(data: string) {
    return this.decodeInt(data, 64, true);
  }
  fromQWord(data: number) {
    return this.encodeInt(data, 64, true);
  }
  toFloat(data: string) {
    return this.decodeFloat(data, 23, 8);
  }
  fromFloat(data: string) {
    return this.encodeFloat(data, 23, 8);
  }
  toDouble(data: string) {
    return this.decodeFloat(data, 52, 11);
  }
  fromDouble(data: string) {
    return this.encodeFloat(data, 52, 11);
  }

  // Factor out the encode so it can be shared by add_header and push_int32
  encode_int32(number: number, asArray: number) {
    var a, b, c, d, unsigned;
    unsigned = number < 0 ? number + 0x100000000 : number;
    a = Math.floor(unsigned / 0xffffff);
    unsigned &= 0xffffff;
    b = Math.floor(unsigned / 0xffff);
    unsigned &= 0xffff;
    c = Math.floor(unsigned / 0xff);
    unsigned &= 0xff;
    d = Math.floor(unsigned);
    return asArray
      ? [chr(a), chr(b), chr(c), chr(d)]
      : chr(a) + chr(b) + chr(c) + chr(d);
  }

  encode_int64(number: number) {
    let unsigned;
    unsigned = number < 0 ? number + 0x10000000000000000 : number;
    const a = Math.floor(unsigned / 0xffffffffffffff);
    unsigned &= 0xffffffffffffff;
    const b = Math.floor(unsigned / 0xffffffffffff);
    unsigned &= 0xffffffffffff;
    const c = Math.floor(unsigned / 0xffffffffff);
    unsigned &= 0xffffffffff;
    const d = Math.floor(unsigned / 0xffffffff);
    unsigned &= 0xffffffff;
    const e = Math.floor(unsigned / 0xffffff);
    unsigned &= 0xffffff;
    const f = Math.floor(unsigned / 0xffff);
    unsigned &= 0xffff;
    const g = Math.floor(unsigned / 0xff);
    unsigned &= 0xff;
    const h = Math.floor(unsigned);
    return chr(a) + chr(b) + chr(c) + chr(d) + chr(e) + chr(f) + chr(g) +
      chr(h);
  }

  /**
   * UTF8 methods
   */

  // Take a raw binary string and return a utf8 string
  decode_utf8(binaryStr: string) {
    const len = binaryStr.length;
    let decoded = "";
    let i = 0;
    let c = 0;
    let c2 = 0;
    let c3;

    while (i < len) {
      c = binaryStr.charCodeAt(i);
      if (c < 128) {
        decoded += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        c2 = binaryStr.charCodeAt(i + 1);
        decoded += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = binaryStr.charCodeAt(i + 1);
        c3 = binaryStr.charCodeAt(i + 2);
        decoded += String.fromCharCode(
          ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63),
        );
        i += 3;
      }
    }

    return decoded;
  }

  // Encode a cstring
  encode_cstring(s: string) {
    return unescape(encodeURIComponent(s)) + this.fromByte(0);
  }

  // Take a utf8 string and return a binary string
  encode_utf8(s: string) {
    let a = "";

    for (let n = 0, len = s.length; n < len; n++) {
      const c = s.charCodeAt(n);

      if (c < 128) {
        a += String.fromCharCode(c);
      } else {
        if (c > 127 && c < 2048) {
          a += String.fromCharCode((c >> 6) | 192);
        } else {
          a += String.fromCharCode((c >> 12) | 224);
          a += String.fromCharCode(((c >> 6) & 63) | 128);
        }
        a += String.fromCharCode((c & 63) | 128);
      }
    }

    return a;
  }

  hprint(s: string) {
    let number;

    for (let i = 0, len = s.length; i < len; i++) {
      number = s.charCodeAt(i) <= 15
        ? `0${s.charCodeAt(i).toString(16)}`
        : s.charCodeAt(i).toString(16);
      Deno.stdout.write(TextEncoder.prototype.encode(`${number} `));
    }

    Deno.stdout.write(TextEncoder.prototype.encode("\n\n"));
  }

  ilprint(s: string) {
    let number;

    for (let i = 0, len = s.length; i < len; i++) {
      if (s.charCodeAt(i) < 32) {
        number = s.charCodeAt(i) <= 15
          ? `0${s.charCodeAt(i).toString(10)}`
          : s.charCodeAt(i).toString(10);

        console.log(`${number} : `);
      } else {
        number = s.charCodeAt(i) <= 15
          ? `0${s.charCodeAt(i).toString(10)}`
          : s.charCodeAt(i).toString(10);
        console.log(`${number} : ${s.charAt(i)}`);
      }
    }
  }

  hlprint(s: string) {
    let number;

    for (let i = 0, len = s.length; i < len; i++) {
      if (s.charCodeAt(i) < 32) {
        number = s.charCodeAt(i) <= 15
          ? `0${s.charCodeAt(i).toString(16)}`
          : s.charCodeAt(i).toString(16);
        console.log(`${number} : `);
      } else {
        number = s.charCodeAt(i) <= 15
          ? `0${s.charCodeAt(i).toString(16)}`
          : s.charCodeAt(i).toString(16);
        console.log(`${number} : ${s.charAt(i)}`);
      }
    }
  }
}();
