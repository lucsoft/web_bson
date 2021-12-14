import {
  Binary,
  BSONRegExp,
  BSONSymbol,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
} from "../src/bson.ts";

Deno.test("Constructing BSON types", async ({ step }) => {
  await step("with new keyword should work", () => {
    const oid = new ObjectId();
    new DBRef("test", oid);
    new BSONRegExp("aaa");
    new BSONSymbol("aaa");
    new Binary("aaa");
    new Code(() => {});
    new Decimal128("123");
    new Double(2.3);
    new Int32(1);
    new Long(0, 0);
    new Timestamp(0, 0);
    new MaxKey();
    new MinKey();
  });
  //   Deno.test("as a function call should work", () => {
  //     const oid = ObjectId();
  //     DBRef("test", oid);
  //     BSONRegExp("aaa");
  //     BSONSymbol("aaa");
  //     Binary("aaa");
  //     Code(() => {});
  //     Decimal128("123");
  //     Double(2.3);
  //     Int32(1);
  //     Long(0, 0);
  //     Timestamp(0, 0);
  //     MaxKey();
  //     MinKey();
  //   });
});
