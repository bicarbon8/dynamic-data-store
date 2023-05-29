import { DynamicDataStore } from "../src";
import { between, containing, matching, startingWith } from "../src/value-matcher";

type TestObj = {
    strKey?: string;
    boolKey?: boolean;
    numKey?: number;
    objKey?: TestObj;
};

describe('DynamicDataStore', () => {
    it('can add records via contructor options', () => {
        const store = new DynamicDataStore<TestObj>({
            records: [
                { strKey: 'foo', boolKey: true },
                { strKey: 'foo', boolKey: false }
            ]
        });

        expect(store.size()).withContext('number of records in the table').toBe(2);
        const actual = store.select();
        expect(actual.first.strKey).toEqual('foo');
        expect(actual.first.boolKey).toBe(true);
        expect(actual[1].strKey).toEqual('foo');
        expect(actual[1].boolKey).toBe(false);
    })

    it('can add indexKeys via contructor options', () => {
        const store = new DynamicDataStore<TestObj>({
            indicies: ['boolKey']
        });

        const actualKey = store.getIndex({ strKey: 'foo', boolKey: true, numKey: 10 });
        expect(actualKey).toEqual('true');
    })

    it('can add key delimiter via contructor options', () => {
        const store = new DynamicDataStore<TestObj>({
            delimiter: ':',
            indicies: ['strKey', 'numKey']
        });

        const actualKey = store.getIndex({ strKey: 'foo', boolKey: false, numKey: 111 });
        expect(actualKey).toEqual('"foo":111');
    })

    it('does not update source table if returned record is modified', () => {
        const store = new DynamicDataStore<TestObj>({
            indicies: ['strKey'],
            records: [
                { strKey: 'foo', boolKey: true, numKey: 222 }
            ]
        });
        const record = store.select().first;
        record.strKey = 'bar';
        record.boolKey = false;
        record.numKey = 333;

        const actual = store.select().first;
        expect(actual.strKey).toEqual('foo');
        expect(actual.boolKey).toBe(true);
        expect(actual.numKey).toBe(222);
    })

    it('can update record using the update function', () => {
        const store = new DynamicDataStore<TestObj>({
            indicies: ['strKey', 'numKey'],
            records: [
                {strKey: 'foo', boolKey: true, numKey: 1},
                {strKey: 'foo', boolKey: true, numKey: 2},
                {strKey: 'foo', boolKey: true, numKey: 3},
                {strKey: 'foo', boolKey: true, numKey: 4}
            ]
        });
        const count = store.update({strKey: 'foo', boolKey: false, numKey: 2});

        expect(count).withContext('only one record updated').toEqual(1);
        const updated = store.select({strKey: 'foo', numKey: 2}).first;
        expect(updated.boolKey).toBe(false);
        const unchanged = store.select({boolKey: true});
        expect(unchanged.length).toBe(3);
    })

    it('can update multiple records using the update function', () => {
        const store = new DynamicDataStore<TestObj>({
            indicies: ['strKey', 'numKey'],
            records: [
                {strKey: 'foo', boolKey: true, numKey: 1},
                {strKey: 'foo', boolKey: false, numKey: 2},
                {strKey: 'foo', boolKey: false, numKey: 3},
                {strKey: 'foo', boolKey: false, numKey: 4}
            ]
        });
        const count = store.update({boolKey: true}, {numKey: between(2, 3)});

        expect(count).withContext('only two records updated').toBe(2);
        const unchanged = store.select({strKey: 'foo', numKey: 4}).first;
        expect(unchanged.boolKey).toBe(false);
        const updated = store.select({numKey: between(2, 3)});
        expect(updated.length).toBe(2);
        expect(updated.every(c => c.boolKey === true)).toBe(true);
    })

    it('can remove records by query data', () => {
        const store = new DynamicDataStore<TestObj>({
            records: [
                {strKey: 'foo', boolKey: true, numKey: 1},
                {strKey: 'foo', boolKey: false, numKey: 2},
                {strKey: 'foo', boolKey: false, numKey: 1},
                {strKey: 'foo', boolKey: true, numKey: 2},
                {strKey: 'bar', boolKey: true, numKey: 1},
                {strKey: 'bar', boolKey: false, numKey: 2},
                {strKey: 'bar', boolKey: false, numKey: 1},
                {strKey: 'bar', boolKey: true, numKey: 2}
            ]
        });

        const deleted = store.delete({strKey: 'foo', boolKey: true});
        expect(deleted.length).withContext('expected two records removed based on criteria').toBe(2);
        expect(deleted.filter(d => d.numKey === 1).length).toBe(1);

        const remaining = store.delete({strKey: matching(/(foo|bar)/)});
        expect(remaining.length).toBe(6);
        expect(store.size()).toBe(0);
    })

    it('can clear all records', () => {
        const store = new DynamicDataStore<TestObj>({
            records: [
                {strKey: 'foo', boolKey: true, numKey: 1},
                {strKey: 'foo', boolKey: false, numKey: 2},
                {strKey: 'foo', boolKey: false, numKey: 1},
                {strKey: 'foo', boolKey: true, numKey: 2},
                {strKey: 'bar', boolKey: true, numKey: 1},
                {strKey: 'bar', boolKey: false, numKey: 2},
                {strKey: 'bar', boolKey: false, numKey: 1},
                {strKey: 'bar', boolKey: true, numKey: 2}
            ]
        });

        expect(store.size()).toBe(8);
        store.clear();
        expect(store.size()).toBe(0);
    })

    it('does not allow the indexProperties array to be modified', () => {
        const store = new DynamicDataStore<TestObj>({
            indicies: ['strKey', 'numKey']
        });

        const indexProps = [...store.indicies];
        
        expect(indexProps.length).toBe(2);

        store.indicies.splice(0, 1);

        expect(store.indicies.length).toBe(2);
        expect(store.indicies).toEqual(indexProps);
    })

    it('allows queries to search nested objects', () => {
        const store = new DynamicDataStore<TestObj>({
            indicies: ['strKey', 'boolKey', 'numKey'],
            records: [
                {strKey: 'foo', boolKey: true, numKey: 1, objKey: {strKey: 'bar'}},
                {strKey: 'foo', boolKey: false, numKey: 2, objKey: {strKey: 'baz'}},
                {strKey: 'foo', boolKey: false, numKey: 1, objKey: {strKey: 'bar'}},
                {strKey: 'foo', boolKey: true, numKey: 2, objKey: {strKey: 'baz'}},
                {strKey: 'bar', boolKey: true, numKey: 1, objKey: {strKey: 'bar'}},
                {strKey: 'bar', boolKey: false, numKey: 2, objKey: {strKey: 'baz'}},
                {strKey: 'bar', boolKey: false, numKey: 1, objKey: {strKey: 'bar'}},
                {strKey: 'bar', boolKey: true, numKey: 2, objKey: {strKey: 'baz'}}
            ]
        });

        const results = store.select({strKey: 'foo', objKey: {strKey: 'bar'}});
        expect(results.length).toBe(2);
        const valRes = store.select({strKey: 'bar', objKey: {strKey: startingWith('ba')}});
        expect(valRes.length).toBe(4);
    })

    it('works when records contain a map', () => {
        type MapObj = TestObj & {
            mapObj: Map<string, any>;
        };
        const store = new DynamicDataStore<MapObj>({
            indicies: ['mapObj'],
            records: [
                {strKey: 'abc', numKey: 1, mapObj: new Map<string, any>([['def', 456]])},
                {strKey: 'bcd', numKey: 2, mapObj: new Map<string, any>([['cde', 345]])},
                {strKey: 'cde', numKey: 3, mapObj: new Map<string, any>([['bcd', 234]])},
                {strKey: 'def', numKey: 4, mapObj: new Map<string, any>([['abc', 123]])}
            ]
        });

        expect(store.size()).toBe(4);

        const records = store.select().orderBy('asc', 'mapObj');

        expect(records.first.strKey).toEqual('def');
        expect(records.first.numKey).toBe(4);
        expect(records.last.strKey).toEqual('abc');
        expect(records.last.numKey).toBe(1);
    })

    it('works when records contain a set', () => {
        type SetObj = TestObj & {
            setObj: Set<any>;
        };
        const store = new DynamicDataStore<SetObj>({
            indicies: ['setObj'],
            records: [
                {strKey: 'abc', numKey: 1, setObj: new Set<any>([456])},
                {strKey: 'bcd', numKey: 2, setObj: new Set<any>([345])},
                {strKey: 'cde', numKey: 3, setObj: new Set<any>([234])},
                {strKey: 'def', numKey: 4, setObj: new Set<any>([123])}
            ]
        });

        expect(store.size()).toBe(4);

        const records = store.select().orderBy('asc', 'setObj');

        expect(records.first.strKey).toEqual('def');
        expect(records.first.numKey).toBe(4);
        expect(records.last.strKey).toEqual('abc');
        expect(records.last.numKey).toBe(1);
    })
})