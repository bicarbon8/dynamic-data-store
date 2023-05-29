/**
 * base class that should be extended to create a custom matcher.
 * NOTE: will always return `false` from `isMatch` so overriding
 * in a sub-class is necessary to actually function
 */
export class ValueMatcher {
    isMatch(actual?: unknown): boolean { return false; }
}

class Between extends ValueMatcher {
    public readonly min: number;
    public readonly max: number;
    constructor(min?: number, max?: number) {
        super();
        this.min = min ?? -Infinity;
        this.max = max ?? Infinity;
    }
    override isMatch(actual?: unknown): boolean {
        if (actual != null) {
            if (typeof actual === 'number' || typeof actual === 'string' || typeof actual === 'boolean') {
                const anum = Number(actual);
                if (!isNaN(anum)) {
                    return this.min <= anum && anum <= this.max;
                }
            }
            if (typeof actual === 'string') {
                const length = String(actual).length;
                return this.min <= length && length <= this.max;
            }
            if (Array.isArray(actual)) {
                const length = actual.length;
                return this.min <= length && length <= this.max;
            }
            if (actual instanceof Map || actual instanceof Set) {
                const size = (actual as Map<any, any> | Set<any>).size;
                return this.min <= size && size <= this.max;
            }
        }
        return false;
    }
}
/**
 * compares the `actual` value passed to `isMatch` with the `min` and `max` values where an
 * `actual` that is a number or a string representation of a number is compared directly (boolean values
 * are converted to 1 or 0), and `actual` values that are a string or collection are compared by length
 * or number of contained items
 * @param min the minimum value that will return `true` from the `isMatch` function. @default -Infinity
 * @param max the maximum value that will return `true` from the `isMatch` function. @default Infinity
 * @returns `true` if the value passed to `isMatch` is between or equal to the `min`
 * and `max` values; otherwise `false`
 */
export const between = (min?: number, max?: number) => new Between(min, max);

class GreaterThan extends ValueMatcher {
    public readonly min: number;
    constructor(min?: number) {
        super();
        this.min = min ?? -Infinity;
    }
    override isMatch(actual?: unknown): boolean {
        if (actual != null) {
            if (typeof actual === 'number' || typeof actual === 'string' || typeof actual === 'boolean') {
                const anum = Number(actual);
                if (!isNaN(anum)) {
                    return this.min < anum;
                }
            }
            if (typeof actual === 'string') {
                const length = String(actual).length;
                return this.min < length;
            }
            if (Array.isArray(actual)) {
                const length = actual.length;
                return this.min < length;
            }
            if (actual instanceof Map || actual instanceof Set) {
                const size = (actual as Map<any, any> | Set<any>).size;
                return this.min < size;
            }
        }
        return false;
    }
}
/**
 * compares the `actual` value passed to `isMatch` with the `min` value where an
 * `actual` that is a number or a string representation of a number is compared directly (boolean values
 * are converted to 1 or 0), and `actual` values that are a string or collection are compared by length
 * or number of contained items
 * @param min the minimum value that will return `true` from the `isMatch` function. @default -Infinity
 * @returns `true` if the value passed to `isMatch` is greater than the `min`
 * value; otherwise `false`
 */
export const greaterThan = (min?: number) => new GreaterThan(min);

class LessThan extends ValueMatcher {
    public readonly max: number;
    constructor(max?: number) {
        super();
        this.max = max ?? Infinity;
    }
    override isMatch(actual?: unknown): boolean {
        if (actual != null) {
            if (typeof actual === 'number' || typeof actual === 'string' || typeof actual === 'boolean') {
                const anum = Number(actual);
                if (!isNaN(anum)) {
                    return anum < this.max;
                }
            }
            if (typeof actual === 'string') {
                const length = String(actual).length;
                return length < this.max;
            }
            if (Array.isArray(actual)) {
                const length = actual.length;
                return length < this.max;
            }
            if (actual instanceof Map || actual instanceof Set) {
                const size = (actual as Map<any, any> | Set<any>).size;
                return size < this.max;
            }
        }
        return false;
    }
}
/**
 * compares the `actual` value passed to `isMatch` with the `max` value where an
 * `actual` that is a number or a string representation of a number is compared directly (boolean values
 * are converted to 1 or 0), and `actual` values that are a string or collection are compared by length
 * or number of contained items
 * @param max the maximum value that will return `true` from the `isMatch` function. @default Infinity
 * @returns `true` if the value passed to `isMatch` is less than the `max`
 * value; otherwise `false`
 */
export const lessThan = (max?: number) => new LessThan(max);

class Containing extends ValueMatcher {
    private expected: any;
    constructor(expected?: any) {
        super();
        this.expected = expected ?? '';
    }
    override isMatch(actual?: unknown): boolean {
        if (actual != null) {
            if (typeof actual === 'number' && typeof this.expected === 'number') {
                // is actual a number bigger than expected?
                return actual - this.expected >= 0;
            }
            if (typeof actual === 'string') {
                if (typeof this.expected === 'string' || typeof this.expected === 'number' || typeof this.expected === 'boolean') {
                    // does actual string contain expected string?
                    return actual.includes(String(this.expected));
                }
                if (Array.isArray(this.expected)) {
                    for (let val of this.expected) {
                        if (!actual.includes(String(val))) {
                            return false;
                        }
                    }
                    return true;
                }
            }
            if (Array.isArray(actual)) {
                if (Array.isArray(this.expected)) {
                    for (let val of this.expected) {
                        if (!actual.includes(val)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    // does actual array contain element expected?
                    return actual.includes(this.expected);
                }
            }
            if (actual instanceof Map || actual instanceof Set) {
                const arr = Array.from((actual as Map<any, any> | Set<any>).values());
                if (Array.isArray(this.expected)) {
                    for (let val of this.expected) {
                        if (!arr.includes(val)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    // does actual map / set contain expected entry?
                    return arr.includes(this.expected);
                }
            }
            if (typeof actual === 'object') {
                return this._objectContains(actual);
            }
        }
        return false;
    }
    private _objectContains(obj: object): boolean {
        if (obj != null) {
            const objKeys = Object.keys(obj);
            for (let key of objKeys) {
                if (typeof obj[key] === typeof this.expected) {
                    const contains = obj[key] === this.expected;
                    if (contains) {
                        return true;
                    }
                }
                if (typeof obj[key] === 'object') {
                    const contains = this._objectContains(obj[key]);
                    if (contains) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
/**
 * checks that the `actual` result contains the `expected` where the following rules apply:
 * - **`actual` and `expected` are numeric:** if `actual` is a larger number than `expected` then `true` 
 * - **`actual` is a `string`:**
 *   - **`expected` is a `string`, `number` or `boolean`:** if `expected` value is contained in the `actual` string then `true`
 *   - **`expected` is an array:** if all values in the `expected` array are contained in the `actual` string then `true`
 * - **`actual` is an array:**
 *   - **`expected` is an array:** if all values in the `expected` array are also in the `actual` array then `true`
 *   - **`expected` is not an array:** if the `actual` array contains the `expected` value then `true`
 * - **`actual` is a Set or Map:**
 *   - **`expected` is an array:** if all values in the `expected` array are in the values of `actual` then `true`
 *   - **`expected` is not an array:** if any of thethe `actual` values matches `expected` then `true`
 * - **`actual` is some other `object`:** if any of the properties of `actual` contain a value matching `expected` then `true`
 * @param expected a value you expect to be contained in the `actual` object passed to `isMatch`. @default ''
 * @returns `true` if the `actual` contains the `expected`; otherwise `false`
 */
export const containing = (expected?: any) => new Containing(expected);

class Matching extends ValueMatcher {
    public readonly regx: RegExp;
    constructor(regx?: RegExp) {
        super();
        this.regx = regx ?? /.*/;
    }
    override isMatch(actual?: unknown): boolean {
        if (actual != null) {
            if (typeof actual === 'string' || typeof actual === 'number' || typeof actual === 'boolean') {
                return this.regx.test(String(actual));
            }
            if (Array.isArray(actual)) {
                return actual.every(a => this.isMatch(a));
            }
            if (actual instanceof Map || actual instanceof Set) {
                const arr = Array.from(actual.values());
                return arr.every(a => this.isMatch(a));
            }
        }
        return false;
    }
}
/**
 * compares the `regx` directly against the value passed to `isMatch` if that value
 * is a `string`, `number` or `boolean`, but if it is an array, Set or Map then it
 * compares the `regx` to all elements in the collection and only returns true if all
 * match
 * @param regx a `Regexp` used to compare to the `actual` value passed to `isMatch`
 * @returns `true` if the `regx` matches `actual`
 */
export const matching = (regx?: RegExp) => new Matching(regx);

class StartingWith extends ValueMatcher {
    public readonly start: string | number | boolean;
    constructor(start?: string | number | boolean) {
        super();
        this.start = start ?? '';
    }
    override isMatch(actual?: unknown): boolean {
        if (actual != null) {
            if (typeof actual === 'number' || typeof actual === 'string' || typeof actual === 'boolean') {
                // does actual start with expected when both are converted to a string?
                return String(actual).startsWith(String(this.start));
            }
            if (Array.isArray(actual)) {
                // does actual array start with expected?
                return actual.length > 0 && actual[0] === this.start;
            }
            if (actual instanceof Map || actual instanceof Set) {
                // does actual map / set start with expected?
                const arr = Array.from((actual as Map<any, any> | Set<any>).values());
                return arr.length > 0 && arr[0] === this.start
            }
        }
        return false;
    }
}
/**
 * performs a `string.startsWith` operation if `actual` is a `string`, `number` or `boolean` or
 * if `actual` is an array, Set or Map it will check that `start` is the first value found in
 * the collection
 * @param start a `string`, `number` or `boolean` that is expected to be found at the beginning
 * of the `actual` value @default ''
 * @returns `true` if the `actual` value starts with `start`; otherwise `false`
 */
export const startingWith = (start?: string | number | boolean) => new StartingWith(start);

class EndingWith extends ValueMatcher {
    public readonly end: string | number | boolean;
    constructor(end?: string | number | boolean) {
        super();
        this.end = end ?? '';
    }
    override isMatch(actual?: unknown): boolean {
        if (actual != null) {
            if (typeof actual === 'number' || typeof actual === 'string' || typeof actual === 'boolean') {
                // does actual end with expected when both are converted to a string?
                return String(actual).endsWith(String(this.end));
            }
            if (Array.isArray(actual)) {
                // does actual array start with expected?
                return actual.length > 0 && actual[actual.length - 1] === this.end;
            }
            if (actual instanceof Map || actual instanceof Set) {
                // does actual map / set start with expected?
                const arr = Array.from((actual as Map<any, any> | Set<any>).values());
                return arr.length > 0 && arr[arr.length - 1] === this.end
            }
        }
        return false;
    }
}
/**
 * performs a `string.endsWith` operation if `actual` is a `string`, `number` or `boolean` or
 * if `actual` is an array, Set or Map it will check that `end` is the last value found in
 * the collection
 * @param end a `string`, `number` or `boolean` that is expected to be found at the end
 * of the `actual` value @default ''
 * @returns `true` if the `actual` value ends with `end`; otherwise `false`
 */
export const endingWith = (end?: string | number | boolean) => new EndingWith(end);

class HavingValue implements ValueMatcher {
    isMatch(actual?: unknown): boolean {
        return actual != null;
    }
}
/**
 * verifies that the `actual` value is set to something other than `null` or
 * `undefined`
 * @returns `true` if the `actual` value is not `null` or `undefined`
 */
export const havingValue = () => new HavingValue();

class Not implements ValueMatcher {
    public readonly notExpected: ValueMatcher;
    constructor(notExpected: ValueMatcher) {
        this.notExpected = notExpected;
    }
    isMatch(actual?: unknown): boolean {
        return !this.notExpected.isMatch(actual);
    }
}
/**
 * inverts the result of any {ValueMatcher} passed to it
 * @param notExpected a {ValueMatcher} to be negated
 * @returns `true` if the passed in `notExpected` returns `false`; otherwise `false`
 */
export const not = (notExpected: ValueMatcher) => new Not(notExpected);