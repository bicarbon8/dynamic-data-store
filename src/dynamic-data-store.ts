export type DynamicDataStoreOptions<T extends {}> = {
    /**
     * an array of property keys in `T` whose values will be used to generate
     * a unique record index for each record added to the `DynamicDataStore`
     */
    indexPropertyKeys?: Array<keyof T>;
    /**
     * an optional array of records to add on creation of the `DynamicDataStore`; 
     * alternatively you can use the `add(record: T)` function after creation
     */
    records?: Array<T>;
    /**
     * an optional string to use to separate the property values when generating
     * a unique key to index the `DynamicDataStore`
     */
    propertyKeyDelimiter?: string;
};

export class DynamicDataStore<T extends {}> {
    private readonly _indexPropKeys: Array<keyof T>;
    private readonly _store = new Map<string, T>();
    private readonly _propDelim: string;
    
    constructor(options?: DynamicDataStoreOptions<T>) {
        options = {
            propertyKeyDelimiter: '-',
            ...options
        };
        this._propDelim = options.propertyKeyDelimiter;
        this._indexPropKeys = [...(options.indexPropertyKeys ?? [])];
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
    get indexPropertyKeys(): Array<keyof T> {
        return [...this._indexPropKeys];
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
     * @param updated an object containing the values to update on one or more stored
     * records
     * @param queries optional `Partial<T>` object(s) containing one or more fields
     * used to determine which records are updated (must match all values specified).
     * if not supplied then the `updated` object will be used to `get` a matching
     * record from the `DynamicDataStore` by generating an index from the object's 
     * properties that match the specified index property keys
     * @returns the number of records updated
     */
    update(updated: Partial<T>, ...queries: Array<Partial<T>>): number {
        let count = 0;
        if (updated) {
            let oldRecords: Array<T>;
            if (queries?.length) {
                oldRecords = this.select(...queries);
            } else {
                oldRecords = [this.get(updated)];
            }
            if (oldRecords?.length) {
                for (const oldRecord of oldRecords) {
                    let key = this.getIndex(oldRecord);
                    if (key) {
                        this._store.set(key, {
                            ...oldRecord,
                            ...updated
                        });
                        count++;
                    }
                }
            }
        }
        return count;
    }

    /**
     * finds all objects containing matching values for the supplied
     * fields in `partial`. if multiple `queries` are supplied then each
     * is applied as an `OR` operation with the others
     * @param queries optional objects containing one or more fields in type `T`
     * used to filter the results. returned results must match all values specified
     * in the individual query
     * @returns an array of objects containing matching values for all
     * fields supplied in `queries` or all objects if `queries` is not supplied
     */
    select(...queries: Array<Partial<T>>): Array<T> {
        const results = new Array<T>();
        if (queries?.length && queries[0]) {
            for (const query of queries) {
                if (query) {
                    const findByKeys = Object.keys(query);
                    const uArr = Array.from(this._store.values());
                    results.splice(results.length, 0, ...uArr.filter(u => {
                        for (const key of findByKeys) {
                            if (query[key] !== u[key]) {
                                return false;
                            }
                        }
                        return true;
                    }));
                }
            }
        } else {
            // return all records in the table
            results.splice(0, 0, ...this._store.values());
        }
        return JSON.parse(JSON.stringify(results));
    }

    /**
     * finds the first object containing matching values for the supplied fields
     * in `partial`
     * @param partial an optional object containing one or more fields in type `T`
     * @returns the first non-null (and non-undefined) object matching values
     * for all fields supplied in `partial`
     */
    selectFirst(partial?: Partial<T>): T {
        const results = this.select(partial);
        return results.find(r => r != null);
    }

    /**
     * gets the object contained in the `DynamicDataStore` whose index keys match
     * those supplied in `containsIndexProps`
     * @param containsIndexProps an object containing all properties used
     * as index keys
     * @returns a single object matching the supplied index keys or
     * `undefined` if none exist or the passed in object does not contain all the
     * expected index properties
     */
    get(containsIndexProps: Partial<T>): T {
        const key = this.getIndex(containsIndexProps);
        if (key) {
            const record = this._store.get(key);
            if (record) {
                return JSON.parse(JSON.stringify(record));
            }
        }
        return undefined;
    }

    /**
     * returns the number of records matching the specified selection
     * criteria passed in `partial`
     * @param partial an optional object containing one or more properties in type `T`
     * @returns the number of records found that match the passed in `partial` or
     * all records if no `partial` is supplied
     */
    count(partial?: Partial<T>): number {
        const records = this.select(partial);
        return records.length;
    }

    /**
     * removes records from the `DynamicDataStore` whose property values match the 
     * values of the supplied `queries` object(s). where more than one `queries`
     * object is supplied each is assumed to be combined using a logical `OR`
     * operation
     * @param queries the object whose property values are used to lookup
     * existing records for deletion
     * @returns and array of records that were deleted or empty array
     * if no matches found
     */
    delete(...queries: Array<Partial<T>>): Array<T> {
        const found = this.select(...queries);
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
    hasIndexProperties(record: Partial<T>): boolean {
        let hasProps: boolean = true;
        for (const key of this._indexPropKeys) {
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
        if (this.hasIndexProperties(record)) {
            const strVals = new Array<string>();
            if (this._indexPropKeys.length) {
                for (let key of this._indexPropKeys) {
                    strVals.push(JSON.stringify(record[key]));
                }
            } else {
                strVals.push(JSON.stringify(record));
            }
            return strVals.join(this._propDelim);
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
        const values = index.split(this._propDelim);
        if (values.length === this._indexPropKeys.length) {
            for (var i=0; i<this._indexPropKeys.length; i++) {
                let key = this._indexPropKeys[i];
                let val = values[i];
                parsed[key] = JSON.parse(val);
            }
        } else {
            throw new Error(`invalid index '${index}'`);
        }
        return parsed;
    }
}