import {} from "../src/bson.ts";
const BSONTypeError = BSON.BSONTypeError;
const BSONError = BSONError;

Deno.test("BSONTypeError", () => {
  Deno.test("should evaluate true on instanceof BSONTypeError and TypeError", () => {
    const bsonTypeErr = new BSONTypeError();
    assert(bsonTypeErr instanceof BSONTypeError).to.be.true;
    assert(bsonTypeErr instanceof TypeError).to.be.true;
    assert(bsonTypeErr).to.be.instanceOf(BSONTypeError);
    assert(bsonTypeErr).to.be.instanceOf(TypeError);
  });

  Deno.test("should correctly set BSONTypeError name and message properties", () => {
    const bsonTypeErr = new BSONTypeError("This is a BSONTypeError message");
    assert(bsonTypeErr.name).equals("BSONTypeError");
    assert(bsonTypeErr.message).equals("This is a BSONTypeError message");
  });
});

Deno.test("BSONError", () => {
  Deno.test("should evaluate true on instanceof BSONError and Error", () => {
    const bsonErr = new BSONError();
    assert(bsonErr instanceof BSONError).to.be.true;
    assert(bsonErr instanceof Error).to.be.true;
    assert(bsonErr).to.be.instanceOf(BSONError);
    assert(bsonErr).to.be.instanceOf(Error);
  });

  Deno.test("should correctly set BSONError name and message properties", () => {
    const bsonErr = new BSONError("This is a BSONError message");
    assert(bsonErr.name).equals("BSONError");
    assert(bsonErr.message).equals("This is a BSONError message");
  });
});
