import {
    bench,
    BenchmarkTimer,
    BsonModule,
    local,
    prettyBenchmarkProgress,
    runBenchmarks,
    stable,
    upstream,
  } from "./common.ts";


const runs = 2000;

function BenchCode(timer: BenchmarkTimer, Bson: BsonModule) {
  timer.start();
  const d = {
    _id: new Bson.ObjectId(),
    name: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    a: Math.random(),
    foo: [] as unknown[],
  };

  for (let j = 0; j < 300; j++) {
    d.foo.push({
      bar: new Bson.ObjectId(),
      name: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      title: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      a: [1, 45, 78, 45, 78, 23, 13, 545, 3, 45],
    });
  }

  const b = Bson.serialize(d);
  Bson.deserialize(b);
  timer.stop();
}

bench({ runs, name: "master", func: (b) => BenchCode(b, stable) });
bench({ runs, name: "js-bson", func: (b) => BenchCode(b, upstream) });
bench({ runs, name: "local", func: (b) => BenchCode(b, local) });
runBenchmarks({ silent: true, skip: /_long/ }, prettyBenchmarkProgress());
