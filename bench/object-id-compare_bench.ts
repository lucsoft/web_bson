import { BsonModule, jsBson, local, stable } from "../bench_deps.ts";

function fn(Bson: BsonModule) {
  const obj1 = new Bson.ObjectId();
  const obj2 = new Bson.ObjectId();
  for (let j = 0; j < 300; j++) {
    obj1.equals(obj2);
  }
}

Deno.bench({
  name: "object-id-compare (stable)",
  fn: () => fn(stable),
});

Deno.bench({
  name: "object-id-compare (js-bson)",
  fn: () => fn(jsBson),
});

Deno.bench({
  name: "object-id-compare (local)",
  fn: () => fn(local),
});
