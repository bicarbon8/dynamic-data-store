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
                // does actual map / set contain expected entry?
                return (actual as Map<any, any> | Set<any>).has(this.expected);
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
export const matching = (regx?: RegExp) => new Matching(regx);

class StartingWith extends ValueMatcher {
    public readonly start: any;
    constructor(start?: any) {
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
export const startingWith = (start?: string) => new StartingWith(start);