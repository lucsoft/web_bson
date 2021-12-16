// deno-lint-ignore-file no-explicit-any
import { Binary, BinarySizes } from "./binary.ts";
import { Code } from "./code.ts";
import { DBRef } from "./db_ref.ts";
import { Decimal128 } from "./decimal128.ts";
import { Double } from "./double.ts";
import { Int32 } from "./int_32.ts";
import { Long } from "./long.ts";
import { MaxKey, MinKey } from "./key.ts";
import { ObjectId } from "./objectid.ts";
import { calculateObjectSize as internalCalculateObjectSize } from "./parser/calculate_size.ts";
// Parts of the parser
import {
  deserialize as internalDeserialize,
  DeserializeOptions,
} from "./parser/deserializer.ts";
import {
  serializeInto as internalSerialize,
  SerializeOptions,
} from "./parser/serializer.ts";
import { BSONRegExp } from "./regexp.ts";
import { BSONSymbol } from "./symbol.ts";
import { Timestamp } from "./timestamp.ts";
import { UUID } from "./uuid.ts";
import { bytesCopy } from "./parser/utils.ts";
export * from "./constants.ts";
export type { DBRefLike } from "./db_ref.ts";
export { LongWithoutOverridesClass } from "./timestamp.ts";
export type { LongWithoutOverrides } from "./timestamp.ts";
export type { DeserializeOptions, SerializeOptions };
export {
  Binary,
  BinarySizes,
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
  UUID,
};
export * from "./error.ts";

/** @public */
export interface Document {
  [key: string]: any;
}

/** @internal */
// Default Max Size
const MAXSIZE = 1024 * 1024 * 17;

// Current Internal Temporary Serialization Buffer
let buffer = new Uint8Array(MAXSIZE);

/**
 * Sets the size of the internal serialization buffer.
 *
 * @param size - The desired size for the internal serialization buffer
 * @public
 */
export function setInternalBufferSize(size: number): void {
  // Resize the internal serialization buffer if needed
  if (buffer.length < size) {
    buffer = new Uint8Array(size);
  }
}

/**
 * Serialize a Javascript object.
 *
 * @param object - the Javascript object to serialize.
 * @returns Buffer object containing the serialized object.
 * @public
 */
export function serialize(
  object: Document,
  options: SerializeOptions = {},
): Uint8Array {
  // Unpack the options
  const checkKeys = typeof options.checkKeys === "boolean"
    ? options.checkKeys
    : false;
  const serializeFunctions = typeof options.serializeFunctions === "boolean"
    ? options.serializeFunctions
    : false;
  const ignoreUndefined = typeof options.ignoreUndefined === "boolean"
    ? options.ignoreUndefined
    : true;

  // Attempt to serialize
  const serializationIndex = internalSerialize(
    buffer,
    object,
    checkKeys,
    0,
    0,
    serializeFunctions,
    ignoreUndefined,
    [],
  );

  // Create the final buffer
  const finishedBuffer = new Uint8Array(serializationIndex);

  // Copy into the finished buffer
  bytesCopy(finishedBuffer, 0, buffer, 0, finishedBuffer.length);

  // Return the buffer
  return finishedBuffer;
}

/**
 * Serialize a Javascript object using a predefined Buffer and index into the buffer,
 * useful when pre-allocating the space for serialization.
 *
 * @param object - the Javascript object to serialize.
 * @param finalBuffer - the Buffer you pre-allocated to store the serialized BSON object.
 * @returns the index pointing to the last written byte in the buffer.
 * @public
 */
export function serializeWithBufferAndIndex(
  object: Document,
  finalBuffer: Uint8Array,
  options: SerializeOptions = {},
): number {
  // Unpack the options
  const checkKeys = typeof options.checkKeys === "boolean"
    ? options.checkKeys
    : false;
  const serializeFunctions = typeof options.serializeFunctions === "boolean"
    ? options.serializeFunctions
    : false;
  const ignoreUndefined = typeof options.ignoreUndefined === "boolean"
    ? options.ignoreUndefined
    : true;
  const startIndex = typeof options.index === "number" ? options.index : 0;

  // Attempt to serialize
  const serializationIndex = internalSerialize(
    buffer,
    object,
    checkKeys,
    0,
    0,
    serializeFunctions,
    ignoreUndefined,
  );
  bytesCopy(finalBuffer, startIndex, buffer, 0, serializationIndex);

  // Return the index
  return startIndex + serializationIndex - 1;
}

/**
 * Deserialize data as BSON.
 *
 * @param buffer - the buffer containing the serialized set of BSON documents.
 * @returns returns the deserialized Javascript Object.
 * @public
 */
export function deserialize(
  buffer: Uint8Array | ArrayBuffer,
  options: DeserializeOptions = {},
): Document {
  return internalDeserialize(
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer),
    options,
  );
}

/** @public */
export type CalculateObjectSizeOptions = Pick<
  SerializeOptions,
  "serializeFunctions" | "ignoreUndefined"
>;

/**
 * Calculate the bson size for a passed in Javascript object.
 *
 * @param object - the Javascript object to calculate the BSON byte size for
 * @returns size of BSON object in bytes
 * @public
 */
export function calculateObjectSize(
  object: Document,
  options: CalculateObjectSizeOptions = {},
): number {
  options = options || {};

  const serializeFunctions = typeof options.serializeFunctions === "boolean"
    ? options.serializeFunctions
    : false;
  const ignoreUndefined = typeof options.ignoreUndefined === "boolean"
    ? options.ignoreUndefined
    : true;

  return internalCalculateObjectSize(
    object,
    serializeFunctions,
    ignoreUndefined,
  );
}

/**
 * Deserialize stream data as BSON documents.
 *
 * @param data - the buffer containing the serialized set of BSON documents.
 * @param startIndex - the start index in the data Buffer where the deserialization is to start.
 * @param numberOfDocuments - number of documents to deserialize.
 * @param documents - an array where to store the deserialized documents.
 * @param docStartIndex - the index in the documents array from where to start inserting documents.
 * @param options - additional options used for the deserialization.
 * @returns next index in the buffer after deserialization **x** numbers of documents.
 * @public
 */
export function deserializeStream(
  data: Uint8Array | ArrayBufferView | ArrayBuffer,
  startIndex: number,
  numberOfDocuments: number,
  documents: Document[],
  docStartIndex: number,
  options?: DeserializeOptions,
): number {
  const internalOptions = Object.assign(
    { allowObjectSmallerThanBufferSize: true, index: 0 },
    options,
  );
  const bufferData: Uint8Array = data instanceof Uint8Array
    ? data
    : data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  let index = startIndex;
  // Loop over all documents
  for (let i = 0; i < numberOfDocuments; i++) {
    // Find size of the document
    const size = bufferData[index] |
      (bufferData[index + 1] << 8) |
      (bufferData[index + 2] << 16) |
      (bufferData[index + 3] << 24);
    // Update options with index
    internalOptions.index = index;
    // Parse the document at this point
    documents[docStartIndex + i] = internalDeserialize(
      bufferData,
      internalOptions,
    );
    // Adjust index by the document size
    index += size;
  }

  // Return object containing end index of parsing and list of documents
  return index;
}
