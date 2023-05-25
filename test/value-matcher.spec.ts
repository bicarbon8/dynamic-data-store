import { between, containing, matching } from "../src/value-matcher";

describe('ValueMatcher', () => {
    describe('NumberBetween', () => {
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
            {min: -10, max: -1, actual: -11, expected: false, ctx: 'negative number outside negative min and max bounds'}
        ];
        testData.forEach(d => {
            it(`returns the correct result for: ${JSON.stringify(d)}`, () => {
                expect(between(d.min, d.max).isMatch(d.actual))
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
            {input: 'foo', actual: {bar: false, baz: {bar: 'foo'}}, expected: true, ctx: 'object actual with nested match'}
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