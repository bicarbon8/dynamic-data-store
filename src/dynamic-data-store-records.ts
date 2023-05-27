import { JsonHelper } from "./json-helper";

export type Order = 'asc' | 'desc';

export class DynamicDataStoreRecords<T extends {}> {
    public readonly data: Array<T>;
    private readonly _highValueCharacters = '\u9999\u9999\u9999\u9999\u9999\u9999';

    constructor(...inputs: Array<T>) {
        this.data = inputs ?? new Array<T>();
    }

    orderBy(order: Order = 'asc', ...keys: Array<keyof T>): this {
        this.data.sort((a: T, b: T) => {
            let aStr: string = '';
            let bStr: string = '';
            if (keys?.length > 0) {
                for (let key of keys) {
                    aStr += (a?.[key] != null) ? JSON.stringify(a[key], JsonHelper.replacer) : this._highValueCharacters;
                    bStr += (b?.[key] != null) ? JSON.stringify(b[key], JsonHelper.replacer) : this._highValueCharacters;
                }
            } else {
                aStr = (a != null) ? JSON.stringify(a, JsonHelper.replacer) : this._highValueCharacters;
                bStr = (b != null) ? JSON.stringify(b, JsonHelper.replacer) : this._highValueCharacters;
            }
            if (aStr < bStr) {
                if (order === 'asc') {
                    return -1;
                } else {
                    return 1;
                }
            } else if (aStr > bStr) {
                if (order === 'asc') {
                    return 1;
                } else {
                    return -1;
                }
            } else {
                return 0;
            }
        });
        return this;
    }

    count(val: number | string): Array<T> {
        if (typeof val === 'number') {
            if (val >= 0) {
                return this.data.slice(0, val);
            }
        }
        if (val === '*') {
            return this.data;
        }
        return undefined;
    }

    first(): T {
        return (this.data.length > 0) ? this.data[0] : undefined;
    }

    last(): T {
        return (this.data.length > 0) ? this.data[this.data.length - 1] : undefined;
    }
}