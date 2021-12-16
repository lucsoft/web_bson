# deno_bson

deno_bson is a fork of the js-bson. Bson is short for "Binary JSON" and is the
binary-encoded serialization of JSON-like documents. You can learn more about it
in [the specification](http://bsonspec.org).

### Deno & Web

A simple example of how to use deno_bson:

```js
import { deserialize, Long, serialize } from "https://deno.land/x/deno_bson";

// Serialize a document
const doc = { long: Long.fromNumber(100) };
const data = serialize(doc);
console.log("data:", data);

// Deserialize the resulting Buffer
const doc_2 = deserialize(data);
console.log("doc_2:", doc_2);
```

## Documentation

The Documentation can be found under
[doc.deno.land](https://doc.deno.land/https://raw.githubusercontent.com/lucsoft/deno_bson/master/mod.ts)
