import * as current from "../mod.ts";
import * as _upstream from "https://cdn.skypack.dev/bson";
import { assertEquals } from "../test_deps.ts";

const upstream = {
  ..._upstream,
  // deno-lint-ignore no-explicit-any
  serialize(doc: any) {
    return new Uint8Array(_upstream.serialize(doc));
  },
};

Deno.test("[Upstream-Compare] serialize & deserialize basic types", () => {
  const _id = "4e886e687ff7ef5e00000162";
  const string = "string with 中文 سلام";
  const number = 231354532;
  const float = 231354532.23;
  const boolean = true;
  const date = new Date("2020-01-01");
  const regex = /^[a-zA-Z0-9]{3,}$/;
  const binary = new Uint8Array([1, 2, 3, 4, 5]);
  const array = [1, 2.5, true, "foo", { a: 1 }];
  const object = {
    a: 1,
    foo: { a: 2, bar: "zar" },
    zoo: [1, 2, 3],
  };

  const bufferA = upstream.serialize({
    _id: new upstream.ObjectId(_id),
    string,
    number,
    float,
    long: new upstream.Long(number),
    boolean,
    date,
    regex,
    binary,
    array,
    object,
  });

  const bufferB = current.serialize({
    _id: new current.ObjectId(_id),
    string,
    number,
    float,
    long: new current.Long(number),
    boolean,
    date,
    regex,
    binary,
    array,
    object,
  });

  assertEquals(bufferA.length, bufferB.length);
  assertEquals(bufferA, bufferB);

  const docA = upstream.deserialize(bufferA);
  const docB = current.deserialize(bufferB);

  assertEquals(JSON.stringify(docA), JSON.stringify(docB));
});
