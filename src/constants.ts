/** @internal */
export const BSON_INT32_MAX = 0x7fffffff;
/** @internal */
export const BSON_INT32_MIN = -0x80000000;

/**
 * Any integer up to 2^53 can be precisely represented by a double.
 * @internal
 */
export const JS_INT_MAX = 2 ** 53;

/**
 * Any integer down to -2^53 can be precisely represented by a double.
 * @internal
 */
export const JS_INT_MIN = -(2 ** 53);

/** Number BSON Type @internal */
export const BSON_DATA_NUMBER = 1;

/** String BSON Type @internal */
export const BSON_DATA_STRING = 2;

/** Object BSON Type @internal */
export const BSON_DATA_OBJECT = 3;

/** Array BSON Type @internal */
export const BSON_DATA_ARRAY = 4;

/** Binary BSON Type @internal */
export const BSON_DATA_BINARY = 5;

/** Binary BSON Type @internal */
export const BSON_DATA_UNDEFINED = 6;

/** ObjectId BSON Type @internal */
export const BSON_DATA_OID = 7;

/** Boolean BSON Type @internal */
export const BSON_DATA_BOOLEAN = 8;

/** Date BSON Type @internal */
export const BSON_DATA_DATE = 9;

/** null BSON Type @internal */
export const BSON_DATA_NULL = 10;

/** RegExp BSON Type @internal */
export const BSON_DATA_REGEXP = 11;

/** Code BSON Type @internal */
export const BSON_DATA_DBPOINTER = 12;

/** Code BSON Type @internal */
export const BSON_DATA_CODE = 13;

/** Symbol BSON Type @internal */
export const BSON_DATA_SYMBOL = 14;

/** Code with Scope BSON Type @internal */
export const BSON_DATA_CODE_W_SCOPE = 15;

/** 32 bit Integer BSON Type @internal */
export const BSON_DATA_INT = 16;

/** Timestamp BSON Type @internal */
export const BSON_DATA_TIMESTAMP = 17;

/** Long BSON Type @internal */
export const BSON_DATA_LONG = 18;

/** Decimal128 BSON Type @internal */
export const BSON_DATA_DECIMAL128 = 19;

/** MinKey BSON Type @internal */
export const BSON_DATA_MIN_KEY = 0xff;

/** MaxKey BSON Type @internal */
export const BSON_DATA_MAX_KEY = 0x7f;

/** Binary Default Type @internal */
export const BSON_BINARY_SUBTYPE_DEFAULT = 0;
