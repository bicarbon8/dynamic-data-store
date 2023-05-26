import { ValueMatcher } from "./value-matcher";

export type DynamicDataStoreOptions<T extends {}> = {
    /**
     * an array of property keys in `T` whose values will be used to generate
     * a unique record index for each record added to the `DynamicDataStore`
     */
    indicies?: Array<keyof T>;
    /**
     * an optional array of records to add on creation of the `DynamicDataStore`; 
     * alternatively you can use the `add(record: T)` function after creation
     */
    records?: Array<T>;
    /**
     * an optional string to use to separate the property values when generating
     * a unique key to index the `DynamicDataStore`
     */
    delimiter?: string;
};

export type QueryValue = ValueMatcher | number | boolean | string | {};
export type Query<T> = Partial<Record<keyof T, QueryValue>>;

export class DynamicDataStore<T extends {}> {
    private readonly _indicies: Array<keyof T>;
    private readonly _store = new Map<string, T>();
    private readonly _delim: string;
    
    constructor(options?: DynamicDataStoreOptions<T>) {
        options = {
            delimiter: '-',
            ...options
        };
        this._delim = options.delimiter;
        this._indicies = [...(options.indicies ?? [])];
        if (options.records) {
            for (let record of options.records) {
                this.add(record);
            }
        }
    }

    /**
     * a readonly array of the property keys used to generate the index
     * for this `DynamicDataStore`
     */
    get indicies(): Array<keyof T> {
        return [...this._indicies];
    }

    /**
     * adds a new unique object to the table if no objects already
     * exist that use the same index
     * @param record a new object to be added to the table
     * @returns `true` if the object was added or `false` if an object
     * already exists using the same index
     */
    add(record: T): boolean {
        const key = this.getIndex(record);
        if (key && !this._store.has(key)) {
            this._store.set(key, record);
            return true;
        }
        return false;
    }

    /**
     * updates an existing object in the `DynamicDataStore` with new values for
     * all fields that have changed, preserving any unchanged fields
     * and the fields used as index properties
     * @param updates an object containing the values to update on one or more stored
     * records
     * @param query optional `Query<T>` object containing one or more fields
     * used to determine which records should be updated (must match all values specified).
     * if not supplied then the `updated` object will be used to `get` a matching
     * record from the `DynamicDataStore` by generating an index from the object's 
     * properties that match the specified index property keys
     * @returns the number of records updated
     */
    update(updates: Partial<T>, query?: Query<T>): number {
        let count = 0;
        if (updates) {
            const shouldBeUpdatedArr = new Array<T>();
            if (this.hasAllIndexProperties(updates)) {
                shouldBeUpdatedArr.splice(0, 0, this.get(updates));
            } else {
                shouldBeUpdatedArr.splice(0, 0, ...this.select(query));
            }
            for (let toBeUpdated of shouldBeUpdatedArr) {
                let key = this.getIndex(toBeUpdated);
                if (key) {
                    this._store.set(key, {
                        ...toBeUpdated,
                        ...updates
                    });
                    count++;
                }
            }
        }
        return count;
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
    select(query?: Query<T>): Array<T> {
        const results = new Array<T>();
        if (query) {
            const sArr = Array.from(this._store.values());
            const queryKeys = Object.keys(query);
            results.splice(0, 0, ...sArr.filter(r => {
                for (let prop of queryKeys) {
                    if (query[prop] instanceof ValueMatcher) {
                        if (!query[prop].isMatch(r[prop])) {
                            return false;
                        }
                    } else {
                        if (query[prop] !== r[prop]) {
                            return false;
                        }
                    }
                }
                return true;
            }));
        } else {
            results.splice(0, 0, ...this._store.values());
        }
        return JSON.parse(JSON.stringify(results));
    }

    /**
     * returns the number of records matching the specified selection
     * criteria passed in `query`
     * @param query an optional object containing one or more properties in type `T`
     * @returns the number of records found that match the passed in `query` or
     * all records if no `query` is supplied
     */
    count(query?: Query<T>): number {
        const records = this.select(query);
        return records.length;
    }

    /**
     * removes records from the `DynamicDataStore` whose property values match the 
     * values of the supplied `queries` object(s). where more than one `queries`
     * object is supplied each is assumed to be combined using a logical `OR`
     * operation
     * @param query the object whose property values are used to lookup
     * existing records for deletion
     * @returns and array of records that were deleted or empty array
     * if no matches found
     */
    delete(query: Query<T>): Array<T> {
        const found = this.select(query);
        for (let f of found) {
            let key = this.getIndex(f);
            if (key) {
                this._store.delete(key);
            }
        }
        return found;
    }

    /**
     * removes all records stored by this `DynamicDataStore`
     * @returns all removed records
     */
    clear(): Array<T> {
        const records = Array.from(this._store.values());
        this._store.clear();
        return records;
    }

    /**
     * checks if the passed in object has all the properties currently used
     * to generate an index key. NOTE: if no `indexKeys` were specified for
     * this `DynamicDataStore` instance then `true` will be returned as long
     * as the passed in object is not `null` or `undefined`
     * @param record the object to check for properties used as index keys
     * @returns `true` if all the properties used as index keys have a value,
     * otherwise `false`
     */
    hasAllIndexProperties(record: Partial<T>): boolean {
        let hasProps: boolean = true;
        for (const key of this._indicies) {
            if (record?.[key] == null) {
                hasProps = false;
                break;
            }
        }
        return hasProps && record != null;
    }

    /**
     * ensures the passed in `record` has values for all index properties and
     * converts the passed in `record` to an index key that is used to uniquely
     * identify records in this `DynamicDataStore`
     * @param record the object that contains the index property keys to be
     * converted into a `string` delimited by `propertyKeyDelimiter`
     * @returns the generated index key
     */
    getIndex(record: Partial<T>): string {
        if (this.hasAllIndexProperties(record)) {
            const strVals = new Array<string>();
            if (this._indicies.length) {
                for (let key of this._indicies) {
                    strVals.push(JSON.stringify(record[key]));
                }
            } else {
                strVals.push(JSON.stringify(record));
            }
            return strVals.join(this._delim);
        }
        return undefined;
    }

    /**
     * parses the supplied `index` to create a partial object containing the fields
     * and values from the `index`
     * @param index a `string` index created by the `getIndex` function
     * @returns a partial object containing fields and values parsed from
     * the supplied `index`
     */
    parseIndex(index: string): Partial<T> {
        const parsed: Partial<T> = {};
        const values = index.split(this._delim);
        if (values.length === this._indicies.length) {
            for (var i=0; i<this._indicies.length; i++) {
                let key = this._indicies[i];
                let val = values[i];
                parsed[key] = JSON.parse(val);
            }
        } else {
            throw new Error(`invalid index '${index}'`);
        }
        return parsed;
    }
}