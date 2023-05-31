import { ValueMatcher } from "./value-matcher";

function recordMatches(query: {}, record: {}): boolean {
    const queryKeys = Object.keys(query);
    for (let prop of queryKeys) {
        if (query[prop] instanceof ValueMatcher) {
            if (!query[prop].isMatch(record[prop])) {
                return false;
            }
        } else {
            if (typeof query[prop] === 'object' && query[prop] !== null) {
                if (record[prop] == null) {
                    return false;
                }
                const result = recordMatches(query[prop], record[prop]);
                if (result === false) {
                    return false;
                }
            } else if (query[prop] !== record[prop]) {
                return false;
            }
        }
    }
    return true;
}

export type QueryValue = ValueMatcher | number | boolean | string | {};
export type Query<T> = Partial<Record<keyof T, QueryValue>>;
/**
 * module providing object and class array filtering by using a passed in `Query<T>`
 * object containing property keys from type `T` and either an expected value or a
 * `ValueMatcher` used to match against certain conditions
 */
export module Query {
    /**
     * allows filtering of a supplied set of objects by a passed in `query` without storing
     * the values inside a `DynamicDataStore`. this function can be used in cases where no
     * uniqueness constraints exist or where filtering and retrieval of class objects is
     * required
     * @param query a record containing keys and values or `ValueMatcher`s used to filter the 
     * passed in `records`
     * @param records 0 or more objects to be filtered using the supplied `query`
     * @returns an array of filtered objects matching the supplied `query`
     */
    export const filterBy = <T extends {}>(query: Query<T>, ...records: Array<T>): Array<T> => {
        const results = new Array<T>();
        if (query) {
            results.splice(0, 0, ...records.filter(r => recordMatches(query, r)));
        } else {
            results.splice(0, 0, ...records);
        }
        return results;
    }
}