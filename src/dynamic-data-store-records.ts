import { DynamicDataStore } from "./dynamic-data-store";
import { JsonHelper } from "./json-helper";
import { Query } from "./query";

export type Order = 'asc' | 'desc';

/**
 * a `DynamicDataStore` results class used to provide record sorting and
 * filtering. calls to `DynamicDataStore.select(query?: Query<T>)` will
 * return an instance of this class or it can be used on it's own to provide
 * an alternative to the `Array.sort` and `Array.filter` functions
 */
export class DynamicDataStoreRecords<T extends {}> extends Array<T> {
    private readonly _highValueCharacters = '\u9999\u9999\u9999\u9999\u9999\u9999';
    private readonly _indicies: Array<keyof T>;

    constructor(indicies: Array<keyof T>, ...inputs: Array<T>) {
        super(...inputs);
        this._indicies = indicies;
    }

    get first(): T {
        return (this.length > 0) ? this[0] : undefined;
    }

    get last(): T {
        return (this.length > 0) ? this[this.length - 1] : undefined;
    }
    
    /**
     * orders the records by either the entire record or by specific property keys where
     * the order that the property keys are specified is important to the orderting of
     * the records. NOTE: any fields set to `null` or `undefined` that are used for 
     * ordering the records will be assigned a high value resulting in them being ordered
     * at the end of the records array if using an order of `asc`
     * @param order a value of either 'asc' for ascending or 'desc' for descending
     * @param keys the property keys to use to order the records. records will be ordered by
     * each property key in the order they're passed
     * @returns a reference to this {DynamicDataStoreRecords}
     */
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

    /**
     * finds all records in the `DynamicDataStore` whose values match those
     * passed in the supplied record. NOTE: any properties not specified will
     * be ignored
     * @param query a record object where any keys of type `T` are set to either 
     * the exact value expected or a `ValueMatcher` used to identify values
     * conforming to certain criteria
     * @returns an array of all matching records
     */
    select(query?: Query<T>): DynamicDataStoreRecords<T> {
        return new DynamicDataStore({
            indicies: this._indicies,
            records: this
        }).select(query);
    }
}