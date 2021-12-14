import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { BSONError, BSONTypeError } from "../src/bson.ts";

Deno.test("BSONTypeError", () => {
  Deno.test("should evaluate true on instanceof BSONTypeError and TypeError", () => {
    const bsonTypeErr = new BSONTypeError("");
    assert(bsonTypeErr instanceof BSONTypeError);
    assert(bsonTypeErr instanceof TypeError);
  });

  Deno.test("should correctly set BSONTypeError name and message properties", () => {
    const bsonTypeErr = new BSONTypeError("This is a BSONTypeError message");
    assertEquals(bsonTypeErr.name, "BSONTypeError");
    assertEquals(bsonTypeErr.message, "This is a BSONTypeError message");
  });
});

Deno.test("BSONError", () => {
  Deno.test("should evaluate true on instanceof BSONError and Error", () => {
    const bsonErr = new BSONError();
    assert(bsonErr instanceof BSONError);
    assert(bsonErr instanceof Error);
  });

  Deno.test("should correctly set BSONError name and message properties", () => {
    const bsonErr = new BSONError("This is a BSONError message");
    assertEquals(bsonErr.name, "BSONError");
    assertEquals(bsonErr.message, "This is a BSONError message");
  });
});
