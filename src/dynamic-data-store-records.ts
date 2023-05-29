import { DynamicDataStore, QueryValue } from "./dynamic-data-store";
import { JsonHelper } from "./json-helper";

export type Order = 'asc' | 'desc';

export class DynamicDataStoreRecords<T extends {}> extends Array<T> {
    private readonly _highValueCharacters = '\u9999\u9999\u9999\u9999\u9999\u9999';
    private readonly _indicies: Array<keyof T>;

    constructor(indicies: Array<keyof T>, ...inputs: Array<T>) {
        super(...inputs);
        this._indicies = indicies;
    }
    
    orderBy(order: Order = 'asc', ...keys: Array<keyof T>): this {
        this.sort((a: T, b: T) => {
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
                return this.slice(0, val);
            }
        }
        if (val === '*') {
            return this;
        }
        return undefined;
    }

    first(): T {
        return (this.length > 0) ? this[0] : undefined;
    }

    last(): T {
        return (this.length > 0) ? this[this.length - 1] : undefined;
    }

    select(query?: Partial<Record<keyof T, QueryValue>>): DynamicDataStoreRecords<T> {
        return new DynamicDataStore({
            indicies: this._indicies,
            records: this
        }).select(query);
    }
}