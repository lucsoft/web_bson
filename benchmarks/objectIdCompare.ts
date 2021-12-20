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
  const obj1 = new Bson.ObjectId();
  const obj2 = new Bson.ObjectId();
  for (let j = 0; j < 300; j++) {
    obj1.equals(obj2);
  }

  timer.stop();
}

bench({ runs, name: "master", func: (b) => BenchCode(b, stable) });
bench({ runs, name: "js-bson", func: (b) => BenchCode(b, upstream) });
bench({ runs, name: "local", func: (b) => BenchCode(b, local) });
runBenchmarks({ silent: true, skip: /_long/ }, prettyBenchmarkProgress());
