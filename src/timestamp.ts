import { Long } from "./long.ts";

/** @public */
export type LongWithoutOverrides = new (
  low: unknown,
  high?: number,
  unsigned?: boolean,
) => {
  [P in keyof Long]: Long[P];
};
/** @public */
export const LongWithoutOverridesClass =
  Long as unknown as LongWithoutOverrides;

/** @public */
export class Timestamp extends LongWithoutOverridesClass {
  static readonly MAX_VALUE = Long.MAX_UNSIGNED_VALUE;

  constructor();
  /**
   * @param value - A 64-bit Long representing the Timestamp.
   */
  constructor(value: Long);
  /**
   * @param value - A pair of two values indicating timestamp and increment.
   */
  constructor(value: { t: number; i: number });
  constructor(
    value: Long | { t: number; i: number } = new Long(),
  ) {
    const isLong = Long.isLong(value);
    const low = isLong ? value.low : value.i;
    const high = isLong ? value.high : value.t;
    super(low, high, true);
  }

  toJSON(): { $timestamp: string } {
    return {
      $timestamp: this.toString(),
    };
  }

  /** Returns a Timestamp represented by the given (32-bit) integer value. */
  static fromInt(value: number): Timestamp {
    return new Timestamp(Long.fromInt(value, true));
  }

  /** Returns a Timestamp representing the given number value, provided that it is a finite number. Otherwise, zero is returned. */
  static fromNumber(value: number): Timestamp {
    return new Timestamp(Long.fromNumber(value, true));
  }

  /**
   * Returns a Timestamp for the given high and low bits. Each is assumed to use 32 bits.
   *
   * @param lowBits - the low 32-bits.
   * @param highBits - the high 32-bits.
   */
  static fromBits(lowBits: number, highBits: number): Timestamp {
    return new Timestamp(new Long(lowBits, highBits));
  }

  /**
   * Returns a Timestamp from the given string, optionally using the given radix.
   *
   * @param str - the textual representation of the Timestamp.
   * @param optRadix - the radix in which the text is written.
   */
  static fromString(str: string, optRadix: number): Timestamp {
    return new Timestamp(Long.fromString(str, true, optRadix));
  }

  [Symbol.for("Deno.customInspect")](): string {
    return `new Timestamp({ t: ${this.getHighBits()}, i: ${this.getLowBits()} })`;
  }
}
