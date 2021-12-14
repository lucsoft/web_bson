import {} from "../src/bson.ts";

Deno.test("string tests", () => {
  Deno.test("can serialize and deserialize 0xFFFD", () => {
    const unicodeString = String.fromCharCode(0x41, 0x42, 0xfffd, 0x43, 0x44); // "AB�CD"

    const serialized = serialize({ value: unicodeString });
    deserialize(serialized);
  });
});
