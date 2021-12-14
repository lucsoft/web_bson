import { Int32, Long, Timestamp } from "../src/bson.ts";

Deno.test("Timestamp", () => {
  Deno.test("should have a MAX_VALUE equal to Long.MAX_UNSIGNED_VALUE", () => {
    assert(Timestamp.MAX_VALUE).to.equal(Long.MAX_UNSIGNED_VALUE);
  });

  Deno.test("should always be an unsigned value", () => {
    [
      new Timestamp(),
      new Timestamp(0xff, 0xffffffff),
      new Timestamp(0xffffffff, 0xffffffff),
      new Timestamp(-1, -1),
      new Timestamp(new Timestamp(0xffffffff, 0xffffffff)),
      new Timestamp(new Long(0xffffffff, 0xfffffffff, false)),
      new Timestamp(new Long(0xffffffff, 0xfffffffff, true)),
      new Timestamp({ t: 0xffffffff, i: 0xfffffffff }),
      new Timestamp({ t: -1, i: -1 }),
      new Timestamp({
        t: new Int32(0xffffffff),
        i: new Int32(0xffffffff),
      }),
    ].forEach((timestamp) => {
      assert(timestamp).to.have.property("unsigned", true);
    });
  });

  Deno.test("should print out an unsigned number", () => {
    const timestamp = new Timestamp(0xffffffff, 0xffffffff);
    assert(timestamp.toString()).to.equal("18446744073709551615");
    assert(timestamp.toJSON()).to.deep.equal({
      $timestamp: "18446744073709551615",
    });
    assert(timestamp.toExtendedJSON()).to.deep.equal({
      $timestamp: { t: 4294967295, i: 4294967295 },
    });
  });

  Deno.test("should accept a { t, i } object as constructor input", () => {
    const input = { t: 89, i: 144 };
    const timestamp = new Timestamp(input);
    assert(timestamp.toExtendedJSON()).to.deep.equal({ $timestamp: input });
  });

  Deno.test("should accept a { t, i } object as constructor input and coerce to integer", () => {
    const input = { t: new Int32(89), i: new Int32(144) };
    const timestamp = new Timestamp(input);
    assert(timestamp.toExtendedJSON()).to.deep.equal({
      $timestamp: { t: 89, i: 144 },
    });
  });
});
