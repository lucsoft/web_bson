/**
 * A class representation of a BSON Int32 type.
 * @public
 */
export class Int32 {
  value!: number;
  /**
   * Create an Int32 type
   *
   * @param value - the number we want to represent as an int32.
   */
  constructor(value: number | string) {
    if ((value as unknown) instanceof Number) {
      value = value.valueOf();
    }

    this.value = +value | 0;
  }

  /**
   * Access the number value.
   *
   * @returns returns the wrapped int32 number.
   */
  valueOf(): number {
    return this.value;
  }

  toString(radix?: number): string {
    return this.value.toString(radix);
  }

  toJSON(): number {
    return this.value;
  }

  [Symbol.for("Deno.customInspect")](): string {
    return `new Int32(${this.valueOf()})`;
  }
}
