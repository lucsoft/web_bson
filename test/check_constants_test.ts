import { assertEquals } from "../test_deps.ts";
import {
  BinarySizes,
  BSON_BINARY_SUBTYPE_DEFAULT,
  BSONData,
} from "../src/bson.ts";

/*
     subtype	::=
     |  "\x00"  Generic binary subtype
     |  "\x01"  Function
     |  "\x02"  Binary (Old)
     |  "\x03"  UUID (Old)
     |  "\x04"  UUID
     |  "\x05"  MD5
     |  "\x06"  Encrypted BSON value
     |  "\x80"  User defined
    */
Deno.test("[BSON Constants Binary Subtype] Default should be 0", () => {
  assertEquals(BSON_BINARY_SUBTYPE_DEFAULT, 0);
  assertEquals(BinarySizes.SUBTYPE_DEFAULT, 0);
});
Deno.test("[BSON Constants Binary Subtype] Function should be 1", () => {
  assertEquals(BinarySizes.SUBTYPE_FUNCTION, 1);
});
Deno.test("[BSON Constants Binary Subtype] Binary (Old) should be 2", () => {
  assertEquals(BinarySizes.SUBTYPE_BYTE_ARRAY, 2);
});
Deno.test("[BSON Constants Binary Subtype] UUID should be 4", () => {
  assertEquals(BinarySizes.SUBTYPE_UUID, 4);
});
Deno.test("[BSON Constants Binary Subtype] MD5 should be 5", () => {
  assertEquals(BinarySizes.SUBTYPE_MD5, 5);
});

Deno.test("[BSON Constants Binary Subtype] Encrypted should be 6", () => {
  assertEquals(BinarySizes.SUBTYPE_ENCRYPTED, 6);
});

Deno.test("[BSON Constants Binary Subtype] Column should be 7", () => {
  assertEquals(BinarySizes.SUBTYPE_COLUMN, 7);
});

/*
      | "\x01" 64-bit binary floating point
      | "\x02" UTF-8 string
      | "\x03" Embedded document
      | "\x04" Array
      | "\x05" Binary data
      | "\x06" Undefined (value) — Deprecated
      | "\x07" ObjectId
      | "\x08" Boolean
      | "\x09" UTC date time
      | "\x0A" Null value
      | "\x0B" Regular expression
      | "\x0C" DBPointer — Deprecated
      | "\x0D" JavaScript code
      | "\x0E" Symbol. — Deprecated
      | "\x0F" JavaScript code w/ scope — Deprecated
      | "\x10" 32-bit integer
      | "\x11" Timestamp
      | "\x12" 64-bit integer
      | "\x13" 128-bit decimal floating point
      | "\xFF" Min key
      | "\x7F" Max key
     */

Deno.test("[BSON Constants BSON Type indicators] 64-bit binary floating point should be 0x01", () => {
  assertEquals(BSONData.NUMBER, 0x01);
});
Deno.test("[BSON Constants BSON Type indicators] UTF-8 string should be 0x02", () => {
  assertEquals(BSONData.STRING, 0x02);
});
Deno.test("[BSON Constants BSON Type indicators] Embedded document should be 0x03", () => {
  assertEquals(BSONData.OBJECT, 0x03);
});
Deno.test("[BSON Constants BSON Type indicators] Array should be 0x04", () => {
  assertEquals(BSONData.ARRAY, 0x04);
});
Deno.test("[BSON Constants BSON Type indicators] Binary data should be 0x05", () => {
  assertEquals(BSONData.BINARY, 0x05);
});
Deno.test("[BSON Constants BSON Type indicators] Undefined (value) — Deprecated should be 0x06", () => {
  assertEquals(BSONData.UNDEFINED, 0x06);
});
Deno.test("[BSON Constants BSON Type indicators] ObjectId should be 0x07", () => {
  assertEquals(BSONData.OID, 0x07);
});
Deno.test("[BSON Constants BSON Type indicators] Boolean should be 0x08", () => {
  assertEquals(BSONData.BOOLEAN, 0x08);
});
Deno.test("[BSON Constants BSON Type indicators] UTC date time should be 0x09", () => {
  assertEquals(BSONData.DATE, 0x09);
});
Deno.test("[BSON Constants BSON Type indicators] Null value should be 0x0A", () => {
  assertEquals(BSONData.NULL, 0x0a);
});
Deno.test("[BSON Constants BSON Type indicators] Regular expression should be 0x0B", () => {
  assertEquals(BSONData.REGEXP, 0x0b);
});
Deno.test("[BSON Constants BSON Type indicators] DBPointer — Deprecated should be 0x0C", () => {
  assertEquals(BSONData.DBPOINTER, 0x0c);
});
Deno.test("[BSON Constants BSON Type indicators] JavaScript code should be 0x0D", () => {
  assertEquals(BSONData.CODE, 0x0d);
});
Deno.test("[BSON Constants BSON Type indicators] Symbol. — Deprecated should be 0x0E", () => {
  assertEquals(BSONData.SYMBOL, 0x0e);
});
Deno.test("[BSON Constants BSON Type indicators] JavaScript code w/ scope — Deprecated should be 0x0F", () => {
  assertEquals(BSONData.CODE_W_SCOPE, 0x0f);
});
Deno.test("[BSON Constants BSON Type indicators] 32-bit integer should be 0x10", () => {
  assertEquals(BSONData.INT, 0x10);
});
Deno.test("[BSON Constants BSON Type indicators] Timestamp should be 0x11", () => {
  assertEquals(BSONData.TIMESTAMP, 0x11);
});
Deno.test("[BSON Constants BSON Type indicators] 64-bit integer should be 0x12", () => {
  assertEquals(BSONData.LONG, 0x12);
});
Deno.test("[BSON Constants BSON Type indicators] 128-bit decimal floating point should be 0x13", () => {
  assertEquals(BSONData.DECIMAL128, 0x13);
});
Deno.test("[BSON Constants BSON Type indicators] Min key should be 0xFF", () => {
  assertEquals(BSONData.MIN_KEY, 0xff);
});
Deno.test("[BSON Constants BSON Type indicators] Max key should be 0x7F", () => {
  assertEquals(BSONData.MAX_KEY, 0x7f);
});
