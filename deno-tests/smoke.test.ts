import { assertEquals } from "https://deno.land/std@0.175.0/testing/asserts.ts";
import * as BSON from "../mod.js";

Deno.test("Same Object should still be same object", () => {
  const id = new BSON.ObjectId();
  const source = {
    string: "hello",
    objectId: id,
  };
  const data = BSON.serialize(source);
  const obj = BSON.deserialize(data);

  assertEquals(obj.string, "hello");
  assertEquals(obj.objectId, id);
});

Deno.test("Deno.customInspect", () => {
  const id = new BSON.ObjectId("63dac4451edcfe93b441c606");
  const source = {
    string: "hello",
    objectId: id,
  };

  assertEquals(
    Deno.inspect(source),
    '{ string: "hello", objectId: new ObjectId("63dac4451edcfe93b441c606") }',
  );
});
