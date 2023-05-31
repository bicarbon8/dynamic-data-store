import { Query } from "../src";

type TestClassOptions = {
    strKey?: string;
    boolKey?: boolean;
    numKey?: number;
}
class TestClass {
    private readonly _strKey: string;
    private readonly _boolKey: boolean;
    private readonly _numKey: number;
    constructor(options: TestClassOptions) {
        this._strKey = options.strKey;
        this._boolKey = options.boolKey;
        this._numKey = options.numKey;
    }
    get strKey(): string { return this._strKey; }
    get boolKey(): boolean { return this._boolKey; }
    get numKey(): number { return this._numKey; }
    getOptions(): TestClassOptions {
        return {strKey: this._strKey,boolKey: this._boolKey,numKey: this._numKey};
    }
}

describe('Query', () => {
    describe('filterBy', () => {
        it('allows queries to filter class objects', () => {
            const testClassArray = [
                new TestClass({strKey: 'foo', boolKey: true, numKey: 1}),
                new TestClass({strKey: 'foo', boolKey: false, numKey: 2}),
                new TestClass({strKey: 'foo', boolKey: false, numKey: 1}),
                new TestClass({strKey: 'foo', boolKey: true, numKey: 2}),
                new TestClass({strKey: 'bar', boolKey: true, numKey: 1}),
                new TestClass({strKey: 'bar', boolKey: false, numKey: 2}),
                new TestClass({strKey: 'bar', boolKey: false, numKey: 1}),
                new TestClass({strKey: 'bar', boolKey: true, numKey: 2})
            ];
            const results = Query.filterBy<TestClass>({strKey: 'foo', boolKey: true}, ...testClassArray);
            expect(results.length).toBe(2);
            expect(results[0].getOptions().strKey).withContext('ensure function still works').toEqual('foo');
        })
    })
})