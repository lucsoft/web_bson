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

Deno.test("[Constructing BSON types] with new keyword should work", () => {
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
  new Timestamp();
  new MaxKey();
  new MinKey();
});
