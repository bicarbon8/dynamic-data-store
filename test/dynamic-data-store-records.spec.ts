import { DynamicDataStoreRecords, matching } from "../src"

describe('DynamicDataStoreRecords', () => {
    it('can order records by single key acending', () => {
        const records = new DynamicDataStoreRecords([], 
            {name: 'bcd234'},
            {name: 'abc234'},
            {name: 'bcd123'},
            {name: 'abc123'}
        );
        records.orderBy('asc', 'name');

        expect(records.first.name).toEqual('abc123');
        expect(records.last.name).toEqual('bcd234');
        expect(records[1].name).toEqual('abc234');
        expect(records[2].name).toEqual('bcd123');
    })

    it('can order records by single key descending', () => {
        const records = new DynamicDataStoreRecords([], 
            {name: 'bcd234'},
            {name: 'abc234'},
            {name: 'bcd123'},
            {name: 'abc123'}
        );
        records.orderBy('desc', 'name');

        expect(records.first.name).toEqual('bcd234');
        expect(records.last.name).toEqual('abc123');
        expect(records[1].name).toEqual('bcd123');
        expect(records[2].name).toEqual('abc234');
    })

    it('can order records by multiple keys ascending', () => {
        const records = new DynamicDataStoreRecords([],
            {name: 'def', num: 123},
            {name: 'def', num: 234},
            {name: 'bcd', num: 234},
            {name: 'cde', num: 123},
            {name: 'bcd', num: 123},
            {name: 'abc', num: 123}
        );
        records.orderBy('asc', 'name', 'num');

        expect(records.first.name).toEqual('abc');
        expect(records.first.num).toBe(123);
        expect(records.last.name).toEqual('def');
        expect(records.last.num).toBe(234);
    })

    it('orders based on passed in key order', () => {
        const records = new DynamicDataStoreRecords([],
            {name: 'def', num: 123},
            {name: 'def', num: 234},
            {name: 'bcd', num: 234},
            {name: 'cde', num: 123},
            {name: 'bcd', num: 123},
            {name: 'abc', num: 345}
        );
        records.orderBy('asc', 'num', 'name');

        expect(records.first.name).toEqual('bcd');
        expect(records.first.num).toBe(123);
        expect(records.last.name).toEqual('abc');
        expect(records.last.num).toBe(345);
    })

    it('can order objects ascending when no keys specified', () => {
        const records = new DynamicDataStoreRecords([],
            {name: 'def', num: 123},
            {name: 'def', num: 234},
            {name: 'bcd', num: 234},
            {name: 'bcd', num: 234},
            {name: 'cde', num: 123},
            {name: 'bcd', num: 123},
            {name: 'abc', num: 123}
        );
        records.orderBy('asc');

        expect(records.first.name).toEqual('abc');
        expect(records.first.num).toBe(123);
        expect(records.last.name).toEqual('def');
        expect(records.last.num).toBe(234);
    })

    it('can can be queried to create subset of results', () => {
        const records = new DynamicDataStoreRecords([],
            {name: 'def', num: 123},
            {name: 'def', num: 234},
            {name: 'bcd', num: 234},
            {name: 'cde', num: 123},
            {name: 'bcd', num: 123},
            {name: 'abc', num: 123}
        ).select({name: matching(/(bcd|cde)/)});

        expect(records.length).toBe(3);
        expect(records.select({name: 'cde'}).length).toBe(1);
        expect(records.select({name: 'bcd'}).length).toBe(2);
    })
})