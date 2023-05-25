import { DynamicDataStore } from "../src";
import { between, containing, matching } from "../src/value-matcher";

type TestObj = {
    strKey?: string;
    boolKey?: boolean;
    numKey?: number;
    objKey?: TestObj;
};

describe('DynamicDataStore', () => {
    it('can add records via contructor options', () => {
        const dt = new DynamicDataStore<TestObj>({
            records: [
                { strKey: 'foo', boolKey: true },
                { strKey: 'foo', boolKey: false }
            ]
        });

        expect(dt.count()).withContext('number of records in the table').toBe(2);
        const actual = dt.select();
        expect(actual[0].strKey).toEqual('foo');
        expect(actual[0].boolKey).toBe(true);
        expect(actual[1].strKey).toEqual('foo');
        expect(actual[1].boolKey).toBe(false);
    })

    it('can add indexKeys via contructor options', () => {
        const dt = new DynamicDataStore<TestObj>({
            indicies: ['boolKey']
        });

        const actualKey = dt.getIndex({ strKey: 'foo', boolKey: true, numKey: 10 });
        expect(actualKey).toEqual('true');
    })

    it('can add key delimiter via contructor options', () => {
        const dt = new DynamicDataStore<TestObj>({
            delimiter: ':',
            indicies: ['strKey', 'numKey']
        });

        const actualKey = dt.getIndex({ strKey: 'foo', boolKey: false, numKey: 111 });
        expect(actualKey).toEqual('"foo":111');
    })

    it('does not update source table if returned record is modified', () => {
        const dt = new DynamicDataStore<TestObj>({
            indicies: ['strKey'],
            records: [
                { strKey: 'foo', boolKey: true, numKey: 222 }
            ]
        });
        const record = dt.selectFirst();
        record.strKey = 'bar';
        record.boolKey = false;
        record.numKey = 333;

        const actual = dt.selectFirst();
        expect(actual.strKey).toEqual('foo');
        expect(actual.boolKey).toBe(true);
        expect(actual.numKey).toBe(222);
    })

    it('can update record using the update function', () => {
        const dt = new DynamicDataStore<TestObj>({
            indicies: ['strKey', 'numKey'],
            records: [
                {strKey: 'foo', boolKey: true, numKey: 1},
                {strKey: 'foo', boolKey: true, numKey: 2},
                {strKey: 'foo', boolKey: true, numKey: 3},
                {strKey: 'foo', boolKey: true, numKey: 4}
            ]
        });
        const count = dt.update({strKey: 'foo', boolKey: false, numKey: 2});

        expect(count).withContext('only one record updated').toEqual(1);
        const updated = dt.selectFirst({strKey: 'foo', numKey: 2});
        expect(updated.boolKey).toBe(false);
        const unchanged = dt.select({boolKey: true});
        expect(unchanged.length).toBe(3);
    })

    it('can update multiple records using the update function', () => {
        const dt = new DynamicDataStore<TestObj>({
            indicies: ['strKey', 'numKey'],
            records: [
                {strKey: 'foo', boolKey: true, numKey: 1},
                {strKey: 'foo', boolKey: false, numKey: 2},
                {strKey: 'foo', boolKey: false, numKey: 3},
                {strKey: 'foo', boolKey: false, numKey: 4}
            ]
        });
        const count = dt.update({boolKey: true}, {numKey: between(2, 3)});

        expect(count).withContext('only two records updated').toBe(2);
        const unchanged = dt.selectFirst({strKey: 'foo', numKey: 4});
        expect(unchanged.boolKey).toBe(false);
        const updated = dt.select({numKey: between(2, 3)});
        expect(updated.length).toBe(2);
        expect(updated.every(c => c.boolKey === true)).toBe(true);
    })

    it('can remove records by query data', () => {
        const dt = new DynamicDataStore<TestObj>({
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

        const deleted = dt.delete({strKey: 'foo', boolKey: true});
        expect(deleted.length).withContext('expected two records removed based on criteria').toBe(2);
        expect(deleted.filter(d => d.numKey === 1).length).toBe(1);

        const remaining = dt.delete({strKey: matching(/(foo|bar)/)});
        expect(remaining.length).toBe(6);
        expect(dt.count()).toBe(0);
    })

    it('can clear all records', () => {
        const dt = new DynamicDataStore<TestObj>({
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

        expect(dt.count()).toBe(8);
        dt.clear();
        expect(dt.count()).toBe(0);
    })

    it('does not allow the indexProperties array to be modified', () => {
        const dt = new DynamicDataStore<TestObj>({
            indicies: ['strKey', 'numKey']
        });

        const indexProps = [...dt.indicies];
        
        expect(indexProps.length).toBe(2);

        dt.indicies.splice(0, 1);

        expect(dt.indicies.length).toBe(2);
        expect(dt.indicies).toEqual(indexProps);
    })
})