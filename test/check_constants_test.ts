import { assertEquals } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import {
  BinarySizes,
  BSON_BINARY_SUBTYPE_DEFAULT,
  BSON_DATA_ARRAY,
  BSON_DATA_BINARY,
  BSON_DATA_BOOLEAN,
  BSON_DATA_CODE,
  BSON_DATA_CODE_W_SCOPE,
  BSON_DATA_DATE,
  BSON_DATA_DBPOINTER,
  BSON_DATA_DECIMAL128,
  BSON_DATA_INT,
  BSON_DATA_LONG,
  BSON_DATA_MAX_KEY,
  BSON_DATA_MIN_KEY,
  BSON_DATA_NULL,
  BSON_DATA_NUMBER,
  BSON_DATA_OBJECT,
  BSON_DATA_OID,
  BSON_DATA_REGEXP,
  BSON_DATA_STRING,
  BSON_DATA_SYMBOL,
  BSON_DATA_TIMESTAMP,
  BSON_DATA_UNDEFINED,
} from "../src/bson.ts";

Deno.test("BSON Constants", async ({ step }) => {
  await step("Binary Subtype", async ({ step }) => {
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
    await step("Default should be 0", () => {
      assertEquals(BSON_BINARY_SUBTYPE_DEFAULT, 0);
      assertEquals(BinarySizes.SUBTYPE_DEFAULT, 0);
    });
    await step("Function should be 1", () => {
      assertEquals(BinarySizes.SUBTYPE_FUNCTION, 1);
    });
    await step("Binary (Old) should be 2", () => {
      assertEquals(BinarySizes.SUBTYPE_BYTE_ARRAY, 2);
    });
    await step("UUID should be 4", () => {
      assertEquals(BinarySizes.SUBTYPE_UUID, 4);
    });
    await step("MD5 should be 5", () => {
      assertEquals(BinarySizes.SUBTYPE_MD5, 5);
    });

    await step("Encrypted should be 6", () => {
      assertEquals(BinarySizes.SUBTYPE_ENCRYPTED, 6);
    });

    await step("Column should be 7", () => {
      assertEquals(BinarySizes.SUBTYPE_COLUMN, 7);
    });
  });
  await step("BSON Type indicators", async ({ step }) => {
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

    await step("64-bit binary floating point should be 0x01", () => {
      assertEquals(BSON_DATA_NUMBER, 0x01);
    });
    await step("UTF-8 string should be 0x02", () => {
      assertEquals(BSON_DATA_STRING, 0x02);
    });
    await step("Embedded document should be 0x03", () => {
      assertEquals(BSON_DATA_OBJECT, 0x03);
    });
    await step("Array should be 0x04", () => {
      assertEquals(BSON_DATA_ARRAY, 0x04);
    });
    await step("Binary data should be 0x05", () => {
      assertEquals(BSON_DATA_BINARY, 0x05);
    });
    await step("Undefined (value) — Deprecated should be 0x06", () => {
      assertEquals(BSON_DATA_UNDEFINED, 0x06);
    });
    await step("ObjectId should be 0x07", () => {
      assertEquals(BSON_DATA_OID, 0x07);
    });
    await step("Boolean should be 0x08", () => {
      assertEquals(BSON_DATA_BOOLEAN, 0x08);
    });
    await step("UTC date time should be 0x09", () => {
      assertEquals(BSON_DATA_DATE, 0x09);
    });
    await step("Null value should be 0x0A", () => {
      assertEquals(BSON_DATA_NULL, 0x0a);
    });
    await step("Regular expression should be 0x0B", () => {
      assertEquals(BSON_DATA_REGEXP, 0x0b);
    });
    await step("DBPointer — Deprecated should be 0x0C", () => {
      assertEquals(BSON_DATA_DBPOINTER, 0x0c);
    });
    await step("JavaScript code should be 0x0D", () => {
      assertEquals(BSON_DATA_CODE, 0x0d);
    });
    await step("Symbol. — Deprecated should be 0x0E", () => {
      assertEquals(BSON_DATA_SYMBOL, 0x0e);
    });
    await step("JavaScript code w/ scope — Deprecated should be 0x0F", () => {
      assertEquals(BSON_DATA_CODE_W_SCOPE, 0x0f);
    });
    await step("32-bit integer should be 0x10", () => {
      assertEquals(BSON_DATA_INT, 0x10);
    });
    await step("Timestamp should be 0x11", () => {
      assertEquals(BSON_DATA_TIMESTAMP, 0x11);
    });
    await step("64-bit integer should be 0x12", () => {
      assertEquals(BSON_DATA_LONG, 0x12);
    });
    await step("128-bit decimal floating point should be 0x13", () => {
      assertEquals(BSON_DATA_DECIMAL128, 0x13);
    });
    await step("Min key should be 0xFF", () => {
      assertEquals(BSON_DATA_MIN_KEY, 0xff);
    });
    await step("Max key should be 0x7F", () => {
      assertEquals(BSON_DATA_MAX_KEY, 0x7f);
    });
  });
});
