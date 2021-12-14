import { Decimal128, Document } from "../src/bson.ts";
import { Buffer } from "buffer";
import {
  assertEquals,
  assertThrows,
  equal,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { calculateObjectSize, deserialize, serialize } from "../src/bson.ts";
const NAN = Buffer.from(
  [
    0x7c,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ].reverse(),
);
const INF_NEGATIVE_BUFFER = Buffer.from(
  [
    0xf8,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ].reverse(),
);
const INF_POSITIVE_BUFFER = Buffer.from(
  [
    0x78,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ].reverse(),
);

Deno.test("[Decimal128] fromString invalid input", () => {
  assertThrows(() => Decimal128.fromString("E02"));
  assertThrows(() => Decimal128.fromString("E+02"));
  assertThrows(() => Decimal128.fromString("e+02"));
  assertThrows(() => Decimal128.fromString("."));
  assertThrows(() => Decimal128.fromString(".e"));
  assertThrows(() => Decimal128.fromString(""));
  assertThrows(() => Decimal128.fromString("invalid"));
  assertThrows(() => Decimal128.fromString("in"));
  assertThrows(() => Decimal128.fromString("i"));
  assertThrows(() => Decimal128.fromString("..1"));
  assertThrows(() => Decimal128.fromString("1abcede"));
  assertThrows(() => Decimal128.fromString("1.24abc"));
  assertThrows(() => Decimal128.fromString("1.24abcE+02"));
  assertThrows(() => Decimal128.fromString("1.24E+02abc2d"));
});

Deno.test("[Decimal128] fromString NaN input", () => {
  let result = Decimal128.fromString("NaN");
  equal(NAN, result.bytes);
  result = Decimal128.fromString("+NaN");
  equal(NAN, result.bytes);
  result = Decimal128.fromString("-NaN");
  equal(NAN, result.bytes);
  result = Decimal128.fromString("-nan");
  equal(NAN, result.bytes);
  result = Decimal128.fromString("+nan");
  equal(NAN, result.bytes);
  result = Decimal128.fromString("nan");
  equal(NAN, result.bytes);
  result = Decimal128.fromString("Nan");
  equal(NAN, result.bytes);
  result = Decimal128.fromString("+Nan");
  equal(NAN, result.bytes);
  result = Decimal128.fromString("-Nan");
  equal(NAN, result.bytes);
});

Deno.test("[Decimal128] fromString infinity input", () => {
  let result = Decimal128.fromString("Infinity");
  assertEquals(INF_POSITIVE_BUFFER, result.bytes);
  result = Decimal128.fromString("+Infinity");
  assertEquals(INF_POSITIVE_BUFFER, result.bytes);
  result = Decimal128.fromString("+Inf");
  assertEquals(INF_POSITIVE_BUFFER, result.bytes);
  result = Decimal128.fromString("-Inf");
  assertEquals(INF_NEGATIVE_BUFFER, result.bytes);
  result = Decimal128.fromString("-Infinity");
  assertEquals(INF_NEGATIVE_BUFFER, result.bytes);
});

Deno.test("[Decimal128] fromString simple", () => {
  // Create decimal from string value 1
  let result = Decimal128.fromString("1");
  let bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 0
  result = Decimal128.fromString("0");
  bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value -0
  result = Decimal128.fromString("-0");
  bytes = Buffer.from(
    [
      0xb0,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value -1
  result = Decimal128.fromString("-1");
  bytes = Buffer.from(
    [
      0xb0,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 12345678901234567
  result = Decimal128.fromString("12345678901234567");
  bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x2b,
      0xdc,
      0x54,
      0x5d,
      0x6b,
      0x4b,
      0x87,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 989898983458
  result = Decimal128.fromString("989898983458");
  bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0xe6,
      0x7a,
      0x93,
      0xc8,
      0x22,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value -12345678901234567
  result = Decimal128.fromString("-12345678901234567");
  bytes = Buffer.from(
    [
      0xb0,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x2b,
      0xdc,
      0x54,
      0x5d,
      0x6b,
      0x4b,
      0x87,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 0.12345
  result = Decimal128.fromString("0.12345");
  bytes = Buffer.from(
    [
      0x30,
      0x36,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x30,
      0x39,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 0.0012345
  result = Decimal128.fromString("0.0012345");
  bytes = Buffer.from(
    [
      0x30,
      0x32,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x30,
      0x39,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 00012345678901234567
  result = Decimal128.fromString("00012345678901234567");
  bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x2b,
      0xdc,
      0x54,
      0x5d,
      0x6b,
      0x4b,
      0x87,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);
});

Deno.test("[Decimal128] fromString scientific format", () => {
  // Create decimal from string value 10e0
  let result = Decimal128.fromString("10e0");
  let bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x0a,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 1e1
  result = Decimal128.fromString("1e1");
  bytes = Buffer.from(
    [
      0x30,
      0x42,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 10e-1
  result = Decimal128.fromString("10e-1");
  bytes = Buffer.from(
    [
      0x30,
      0x3e,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x0a,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 12345678901234567e6111
  result = Decimal128.fromString("12345678901234567e6111");
  bytes = Buffer.from(
    [
      0x5f,
      0xfe,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x2b,
      0xdc,
      0x54,
      0x5d,
      0x6b,
      0x4b,
      0x87,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 1e-6176
  result = Decimal128.fromString("1e-6176");
  bytes = Buffer.from(
    [
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value "-100E-10
  result = Decimal128.fromString("-100E-10");
  bytes = Buffer.from(
    [
      0xb0,
      0x2c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x64,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 10.50E8
  result = Decimal128.fromString("10.50E8");
  bytes = Buffer.from(
    [
      0x30,
      0x4c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x04,
      0x1a,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);
});

Deno.test("[Decimal128] fromString large format", () => {
  // Create decimal from string value 12345689012345789012345
  let result = Decimal128.fromString("12345689012345789012345");
  let bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x02,
      0x9d,
      0x42,
      0xda,
      0x3a,
      0x76,
      0xf9,
      0xe0,
      0xd9,
      0x79,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 1234567890123456789012345678901234
  result = Decimal128.fromString("1234567890123456789012345678901234");
  bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x3c,
      0xde,
      0x6f,
      0xff,
      0x97,
      0x32,
      0xde,
      0x82,
      0x5c,
      0xd0,
      0x7e,
      0x96,
      0xaf,
      0xf2,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 9.999999999999999999999999999999999E+6144
  result = Decimal128.fromString("9.999999999999999999999999999999999E+6144");
  bytes = Buffer.from(
    [
      0x5f,
      0xff,
      0xed,
      0x09,
      0xbe,
      0xad,
      0x87,
      0xc0,
      0x37,
      0x8d,
      0x8e,
      0x63,
      0xff,
      0xff,
      0xff,
      0xff,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 9.999999999999999999999999999999999E-6143
  result = Decimal128.fromString("9.999999999999999999999999999999999E-6143");
  bytes = Buffer.from(
    [
      0x00,
      0x01,
      0xed,
      0x09,
      0xbe,
      0xad,
      0x87,
      0xc0,
      0x37,
      0x8d,
      0x8e,
      0x63,
      0xff,
      0xff,
      0xff,
      0xff,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 5.192296858534827628530496329220095E+33
  result = Decimal128.fromString("5.192296858534827628530496329220095E+33");
  bytes = Buffer.from(
    [
      0x30,
      0x40,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
      0xff,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);
});

Deno.test("[Decimal128] fromString exponent normalization", () => {
  // Create decimal from string value 1000000000000000000000000000000000000000

  let result = Decimal128.fromString(
    "1000000000000000000000000000000000000000",
  );
  let bytes = Buffer.from(
    [
      0x30,
      0x4c,
      0x31,
      0x4d,
      0xc6,
      0x44,
      0x8d,
      0x93,
      0x38,
      0xc1,
      0x5b,
      0x0a,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 10000000000000000000000000000000000
  result = Decimal128.fromString("10000000000000000000000000000000000");
  bytes = Buffer.from(
    [
      0x30,
      0x42,
      0x31,
      0x4d,
      0xc6,
      0x44,
      0x8d,
      0x93,
      0x38,
      0xc1,
      0x5b,
      0x0a,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 1000000000000000000000000000000000
  result = Decimal128.fromString("1000000000000000000000000000000000");
  bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x31,
      0x4d,
      0xc6,
      0x44,
      0x8d,
      0x93,
      0x38,
      0xc1,
      0x5b,
      0x0a,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  let str =
    "100000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "000000000000000000000000000000000000000000000000000000000000000000000" +
    "0000000000000000000000000000000000";

  // Create decimal from string value str

  result = Decimal128.fromString(str);
  bytes = Buffer.from(
    [
      0x37,
      0xcc,
      0x31,
      0x4d,
      0xc6,
      0x44,
      0x8d,
      0x93,
      0x38,
      0xc1,
      0x5b,
      0x0a,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // this should throw error according to spec.
  // Create decimal from string value 1E-6177

  // let result = Decimal128.fromString('1E-6177');
  // let bytes = Buffer.from(
  //   [
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);
});

Deno.test("[Decimal128] fromString from string zeros", () => {
  // Create decimal from string value 0
  let result = Decimal128.fromString("0");
  let bytes = Buffer.from(
    [
      0x30,
      0x40,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 0e-611
  result = Decimal128.fromString("0e-611");
  bytes = Buffer.from(
    [
      0x2b,
      0x7a,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 0e+6000
  result = Decimal128.fromString("0e+6000");
  bytes = Buffer.from(
    [
      0x5f,
      0x20,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);

  // Create decimal from string value 1E-6177
  result = Decimal128.fromString("-0e-1");
  bytes = Buffer.from(
    [
      0xb0,
      0x3e,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ].reverse(),
  );
  assertEquals(bytes, result.bytes);
});

Deno.test("[Decimal128] fromString from string round", () => {
  // Create decimal from string value 10E-6177
  let result = Decimal128.fromString("10E-6177");
  let bytes = Buffer.from(
    [
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
    ].reverse(),
  );

  assertEquals(bytes, result.bytes);

  // // Create decimal from string value 15E-6177
  // result = Decimal128.fromString('15E-6177');
  // bytes = Buffer.from(
  //   [
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x02
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // let array = new Array(6179);
  // // for(let i = 0; i < array.length; i++) array[i] = '0';
  // // array[1] = '.';
  // // array[6177] = '1';
  // // array[6178] = '5';
  // // // Create decimal from string value array
  // // result = Decimal128.fromString(array.join(''));
  // // bytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  // //   , 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02].reverse());
  // // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 251E-6178
  // result = Decimal128.fromString('251E-6178');
  // bytes = Buffer.from(
  //   [
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x03
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 250E-6178
  // result = Decimal128.fromString('250E-6178');
  // bytes = Buffer.from(
  //   [
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x02
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 10000000000000000000000000000000006
  // result = Decimal128.fromString('10000000000000000000000000000000006');
  // bytes = Buffer.from(
  //   [
  //     0x30,
  //     0x42,
  //     0x31,
  //     0x4d,
  //     0xc6,
  //     0x44,
  //     0x8d,
  //     0x93,
  //     0x38,
  //     0xc1,
  //     0x5b,
  //     0x0a,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x01
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 10000000000000000000000000000000003
  // result = Decimal128.fromString('10000000000000000000000000000000003');
  // bytes = Buffer.from(
  //   [
  //     0x30,
  //     0x42,
  //     0x31,
  //     0x4d,
  //     0xc6,
  //     0x44,
  //     0x8d,
  //     0x93,
  //     0x38,
  //     0xc1,
  //     0x5b,
  //     0x0a,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 10000000000000000000000000000000005
  // result = Decimal128.fromString('10000000000000000000000000000000005');
  // bytes = Buffer.from(
  //   [
  //     0x30,
  //     0x42,
  //     0x31,
  //     0x4d,
  //     0xc6,
  //     0x44,
  //     0x8d,
  //     0x93,
  //     0x38,
  //     0xc1,
  //     0x5b,
  //     0x0a,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 100000000000000000000000000000000051
  // result = Decimal128.fromString('100000000000000000000000000000000051');
  // bytes = Buffer.from(
  //   [
  //     0x30,
  //     0x44,
  //     0x31,
  //     0x4d,
  //     0xc6,
  //     0x44,
  //     0x8d,
  //     0x93,
  //     0x38,
  //     0xc1,
  //     0x5b,
  //     0x0a,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x01
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 10000000000000000000000000000000006E6111
  // result = Decimal128.fromString('10000000000000000000000000000000006E6111');
  // bytes = Buffer.from(
  //   [
  //     0x78,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 12980742146337069071326240823050239
  // result = Decimal128.fromString('12980742146337069071326240823050239');
  // bytes = Buffer.from(
  //   [
  //     0x30,
  //     0x42,
  //     0x40,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 99999999999999999999999999999999999
  // result = Decimal128.fromString('99999999999999999999999999999999999');
  // bytes = Buffer.from(
  //   [
  //     0x30,
  //     0x44,
  //     0x31,
  //     0x4d,
  //     0xc6,
  //     0x44,
  //     0x8d,
  //     0x93,
  //     0x38,
  //     0xc1,
  //     0x5b,
  //     0x0a,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999
  // result = Decimal128.fromString(
  //   '9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999'
  // );
  // bytes = Buffer.from(
  //   [
  //     0x30,
  //     0xc6,
  //     0x31,
  //     0x4d,
  //     0xc6,
  //     0x44,
  //     0x8d,
  //     0x93,
  //     0x38,
  //     0xc1,
  //     0x5b,
  //     0x0a,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 9999999999999999999999999999999999E6111
  // result = Decimal128.fromString('9999999999999999999999999999999999E6111');
  // bytes = Buffer.from(
  //   [
  //     0x5f,
  //     0xff,
  //     0xed,
  //     0x09,
  //     0xbe,
  //     0xad,
  //     0x87,
  //     0xc0,
  //     0x37,
  //     0x8d,
  //     0x8e,
  //     0x63,
  //     0xff,
  //     0xff,
  //     0xff,
  //     0xff
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);

  // // Create decimal from string value 99999999999999999999999999999999999E6144
  // result = Decimal128.fromString('99999999999999999999999999999999999E6144');
  // bytes = Buffer.from(
  //   [
  //     0x78,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00,
  //     0x00
  //   ].reverse()
  // );
  // assertEquals(bytes, result.bytes);
});

Deno.test("[Decimal128] toString infinity", () => {
  let decimal = new Decimal128(
    Buffer.from(
      [
        0x78,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("Infinity", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0xf8,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("-Infinity", decimal.toString());
});

Deno.test("[Decimal128] toString NaN", () => {
  let decimal = new Decimal128(
    Buffer.from(
      [
        0x7c,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("NaN", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0xfc,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("NaN", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x7e,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("NaN", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0xfe,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("NaN", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x7e,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x12,
      ].reverse(),
    ),
  );
  assertEquals("NaN", decimal.toString());
});

Deno.test("toString regular", () => {
  let decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
      ].reverse(),
    ),
  );
  assertEquals("1", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("0", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x02,
      ].reverse(),
    ),
  );
  assertEquals("2", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0xb0,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
      ].reverse(),
    ),
  );
  assertEquals("-1", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0xb0,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("-0", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x3e,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
      ].reverse(),
    ),
  );
  assertEquals("0.1", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x34,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x04,
        0xd2,
      ].reverse(),
    ),
  );
  assertEquals("0.001234", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x1c,
        0xbe,
        0x99,
        0x1a,
        0x14,
      ].reverse(),
    ),
  );
  assertEquals("123456789012", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x2a,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x07,
        0x5a,
        0xef,
        0x40,
      ].reverse(),
    ),
  );
  assertEquals("0.00123400000", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x2f,
        0xfc,
        0x3c,
        0xde,
        0x6f,
        0xff,
        0x97,
        0x32,
        0xde,
        0x82,
        0x5c,
        0xd0,
        0x7e,
        0x96,
        0xaf,
        0xf2,
      ].reverse(),
    ),
  );
  assertEquals("0.1234567890123456789012345678901234", decimal.toString());
});

Deno.test("toString scientific", () => {
  let decimal = new Decimal128(
    Buffer.from(
      [
        0x5f,
        0xfe,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals(
    "1.000000000000000000000000000000000E+6144",
    decimal.toString(),
  );

  decimal = new Decimal128(
    Buffer.from(
      [
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
      ].reverse(),
    ),
  );
  assertEquals("1E-6176", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x80,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
      ].reverse(),
    ),
  );
  assertEquals("-1E-6176", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x31,
        0x08,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x09,
        0x18,
        0x4d,
        0xb6,
        0x3e,
        0xb1,
      ].reverse(),
    ),
  );
  assertEquals("9.999987654321E+112", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x5f,
        0xff,
        0xed,
        0x09,
        0xbe,
        0xad,
        0x87,
        0xc0,
        0x37,
        0x8d,
        0x8e,
        0x63,
        0xff,
        0xff,
        0xff,
        0xff,
      ].reverse(),
    ),
  );
  assertEquals(
    "9.999999999999999999999999999999999E+6144",
    decimal.toString(),
  );

  decimal = new Decimal128(
    Buffer.from(
      [
        0x00,
        0x01,
        0xed,
        0x09,
        0xbe,
        0xad,
        0x87,
        0xc0,
        0x37,
        0x8d,
        0x8e,
        0x63,
        0xff,
        0xff,
        0xff,
        0xff,
      ].reverse(),
    ),
  );
  assertEquals(
    "9.999999999999999999999999999999999E-6143",
    decimal.toString(),
  );

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x40,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
        0xff,
      ].reverse(),
    ),
  );
  assertEquals("5192296858534827628530496329220095", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x4c,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x04,
        0x1a,
      ].reverse(),
    ),
  );
  assertEquals("1.050E+9", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x42,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x04,
        0x1a,
      ].reverse(),
    ),
  );
  assertEquals("1.050E+4", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x69,
      ].reverse(),
    ),
  );
  assertEquals("105", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x42,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x69,
      ].reverse(),
    ),
  );
  assertEquals("1.05E+3", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x46,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x01,
      ].reverse(),
    ),
  );
  assertEquals("1E+3", decimal.toString());
});

Deno.test("toString zeros", () => {
  let decimal = new Decimal128(
    Buffer.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("0", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x32,
        0x98,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("0E+300", decimal.toString());

  decimal = new Decimal128(
    Buffer.from(
      [
        0x2b,
        0x90,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ].reverse(),
    ),
  );
  assertEquals("0E-600", decimal.toString());
});

Deno.test("Serialize and Deserialize tests", () => {
  // Test all methods around a simple serialization at object top level
  let doc: Document = { value: Decimal128.fromString("1") };
  let buffer = serialize(doc);
  let size = calculateObjectSize(doc);
  let back = deserialize(buffer);

  assertEquals(buffer.length, size);
  assertEquals(doc, back);
  assertEquals("1", doc.value.toString());
  assertEquals('{"value":{"$numberDecimal":"1"}}', JSON.stringify(doc, null));

  // Test all methods around a simple serialization at array top level
  doc = { value: [Decimal128.fromString("1")] };
  buffer = serialize(doc);
  size = calculateObjectSize(doc);
  back = deserialize(buffer);

  assertEquals(buffer.length, size);
  assertEquals(doc, back);
  assertEquals("1", doc.value[0].toString());

  // Test all methods around a simple serialization at nested object
  doc = { value: { a: Decimal128.fromString("1") } };
  buffer = serialize(doc);
  size = calculateObjectSize(doc);
  back = deserialize(buffer);

  assertEquals(buffer.length, size);
  assertEquals(doc, back);
  assertEquals("1", doc.value.a.toString());
});

Deno.test("accepts strings in the constructor", () => {
  assertEquals(new Decimal128("0").toString(), "0");
  assertEquals(new Decimal128("00").toString(), "0");
  assertEquals(new Decimal128("0.5").toString(), "0.5");
  assertEquals(new Decimal128("-0.5").toString(), "-0.5");
  assertEquals(new Decimal128("-0.0097").toString(), "-0.0097");
  assertEquals(new Decimal128("-0.0011").toString(), "-0.0011");
  assertEquals(new Decimal128("-0.00110").toString(), "-0.00110");
  assertEquals(new Decimal128("0.0011").toString(), "0.0011");
  assertEquals(new Decimal128("0.00110").toString(), "0.00110");
  assertEquals(new Decimal128("-1e400").toString(), "-1E+400");
});
