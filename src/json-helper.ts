export type MapJson = {
    dataType: 'Map';
    value: Array<any>;
};
export type SetJson = {
    dataType: 'Set';
    value: Array<any>;
};

export module JsonHelper {
    export const replacer = (key: unknown, val: unknown): unknown => {
        if (val instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(val.entries())
            } as MapJson;
        }
        if (val instanceof Set) {
            return {
                dataType: 'Set',
                value: Array.from(val.entries())
            } as SetJson;
        }
        return val;
    }
    export const reviver = (key: unknown, val: unknown): any => {
        if (typeof val === 'object' && val !== null) {
            if ((val as MapJson)?.dataType === 'Map') {
                return new Map((val as MapJson).value);
            }
            if ((val as SetJson)?.dataType === 'Set') {
                return new Set((val as SetJson).value);
            }
        }
        return val;
    }
}