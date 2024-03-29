import { between, containing, endingWith, greaterThan, havingValue, lessThan, matching, not, startingWith } from "../src/value-matcher";

describe('ValueMatcher', () => {
    describe('Between', () => {
        const testData = [
            {min: null, max: null, actual: 0, expected: true, ctx: 'min and max default to -Infinity and Infinity respectively'},
            {min: 0, max: 0, actual: 0, expected: true, ctx: 'actual value can be equal to the min and max bounds'},
            {min: 1, max: 10, actual: 3, expected: true, ctx: 'number between positive min and max'},
            {min: -10, max: -1, actual: -3, expected: true, ctx: 'number between negative min and max'},
            {min: 1, max: 10, actual: 0, expected: false, ctx: 'zero number outside positive min and max bounds'},
            {min: 1, max: 10, actual: -1, expected: false, ctx: 'negative number outside positive min and max bounds'},
            {min: 1, max: 10, actual: 11, expected: false, ctx: 'positive number outside positive min and max bounds'},
            {min: -10, max: -1, actual: 0, expected: false, ctx: 'zero number outside negative min and max bounds'},
            {min: -10, max: -1, actual: 1, expected: false, ctx: 'positive number outside negative min and max bounds'},
            {min: -10, max: -1, actual: -11, expected: false, ctx: 'negative number outside negative min and max bounds'},
            {min: 1, max: 3, actual: ['foo', 'bar'], expected: true, ctx: 'array actual will compare length to min and max for positive case'},
            {min: 3, max: 10, actual: ['foo', 'bar'], expected: false, ctx: 'array actual will compare length to min and max for negative case'},
            {min: 1, max: 3, actual: new Set(['foo', 'bar']), expected: true, ctx: 'Set or Map actual will compare size to min and max for positive case'},
            {min: 3, max: 10, actual: new Set(['foo', 'bar']), expected: false, ctx: 'Set or Map actual will compare size to min and max for negative case'},
            {min: 1, max: 5, actual: '3', expected: true, ctx: 'string actual containing number is compared as number for positive case'},
            {min: 1, max: 5, actual: '-10', expected: false, ctx: 'string actual containing number is compared as number for negative case'},
            {min: 5, max: 15, actual: 'hello world!', expected: true, ctx: 'string actual NOT containing number is compared by length for positive case'},
            {min: 5, max: 7, actual: 'hello world!', expected: false, ctx: 'string actual NOT containing number is compared by length for negative case'},
            {min: 0, max: 1, actual: true, expected: true, ctx: 'boolean actual converted to number for positive case'},
            {min: 1, max: 2, actual: false, expected: false, ctx: 'boolean actual converted to number for negative case'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(between(d.min, d.max).isMatch(d.actual))
                    .withContext(d.ctx)
                    .toBe(d.expected);
            })
        })
    })

    describe('GreaterThan', () => {
        const testData = [
            {min: null, actual: 0, expected: true, ctx: 'min defaults to -Infinity'},
            {min: 0, actual: 0, expected: false, ctx: 'actual value can NOT be equal to min'},
            {min: 1, actual: 3, expected: true, ctx: 'number greater than positive min'},
            {min: -10, actual: -3, expected: true, ctx: 'number greater than negative min'},
            {min: 1, actual: 0, expected: false, ctx: 'zero number less than positive min'},
            {min: 1, actual: -1, expected: false, ctx: 'negative number less than positive min'},
            {min: 11, actual: 1, expected: false, ctx: 'positive number less than positive min'},
            {min: -10, actual: 0, expected: true, ctx: 'zero number greater than negative min'},
            {min: -10, actual: 1, expected: true, ctx: 'positive number greater than negative min'},
            {min: -10, actual: -11, expected: false, ctx: 'negative number less than negative min'},
            {min: 1, actual: ['foo', 'bar'], expected: true, ctx: 'array actual will compare length to min for positive case'},
            {min: 3, actual: ['foo', 'bar'], expected: false, ctx: 'array actual will compare length to min for negative case'},
            {min: 1, actual: new Set(['foo', 'bar']), expected: true, ctx: 'Set or Map actual will compare size to min for positive case'},
            {min: 3, actual: new Set(['foo', 'bar']), expected: false, ctx: 'Set or Map actual will compare size to min for negative case'},
            {min: 1, actual: '3', expected: true, ctx: 'string actual containing number is compared as number for positive case'},
            {min: 1, actual: '-10', expected: false, ctx: 'string actual containing number is compared as number for negative case'},
            {min: 5, actual: 'hello world!', expected: true, ctx: 'string actual NOT containing number is compared by length for positive case'},
            {min: 20, actual: 'hello world!', expected: false, ctx: 'string actual NOT containing number is compared by length for negative case'},
            {min: 0, actual: true, expected: true, ctx: 'boolean actual converted to number for positive case'},
            {min: 1, actual: false, expected: false, ctx: 'boolean actual converted to number for negative case'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(greaterThan(d.min).isMatch(d.actual))
                    .withContext(d.ctx)
                    .toBe(d.expected);
            })
        })
    })

    describe('LessThan', () => {
        const testData = [
            {max: null, actual: 0, expected: true, ctx: 'max defaults to Infinity'},
            {max: 0, actual: 0, expected: false, ctx: 'actual value can NOT be equal to max'},
            {max: 3, actual: 1, expected: true, ctx: 'number less than positive max'},
            {max: -3, actual: -10, expected: true, ctx: 'number less than negative max'},
            {max: 1, actual: 0, expected: true, ctx: 'zero number less than positive max'},
            {max: 1, actual: -1, expected: true, ctx: 'negative number less than positive max'},
            {max: 1, actual: 11, expected: false, ctx: 'positive number greater than positive max'},
            {max: -10, actual: 0, expected: false, ctx: 'zero number greater than negative max'},
            {max: -10, actual: 1, expected: false, ctx: 'positive number greater than negative max'},
            {max: -10, actual: -3, expected: false, ctx: 'negative number greater than negative max'},
            {max: 3, actual: ['foo', 'bar'], expected: true, ctx: 'array actual will compare length to max for positive case'},
            {max: 1, actual: ['foo', 'bar'], expected: false, ctx: 'array actual will compare length to max for negative case'},
            {max: 3, actual: new Set(['foo', 'bar']), expected: true, ctx: 'Set or Map actual will compare size to max for positive case'},
            {max: 1, actual: new Set(['foo', 'bar']), expected: false, ctx: 'Set or Map actual will compare size to max for negative case'},
            {max: 4, actual: '3', expected: true, ctx: 'string actual containing number is compared as number for positive case'},
            {max: -11, actual: '-10', expected: false, ctx: 'string actual containing number is compared as number for negative case'},
            {max: 20, actual: 'hello world!', expected: true, ctx: 'string actual NOT containing number is compared by length for positive case'},
            {max: 5, actual: 'hello world!', expected: false, ctx: 'string actual NOT containing number is compared by length for negative case'},
            {max: 2, actual: true, expected: true, ctx: 'boolean actual converted to number for positive case'},
            {max: 0, actual: false, expected: false, ctx: 'boolean actual converted to number for negative case'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(lessThan(d.max).isMatch(d.actual))
                    .withContext(d.ctx)
                    .toBe(d.expected);
            })
        })
    })

    describe('Containing', () => {
        const testData = [
            {input: null, actual: 'abc123', expected: true, ctx: 'null input defaults to empty string comparison'},
            {input: 42, actual: '1234221', expected: true, ctx: 'numeric input and string actual looks for actual number sequence'},
            {input: 42, actual: '1234', expected: false, ctx: 'numeric input and string actual does not check if input can fit inside actual'},
            {input: 42, actual: 1234, expected: true, ctx: 'numeric input and actual checks if input can fit inside actual'},
            {input: 42, actual: [42, 24], expected: true, ctx: 'numeric input and array actual positive case'},
            {input: 42, actual: [12, 23], expected: false, ctx: 'numeric input and array actual negative case'},
            {input: 'foo', actual: {bar: false, baz: {bar: 'foo'}}, expected: true, ctx: 'object actual with nested match'},
            {input: [42, 24], actual: [12, 42, 24, 99], expected: true, ctx: 'array input and array actual checks that all input values exist for positive case'},
            {input: [42], actual: [12, 24], expected: false, ctx: 'array input and array actual checks that all input values exist for negative case'},
            {input: ['foo', 'bar'], actual: 'foobarbaz', expected: true, ctx: 'array input and string actual checks that all input values exist for positive case'},
            {input: ['foo', 'bar'], actual: 'barbaz', expected: false, ctx: 'array input and string actual checks that all input values exist for negative case'},
            {input: 'foo', actual: new Set(['foo', 'bar']), expected: true, ctx: 'string input and Set or Map actual checks that input exists as value in actual for positive case'},
            {input: 'foo', actual: new Set(['bar', 'baz']), expected: false, ctx: 'string input and Set or Map actual checks that input exists as value in actual for negative case'},
            {input: ['foo', 'bar'], actual: new Set(['foo', 'bar']), expected: true, ctx: 'array input and Set or Map actual checks that each value in input exists as value in actual for positive case'},
            {input: ['foo', 'bar'], actual: new Set(['bar', 'baz']), expected: false, ctx: 'array input and Set or Map actual checks that each value in input exists as value in actual for negative case'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(containing(d.input).isMatch(d.actual)).withContext(d.ctx).toBe(d.expected);
            })
        })
    })

    describe('Matching', () => {
        const testData = [
            {input: null, actual: 'abc123', expected: true, ctx: 'null input defaults to match all'},
            {input: /[0-9]+/, actual: 42, expected: true, ctx: 'works with numeric actual for positive case'},
            {input: /[0-3]+/, actual: 45, expected: false, ctx: 'works with numeric actual for negative case'},
            {input: /(T|t)(rue)/, actual: true, expected: true, ctx: 'works with boolean actual'},
            {input: /(hello)/, actual: 'hello world', expected: true, ctx: 'works with string actual for positive case'},
            {input: /(hello)/, actual: 'hell world', expected: false, ctx: 'works with string actual for negative case'},
            {input: /(a|b|c)/, actual: ['a', 'b', 'c'], expected: true, ctx: 'works with array actual for positive case'},
            {input: /(d|e|f)/, actual: ['a', 'b', 'c'], expected: false, ctx: 'works with array actual for negative case'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(matching(d.input).isMatch(d.actual)).withContext(d.ctx).toBe(d.expected);
            })
        })
    })

    describe('StartingWith', () => {
        const testData = [
            {start: null, actual: 'abc123', expected: true, ctx: 'null start defaults to empty string'},
            {start: 'abc', actual: 'abc123', expected: true, ctx: 'string start and string actual positive case'},
            {start: '123', actual: 'abc123', expected: false, ctx: 'string start and string actual negative case'},
            {start: 123, actual: '123abc', expected: true, ctx: 'number start and string actual positive case'},
            {start: 123, actual: 'abc123', expected: false, ctx: 'number start and string actual negative case'},
            {start: true, actual: 'true123', expected: true, ctx: 'boolean start and string actual positive case'},
            {start: true, actual: '123true', expected: false, ctx: 'boolean start and string actual negative case'},
            {start: 'foo', actual: ['foo', 'bar', 'baz'], expected: true, ctx: 'string start and array actual positive case'},
            {start: 'bar', actual: ['foo', 'bar', 'baz'], expected: false, ctx: 'string start and array actual negative case'},
            {start: '42', actual: [42, 24, 12], expected: false, ctx: 'numeric string start will not match with numeric array actual'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(startingWith(d.start).isMatch(d.actual)).withContext(d.ctx).toBe(d.expected);
            })
        })
    })

    describe('EndingWith', () => {
        const testData = [
            {end: null, actual: 'abc123', expected: true, ctx: 'null end defaults to empty string'},
            {end: '123', actual: 'abc123', expected: true, ctx: 'string end and string actual positive case'},
            {end: 'abc', actual: 'abc123', expected: false, ctx: 'string end and string actual negative case'},
            {end: 123, actual: 'abc123', expected: true, ctx: 'number end and string actual positive case'},
            {end: 123, actual: '123abc', expected: false, ctx: 'number end and string actual negative case'},
            {end: true, actual: '123true', expected: true, ctx: 'boolean end and string actual positive case'},
            {end: true, actual: 'true123', expected: false, ctx: 'boolean end and string actual negative case'},
            {end: 'baz', actual: ['foo', 'bar', 'baz'], expected: true, ctx: 'string end and array actual positive case'},
            {end: 'bar', actual: ['foo', 'bar', 'baz'], expected: false, ctx: 'string end and array actual negative case'},
            {end: '12', actual: [42, 24, 12], expected: false, ctx: 'numeric string end will not match with numeric array actual'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(endingWith(d.end).isMatch(d.actual)).withContext(d.ctx).toBe(d.expected);
            })
        })
    })

    describe('HavingValue', () => {
        const testData = [
            {actual: null, expected: false, ctx: 'null actual results in false'},
            {actual: undefined, expected: false, ctx: 'undefined actual results in false'},
            {actual: false, expected: true, ctx: 'false actual results in true'},
            {actual: 0, expected: true, ctx: '0 actual results in true'},
            {actual: '', expected: true, ctx: 'empty string actual results in true'},
            {actual: {}, expected: true, ctx: 'empty object actual results in true'},
            {actual: () => null, expected: true, ctx: 'function actual returning null results in true'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(havingValue().isMatch(d.actual)).withContext(d.ctx).toBe(d.expected);
            })
        })
    })

    describe('Not', () => {
        const testData = [
            {matcher: between(3, 5), actual: 7, expected: true, ctx: 'between 3 and 5 with 7 actual results in true'},
            {matcher: containing(42), actual: [12, 24], expected: true, ctx: 'containing 42 with [12, 24] actual results in true'},
            {matcher: havingValue(), actual: null, expected: true, ctx: 'havingValue with null actual results in true'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(not(d.matcher).isMatch(d.actual)).withContext(d.ctx).toBe(d.expected);
            })
        })
    })
})