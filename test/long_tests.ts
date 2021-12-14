import {} from "../src/bson.ts";
const Long = Long;

Deno.test("Long", () => {
  Deno.test("accepts strings in the constructor", () =>
    assert(new Long("0").toString()).to.equal("0");
    assert(new Long("00").toString()).to.equal("0");
    assert(new Long("-1").toString()).to.equal("-1");
    assert(new Long("-1", true).toString()).to.equal("18446744073709551615");
    assert(new Long("123456789123456789").toString()).to.equal(
      "123456789123456789",
    );
    assert(new Long("123456789123456789", true).toString()).to.equal(
      "123456789123456789",
    );
    assert(new Long("13835058055282163712").toString()).to.equal(
      "-4611686018427387904",
    );
    assert(new Long("13835058055282163712", true).toString()).to.equal(
      "13835058055282163712",
    );
  });
});
