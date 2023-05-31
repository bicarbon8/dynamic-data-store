export type MapJson = {
    dataType: 'Map';
    value: Array<any>;
};
export type SetJson = {
    dataType: 'Set';
    value: Array<any>;
};

/**
 * module used by `DynamicDataStore` to allow JSON serialisation and 
 * deserialisation of `Map` and `Set` objects which typically are not
 * supported by `JSON.stringify` and `JSON.parse` functions
 */
export module JsonHelper {
    /**
     * a JSON.stringify replacer function that can serialise `Map` and `Set`
     * objects such that they can be deserialised using the `JsonHelper.reviver`
     */
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
    /**
     * a JSON.parse reviver function that can deserialise `Map` and `Set`
     * objects that were serialised using the `JsonHelper.replacer`
     */
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