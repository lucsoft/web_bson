import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { BSONTypeError, Long, serialize } from "../src/bson.ts";

Deno.test("BSON BigInt Support", () => {
  Deno.test("Should serialize an int that fits in int32", () => {
    const testDoc = { b: BigInt(32) };
    assertThrows(() => {serialize(testDoc), BSONTypeError);

    // const serializedDoc = serialize(testDoc);
    // // prettier-ignore
    // const resultBuffer = Buffer.from([0x0C, 0x00, 0x00, 0x00, 0x10, 0x62, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00]);
    // const resultDoc = deserialize(serializedDoc);
    // assert(Array.from(serializedDoc)).to.have.members(Array.from(resultBuffer));
    // assert(BigInt(resultDoc.b)).to.equal(testDoc.b);
  });

  Deno.test("Should serialize an int that fits in int64", () => {
    const testDoc = { b: BigInt(0x1_ff_ff_ff_ff) };
    assertThrows(() => {serialize(testDoc), BSONTypeError);

    // const serializedDoc = serialize(testDoc);
    // // prettier-ignore
    // const resultBuffer = Buffer.from([0x10, 0x00, 0x00, 0x00, 0x12, 0x62, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x00]);
    // const resultDoc = deserialize(serializedDoc);
    // assert(Array.from(serializedDoc)).to.have.members(Array.from(resultBuffer));
    // assert(BigInt(resultDoc.b)).to.equal(testDoc.b);
  });

  Deno.test("Should serialize an int that fits in decimal128", () => {
    const testDoc = { b: BigInt("9223372036854776001") }; // int64 max + 1
    assertThrows(() => {serialize(testDoc), BSONTypeError);

    // const serializedDoc = serialize(testDoc);
    // // prettier-ignore
    // const resultBuffer = Buffer.from([0x18, 0x00, 0x00, 0x00, 0x13, 0x62, 0x00, 0xC1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x30, 0x00]);
    // const resultDoc = deserialize(serializedDoc);
    // assert(Array.from(serializedDoc)).to.have.members(Array.from(resultBuffer));
    // assert(resultDoc.b._bsontype).to.equal('Decimal128');
    // assert(BigInt(resultDoc.b.toString())).to.equal(testDoc.b);
  });

  Deno.test("Should throw if BigInt is too large to serialize", () => {
    const testDoc = {
      b: BigInt("9".repeat(35)),
    }; // decimal 128 can only encode 34 digits of precision
    assertThrows(() => {serialize(testDoc), BSONTypeError);
    // assert(() => {serialize(testDoc)).to.throw();
  });

  Deno.test("Should accept BigInts in Long constructor", () => {
    assertEquals(new Long(BigInt("0")).toString(), "0");
    assertEquals(new Long(BigInt("-1")).toString(), "-1");
    assertEquals(
      new Long(BigInt("-1"), true).toString(),
      "18446744073709551615",
    );
    assertEquals(
      new Long(BigInt("123456789123456789")).toString(),
      "123456789123456789",
    );
    assertEquals(
      new Long(BigInt("123456789123456789"), true).toString(),
      "123456789123456789",
    );
    assertEquals(
      new Long(BigInt("13835058055282163712")).toString(),
      "-4611686018427387904",
    );
    assertEquals(
      new Long(BigInt("13835058055282163712"), true).toString(),
      "13835058055282163712",
    );
  });
});
