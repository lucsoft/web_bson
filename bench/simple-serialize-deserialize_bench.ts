import { BsonModule, jsBson, local, stable } from "../bench_deps.ts";

function fn(Bson: BsonModule) {
  const d = {
    _id: new Bson.ObjectId(),
    name: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    a: Math.random(),
    foo: [] as unknown[],
  };

  for (let j = 0; j < 30; j++) {
    d.foo.push({
      bar: new Bson.ObjectId(),
      name: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      title: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      a: [1, 45, 78, 45, 78, 23, 13, 545, 3, 45],
    });
  }

  const b = Bson.serialize(d);
  Bson.deserialize(b);
}

Deno.bench({
  name: "simple-serialize-deserialize (stable)",
  fn: () => fn(stable),
});

Deno.bench({
  name: "simple-serialize-deserialize (js-bson)",
  fn: () => fn(jsBson),
});

Deno.bench({
  name: "simple-serialize-deserialize (local)",
  fn: () => fn(local),
});
