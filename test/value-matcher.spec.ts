import { between, containing, greaterThan, matching } from "../src/value-matcher";

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
            {input: ['foo', 'bar'], actual: 'barbaz', expected: false, ctx: 'array input and string actual checks that all input values exist for negative case'}
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
            {input: /[0-9]+/, actual: 42, expected: true, ctx: 'works with numeric actual'},
            {input: /(T|t)(rue)/, actual: true, expected: true, ctx: 'works with boolean actual'},
            {input: /(hello)/, actual: 'hello world', expected: true, ctx: 'works with string actual'},
            {input: /(a|b|c)/, actual: ['a', 'b', 'c'], expected: true, ctx: 'works with array actual'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(matching(d.input).isMatch(d.actual)).withContext(d.ctx).toBe(d.expected);
            })
        })
    })
})