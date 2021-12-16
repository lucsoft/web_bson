class Code1 {
  code;
  scope;
  constructor(code, scope) {
    this.code = code;
    this.scope = scope;
  }
  toJSON() {
    return {
      code: this.code,
      scope: this.scope,
    };
  }
  [Symbol.for("Deno.customInspect")]() {
    const codeJson = this.toJSON();
    return `new Code("${codeJson.code}"${
      codeJson.scope ? `, ${JSON.stringify(codeJson.scope)}` : ""
    })`;
  }
}
const BSON_INT32_MAX1 = 2147483647;
const BSON_INT32_MIN1 = -2147483648;
const JS_INT_MAX1 = 2 ** 53;
const JS_INT_MIN1 = -(2 ** 53);
var BSONData1;
(function (BSONData) {
  BSONData[BSONData["NUMBER"] = 1] = "NUMBER";
  BSONData[BSONData["STRING"] = 2] = "STRING";
  BSONData[BSONData["OBJECT"] = 3] = "OBJECT";
  BSONData[BSONData["ARRAY"] = 4] = "ARRAY";
  BSONData[BSONData["BINARY"] = 5] = "BINARY";
  BSONData[BSONData["UNDEFINED"] = 6] = "UNDEFINED";
  BSONData[BSONData["OID"] = 7] = "OID";
  BSONData[BSONData["BOOLEAN"] = 8] = "BOOLEAN";
  BSONData[BSONData["DATE"] = 9] = "DATE";
  BSONData[BSONData["NULL"] = 10] = "NULL";
  BSONData[BSONData["REGEXP"] = 11] = "REGEXP";
  BSONData[BSONData["DBPOINTER"] = 12] = "DBPOINTER";
  BSONData[BSONData["CODE"] = 13] = "CODE";
  BSONData[BSONData["SYMBOL"] = 14] = "SYMBOL";
  BSONData[BSONData["CODE_W_SCOPE"] = 15] = "CODE_W_SCOPE";
  BSONData[BSONData["INT"] = 16] = "INT";
  BSONData[BSONData["TIMESTAMP"] = 17] = "TIMESTAMP";
  BSONData[BSONData["LONG"] = 18] = "LONG";
  BSONData[BSONData["DECIMAL128"] = 19] = "DECIMAL128";
  BSONData[BSONData["MIN_KEY"] = 255] = "MIN_KEY";
  BSONData[BSONData["MAX_KEY"] = 127] = "MAX_KEY";
})(BSONData1 || (BSONData1 = {}));
const BSON_BINARY_SUBTYPE_DEFAULT1 = 0;
export { BSON_INT32_MAX1 as BSON_INT32_MAX };
export { BSON_INT32_MIN1 as BSON_INT32_MIN };
export { JS_INT_MAX1 as JS_INT_MAX };
export { JS_INT_MIN1 as JS_INT_MIN };
export { BSONData1 as BSONData };
export { BSON_BINARY_SUBTYPE_DEFAULT1 as BSON_BINARY_SUBTYPE_DEFAULT };
function normalizedFunctionString(fn) {
  return fn.toString().replace("function(", "function (");
}
const randomBytes = (size) => crypto.getRandomValues(new Uint8Array(size));
function isObjectLike(candidate) {
  return typeof candidate === "object" && candidate !== null;
}
function bytesCopy(target, targetStart, source, sourceStart, sourceEnd) {
  Uint8Array.prototype.set.call(
    target,
    source.subarray(sourceStart, sourceEnd),
    targetStart,
  );
}
function utf8ToBytes(string, units) {
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
function asciiToBytes(str) {
  const byteArray = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    byteArray[i] = str.charCodeAt(i) & 255;
  }
  return byteArray;
}
function writeToBytes(bytes, data, offset, encoding) {
  const bytesLength = bytes.length;
  const src = encoding == "ascii"
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
function utf8Slice(buf, start, end) {
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
            tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 |
              thirdByte & 63;
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
            tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 |
              (thirdByte & 63) << 6 | fourthByte & 63;
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
function decodeCodePointsArray(codePoints) {
  const len = codePoints.length;
  if (len <= 4096) {
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
function isDBRefLike(value) {
  return isObjectLike(value) && value.$id != null &&
    typeof value.$ref === "string" &&
    (value.$db == null || typeof value.$db === "string");
}
class DBRef1 {
  collection;
  oid;
  db;
  fields;
  constructor(collection, oid, db, fields) {
    const parts = collection.split(".");
    if (parts.length === 2) {
      db = parts.shift();
      collection = parts.shift();
    }
    this.collection = collection;
    this.oid = oid;
    this.db = db;
    this.fields = fields || {};
  }
  toJSON() {
    const o = Object.assign({
      $ref: this.collection,
      $id: this.oid,
    }, this.fields);
    if (this.db != null) o.$db = this.db;
    return o;
  }
  static fromExtendedJSON(doc) {
    const copy = Object.assign({}, doc);
    delete copy.$ref;
    delete copy.$id;
    delete copy.$db;
    return new DBRef1(doc.$ref, doc.$id, doc.$db, copy);
  }
  [Symbol.for("Deno.customInspect")]() {
    const oid = this.oid === undefined || this.oid.toString === undefined
      ? this.oid
      : this.oid.toString();
    return `new DBRef("${this.collection}", new ObjectId("${oid}")${
      this.db ? `, "${this.db}"` : ""
    })`;
  }
}
class BSONError1 extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, BSONError1.prototype);
  }
  get name() {
    return "BSONError";
  }
}
class BSONTypeError1 extends TypeError {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, BSONTypeError1.prototype);
  }
  get name() {
    return "BSONTypeError";
  }
}
export { BSONError1 as BSONError };
export { BSONTypeError1 as BSONTypeError };
const wasm = new WebAssembly.Instance(
  new WebAssembly.Module(
    new Uint8Array([
      0,
      97,
      115,
      109,
      1,
      0,
      0,
      0,
      1,
      13,
      2,
      96,
      0,
      1,
      127,
      96,
      4,
      127,
      127,
      127,
      127,
      1,
      127,
      3,
      7,
      6,
      0,
      1,
      1,
      1,
      1,
      1,
      6,
      6,
      1,
      127,
      1,
      65,
      0,
      11,
      7,
      50,
      6,
      3,
      109,
      117,
      108,
      0,
      1,
      5,
      100,
      105,
      118,
      95,
      115,
      0,
      2,
      5,
      100,
      105,
      118,
      95,
      117,
      0,
      3,
      5,
      114,
      101,
      109,
      95,
      115,
      0,
      4,
      5,
      114,
      101,
      109,
      95,
      117,
      0,
      5,
      8,
      103,
      101,
      116,
      95,
      104,
      105,
      103,
      104,
      0,
      0,
      10,
      191,
      1,
      6,
      4,
      0,
      35,
      0,
      11,
      36,
      1,
      1,
      126,
      32,
      0,
      173,
      32,
      1,
      173,
      66,
      32,
      134,
      132,
      32,
      2,
      173,
      32,
      3,
      173,
      66,
      32,
      134,
      132,
      126,
      34,
      4,
      66,
      32,
      135,
      167,
      36,
      0,
      32,
      4,
      167,
      11,
      36,
      1,
      1,
      126,
      32,
      0,
      173,
      32,
      1,
      173,
      66,
      32,
      134,
      132,
      32,
      2,
      173,
      32,
      3,
      173,
      66,
      32,
      134,
      132,
      127,
      34,
      4,
      66,
      32,
      135,
      167,
      36,
      0,
      32,
      4,
      167,
      11,
      36,
      1,
      1,
      126,
      32,
      0,
      173,
      32,
      1,
      173,
      66,
      32,
      134,
      132,
      32,
      2,
      173,
      32,
      3,
      173,
      66,
      32,
      134,
      132,
      128,
      34,
      4,
      66,
      32,
      135,
      167,
      36,
      0,
      32,
      4,
      167,
      11,
      36,
      1,
      1,
      126,
      32,
      0,
      173,
      32,
      1,
      173,
      66,
      32,
      134,
      132,
      32,
      2,
      173,
      32,
      3,
      173,
      66,
      32,
      134,
      132,
      129,
      34,
      4,
      66,
      32,
      135,
      167,
      36,
      0,
      32,
      4,
      167,
      11,
      36,
      1,
      1,
      126,
      32,
      0,
      173,
      32,
      1,
      173,
      66,
      32,
      134,
      132,
      32,
      2,
      173,
      32,
      3,
      173,
      66,
      32,
      134,
      132,
      130,
      34,
      4,
      66,
      32,
      135,
      167,
      36,
      0,
      32,
      4,
      167,
      11,
    ]),
  ),
  {},
).exports;
const TWO_PWR_16_DBL = 1 << 16;
const TWO_PWR_24_DBL = 1 << 24;
const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
const TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
const TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
const INT_CACHE = {};
const UINT_CACHE = {};
class Long1 {
  high;
  low;
  unsigned;
  constructor(low = 0, high, unsigned) {
    if (typeof low === "bigint") {
      Object.assign(this, Long1.fromBigInt(low, !!high));
    } else if (typeof low === "string") {
      Object.assign(this, Long1.fromString(low, !!high));
    } else {
      this.low = low | 0;
      this.high = high | 0;
      this.unsigned = !!unsigned;
    }
  }
  static TWO_PWR_24 = Long1.fromInt(TWO_PWR_24_DBL);
  static MAX_UNSIGNED_VALUE = Long1.fromBits(
    4294967295 | 0,
    4294967295 | 0,
    true,
  );
  static ZERO = Long1.fromInt(0);
  static UZERO = Long1.fromInt(0, true);
  static ONE = Long1.fromInt(1);
  static UONE = Long1.fromInt(1, true);
  static NEG_ONE = Long1.fromInt(-1);
  static MAX_VALUE = Long1.fromBits(4294967295 | 0, 2147483647 | 0, false);
  static MIN_VALUE = Long1.fromBits(0, 2147483648 | 0, false);
  static fromBits(lowBits, highBits, unsigned) {
    return new Long1(lowBits, highBits, unsigned);
  }
  static fromInt(value, unsigned) {
    let obj;
    let cache;
    if (unsigned) {
      value >>>= 0;
      if (cache = 0 <= value && value < 256) {
        const cachedObj = UINT_CACHE[value];
        if (cachedObj) return cachedObj;
      }
      obj = Long1.fromBits(value, (value | 0) < 0 ? -1 : 0, true);
      if (cache) UINT_CACHE[value] = obj;
      return obj;
    }
    value |= 0;
    if (cache = -128 <= value && value < 128) {
      const cachedObj = INT_CACHE[value];
      if (cachedObj) return cachedObj;
    }
    obj = Long1.fromBits(value, value < 0 ? -1 : 0, false);
    if (cache) INT_CACHE[value] = obj;
    return obj;
  }
  static fromNumber(value, unsigned) {
    if (isNaN(value)) return unsigned ? Long1.UZERO : Long1.ZERO;
    if (unsigned) {
      if (value < 0) return Long1.UZERO;
      if (value >= TWO_PWR_64_DBL) return Long1.MAX_UNSIGNED_VALUE;
    } else {
      if (value <= -TWO_PWR_63_DBL) return Long1.MIN_VALUE;
      if (value + 1 >= TWO_PWR_63_DBL) return Long1.MAX_VALUE;
    }
    if (value < 0) return Long1.fromNumber(-value, unsigned).neg();
    return Long1.fromBits(
      value % TWO_PWR_32_DBL | 0,
      value / TWO_PWR_32_DBL | 0,
      unsigned,
    );
  }
  static fromBigInt(value, unsigned) {
    return Long1.fromString(value.toString(), unsigned);
  }
  static fromString(str, unsigned, radix) {
    if (str.length === 0) throw Error("empty string");
    if (
      str === "NaN" || str === "Infinity" || str === "+Infinity" ||
      str === "-Infinity"
    ) {
      return Long1.ZERO;
    }
    if (typeof unsigned === "number") {
      radix = unsigned, unsigned = false;
    } else {
      unsigned = !!unsigned;
    }
    radix = radix || 10;
    if (radix < 2 || 36 < radix) throw RangeError("radix");
    let p;
    if ((p = str.indexOf("-")) > 0) throw Error("interior hyphen");
    else if (p === 0) {
      return Long1.fromString(str.substring(1), unsigned, radix).neg();
    }
    const radixToPower = Long1.fromNumber(radix ** 8);
    let result = Long1.ZERO;
    for (let i = 0; i < str.length; i += 8) {
      const size = Math.min(8, str.length - i);
      const value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        const power = Long1.fromNumber(radix ** size);
        result = result.mul(power).add(Long1.fromNumber(value));
      } else {
        result = result.mul(radixToPower);
        result = result.add(Long1.fromNumber(value));
      }
    }
    result.unsigned = unsigned;
    return result;
  }
  static fromBytes(bytes, unsigned, le) {
    return le
      ? Long1.fromBytesLE(bytes, unsigned)
      : Long1.fromBytesBE(bytes, unsigned);
  }
  static fromBytesLE(bytes, unsigned) {
    return new Long1(
      bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
      bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
      unsigned,
    );
  }
  static fromBytesBE(bytes, unsigned) {
    return new Long1(
      bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
      bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
      unsigned,
    );
  }
  static isLong(value) {
    return value instanceof Long1;
  }
  static fromValue(val, unsigned) {
    if (typeof val === "number") return Long1.fromNumber(val, unsigned);
    if (typeof val === "string") return Long1.fromString(val, unsigned);
    return Long1.fromBits(
      val.low,
      val.high,
      typeof unsigned === "boolean" ? unsigned : val.unsigned,
    );
  }
  add(addend) {
    if (!Long1.isLong(addend)) addend = Long1.fromValue(addend);
    const a48 = this.high >>> 16;
    const a32 = this.high & 65535;
    const a16 = this.low >>> 16;
    const a00 = this.low & 65535;
    const b48 = addend.high >>> 16;
    const b32 = addend.high & 65535;
    const b16 = addend.low >>> 16;
    const b00 = addend.low & 65535;
    let c48 = 0;
    let c32 = 0;
    let c16 = 0;
    let c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 65535;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 65535;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 65535;
    c48 += a48 + b48;
    c48 &= 65535;
    return Long1.fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
  }
  and(other) {
    if (!Long1.isLong(other)) other = Long1.fromValue(other);
    return Long1.fromBits(
      this.low & other.low,
      this.high & other.high,
      this.unsigned,
    );
  }
  compare(other) {
    if (!Long1.isLong(other)) other = Long1.fromValue(other);
    if (this.eq(other)) return 0;
    const thisNeg = this.isNegative();
    const otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) return -1;
    if (!thisNeg && otherNeg) return 1;
    if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1;
    return other.high >>> 0 > this.high >>> 0 ||
        other.high === this.high && other.low >>> 0 > this.low >>> 0
      ? -1
      : 1;
  }
  comp(other) {
    return this.compare(other);
  }
  divide(divisor) {
    if (!Long1.isLong(divisor)) divisor = Long1.fromValue(divisor);
    if (divisor.isZero()) throw Error("division by zero");
    if (
      !this.unsigned && this.high === -2147483648 && divisor.low === -1 &&
      divisor.high === -1
    ) {
      return this;
    }
    const low = (this.unsigned ? wasm.div_u : wasm.div_s)(
      this.low,
      this.high,
      divisor.low,
      divisor.high,
    );
    return Long1.fromBits(low, wasm.get_high(), this.unsigned);
  }
  div(divisor) {
    return this.divide(divisor);
  }
  equals(other) {
    if (!Long1.isLong(other)) other = Long1.fromValue(other);
    if (
      this.unsigned !== other.unsigned && this.high >>> 31 === 1 &&
      other.high >>> 31 === 1
    ) {
      return false;
    }
    return this.high === other.high && this.low === other.low;
  }
  eq(other) {
    return this.equals(other);
  }
  getHighBits() {
    return this.high;
  }
  getHighBitsUnsigned() {
    return this.high >>> 0;
  }
  getLowBits() {
    return this.low;
  }
  getLowBitsUnsigned() {
    return this.low >>> 0;
  }
  getNumBitsAbs() {
    if (this.isNegative()) {
      return this.eq(Long1.MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
    }
    const val = this.high !== 0 ? this.high : this.low;
    let bit;
    for (bit = 31; bit > 0; bit--) if ((val & 1 << bit) !== 0) break;
    return this.high !== 0 ? bit + 33 : bit + 1;
  }
  greaterThan(other) {
    return this.comp(other) > 0;
  }
  gt(other) {
    return this.greaterThan(other);
  }
  greaterThanOrEqual(other) {
    return this.comp(other) >= 0;
  }
  gte(other) {
    return this.greaterThanOrEqual(other);
  }
  ge(other) {
    return this.greaterThanOrEqual(other);
  }
  isEven() {
    return (this.low & 1) === 0;
  }
  isNegative() {
    return !this.unsigned && this.high < 0;
  }
  isOdd() {
    return (this.low & 1) === 1;
  }
  isPositive() {
    return this.unsigned || this.high >= 0;
  }
  isZero() {
    return this.high === 0 && this.low === 0;
  }
  lessThan(other) {
    return this.comp(other) < 0;
  }
  lt(other) {
    return this.lessThan(other);
  }
  lessThanOrEqual(other) {
    return this.comp(other) <= 0;
  }
  lte(other) {
    return this.lessThanOrEqual(other);
  }
  modulo(divisor) {
    if (!Long1.isLong(divisor)) divisor = Long1.fromValue(divisor);
    const low = (this.unsigned ? wasm.rem_u : wasm.rem_s)(
      this.low,
      this.high,
      divisor.low,
      divisor.high,
    );
    return Long1.fromBits(low, wasm.get_high(), this.unsigned);
  }
  mod(divisor) {
    return this.modulo(divisor);
  }
  rem(divisor) {
    return this.modulo(divisor);
  }
  multiply(multiplier) {
    if (this.isZero()) return Long1.ZERO;
    if (!Long1.isLong(multiplier)) multiplier = Long1.fromValue(multiplier);
    const low = wasm.mul(this.low, this.high, multiplier.low, multiplier.high);
    return Long1.fromBits(low, wasm.get_high(), this.unsigned);
  }
  mul(multiplier) {
    return this.multiply(multiplier);
  }
  negate() {
    if (!this.unsigned && this.eq(Long1.MIN_VALUE)) return Long1.MIN_VALUE;
    return this.not().add(Long1.ONE);
  }
  neg() {
    return this.negate();
  }
  not() {
    return Long1.fromBits(~this.low, ~this.high, this.unsigned);
  }
  notEquals(other) {
    return !this.equals(other);
  }
  neq(other) {
    return this.notEquals(other);
  }
  ne(other) {
    return this.notEquals(other);
  }
  or(other) {
    if (!Long1.isLong(other)) other = Long1.fromValue(other);
    return Long1.fromBits(
      this.low | other.low,
      this.high | other.high,
      this.unsigned,
    );
  }
  shiftLeft(numBits) {
    if (Long1.isLong(numBits)) numBits = numBits.toInt();
    if ((numBits &= 63) === 0) return this;
    if (numBits < 32) {
      return Long1.fromBits(
        this.low << numBits,
        this.high << numBits | this.low >>> 32 - numBits,
        this.unsigned,
      );
    }
    return Long1.fromBits(0, this.low << numBits - 32, this.unsigned);
  }
  shl(numBits) {
    return this.shiftLeft(numBits);
  }
  shiftRight(numBits) {
    if (Long1.isLong(numBits)) numBits = numBits.toInt();
    if ((numBits &= 63) === 0) return this;
    if (numBits < 32) {
      return Long1.fromBits(
        this.low >>> numBits | this.high << 32 - numBits,
        this.high >> numBits,
        this.unsigned,
      );
    }
    return Long1.fromBits(
      this.high >> numBits - 32,
      this.high >= 0 ? 0 : -1,
      this.unsigned,
    );
  }
  shr(numBits) {
    return this.shiftRight(numBits);
  }
  shiftRightUnsigned(numBits) {
    if (Long1.isLong(numBits)) numBits = numBits.toInt();
    numBits &= 63;
    if (numBits === 0) return this;
    const high = this.high;
    if (numBits < 32) {
      const low = this.low;
      return Long1.fromBits(
        low >>> numBits | high << 32 - numBits,
        high >>> numBits,
        this.unsigned,
      );
    }
    if (numBits === 32) return Long1.fromBits(high, 0, this.unsigned);
    else return Long1.fromBits(high >>> numBits - 32, 0, this.unsigned);
  }
  shr_u(numBits) {
    return this.shiftRightUnsigned(numBits);
  }
  shru(numBits) {
    return this.shiftRightUnsigned(numBits);
  }
  subtract(subtrahend) {
    if (!Long1.isLong(subtrahend)) subtrahend = Long1.fromValue(subtrahend);
    return this.add(subtrahend.neg());
  }
  sub(subtrahend) {
    return this.subtract(subtrahend);
  }
  toInt() {
    return this.unsigned ? this.low >>> 0 : this.low;
  }
  toNumber() {
    if (this.unsigned) {
      return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
    }
    return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
  }
  toBigInt() {
    return BigInt(this.toString());
  }
  toBytes(le) {
    return le ? this.toBytesLE() : this.toBytesBE();
  }
  toBytesLE() {
    const hi = this.high;
    const lo = this.low;
    return [
      lo & 255,
      lo >>> 8 & 255,
      lo >>> 16 & 255,
      lo >>> 24,
      hi & 255,
      hi >>> 8 & 255,
      hi >>> 16 & 255,
      hi >>> 24,
    ];
  }
  toBytesBE() {
    const hi = this.high;
    const lo = this.low;
    return [
      hi >>> 24,
      hi >>> 16 & 255,
      hi >>> 8 & 255,
      hi & 255,
      lo >>> 24,
      lo >>> 16 & 255,
      lo >>> 8 & 255,
      lo & 255,
    ];
  }
  toSigned() {
    if (!this.unsigned) return this;
    return Long1.fromBits(this.low, this.high, false);
  }
  toString(radix = 10) {
    if (radix < 2 || 36 < radix) throw RangeError("radix");
    if (this.isZero()) return "0";
    if (this.isNegative()) {
      if (this.eq(Long1.MIN_VALUE)) {
        const radixLong = Long1.fromNumber(radix);
        const div = this.div(radixLong);
        const rem1 = div.mul(radixLong).sub(this);
        return div.toString(radix) + rem1.toInt().toString(radix);
      }
      return `-${this.neg().toString(radix)}`;
    }
    const radixToPower = Long1.fromNumber(radix ** 6, this.unsigned);
    let rem = this;
    let result = "";
    while (true) {
      const remDiv = rem.div(radixToPower);
      const intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0;
      let digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      }
      while (digits.length < 6) digits = `0${digits}`;
      result = `${digits}${result}`;
    }
  }
  toUnsigned() {
    if (this.unsigned) return this;
    return Long1.fromBits(this.low, this.high, true);
  }
  xor(other) {
    if (!Long1.isLong(other)) other = Long1.fromValue(other);
    return Long1.fromBits(
      this.low ^ other.low,
      this.high ^ other.high,
      this.unsigned,
    );
  }
  eqz() {
    return this.isZero();
  }
  le(other) {
    return this.lessThanOrEqual(other);
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new Long("${this.toString()}"${this.unsigned ? ", true" : ""})`;
  }
}
const PARSE_STRING_REGEXP = /^(\+|-)?(\d+|(\d*\.\d*))?(E|e)?([-+])?(\d+)?$/;
const PARSE_INF_REGEXP = /^(\+|-)?(Infinity|inf)$/i;
const PARSE_NAN_REGEXP = /^(\+|-)?NaN$/i;
const EXPONENT_MAX = 6111;
const EXPONENT_MIN = -6176;
const EXPONENT_BIAS = 6176;
const NAN_BUFFER = [
  124,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
].reverse();
const INF_NEGATIVE_BUFFER = [
  248,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
].reverse();
const INF_POSITIVE_BUFFER = [
  120,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
].reverse();
const EXPONENT_REGEX = /^([-+])?(\d+)?$/;
const EXPONENT_MASK = 16383;
function isDigit(value) {
  return !isNaN(parseInt(value, 10));
}
function divideu128(value) {
  const DIVISOR = Long1.fromNumber(1000 * 1000 * 1000);
  let _rem = Long1.fromNumber(0);
  if (
    !value.parts[0] && !value.parts[1] && !value.parts[2] && !value.parts[3]
  ) {
    return {
      quotient: value,
      rem: _rem,
    };
  }
  for (let i = 0; i <= 3; i++) {
    _rem = _rem.shiftLeft(32);
    _rem = _rem.add(new Long1(value.parts[i], 0));
    value.parts[i] = _rem.div(DIVISOR).low;
    _rem = _rem.modulo(DIVISOR);
  }
  return {
    quotient: value,
    rem: _rem,
  };
}
function multiply64x2(left, right) {
  if (!left && !right) {
    return {
      high: Long1.fromNumber(0),
      low: Long1.fromNumber(0),
    };
  }
  const leftHigh = left.shiftRightUnsigned(32);
  const leftLow = new Long1(left.getLowBits(), 0);
  const rightHigh = right.shiftRightUnsigned(32);
  const rightLow = new Long1(right.getLowBits(), 0);
  let productHigh = leftHigh.multiply(rightHigh);
  let productMid = leftHigh.multiply(rightLow);
  const productMid2 = leftLow.multiply(rightHigh);
  let productLow = leftLow.multiply(rightLow);
  productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
  productMid = new Long1(productMid.getLowBits(), 0).add(productMid2).add(
    productLow.shiftRightUnsigned(32),
  );
  productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
  productLow = productMid.shiftLeft(32).add(
    new Long1(productLow.getLowBits(), 0),
  );
  return {
    high: productHigh,
    low: productLow,
  };
}
function lessThan(left, right) {
  const uhleft = left.high >>> 0;
  const uhright = right.high >>> 0;
  if (uhleft < uhright) {
    return true;
  }
  if (uhleft === uhright) {
    const ulleft = left.low >>> 0;
    const ulright = right.low >>> 0;
    if (ulleft < ulright) return true;
  }
  return false;
}
function invalidErr(string, message) {
  throw new BSONTypeError1(
    `"${string}" is not a valid Decimal128 string - ${message}`,
  );
}
class Decimal1281 {
  bytes;
  constructor(bytes) {
    this.bytes = typeof bytes === "string"
      ? Decimal1281.fromString(bytes).bytes
      : bytes;
  }
  static fromString(representation) {
    let isNegative = false;
    let sawRadix = false;
    let foundNonZero = false;
    let significantDigits = 0;
    let nDigitsRead = 0;
    let nDigits = 0;
    let radixPosition = 0;
    let firstNonZero = 0;
    const digits = [
      0,
    ];
    let nDigitsStored = 0;
    let digitsInsert = 0;
    let firstDigit = 0;
    let lastDigit = 0;
    let exponent = 0;
    let i = 0;
    let significandHigh = new Long1(0, 0);
    let significandLow = new Long1(0, 0);
    let biasedExponent = 0;
    let index = 0;
    if (representation.length >= 7000) {
      throw new BSONTypeError1(
        `${representation} not a valid Decimal128 string`,
      );
    }
    const stringMatch = representation.match(PARSE_STRING_REGEXP);
    const infMatch = representation.match(PARSE_INF_REGEXP);
    const nanMatch = representation.match(PARSE_NAN_REGEXP);
    if (!stringMatch && !infMatch && !nanMatch || representation.length === 0) {
      throw new BSONTypeError1(
        `${representation} not a valid Decimal128 string`,
      );
    }
    if (stringMatch) {
      const unsignedNumber = stringMatch[2];
      const e = stringMatch[4];
      const expSign = stringMatch[5];
      const expNumber = stringMatch[6];
      if (e && expNumber === undefined) {
        invalidErr(representation, "missing exponent power");
      }
      if (e && unsignedNumber === undefined) {
        invalidErr(representation, "missing exponent base");
      }
      if (e === undefined && (expSign || expNumber)) {
        invalidErr(representation, "missing e before exponent");
      }
    }
    if (representation[index] === "+" || representation[index] === "-") {
      isNegative = representation[index++] === "-";
    }
    if (!isDigit(representation[index]) && representation[index] !== ".") {
      if (representation[index] === "i" || representation[index] === "I") {
        return new Decimal1281(
          new Uint8Array(
            isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER,
          ),
        );
      }
      if (representation[index] === "N") {
        return new Decimal1281(new Uint8Array(NAN_BUFFER));
      }
    }
    while (isDigit(representation[index]) || representation[index] === ".") {
      if (representation[index] === ".") {
        if (sawRadix) invalidErr(representation, "contains multiple periods");
        sawRadix = true;
        index += 1;
        continue;
      }
      if (
        nDigitsStored < 34 && (representation[index] !== "0" || foundNonZero)
      ) {
        if (!foundNonZero) {
          firstNonZero = nDigitsRead;
        }
        foundNonZero = true;
        digits[digitsInsert++] = parseInt(representation[index], 10);
        nDigitsStored += 1;
      }
      if (foundNonZero) nDigits += 1;
      if (sawRadix) radixPosition += 1;
      nDigitsRead += 1;
      index += 1;
    }
    if (sawRadix && !nDigitsRead) {
      throw new BSONTypeError1(
        `${representation} not a valid Decimal128 string`,
      );
    }
    if (representation[index] === "e" || representation[index] === "E") {
      const match = representation.substr(++index).match(EXPONENT_REGEX);
      if (!match || !match[2]) {
        return new Decimal1281(new Uint8Array(NAN_BUFFER));
      }
      exponent = parseInt(match[0], 10);
      index += match[0].length;
    }
    if (representation[index]) {
      return new Decimal1281(new Uint8Array(NAN_BUFFER));
    }
    firstDigit = 0;
    if (!nDigitsStored) {
      firstDigit = 0;
      lastDigit = 0;
      digits[0] = 0;
      nDigits = 1;
      nDigitsStored = 1;
      significantDigits = 0;
    } else {
      lastDigit = nDigitsStored - 1;
      significantDigits = nDigits;
      if (significantDigits !== 1) {
        while (digits[firstNonZero + significantDigits - 1] === 0) {
          significantDigits -= 1;
        }
      }
    }
    exponent = exponent <= radixPosition && radixPosition - exponent > 1 << 14
      ? EXPONENT_MIN
      : exponent - radixPosition;
    while (exponent > 6111) {
      lastDigit += 1;
      if (lastDigit - firstDigit > 34) {
        const digitsString = digits.join("");
        if (digitsString.match(/^0+$/)) {
          exponent = EXPONENT_MAX;
          break;
        }
        invalidErr(representation, "overflow");
      }
      exponent -= 1;
    }
    while (exponent < EXPONENT_MIN || nDigitsStored < nDigits) {
      if (lastDigit === 0 && significantDigits < nDigitsStored) {
        exponent = EXPONENT_MIN;
        significantDigits = 0;
        break;
      }
      if (nDigitsStored < nDigits) {
        nDigits -= 1;
      } else {
        lastDigit -= 1;
      }
      if (exponent < 6111) {
        exponent += 1;
      } else {
        const digitsString = digits.join("");
        if (digitsString.match(/^0+$/)) {
          exponent = EXPONENT_MAX;
          break;
        }
        invalidErr(representation, "overflow");
      }
    }
    if (lastDigit - firstDigit + 1 < significantDigits) {
      let endOfString = nDigitsRead;
      if (sawRadix) {
        firstNonZero += 1;
        endOfString += 1;
      }
      if (isNegative) {
        firstNonZero += 1;
        endOfString += 1;
      }
      const roundDigit = parseInt(
        representation[firstNonZero + lastDigit + 1],
        10,
      );
      let roundBit = 0;
      if (roundDigit >= 5) {
        roundBit = 1;
        if (roundDigit === 5) {
          roundBit = digits[lastDigit] % 2 === 1 ? 1 : 0;
          for (i = firstNonZero + lastDigit + 2; i < endOfString; i++) {
            if (parseInt(representation[i], 10)) {
              roundBit = 1;
              break;
            }
          }
        }
      }
      if (roundBit) {
        let dIdx = lastDigit;
        for (; dIdx >= 0; dIdx--) {
          if (++digits[dIdx] > 9) {
            digits[dIdx] = 0;
            if (dIdx === 0) {
              if (exponent < 6111) {
                exponent += 1;
                digits[dIdx] = 1;
              } else {
                return new Decimal1281(
                  new Uint8Array(
                    isNegative
                      ? INF_NEGATIVE_BUFFER
                      : INF_POSITIVE_BUFFER,
                  ),
                );
              }
            }
          }
        }
      }
    }
    significandHigh = Long1.fromNumber(0);
    significandLow = Long1.fromNumber(0);
    if (significantDigits === 0) {
      significandHigh = Long1.fromNumber(0);
      significandLow = Long1.fromNumber(0);
    } else if (lastDigit - firstDigit < 17) {
      let dIdx = firstDigit;
      significandLow = Long1.fromNumber(digits[dIdx++]);
      significandHigh = new Long1(0, 0);
      for (; dIdx <= lastDigit; dIdx++) {
        significandLow = significandLow.multiply(Long1.fromNumber(10));
        significandLow = significandLow.add(Long1.fromNumber(digits[dIdx]));
      }
    } else {
      let dIdx = firstDigit;
      significandHigh = Long1.fromNumber(digits[dIdx++]);
      for (; dIdx <= lastDigit - 17; dIdx++) {
        significandHigh = significandHigh.multiply(Long1.fromNumber(10));
        significandHigh = significandHigh.add(Long1.fromNumber(digits[dIdx]));
      }
      significandLow = Long1.fromNumber(digits[dIdx++]);
      for (; dIdx <= lastDigit; dIdx++) {
        significandLow = significandLow.multiply(Long1.fromNumber(10));
        significandLow = significandLow.add(Long1.fromNumber(digits[dIdx]));
      }
    }
    const significand = multiply64x2(
      significandHigh,
      Long1.fromString("100000000000000000"),
    );
    significand.low = significand.low.add(significandLow);
    if (lessThan(significand.low, significandLow)) {
      significand.high = significand.high.add(Long1.fromNumber(1));
    }
    biasedExponent = exponent + EXPONENT_BIAS;
    const dec = {
      low: Long1.fromNumber(0),
      high: Long1.fromNumber(0),
    };
    if (
      significand.high.shiftRightUnsigned(49).and(Long1.fromNumber(1)).equals(
        Long1.fromNumber(1),
      )
    ) {
      dec.high = dec.high.or(Long1.fromNumber(3).shiftLeft(61));
      dec.high = dec.high.or(
        Long1.fromNumber(biasedExponent).and(
          Long1.fromNumber(16383).shiftLeft(47),
        ),
      );
      dec.high = dec.high.or(
        significand.high.and(Long1.fromNumber(140737488355327)),
      );
    } else {
      dec.high = dec.high.or(
        Long1.fromNumber(biasedExponent & 16383).shiftLeft(49),
      );
      dec.high = dec.high.or(
        significand.high.and(Long1.fromNumber(562949953421311)),
      );
    }
    dec.low = significand.low;
    if (isNegative) {
      dec.high = dec.high.or(Long1.fromString("9223372036854775808"));
    }
    const buffer = new Uint8Array(16);
    index = 0;
    buffer[index++] = dec.low.low & 255;
    buffer[index++] = dec.low.low >> 8 & 255;
    buffer[index++] = dec.low.low >> 16 & 255;
    buffer[index++] = dec.low.low >> 24 & 255;
    buffer[index++] = dec.low.high & 255;
    buffer[index++] = dec.low.high >> 8 & 255;
    buffer[index++] = dec.low.high >> 16 & 255;
    buffer[index++] = dec.low.high >> 24 & 255;
    buffer[index++] = dec.high.low & 255;
    buffer[index++] = dec.high.low >> 8 & 255;
    buffer[index++] = dec.high.low >> 16 & 255;
    buffer[index++] = dec.high.low >> 24 & 255;
    buffer[index++] = dec.high.high & 255;
    buffer[index++] = dec.high.high >> 8 & 255;
    buffer[index++] = dec.high.high >> 16 & 255;
    buffer[index++] = dec.high.high >> 24 & 255;
    return new Decimal1281(buffer);
  }
  toString() {
    let biasedExponent;
    let significandDigits = 0;
    const significand = new Array(36);
    for (let i = 0; i < significand.length; i++) significand[i] = 0;
    let index = 0;
    let isZero = false;
    let significandMsb;
    let significand128 = {
      parts: [
        0,
        0,
        0,
        0,
      ],
    };
    let j;
    let k;
    const string = [];
    index = 0;
    const buffer = this.bytes;
    const low = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 |
      buffer[index++] << 24;
    const midl = buffer[index++] | buffer[index++] << 8 |
      buffer[index++] << 16 | buffer[index++] << 24;
    const midh = buffer[index++] | buffer[index++] << 8 |
      buffer[index++] << 16 | buffer[index++] << 24;
    const high = buffer[index++] | buffer[index++] << 8 |
      buffer[index++] << 16 | buffer[index++] << 24;
    index = 0;
    const dec = {
      low: new Long1(low, midl),
      high: new Long1(midh, high),
    };
    if (dec.high.lessThan(Long1.ZERO)) {
      string.push("-");
    }
    const combination = high >> 26 & 31;
    if (combination >> 3 === 3) {
      if (combination === 30) {
        return `${string.join("")}Infinity`;
      }
      if (combination === 31) {
        return "NaN";
      }
      biasedExponent = high >> 15 & EXPONENT_MASK;
      significandMsb = 8 + (high >> 14 & 1);
    } else {
      significandMsb = high >> 14 & 7;
      biasedExponent = high >> 17 & EXPONENT_MASK;
    }
    const exponent = biasedExponent - 6176;
    significand128.parts[0] = (high & 16383) + ((significandMsb & 15) << 14);
    significand128.parts[1] = midh;
    significand128.parts[2] = midl;
    significand128.parts[3] = low;
    if (
      significand128.parts[0] === 0 && significand128.parts[1] === 0 &&
      significand128.parts[2] === 0 && significand128.parts[3] === 0
    ) {
      isZero = true;
    } else {
      for (k = 3; k >= 0; k--) {
        let leastDigits = 0;
        const result = divideu128(significand128);
        significand128 = result.quotient;
        leastDigits = result.rem.low;
        if (!leastDigits) continue;
        for (j = 8; j >= 0; j--) {
          significand[k * 9 + j] = leastDigits % 10;
          leastDigits = Math.floor(leastDigits / 10);
        }
      }
    }
    if (isZero) {
      significandDigits = 1;
      significand[index] = 0;
    } else {
      significandDigits = 36;
      while (!significand[index]) {
        significandDigits -= 1;
        index += 1;
      }
    }
    const scientificExponent = significandDigits - 1 + exponent;
    if (scientificExponent >= 34 || scientificExponent <= -7 || exponent > 0) {
      if (significandDigits > 34) {
        string.push(`${0}`);
        if (exponent > 0) string.push(`E+${exponent}`);
        else if (exponent < 0) string.push(`E${exponent}`);
        return string.join("");
      }
      string.push(`${significand[index++]}`);
      significandDigits -= 1;
      if (significandDigits) {
        string.push(".");
      }
      for (let i = 0; i < significandDigits; i++) {
        string.push(`${significand[index++]}`);
      }
      string.push("E");
      if (scientificExponent > 0) {
        string.push(`+${scientificExponent}`);
      } else {
        string.push(`${scientificExponent}`);
      }
    } else {
      if (exponent >= 0) {
        for (let i = 0; i < significandDigits; i++) {
          string.push(`${significand[index++]}`);
        }
      } else {
        let radixPosition = significandDigits + exponent;
        if (radixPosition > 0) {
          for (let i = 0; i < radixPosition; i++) {
            string.push(`${significand[index++]}`);
          }
        } else {
          string.push("0");
        }
        string.push(".");
        while (radixPosition++ < 0) {
          string.push("0");
        }
        for (
          let i = 0; i < significandDigits - Math.max(radixPosition - 1, 0); i++
        ) {
          string.push(`${significand[index++]}`);
        }
      }
    }
    return string.join("");
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new Decimal128("${this.toString()}")`;
  }
  toJSON() {
    return {
      $numberDecimal: this.toString(),
    };
  }
}
class Double1 {
  value;
  constructor(value) {
    if (value instanceof Number) {
      value = value.valueOf();
    }
    this.value = +value;
  }
  valueOf() {
    return this.value;
  }
  toJSON() {
    return this.value;
  }
  toString(radix) {
    return this.value.toString(radix);
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new Double(${this.toJSON()})`;
  }
}
function writeIEEE754(buffer, value, offset, endian, mLen, nBytes) {
  let e;
  let m;
  let c;
  const bBE = endian === "big";
  let eLen = nBytes * 8 - mLen - 1;
  const eMax = (1 << eLen) - 1;
  const eBias = eMax >> 1;
  const rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  let i = bBE ? nBytes - 1 : 0;
  const d = bBE ? -1 : 1;
  const s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);
  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }
    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }
  if (isNaN(value)) m = 0;
  while (mLen >= 8) {
    buffer[offset + i] = m & 255;
    i += d;
    m /= 256;
    mLen -= 8;
  }
  e = e << mLen | m;
  if (isNaN(value)) e += 8;
  eLen += mLen;
  while (eLen > 0) {
    buffer[offset + i] = e & 255;
    i += d;
    e /= 256;
    eLen -= 8;
  }
  buffer[offset + i - d] |= s * 128;
}
class Int321 {
  value;
  constructor(value) {
    if (value instanceof Number) {
      value = value.valueOf();
    }
    this.value = +value | 0;
  }
  valueOf() {
    return this.value;
  }
  toString(radix) {
    return this.value.toString(radix);
  }
  toJSON() {
    return this.value;
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new Int32(${this.valueOf()})`;
  }
}
class MaxKey1 {
  [Symbol.for("Deno.customInspect")]() {
    return "new MaxKey()";
  }
}
class MinKey1 {
  [Symbol.for("Deno.customInspect")]() {
    return "new MinKey()";
  }
}
const hexTable = new TextEncoder().encode("0123456789abcdef");
function errInvalidByte(__byte) {
  return new TypeError(`Invalid byte '${String.fromCharCode(__byte)}'`);
}
function errLength() {
  return new RangeError("Odd length hex string");
}
function fromHexChar(__byte) {
  if (48 <= __byte && __byte <= 57) return __byte - 48;
  if (97 <= __byte && __byte <= 102) return __byte - 97 + 10;
  if (65 <= __byte && __byte <= 70) return __byte - 65 + 10;
  throw errInvalidByte(__byte);
}
function encode(src) {
  const dst = new Uint8Array(src.length * 2);
  for (let i = 0; i < dst.length; i++) {
    const v = src[i];
    dst[i * 2] = hexTable[v >> 4];
    dst[i * 2 + 1] = hexTable[v & 15];
  }
  return dst;
}
function decode(src) {
  const dst = new Uint8Array(src.length / 2);
  for (let i = 0; i < dst.length; i++) {
    const a = fromHexChar(src[i * 2]);
    const b = fromHexChar(src[i * 2 + 1]);
    dst[i] = a << 4 | b;
  }
  if (src.length % 2 == 1) {
    fromHexChar(src[dst.length * 2]);
    throw errLength();
  }
  return dst;
}
const mod = {
  encode: encode,
  decode: decode,
};
const base64abc = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "+",
  "/",
];
function encode1(data) {
  const uint8 = typeof data === "string"
    ? new TextEncoder().encode(data)
    : data instanceof Uint8Array
    ? data
    : new Uint8Array(data);
  let result = "", i;
  const l = uint8.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 3) << 4 | uint8[i - 1] >> 4];
    result += base64abc[(uint8[i - 1] & 15) << 2 | uint8[i] >> 6];
    result += base64abc[uint8[i] & 63];
  }
  if (i === l + 1) {
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 3) << 4];
    result += "==";
  }
  if (i === l) {
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 3) << 4 | uint8[i - 1] >> 4];
    result += base64abc[(uint8[i - 1] & 15) << 2];
    result += "=";
  }
  return result;
}
function decode1(b64) {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}
const mod1 = {
  encode: encode1,
  decode: decode1,
};
function equalsNaive(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
function equalsSimd(a, b) {
  if (a.length !== b.length) return false;
  const len = a.length;
  const compressable = Math.floor(len / 4);
  const compressedA = new Uint32Array(a.buffer, 0, compressable);
  const compressedB = new Uint32Array(b.buffer, 0, compressable);
  for (let i = compressable * 4; i < len; i++) {
    if (a[i] !== b[i]) return false;
  }
  for (let i1 = 0; i1 < compressedA.length; i1++) {
    if (compressedA[i1] !== compressedB[i1]) return false;
  }
  return true;
}
function equals(a, b) {
  if (a.length < 1000) return equalsNaive(a, b);
  return equalsSimd(a, b);
}
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
function decodeHexString(hexString) {
  return mod.decode(textEncoder.encode(hexString));
}
function encodeHexString(uint8Array) {
  return textDecoder.decode(mod.encode(uint8Array));
}
const textEncoder1 = new TextEncoder();
const textDecoder1 = new TextDecoder();
const checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
let PROCESS_UNIQUE = null;
class ObjectId1 {
  static #index = Math.floor(Math.random() * 16777215);
  static cacheHexString;
  #id;
  #bytesBuffer;
  constructor(inputId = ObjectId1.generate()) {
    let workingId;
    if (typeof inputId === "object" && inputId && "id" in inputId) {
      if (typeof inputId.id !== "string" && !ArrayBuffer.isView(inputId.id)) {
        throw new BSONTypeError1(
          "Argument passed in must have an id that is of type string or Buffer",
        );
      }
      workingId =
        "toHexString" in inputId && typeof inputId.toHexString === "function"
          ? decodeHexString(inputId.toHexString())
          : inputId.id;
    } else {
      workingId = inputId;
    }
    if (workingId == null || typeof workingId === "number") {
      this.#bytesBuffer = new Uint8Array(
        ObjectId1.generate(
          typeof workingId === "number" ? workingId : undefined,
        ),
      );
    } else if (ArrayBuffer.isView(workingId) && workingId.byteLength === 12) {
      this.#bytesBuffer = workingId;
    } else if (typeof workingId === "string") {
      if (workingId.length === 12) {
        const bytes = textEncoder1.encode(workingId);
        if (bytes.byteLength === 12) {
          this.#bytesBuffer = bytes;
        } else {
          throw new BSONTypeError1(
            "Argument passed in must be a string of 12 bytes",
          );
        }
      } else if (workingId.length === 24 && checkForHexRegExp.test(workingId)) {
        this.#bytesBuffer = decodeHexString(workingId);
      } else {
        throw new BSONTypeError1(
          "Argument passed in must be a string of 12 bytes or a string of 24 hex characters",
        );
      }
    } else {
      throw new BSONTypeError1(
        "Argument passed in does not match the accepted types",
      );
    }
    if (ObjectId1.cacheHexString) {
      this.#id = encodeHexString(this.id);
    }
  }
  get id() {
    return this.#bytesBuffer;
  }
  set id(value) {
    this.#bytesBuffer = value;
    if (ObjectId1.cacheHexString) {
      this.#id = encodeHexString(value);
    }
  }
  toHexString() {
    if (ObjectId1.cacheHexString && this.#id) {
      return this.#id;
    }
    const hexString = encodeHexString(this.id);
    if (ObjectId1.cacheHexString && !this.#id) {
      this.#id = hexString;
    }
    return hexString;
  }
  static generate(time) {
    if ("number" !== typeof time) {
      time = Math.floor(Date.now() / 1000);
    }
    const inc = this.#index = (this.#index + 1) % 16777215;
    const objectId = new Uint8Array(12);
    new DataView(objectId.buffer, 0, 4).setUint32(0, time);
    if (PROCESS_UNIQUE === null) {
      PROCESS_UNIQUE = randomBytes(5);
    }
    objectId[4] = PROCESS_UNIQUE[0];
    objectId[5] = PROCESS_UNIQUE[1];
    objectId[6] = PROCESS_UNIQUE[2];
    objectId[7] = PROCESS_UNIQUE[3];
    objectId[8] = PROCESS_UNIQUE[4];
    objectId[11] = inc & 255;
    objectId[10] = inc >> 8 & 255;
    objectId[9] = inc >> 16 & 255;
    return objectId;
  }
  toString() {
    return this.toHexString();
  }
  toJSON() {
    return this.toHexString();
  }
  equals(otherId) {
    if (otherId == null) {
      return false;
    }
    if (otherId instanceof ObjectId1) {
      return this.toString() === otherId.toString();
    }
    if (
      typeof otherId === "string" && ObjectId1.isValid(otherId) &&
      otherId.length === 12 && this.id instanceof Uint8Array
    ) {
      return otherId === textDecoder1.decode(this.id);
    }
    if (
      typeof otherId === "string" && ObjectId1.isValid(otherId) &&
      otherId.length === 24
    ) {
      return otherId.toLowerCase() === this.toHexString();
    }
    if (
      typeof otherId === "string" && ObjectId1.isValid(otherId) &&
      otherId.length === 12
    ) {
      const otherIdUint8Array = textEncoder1.encode(otherId);
      for (let i = 0; i < 12; i++) {
        if (otherIdUint8Array[i] !== this.id[i]) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  getTimestamp() {
    const timestamp = new Date();
    const time = new DataView(this.id.buffer, 0, 4).getUint32(0);
    timestamp.setTime(Math.floor(time) * 1000);
    return timestamp;
  }
  static createFromTime(time) {
    const buffer = new Uint8Array([
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]);
    new DataView(buffer.buffer, 0, 4).setUint32(0, time);
    return new ObjectId1(buffer);
  }
  static createFromHexString(hexString) {
    if (
      typeof hexString === "undefined" ||
      hexString != null && hexString.length !== 24
    ) {
      throw new BSONTypeError1(
        "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters",
      );
    }
    return new ObjectId1(decodeHexString(hexString));
  }
  static isValid(id) {
    if (id == null) return false;
    try {
      new ObjectId1(id);
      return true;
    } catch {
      return false;
    }
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new ObjectId("${this.toHexString()}")`;
  }
}
class Timestamp1 extends Long1 {
  static MAX_VALUE = Long1.MAX_UNSIGNED_VALUE;
  constructor(value = new Long1()) {
    const isLong = Long1.isLong(value);
    const low = isLong ? value.low : value.i;
    const high = isLong ? value.high : value.t;
    super(low, high, true);
  }
  toJSON() {
    return {
      $timestamp: this.toString(),
    };
  }
  static fromInt(value) {
    return new Timestamp1(Long1.fromInt(value, true));
  }
  static fromNumber(value) {
    return new Timestamp1(Long1.fromNumber(value, true));
  }
  static fromBits(lowBits, highBits) {
    return new Timestamp1(new Long1(lowBits, highBits));
  }
  static fromString(str, optRadix) {
    return new Timestamp1(Long1.fromString(str, true, optRadix));
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new Timestamp({ t: ${this.getHighBits()}, i: ${this.getLowBits()} })`;
  }
}
function alphabetize(str) {
  return str.split("").sort().join("");
}
class BSONRegExp1 {
  pattern;
  options;
  constructor(pattern, options) {
    this.pattern = pattern;
    this.options = alphabetize(options ?? "");
    if (this.pattern.indexOf("\x00") !== -1) {
      throw new BSONError1(
        `BSON Regex patterns cannot contain null bytes, found: ${
          JSON.stringify(this.pattern)
        }`,
      );
    }
    if (this.options.indexOf("\x00") !== -1) {
      throw new BSONError1(
        `BSON Regex options cannot contain null bytes, found: ${
          JSON.stringify(this.options)
        }`,
      );
    }
    for (let i = 0; i < this.options.length; i++) {
      if (
        !(this.options[i] === "i" || this.options[i] === "m" ||
          this.options[i] === "x" || this.options[i] === "l" ||
          this.options[i] === "s" || this.options[i] === "u")
      ) {
        throw new BSONError1(
          `The regular expression option [${this.options[i]}] is not supported`,
        );
      }
    }
  }
  static parseOptions(options) {
    return options ? options.split("").sort().join("") : "";
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new BSONRegExp("${this.pattern}")`;
  }
}
const VALIDATION_REGEX =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15})$/i;
const uuidValidateString = (str) =>
  typeof str === "string" && VALIDATION_REGEX.test(str);
const uuidHexStringToBuffer = (hexString) => {
  if (!uuidValidateString(hexString)) {
    throw new BSONTypeError1(
      'UUID string representations must be a 32 or 36 character hex string (dashes excluded/included). Format: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" or "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".',
    );
  }
  const sanitizedHexString = hexString.replace(/-/g, "");
  return decodeHexString(sanitizedHexString);
};
const hexTable1 = new TextEncoder().encode("0123456789abcdef");
const textDecoder2 = new TextDecoder();
const bufferToUuidHexString = (bytes, includeDashes = true) => {
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
    dst[dstIndex] = hexTable1[v >> 4];
    dst[dstIndex + 1] = hexTable1[v & 15];
    dstIndex += 2;
    srcIndex++;
  }
  return textDecoder2.decode(dst);
};
var BinarySizes1;
(function (BinarySizes) {
  BinarySizes[BinarySizes["BUFFER_SIZE"] = 256] = "BUFFER_SIZE";
  BinarySizes[BinarySizes["SUBTYPE_DEFAULT"] = 0] = "SUBTYPE_DEFAULT";
  BinarySizes[BinarySizes["SUBTYPE_FUNCTION"] = 1] = "SUBTYPE_FUNCTION";
  BinarySizes[BinarySizes["SUBTYPE_BYTE_ARRAY"] = 2] = "SUBTYPE_BYTE_ARRAY";
  BinarySizes[BinarySizes["SUBTYPE_UUID"] = 4] = "SUBTYPE_UUID";
  BinarySizes[BinarySizes["SUBTYPE_MD5"] = 5] = "SUBTYPE_MD5";
  BinarySizes[BinarySizes["SUBTYPE_ENCRYPTED"] = 6] = "SUBTYPE_ENCRYPTED";
  BinarySizes[BinarySizes["SUBTYPE_COLUMN"] = 7] = "SUBTYPE_COLUMN";
  BinarySizes[BinarySizes["SUBTYPE_USER_DEFINE"] = 128] = "SUBTYPE_USER_DEFINE";
  BinarySizes[BinarySizes["BSON_BINARY_SUBTYPE_DEFAULT"] = 0] =
    "BSON_BINARY_SUBTYPE_DEFAULT";
})(BinarySizes1 || (BinarySizes1 = {}));
const textDecoder3 = new TextDecoder();
class Binary1 {
  buffer;
  subType;
  constructor(buffer, subType = BinarySizes1.BSON_BINARY_SUBTYPE_DEFAULT) {
    this.buffer = buffer;
    this.subType = subType;
  }
  length() {
    return this.buffer.length;
  }
  toJSON() {
    return mod1.encode(this.buffer);
  }
  toString() {
    return textDecoder3.decode(this.buffer);
  }
  toUUID() {
    if (this.subType === BinarySizes1.SUBTYPE_UUID) {
      return new UUID1(this.buffer);
    }
    throw new BSONError1(
      `Binary sub_type "${this.subType}" is not supported for converting to UUID. Only "${BinarySizes1.SUBTYPE_UUID}" is currently supported.`,
    );
  }
  [Symbol.for("Deno.customInspect")]() {
    if (this.subType === BinarySizes1.SUBTYPE_DEFAULT) {
      return `new Binary(${Deno.inspect(this.buffer)})`;
    }
    return `new Binary(${Deno.inspect(this.buffer)}, ${this.subType})`;
  }
}
class UUID1 {
  static cacheHexString;
  #bytesBuffer;
  #id;
  constructor(input) {
    if (typeof input === "undefined") {
      this.id = UUID1.generate();
    } else if (input instanceof UUID1) {
      this.#bytesBuffer = input.id;
      this.#id = input.#id;
    } else if (ArrayBuffer.isView(input) && input.byteLength === 16) {
      this.id = input;
    } else if (typeof input === "string") {
      this.id = uuidHexStringToBuffer(input);
    } else {
      throw new BSONTypeError1(
        "Argument passed in UUID constructor must be a UUID, a 16 byte Buffer or a 32/36 character hex string (dashes excluded/included, format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).",
      );
    }
    this.#bytesBuffer = this.id;
  }
  get id() {
    return this.#bytesBuffer;
  }
  set id(value) {
    this.#bytesBuffer = value;
    if (UUID1.cacheHexString) {
      this.#id = bufferToUuidHexString(value);
    }
  }
  toHexString(includeDashes = true) {
    if (UUID1.cacheHexString && this.#id) {
      return this.#id;
    }
    const uuidHexString = bufferToUuidHexString(this.id, includeDashes);
    if (UUID1.cacheHexString) {
      this.#id = uuidHexString;
    }
    return uuidHexString;
  }
  toString() {
    return this.toHexString();
  }
  toJSON() {
    return this.toHexString();
  }
  equals(otherId) {
    if (!otherId) {
      return false;
    }
    if (otherId instanceof UUID1) {
      return equals(otherId.id, this.id);
    }
    try {
      return equals(new UUID1(otherId).id, this.id);
    } catch {
      return false;
    }
  }
  toBinary() {
    return new Binary1(this.id, BinarySizes1.SUBTYPE_UUID);
  }
  static generate() {
    const bytes = randomBytes(16);
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    return bytes;
  }
  static isValid(input) {
    if (!input) {
      return false;
    }
    if (input instanceof UUID1) {
      return true;
    }
    if (typeof input === "string") {
      return uuidValidateString(input);
    }
    if (input instanceof Uint8Array) {
      if (input.length !== 16) {
        return false;
      }
      try {
        return parseInt(input[6].toString(16)[0], 10) ===
          BinarySizes1.SUBTYPE_UUID;
      } catch {
        return false;
      }
    }
    return false;
  }
  static createFromHexString(hexString) {
    const buffer = uuidHexStringToBuffer(hexString);
    return new UUID1(buffer);
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new UUID("${this.toHexString()}")`;
  }
}
class BSONSymbol1 {
  value;
  constructor(value) {
    this.value = value;
  }
  valueOf() {
    return this.value;
  }
  toString() {
    return this.value;
  }
  toJSON() {
    return this.value;
  }
  [Symbol.for("Deno.customInspect")]() {
    return `new BSONSymbol("${this.value}")`;
  }
}
function validateUtf8(bytes, start, end) {
  let continuation = 0;
  for (let i = start; i < end; i += 1) {
    const __byte = bytes[i];
    if (continuation) {
      if ((__byte & 192) !== 128) {
        return false;
      }
      continuation -= 1;
    } else if (__byte & 128) {
      if ((__byte & 224) === 192) {
        continuation = 1;
      } else if ((__byte & 240) === 224) {
        continuation = 2;
      } else if ((__byte & 248) === 240) {
        continuation = 3;
      } else {
        return false;
      }
    }
  }
  return !continuation;
}
const JS_INT_MAX_LONG = Long1.fromNumber(JS_INT_MAX1);
const JS_INT_MIN_LONG = Long1.fromNumber(JS_INT_MIN1);
const functionCache = {};
function deserialize2(buffer, options = {}, isArray) {
  const index = options?.index ? options.index : 0;
  const size = buffer[index] | buffer[index + 1] << 8 |
    buffer[index + 2] << 16 | buffer[index + 3] << 24;
  if (size < 5) {
    throw new BSONError1(`bson size must be >= 5, is ${size}`);
  }
  if (options.allowObjectSmallerThanBufferSize && buffer.length < size) {
    throw new BSONError1(
      `buffer length ${buffer.length} must be >= bson size ${size}`,
    );
  }
  if (!options.allowObjectSmallerThanBufferSize && buffer.length !== size) {
    throw new BSONError1(
      `buffer length ${buffer.length} must === bson size ${size}`,
    );
  }
  if (size + index > buffer.byteLength) {
    throw new BSONError1(
      `(bson size ${size} + options.index ${index} must be <= buffer length ${buffer.byteLength})`,
    );
  }
  if (buffer[index + size - 1] !== 0) {
    throw new BSONError1(
      "One object, sized correctly, with a spot for an EOO, but the EOO isn't 0x00",
    );
  }
  return deserializeObject(buffer, index, options, isArray);
}
const allowedDBRefKeys = /^\$ref$|^\$id$|^\$db$/;
function deserializeObject(buffer, index, options, isArray = false) {
  const evalFunctions = options.evalFunctions ?? false;
  const cacheFunctions = options.cacheFunctions ?? false;
  const fieldsAsRaw = options.fieldsAsRaw ?? null;
  const raw = options.raw ?? false;
  const bsonRegExp = options.bsonRegExp ?? false;
  const promoteBuffers = options.promoteBuffers ?? false;
  const promoteLongs = options.promoteLongs ?? true;
  const promoteValues = options.promoteValues ?? true;
  const validation = options.validation ?? {
    utf8: true,
  };
  let globalUTFValidation = true;
  let validationSetting;
  const utf8KeysSet = new Set();
  const utf8ValidatedKeys = validation.utf8;
  if (typeof utf8ValidatedKeys === "boolean") {
    validationSetting = utf8ValidatedKeys;
  } else {
    globalUTFValidation = false;
    const utf8ValidationValues = Object.keys(utf8ValidatedKeys).map((key) =>
      utf8ValidatedKeys[key]
    );
    if (utf8ValidationValues.length === 0) {
      throw new BSONError1("UTF-8 validation setting cannot be empty");
    }
    if (typeof utf8ValidationValues[0] !== "boolean") {
      throw new BSONError1(
        "Invalid UTF-8 validation option, must specify boolean values",
      );
    }
    validationSetting = utf8ValidationValues[0];
    if (!utf8ValidationValues.every((item) => item === validationSetting)) {
      throw new BSONError1(
        "Invalid UTF-8 validation option - keys must be all true or all false",
      );
    }
  }
  if (!globalUTFValidation) {
    for (const key of Object.keys(utf8ValidatedKeys)) {
      utf8KeysSet.add(key);
    }
  }
  const startIndex = index;
  if (buffer.length < 5) {
    throw new BSONError1("corrupt bson message < 5 bytes long");
  }
  const size = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 |
    buffer[index++] << 24;
  if (size < 5 || size > buffer.length) {
    throw new BSONError1("corrupt bson message");
  }
  const object = isArray ? [] : {};
  let arrayIndex = 0;
  let isPossibleDBRef = isArray ? false : null;
  while (!false) {
    const elementType = buffer[index++];
    if (elementType === 0) break;
    let i = index;
    while (buffer[i] !== 0 && i < buffer.length) {
      i++;
    }
    if (i >= buffer.byteLength) {
      throw new BSONError1("Bad BSON Document: illegal CString");
    }
    const name = isArray ? arrayIndex++ : utf8Slice(buffer, index, i);
    let shouldValidateKey = true;
    shouldValidateKey = globalUTFValidation || utf8KeysSet.has(name)
      ? validationSetting
      : !validationSetting;
    if (isPossibleDBRef !== false && name[0] === "$") {
      isPossibleDBRef = allowedDBRefKeys.test(name);
    }
    let value;
    index = i + 1;
    if (elementType === BSONData1.STRING) {
      const stringSize = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      if (
        stringSize <= 0 || stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError1("bad string length in bson");
      }
      value = getValidatedString(
        buffer,
        index,
        index + stringSize - 1,
        shouldValidateKey,
      );
      index += stringSize;
    } else if (elementType === BSONData1.OID) {
      const oid = new Uint8Array(12);
      bytesCopy(oid, 0, buffer, index, index + 12);
      value = new ObjectId1(oid);
      index += 12;
    } else if (elementType === BSONData1.INT && promoteValues === false) {
      value = new Int321(
        buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 |
          buffer[index++] << 24,
      );
    } else if (elementType === BSONData1.INT) {
      value = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 |
        buffer[index++] << 24;
    } else if (elementType === BSONData1.NUMBER && promoteValues === false) {
      value = new Double1(
        new DataView(buffer.buffer, index, 8).getFloat64(0, true),
      );
      index += 8;
    } else if (elementType === BSONData1.NUMBER) {
      value = new DataView(buffer.buffer, index, 8).getFloat64(0, true);
      index += 8;
    } else if (elementType === BSONData1.DATE) {
      const lowBits = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      const highBits = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      value = new Date(new Long1(lowBits, highBits).toNumber());
    } else if (elementType === BSONData1.BOOLEAN) {
      if (buffer[index] !== 0 && buffer[index] !== 1) {
        throw new BSONError1("illegal boolean type value");
      }
      value = buffer[index++] === 1;
    } else if (elementType === BSONData1.OBJECT) {
      const _index = index;
      const objectSize = buffer[index] | buffer[index + 1] << 8 |
        buffer[index + 2] << 16 | buffer[index + 3] << 24;
      if (objectSize <= 0 || objectSize > buffer.length - index) {
        throw new BSONError1("bad embedded document length in bson");
      }
      if (raw) {
        value = buffer.slice(index, index + objectSize);
      } else {
        let objectOptions = options;
        if (!globalUTFValidation) {
          objectOptions = {
            ...options,
            validation: {
              utf8: shouldValidateKey,
            },
          };
        }
        value = deserializeObject(buffer, _index, objectOptions, false);
      }
      index += objectSize;
    } else if (elementType === BSONData1.ARRAY) {
      const _index = index;
      const objectSize = buffer[index] | buffer[index + 1] << 8 |
        buffer[index + 2] << 16 | buffer[index + 3] << 24;
      let arrayOptions = options;
      const stopIndex = index + objectSize;
      if (fieldsAsRaw && fieldsAsRaw[name]) {
        arrayOptions = {};
        for (const n in options) {
          arrayOptions[n] = options[n];
        }
        arrayOptions.raw = true;
      }
      if (!globalUTFValidation) {
        arrayOptions = {
          ...arrayOptions,
          validation: {
            utf8: shouldValidateKey,
          },
        };
      }
      value = deserializeObject(buffer, _index, arrayOptions, true);
      index += objectSize;
      if (buffer[index - 1] !== 0) {
        throw new BSONError1("invalid array terminator byte");
      }
      if (index !== stopIndex) throw new BSONError1("corrupted array bson");
    } else if (elementType === BSONData1.UNDEFINED) {
      value = undefined;
    } else if (elementType === BSONData1.NULL) {
      value = null;
    } else if (elementType === BSONData1.LONG) {
      const lowBits = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      const highBits = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      const __long = new Long1(lowBits, highBits);
      if (promoteLongs && promoteValues === true) {
        value =
          __long.lessThanOrEqual(JS_INT_MAX_LONG) &&
            __long.greaterThanOrEqual(JS_INT_MIN_LONG)
            ? __long.toNumber()
            : __long;
      } else {
        value = __long;
      }
    } else if (elementType === BSONData1.DECIMAL128) {
      const bytes = new Uint8Array(16);
      bytesCopy(bytes, 0, buffer, index, index + 16);
      index += 16;
      const decimal128 = new Decimal1281(bytes);
      value =
        "toObject" in decimal128 && typeof decimal128.toObject === "function"
          ? decimal128.toObject()
          : decimal128;
    } else if (elementType === BSONData1.BINARY) {
      let binarySize = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      const totalBinarySize = binarySize;
      const subType = buffer[index++];
      if (binarySize < 0) {
        throw new BSONError1("Negative binary type element size found");
      }
      if (binarySize > buffer.byteLength) {
        throw new BSONError1("Binary type size larger than document size");
      }
      if (buffer.slice != null) {
        if (subType === BinarySizes1.SUBTYPE_BYTE_ARRAY) {
          binarySize = buffer[index++] | buffer[index++] << 8 |
            buffer[index++] << 16 | buffer[index++] << 24;
          if (binarySize < 0) {
            throw new BSONError1(
              "Negative binary type element size found for subtype 0x02",
            );
          }
          if (binarySize > totalBinarySize - 4) {
            throw new BSONError1(
              "Binary type with subtype 0x02 contains too long binary size",
            );
          }
          if (binarySize < totalBinarySize - 4) {
            throw new BSONError1(
              "Binary type with subtype 0x02 contains too short binary size",
            );
          }
        }
        value = promoteBuffers && promoteValues
          ? buffer.slice(index, index + binarySize)
          : new Binary1(buffer.slice(index, index + binarySize), subType);
      } else {
        const _buffer = new Uint8Array(binarySize);
        if (subType === BinarySizes1.SUBTYPE_BYTE_ARRAY) {
          binarySize = buffer[index++] | buffer[index++] << 8 |
            buffer[index++] << 16 | buffer[index++] << 24;
          if (binarySize < 0) {
            throw new BSONError1(
              "Negative binary type element size found for subtype 0x02",
            );
          }
          if (binarySize > totalBinarySize - 4) {
            throw new BSONError1(
              "Binary type with subtype 0x02 contains too long binary size",
            );
          }
          if (binarySize < totalBinarySize - 4) {
            throw new BSONError1(
              "Binary type with subtype 0x02 contains too short binary size",
            );
          }
        }
        for (i = 0; i < binarySize; i++) {
          _buffer[i] = buffer[index + i];
        }
        value = promoteBuffers && promoteValues
          ? _buffer
          : new Binary1(_buffer, subType);
      }
      index += binarySize;
    } else if (elementType === BSONData1.REGEXP && bsonRegExp === false) {
      i = index;
      while (buffer[i] !== 0 && i < buffer.length) {
        i++;
      }
      if (i >= buffer.length) {
        throw new BSONError1("Bad BSON Document: illegal CString");
      }
      const source = utf8Slice(buffer, index, i);
      index = i + 1;
      i = index;
      while (buffer[i] !== 0 && i < buffer.length) {
        i++;
      }
      if (i >= buffer.length) {
        throw new BSONError1("Bad BSON Document: illegal CString");
      }
      const regExpOptions = utf8Slice(buffer, index, i);
      index = i + 1;
      const optionsArray = new Array(regExpOptions.length);
      for (i = 0; i < regExpOptions.length; i++) {
        switch (regExpOptions[i]) {
          case "m":
            optionsArray[i] = "m";
            break;
          case "s":
            optionsArray[i] = "g";
            break;
          case "i":
            optionsArray[i] = "i";
            break;
        }
      }
      value = new RegExp(source, optionsArray.join(""));
    } else if (elementType === BSONData1.REGEXP && bsonRegExp === true) {
      i = index;
      while (buffer[i] !== 0 && i < buffer.length) {
        i++;
      }
      if (i >= buffer.length) {
        throw new BSONError1("Bad BSON Document: illegal CString");
      }
      const source = utf8Slice(buffer, index, i);
      index = i + 1;
      i = index;
      while (buffer[i] !== 0 && i < buffer.length) {
        i++;
      }
      if (i >= buffer.length) {
        throw new BSONError1("Bad BSON Document: illegal CString");
      }
      const regExpOptions = utf8Slice(buffer, index, i);
      index = i + 1;
      value = new BSONRegExp1(source, regExpOptions);
    } else if (elementType === BSONData1.SYMBOL) {
      const stringSize = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      if (
        stringSize <= 0 || stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError1("bad string length in bson");
      }
      const symbol = getValidatedString(
        buffer,
        index,
        index + stringSize - 1,
        shouldValidateKey,
      );
      value = promoteValues ? symbol : new BSONSymbol1(symbol);
      index += stringSize;
    } else if (elementType === BSONData1.TIMESTAMP) {
      const lowBits = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      const highBits = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      value = new Timestamp1(new Long1(lowBits, highBits));
    } else if (elementType === BSONData1.MIN_KEY) {
      value = new MinKey1();
    } else if (elementType === BSONData1.MAX_KEY) {
      value = new MaxKey1();
    } else if (elementType === BSONData1.CODE) {
      const stringSize = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      if (
        stringSize <= 0 || stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError1("bad string length in bson");
      }
      const functionString = getValidatedString(
        buffer,
        index,
        index + stringSize - 1,
        shouldValidateKey,
      );
      if (evalFunctions) {
        value = cacheFunctions
          ? isolateEval(functionString, functionCache, object)
          : isolateEval(functionString);
      } else {
        value = new Code1(functionString);
      }
      index += stringSize;
    } else if (elementType === BSONData1.CODE_W_SCOPE) {
      const totalSize = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      if (totalSize < 4 + 4 + 4 + 1) {
        throw new BSONError1(
          "code_w_scope total size shorter minimum expected length",
        );
      }
      const stringSize = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      if (
        stringSize <= 0 || stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError1("bad string length in bson");
      }
      const functionString = getValidatedString(
        buffer,
        index,
        index + stringSize - 1,
        shouldValidateKey,
      );
      index += stringSize;
      const _index = index;
      const objectSize = buffer[index] | buffer[index + 1] << 8 |
        buffer[index + 2] << 16 | buffer[index + 3] << 24;
      const scopeObject = deserializeObject(buffer, _index, options, false);
      index += objectSize;
      if (totalSize < 4 + 4 + objectSize + stringSize) {
        throw new BSONError1(
          "code_w_scope total size is too short, truncating scope",
        );
      }
      if (totalSize > 4 + 4 + objectSize + stringSize) {
        throw new BSONError1(
          "code_w_scope total size is too long, clips outer document",
        );
      }
      if (evalFunctions) {
        value = cacheFunctions
          ? isolateEval(functionString, functionCache, object)
          : isolateEval(functionString);
        value.scope = scopeObject;
      } else {
        value = new Code1(functionString, scopeObject);
      }
    } else if (elementType === BSONData1.DBPOINTER) {
      const stringSize = buffer[index++] | buffer[index++] << 8 |
        buffer[index++] << 16 | buffer[index++] << 24;
      if (
        stringSize <= 0 || stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError1("bad string length in bson");
      }
      if (
        validation?.utf8 && !validateUtf8(buffer, index, index + stringSize - 1)
      ) {
        throw new BSONError1("Invalid UTF-8 string in BSON document");
      }
      const namespace = utf8Slice(buffer, index, index + stringSize - 1);
      index += stringSize;
      const oidBuffer = new Uint8Array(12);
      bytesCopy(oidBuffer, 0, buffer, index, index + 12);
      const oid = new ObjectId1(oidBuffer);
      index += 12;
      value = new DBRef1(namespace, oid);
    } else {
      throw new BSONError1(
        `Detected unknown BSON type ${elementType.toString(16)}` +
          ' for fieldname "' + name + '"',
      );
    }
    if (name === "__proto__") {
      Object.defineProperty(object, name, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      object[name] = value;
    }
  }
  if (size !== index - startIndex) {
    if (isArray) throw new BSONError1("corrupt array bson");
    throw new BSONError1("corrupt object bson");
  }
  if (!isPossibleDBRef) return object;
  if (isDBRefLike(object)) {
    const copy = Object.assign({}, object);
    delete copy.$ref;
    delete copy.$id;
    delete copy.$db;
    return new DBRef1(object.$ref, object.$id, object.$db, copy);
  }
  return object;
}
function isolateEval(functionString, functionCache, object) {
  if (!functionCache) return new Function(functionString);
  if (functionCache[functionString] == null) {
    functionCache[functionString] = new Function(functionString);
  }
  return functionCache[functionString].bind(object);
}
function getValidatedString(buffer, start, end, shouldValidateUtf8) {
  const value = utf8Slice(buffer, start, end);
  if (shouldValidateUtf8) {
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) === 65533) {
        if (!validateUtf8(buffer, start, end)) {
          throw new BSONError1("Invalid UTF-8 string in BSON document");
        }
        break;
      }
    }
  }
  return value;
}
const utf8Encoder = new TextEncoder();
const regexp = /\x00/;
export { Long1 as LongWithoutOverridesClass };
export {
  Binary1 as Binary,
  BinarySizes1 as BinarySizes,
  BSONRegExp1 as BSONRegExp,
  BSONSymbol1 as BSONSymbol,
  Code1 as Code,
  DBRef1 as DBRef,
  Decimal1281 as Decimal128,
  Double1 as Double,
  Int321 as Int32,
  Long1 as Long,
  MaxKey1 as MaxKey,
  MinKey1 as MinKey,
  ObjectId1 as ObjectId,
  Timestamp1 as Timestamp,
  UUID1 as UUID,
};
const MAXSIZE = 1024 * 1024 * 17;
let buffer1 = new Uint8Array(MAXSIZE);
function setInternalBufferSize1(size) {
  if (buffer1.length < size) {
    buffer1 = new Uint8Array(size);
  }
}
const ignoreKeys = new Set([
  "$db",
  "$ref",
  "$id",
  "$clusterTime",
]);
function serializeString(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.STRING;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index = index + numberOfWrittenBytes + 1;
  buffer[index - 1] = 0;
  const size = writeToBytes(buffer, value, index + 4, "utf8");
  buffer[index + 3] = size + 1 >> 24 & 255;
  buffer[index + 2] = size + 1 >> 16 & 255;
  buffer[index + 1] = size + 1 >> 8 & 255;
  buffer[index] = size + 1 & 255;
  index = index + 4 + size;
  buffer[index++] = 0;
  return index;
}
function serializeNumber(buffer, key, value, index, isArray) {
  if (
    Number.isInteger(value) && value >= BSON_INT32_MIN1 && value <= 2147483647
  ) {
    buffer[index++] = BSONData1.INT;
    const numberOfWrittenBytes = !isArray
      ? writeToBytes(buffer, key, index, "utf8")
      : writeToBytes(buffer, key, index, "ascii");
    index += numberOfWrittenBytes;
    buffer[index++] = 0;
    buffer[index++] = value & 255;
    buffer[index++] = value >> 8 & 255;
    buffer[index++] = value >> 16 & 255;
    buffer[index++] = value >> 24 & 255;
  } else {
    buffer[index++] = BSONData1.NUMBER;
    const numberOfWrittenBytes = !isArray
      ? writeToBytes(buffer, key, index, "utf8")
      : writeToBytes(buffer, key, index, "ascii");
    index += numberOfWrittenBytes;
    buffer[index++] = 0;
    writeIEEE754(buffer, value, index, "little", 52, 8);
    index += 8;
  }
  return index;
}
function serializeNull(buffer, key, _, index, isArray) {
  buffer[index++] = BSONData1.NULL;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  return index;
}
function serializeBoolean(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.BOOLEAN;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  buffer[index++] = value ? 1 : 0;
  return index;
}
function serializeDate(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.DATE;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  const dateInMilis = Long1.fromNumber(value.getTime());
  const lowBits = dateInMilis.getLowBits();
  const highBits = dateInMilis.getHighBits();
  buffer[index++] = lowBits & 255;
  buffer[index++] = lowBits >> 8 & 255;
  buffer[index++] = lowBits >> 16 & 255;
  buffer[index++] = lowBits >> 24 & 255;
  buffer[index++] = highBits & 255;
  buffer[index++] = highBits >> 8 & 255;
  buffer[index++] = highBits >> 16 & 255;
  buffer[index++] = highBits >> 24 & 255;
  return index;
}
function serializeRegExp(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.REGEXP;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  if (value.source && value.source.match(regexp) != null) {
    throw Error(`value ${value.source} must not contain null bytes`);
  }
  index += writeToBytes(buffer, value.source, index, "utf8");
  buffer[index++] = 0;
  if (value.ignoreCase) buffer[index++] = 105;
  if (value.global) buffer[index++] = 115;
  if (value.multiline) buffer[index++] = 109;
  buffer[index++] = 0;
  return index;
}
function serializeBSONRegExp(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.REGEXP;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  if (value.pattern.match(regexp) != null) {
    throw Error(`pattern ${value.pattern} must not contain null bytes`);
  }
  index += writeToBytes(buffer, value.pattern, index, "utf8");
  buffer[index++] = 0;
  index += writeToBytes(
    buffer,
    value.options.split("").sort().join(""),
    index,
    "utf8",
  );
  buffer[index++] = 0;
  return index;
}
function serializeMinMax(buffer, key, value, index, isArray) {
  if (value === null) {
    buffer[index++] = BSONData1.NULL;
  } else if (value instanceof MinKey1) {
    buffer[index++] = BSONData1.MIN_KEY;
  } else {
    buffer[index++] = BSONData1.MAX_KEY;
  }
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  return index;
}
function serializeObjectId(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.OID;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  if (typeof value.id === "string") {
    writeToBytes(buffer, value.id, index, "ascii");
  } else if (value.id instanceof Uint8Array) {
    buffer.set(value.id.subarray(0, 12), index);
  } else {
    throw new BSONTypeError1(
      `object [${JSON.stringify(value)}] is not a valid ObjectId`,
    );
  }
  return index + 12;
}
function serializeBuffer(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.BINARY;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  const size = value.length;
  buffer[index++] = size & 255;
  buffer[index++] = size >> 8 & 255;
  buffer[index++] = size >> 16 & 255;
  buffer[index++] = size >> 24 & 255;
  buffer[index++] = BSON_BINARY_SUBTYPE_DEFAULT1;
  buffer.set(value, index);
  index += size;
  return index;
}
function serializeObject(
  buffer,
  key,
  value,
  index,
  checkKeys = false,
  depth = 0,
  serializeFunctions = false,
  ignoreUndefined = true,
  isArray = false,
  path = [],
) {
  for (let i = 0; i < path.length; i++) {
    if (path[i] === value) throw new BSONError1("cyclic dependency detected");
  }
  path.push(value);
  buffer[index++] = Array.isArray(value) ? BSONData1.ARRAY : BSONData1.OBJECT;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  const endIndex = serializeInto(
    buffer,
    value,
    checkKeys,
    index,
    depth + 1,
    serializeFunctions,
    ignoreUndefined,
    path,
  );
  path.pop();
  return endIndex;
}
function serializeDecimal128(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.DECIMAL128;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  buffer.set(value.bytes.subarray(0, 16), index);
  return index + 16;
}
function serializeLong(buffer, key, value, index, isArray) {
  buffer[index++] = value instanceof Timestamp1
    ? BSONData1.TIMESTAMP
    : BSONData1.LONG;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  const lowBits = value.getLowBits();
  const highBits = value.getHighBits();
  buffer[index++] = lowBits & 255;
  buffer[index++] = lowBits >> 8 & 255;
  buffer[index++] = lowBits >> 16 & 255;
  buffer[index++] = lowBits >> 24 & 255;
  buffer[index++] = highBits & 255;
  buffer[index++] = highBits >> 8 & 255;
  buffer[index++] = highBits >> 16 & 255;
  buffer[index++] = highBits >> 24 & 255;
  return index;
}
function serializeInt32(buffer, key, value, index, isArray) {
  value = value.valueOf();
  buffer[index++] = BSONData1.INT;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  buffer[index++] = value & 255;
  buffer[index++] = value >> 8 & 255;
  buffer[index++] = value >> 16 & 255;
  buffer[index++] = value >> 24 & 255;
  return index;
}
function serializeDouble(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.NUMBER;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  writeIEEE754(buffer, value.value, index, "little", 52, 8);
  index += 8;
  return index;
}
function serializeFunction(
  buffer,
  key,
  value,
  index,
  _checkKeys = false,
  _depth = 0,
  isArray,
) {
  buffer[index++] = BSONData1.CODE;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  const functionString = normalizedFunctionString(value);
  const size = writeToBytes(buffer, functionString, index + 4, "utf8") + 1;
  buffer[index] = size & 255;
  buffer[index + 1] = size >> 8 & 255;
  buffer[index + 2] = size >> 16 & 255;
  buffer[index + 3] = size >> 24 & 255;
  index = index + 4 + size - 1;
  buffer[index++] = 0;
  return index;
}
function serializeCode(
  buffer,
  key,
  value,
  index,
  checkKeys = false,
  depth = 0,
  serializeFunctions = false,
  ignoreUndefined = true,
  isArray = false,
) {
  if (value.scope && typeof value.scope === "object") {
    buffer[index++] = BSONData1.CODE_W_SCOPE;
    const numberOfWrittenBytes = !isArray
      ? writeToBytes(buffer, key, index, "utf8")
      : writeToBytes(buffer, key, index, "ascii");
    index += numberOfWrittenBytes;
    buffer[index++] = 0;
    let startIndex = index;
    const functionString = typeof value.code === "string"
      ? value.code
      : value.code.toString();
    index += 4;
    const codeSize = writeToBytes(buffer, functionString, index + 4, "utf8") +
      1;
    buffer[index] = codeSize & 255;
    buffer[index + 1] = codeSize >> 8 & 255;
    buffer[index + 2] = codeSize >> 16 & 255;
    buffer[index + 3] = codeSize >> 24 & 255;
    buffer[index + 4 + codeSize - 1] = 0;
    index = index + codeSize + 4;
    const endIndex = serializeInto(
      buffer,
      value.scope,
      checkKeys,
      index,
      depth + 1,
      serializeFunctions,
      ignoreUndefined,
    );
    index = endIndex - 1;
    const totalSize = endIndex - startIndex;
    buffer[startIndex++] = totalSize & 255;
    buffer[startIndex++] = totalSize >> 8 & 255;
    buffer[startIndex++] = totalSize >> 16 & 255;
    buffer[startIndex++] = totalSize >> 24 & 255;
  } else {
    buffer[index++] = BSONData1.CODE;
    const numberOfWrittenBytes = !isArray
      ? writeToBytes(buffer, key, index, "utf8")
      : writeToBytes(buffer, key, index, "ascii");
    index += numberOfWrittenBytes;
    buffer[index++] = 0;
    const functionString = value.code.toString();
    const size = writeToBytes(buffer, functionString, index + 4, "utf8") + 1;
    buffer[index] = size & 255;
    buffer[index + 1] = size >> 8 & 255;
    buffer[index + 2] = size >> 16 & 255;
    buffer[index + 3] = size >> 24 & 255;
    index = index + 4 + size - 1;
  }
  buffer[index++] = 0;
  return index;
}
function serializeBinary(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.BINARY;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  const data = value.buffer;
  let size = value.buffer.length;
  if (value.subType === BinarySizes1.SUBTYPE_BYTE_ARRAY) size += 4;
  buffer[index++] = size & 255;
  buffer[index++] = size >> 8 & 255;
  buffer[index++] = size >> 16 & 255;
  buffer[index++] = size >> 24 & 255;
  buffer[index++] = value.subType;
  if (value.subType === BinarySizes1.SUBTYPE_BYTE_ARRAY) {
    size -= 4;
    buffer[index++] = size & 255;
    buffer[index++] = size >> 8 & 255;
    buffer[index++] = size >> 16 & 255;
    buffer[index++] = size >> 24 & 255;
  }
  buffer.set(data, index);
  index += size;
  return index;
}
function serializeSymbol(buffer, key, value, index, isArray) {
  buffer[index++] = BSONData1.SYMBOL;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  const size = writeToBytes(buffer, value.value, index + 4, "utf8") + 1;
  buffer[index] = size & 255;
  buffer[index + 1] = size >> 8 & 255;
  buffer[index + 2] = size >> 16 & 255;
  buffer[index + 3] = size >> 24 & 255;
  index = index + 4 + size - 1;
  buffer[index++] = 0;
  return index;
}
function serializeDBRef(
  buffer,
  key,
  value,
  index,
  depth,
  serializeFunctions,
  isArray,
) {
  buffer[index++] = BSONData1.OBJECT;
  const numberOfWrittenBytes = !isArray
    ? writeToBytes(buffer, key, index, "utf8")
    : writeToBytes(buffer, key, index, "ascii");
  index += numberOfWrittenBytes;
  buffer[index++] = 0;
  let startIndex = index;
  let output = {
    $ref: value.collection,
    $id: value.oid,
  };
  if (value.db != null) {
    output.$db = value.db;
  }
  output = Object.assign(output, value.fields);
  const endIndex = serializeInto(
    buffer,
    output,
    false,
    index,
    depth + 1,
    serializeFunctions,
  );
  const size = endIndex - startIndex;
  buffer[startIndex++] = size & 255;
  buffer[startIndex++] = size >> 8 & 255;
  buffer[startIndex++] = size >> 16 & 255;
  buffer[startIndex++] = size >> 24 & 255;
  return endIndex;
}
function serializeInto(
  buffer,
  object,
  checkKeys = false,
  startingIndex = 0,
  depth = 0,
  serializeFunctions = false,
  ignoreUndefined = true,
  path = [],
) {
  startingIndex = startingIndex || 0;
  path = path || [];
  path.push(object);
  let index = startingIndex + 4;
  if (Array.isArray(object)) {
    for (let i = 0; i < object.length; i++) {
      const key = i.toString();
      let value = object[i];
      if (value?.toBSON) {
        if (typeof value.toBSON !== "function") {
          throw new BSONTypeError1("toBSON is not a function");
        }
        value = value.toBSON();
      }
      if (typeof value === "string") {
        index = serializeString(buffer, key, value, index, true);
      } else if (typeof value === "number") {
        index = serializeNumber(buffer, key, value, index, true);
      } else if (typeof value === "bigint") {
        throw new BSONTypeError1(
          "Unsupported type BigInt, please use Decimal128",
        );
      } else if (typeof value === "boolean") {
        index = serializeBoolean(buffer, key, value, index, true);
      } else if (value instanceof Date) {
        index = serializeDate(buffer, key, value, index, true);
      } else if (value === undefined) {
        index = serializeNull(buffer, key, value, index, true);
      } else if (value === null) {
        index = serializeNull(buffer, key, value, index, true);
      } else if (value instanceof ObjectId1) {
        index = serializeObjectId(buffer, key, value, index, true);
      } else if (value instanceof Uint8Array) {
        index = serializeBuffer(buffer, key, value, index, true);
      } else if (value instanceof RegExp) {
        index = serializeRegExp(buffer, key, value, index, true);
      } else if (value instanceof Decimal1281) {
        index = serializeDecimal128(buffer, key, value, index, true);
      } else if (value instanceof Long1 || value instanceof Timestamp1) {
        index = serializeLong(buffer, key, value, index, true);
      } else if (value instanceof Double1) {
        index = serializeDouble(buffer, key, value, index, true);
      } else if (typeof value === "function" && serializeFunctions) {
        index = serializeFunction(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          true,
        );
      } else if (value instanceof Code1) {
        index = serializeCode(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          true,
        );
      } else if (value instanceof Binary1) {
        index = serializeBinary(buffer, key, value, index, true);
      } else if (value instanceof BSONSymbol1) {
        index = serializeSymbol(buffer, key, value, index, true);
      } else if (value instanceof DBRef1) {
        index = serializeDBRef(
          buffer,
          key,
          value,
          index,
          depth,
          serializeFunctions,
          true,
        );
      } else if (value instanceof BSONRegExp1) {
        index = serializeBSONRegExp(buffer, key, value, index, true);
      } else if (value instanceof Int321) {
        index = serializeInt32(buffer, key, value, index, true);
      } else if (value instanceof MinKey1 || value instanceof MaxKey1) {
        index = serializeMinMax(buffer, key, value, index, true);
      } else if (value instanceof Object) {
        index = serializeObject(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          true,
          path,
        );
      } else {
        throw new BSONTypeError1(`Unrecognized or invalid BSON Type: ${value}`);
      }
    }
  } else if (object instanceof Map) {
    const iterator = object.entries();
    let done = false;
    while (!done) {
      const entry = iterator.next();
      done = !!entry.done;
      if (done) continue;
      const key = entry.value[0];
      const value = entry.value[1];
      const type = typeof value;
      if (typeof key === "string" && !ignoreKeys.has(key)) {
        if (key.match(regexp) != null) {
          throw Error(`key ${key} must not contain null bytes`);
        }
        if (checkKeys) {
          if (key.startsWith("$")) {
            throw Error(`key ${key} must not start with '$'`);
          } else if (~key.indexOf(".")) {
            throw Error(`key ${key} must not contain '.'`);
          }
        }
      }
      if (type === "string") {
        index = serializeString(buffer, key, value, index);
      } else if (type === "number") {
        index = serializeNumber(buffer, key, value, index);
      } else if (
        type === "bigint" || value instanceof BigInt64Array ||
        value instanceof BigUint64Array
      ) {
        throw new BSONTypeError1(
          "Unsupported type BigInt, please use Decimal128",
        );
      } else if (type === "boolean") {
        index = serializeBoolean(buffer, key, value, index);
      } else if (value instanceof Date) {
        index = serializeDate(buffer, key, value, index);
      } else if (
        value === null || value === undefined && ignoreUndefined === false
      ) {
        index = serializeNull(buffer, key, value, index);
      } else if (value instanceof ObjectId1) {
        index = serializeObjectId(buffer, key, value, index);
      } else if (value instanceof Uint8Array) {
        index = serializeBuffer(buffer, key, value, index);
      } else if (value instanceof RegExp) {
        index = serializeRegExp(buffer, key, value, index);
      } else if (type === "object" && value instanceof Object) {
        index = serializeObject(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          false,
          path,
        );
      } else if (type === "object" && value instanceof Decimal1281) {
        index = serializeDecimal128(buffer, key, value, index);
      } else if (value instanceof Long1) {
        index = serializeLong(buffer, key, value, index);
      } else if (value instanceof Double1) {
        index = serializeDouble(buffer, key, value, index);
      } else if (value instanceof Code1) {
        index = serializeCode(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
        );
      } else if (typeof value === "function" && serializeFunctions) {
        index = serializeFunction(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
        );
      } else if (value instanceof Binary1) {
        index = serializeBinary(buffer, key, value, index);
      } else if (value instanceof BSONSymbol1) {
        index = serializeSymbol(buffer, key, value, index);
      } else if (value instanceof DBRef1) {
        index = serializeDBRef(
          buffer,
          key,
          value,
          index,
          depth,
          serializeFunctions,
        );
      } else if (value instanceof BSONRegExp1) {
        index = serializeBSONRegExp(buffer, key, value, index);
      } else if (value instanceof Int321) {
        index = serializeInt32(buffer, key, value, index);
      } else if (value instanceof MinKey1 || value instanceof MaxKey1) {
        index = serializeMinMax(buffer, key, value, index);
      } else {
        throw new BSONTypeError1(`Unrecognized or invalid BSON TYPE: ${value}`);
      }
    }
  } else {
    if (object.toBSON) {
      if (typeof object.toBSON !== "function") {
        throw new BSONTypeError1("toBSON is not a function");
      }
      object = object.toBSON();
      if (object != null && typeof object !== "object") {
        throw new BSONTypeError1("toBSON function did not return an object");
      }
    }
    for (const key in object) {
      let value = object[key];
      if (value?.toBSON) {
        if (typeof value.toBSON !== "function") {
          throw new BSONTypeError1("toBSON is not a function");
        }
        value = value.toBSON();
      }
      const type = typeof value;
      if (typeof key === "string" && !ignoreKeys.has(key)) {
        if (key.match(regexp) != null) {
          throw Error(`key ${key} must not contain null bytes`);
        }
        if (checkKeys) {
          if (key.startsWith("$")) {
            throw Error(`key ${key} must not start with '$'`);
          } else if (~key.indexOf(".")) {
            throw Error(`key ${key} must not contain '.'`);
          }
        }
      }
      if (type === "string") {
        index = serializeString(buffer, key, value, index);
      } else if (type === "number") {
        index = serializeNumber(buffer, key, value, index);
      } else if (type === "bigint") {
        throw new BSONTypeError1(
          "Unsupported type BigInt, please use Decimal128",
        );
      } else if (type === "boolean") {
        index = serializeBoolean(buffer, key, value, index);
      } else if (value instanceof Date) {
        index = serializeDate(buffer, key, value, index);
      } else if (value === undefined) {
        if (ignoreUndefined === false) {
          index = serializeNull(buffer, key, value, index);
        }
      } else if (value === null) {
        index = serializeNull(buffer, key, value, index);
      } else if (value instanceof ObjectId1) {
        index = serializeObjectId(buffer, key, value, index);
      } else if (value instanceof Uint8Array) {
        index = serializeBuffer(buffer, key, value, index);
      } else if (value instanceof RegExp) {
        index = serializeRegExp(buffer, key, value, index);
      } else if (type === "object" && value instanceof Decimal1281) {
        index = serializeDecimal128(buffer, key, value, index);
      } else if (value instanceof Long1 || value instanceof Timestamp1) {
        index = serializeLong(buffer, key, value, index);
      } else if (value instanceof Double1) {
        index = serializeDouble(buffer, key, value, index);
      } else if (value instanceof Code1) {
        index = serializeCode(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
        );
      } else if (typeof value === "function" && serializeFunctions) {
        index = serializeFunction(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
        );
      } else if (value instanceof Binary1) {
        index = serializeBinary(buffer, key, value, index);
      } else if (value instanceof BSONSymbol1) {
        index = serializeSymbol(buffer, key, value, index);
      } else if (value instanceof DBRef1) {
        index = serializeDBRef(
          buffer,
          key,
          value,
          index,
          depth,
          serializeFunctions,
        );
      } else if (value instanceof BSONRegExp1) {
        index = serializeBSONRegExp(buffer, key, value, index);
      } else if (value instanceof Int321) {
        index = serializeInt32(buffer, key, value, index);
      } else if (value instanceof MinKey1 || value instanceof MaxKey1) {
        index = serializeMinMax(buffer, key, value, index);
      } else if (value instanceof Object) {
        index = serializeObject(
          buffer,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          false,
          path,
        );
      } else {
        throw new BSONTypeError1(`Unrecognized or invalid BSON Type: ${value}`);
      }
    }
  }
  path.pop();
  buffer[index++] = 0;
  const size = index - startingIndex;
  buffer[startingIndex++] = size & 255;
  buffer[startingIndex++] = size >> 8 & 255;
  buffer[startingIndex++] = size >> 16 & 255;
  buffer[startingIndex++] = size >> 24 & 255;
  return index;
}
function serialize1(object, options = {}) {
  const checkKeys = typeof options.checkKeys === "boolean"
    ? options.checkKeys
    : false;
  const serializeFunctions = typeof options.serializeFunctions === "boolean"
    ? options.serializeFunctions
    : false;
  const ignoreUndefined = typeof options.ignoreUndefined === "boolean"
    ? options.ignoreUndefined
    : true;
  const serializationIndex = serializeInto(
    buffer1,
    object,
    checkKeys,
    0,
    0,
    serializeFunctions,
    ignoreUndefined,
    [],
  );
  const finishedBuffer = new Uint8Array(serializationIndex);
  bytesCopy(finishedBuffer, 0, buffer1, 0, finishedBuffer.length);
  return finishedBuffer;
}
function serializeWithBufferAndIndex1(object, finalBuffer, options = {}) {
  const checkKeys = typeof options.checkKeys === "boolean"
    ? options.checkKeys
    : false;
  const serializeFunctions = typeof options.serializeFunctions === "boolean"
    ? options.serializeFunctions
    : false;
  const ignoreUndefined = typeof options.ignoreUndefined === "boolean"
    ? options.ignoreUndefined
    : true;
  const startIndex = typeof options.index === "number" ? options.index : 0;
  const serializationIndex = serializeInto(
    buffer1,
    object,
    checkKeys,
    0,
    0,
    serializeFunctions,
    ignoreUndefined,
  );
  bytesCopy(finalBuffer, startIndex, buffer1, 0, serializationIndex);
  return startIndex + serializationIndex - 1;
}
function deserialize1(buffer, options = {}) {
  return deserialize2(
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer),
    options,
  );
}
function calculateObjectSize2(object, serializeFunctions, ignoreUndefined) {
  let totalLength = 4 + 1;
  if (Array.isArray(object)) {
    for (let i = 0; i < object.length; i++) {
      totalLength += calculateElement(
        i.toString(),
        object[i],
        serializeFunctions,
        true,
        ignoreUndefined,
      );
    }
  } else {
    if (object.toBSON) {
      object = object.toBSON();
    }
    for (const key in object) {
      totalLength += calculateElement(
        key,
        object[key],
        serializeFunctions,
        false,
        ignoreUndefined,
      );
    }
  }
  return totalLength;
}
function calculateObjectSize1(object, options = {}) {
  options = options || {};
  const serializeFunctions = typeof options.serializeFunctions === "boolean"
    ? options.serializeFunctions
    : false;
  const ignoreUndefined = typeof options.ignoreUndefined === "boolean"
    ? options.ignoreUndefined
    : true;
  return calculateObjectSize2(object, serializeFunctions, ignoreUndefined);
}
function deserializeStream1(
  data,
  startIndex,
  numberOfDocuments,
  documents,
  docStartIndex,
  options,
) {
  const internalOptions = Object.assign({
    allowObjectSmallerThanBufferSize: true,
    index: 0,
  }, options);
  const bufferData = data instanceof Uint8Array
    ? data
    : data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let index = startIndex;
  for (let i = 0; i < numberOfDocuments; i++) {
    const size = bufferData[index] | bufferData[index + 1] << 8 |
      bufferData[index + 2] << 16 | bufferData[index + 3] << 24;
    internalOptions.index = index;
    documents[docStartIndex + i] = deserialize2(bufferData, internalOptions);
    index += size;
  }
  return index;
}
function calculateElement(
  name,
  value,
  serializeFunctions = false,
  isArray = false,
  ignoreUndefined = false,
) {
  if (value?.toBSON) {
    value = value.toBSON();
  }
  switch (typeof value) {
    case "string":
      return 1 + utf8Encoder.encode(name).length + 1 + 4 +
        utf8Encoder.encode(value).length + 1;
    case "number":
      if (
        Math.floor(value) === value && value >= JS_INT_MIN1 &&
        value <= JS_INT_MAX1
      ) {
        return value >= BSON_INT32_MIN1 && value <= 2147483647
          ? (name != null ? utf8Encoder.encode(name).length + 1 : 0) + (4 + 1)
          : (name != null ? utf8Encoder.encode(name).length + 1 : 0) + (8 + 1);
      } else {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
          (8 + 1);
      }
    case "undefined":
      if (isArray || !ignoreUndefined) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1;
      }
      return 0;
    case "boolean":
      return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + (1 + 1);
    case "object":
      if (
        value == null || value instanceof MinKey1 || value instanceof MaxKey1
      ) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1;
      } else if (value instanceof ObjectId1) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
          (12 + 1);
      } else if (value instanceof Date) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
          (8 + 1);
      } else if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
          (1 + 4 + 1) + value.byteLength;
      } else if (
        value instanceof Long1 || value instanceof Double1 ||
        value instanceof Timestamp1
      ) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
          (8 + 1);
      } else if (value instanceof Decimal1281) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
          (16 + 1);
      } else if (value instanceof Code1) {
        if (value.scope != null && Object.keys(value.scope).length > 0) {
          return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1 +
            4 + 4 + utf8Encoder.encode(value.code.toString()).length + 1 +
            calculateObjectSize2(
              value.scope,
              serializeFunctions,
              ignoreUndefined,
            );
        }
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1 +
          4 + utf8Encoder.encode(value.code.toString()).length + 1;
      } else if (value instanceof Binary1) {
        return value.subType === BinarySizes1.SUBTYPE_BYTE_ARRAY
          ? (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
            (value.buffer.length + 1 + 4 + 1 + 4)
          : (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
            (value.buffer.length + 1 + 4 + 1);
      } else if (value instanceof BSONSymbol1) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
          utf8Encoder.encode(value.value).length + 4 + 1 + 1;
      } else if (value instanceof DBRef1) {
        const orderedValues = Object.assign({
          $ref: value.collection,
          $id: value.oid,
        }, value.fields);
        if (value.db != null) {
          orderedValues.$db = value.db;
        }
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1 +
          calculateObjectSize2(
            orderedValues,
            serializeFunctions,
            ignoreUndefined,
          );
      } else if (value instanceof RegExp) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1 +
          utf8Encoder.encode(value.source).length + 1 + (value.global ? 1 : 0) +
          (value.ignoreCase ? 1 : 0) + (value.multiline ? 1 : 0) + 1;
      } else if (value instanceof BSONRegExp1) {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1 +
          utf8Encoder.encode(value.pattern).length + 1 +
          utf8Encoder.encode(value.options).length + 1;
      } else {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) +
          calculateObjectSize2(value, serializeFunctions, ignoreUndefined) + 1;
      }
    case "function":
      if (value instanceof RegExp || String.call(value) === "[object RegExp]") {
        return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1 +
          utf8Encoder.encode(value.source).length + 1 + (value.global ? 1 : 0) +
          (value.ignoreCase ? 1 : 0) + (value.multiline ? 1 : 0) + 1;
      } else {
        if (
          serializeFunctions && value.scope != null &&
          Object.keys(value.scope).length > 0
        ) {
          return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1 +
            4 + 4 + utf8Encoder.encode(normalizedFunctionString(value)).length +
            1 +
            calculateObjectSize2(
              value.scope,
              serializeFunctions,
              ignoreUndefined,
            );
        }
        if (serializeFunctions) {
          return (name != null ? utf8Encoder.encode(name).length + 1 : 0) + 1 +
            4 + utf8Encoder.encode(normalizedFunctionString(value)).length + 1;
        }
      }
  }
  return 0;
}
export { setInternalBufferSize1 as setInternalBufferSize };
export { serialize1 as serialize };
export { serializeWithBufferAndIndex1 as serializeWithBufferAndIndex };
export { deserialize1 as deserialize };
export { calculateObjectSize1 as calculateObjectSize };
export { deserializeStream1 as deserializeStream };
