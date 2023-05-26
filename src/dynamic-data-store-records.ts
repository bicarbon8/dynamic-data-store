export type Order = 'asc' | 'desc';

export class DynamicDataStoreRecords<T extends {}> {
    public readonly data: Array<T>;
    private readonly _highValueCharacters = '\u9999\u9999\u9999\u9999\u9999\u9999';

    constructor(...inputs: Array<T>) {
        this.data = inputs ?? new Array<T>();
    }

    orderBy(order: Order = 'asc', ...keys: Array<keyof T>): this {
        this.data.sort((a: T, b: T) => {
            let aStr: string = '';
            let bStr: string = '';
            if (keys?.length > 0) {
                for (let key of keys) {
                    aStr += (a?.[key] != null) ? JSON.stringify(a[key]) : this._highValueCharacters;
                    bStr += (b?.[key] != null) ? JSON.stringify(b[key]) : this._highValueCharacters;
                }
            } else {
                aStr = (a != null) ? JSON.stringify(a) : this._highValueCharacters;
                bStr = (b != null) ? JSON.stringify(b) : this._highValueCharacters;
            }
            if (aStr < bStr) {
                if (order === 'asc') {
                    return -1;
                } else {
                    return 1;
                }
            } else if (aStr > bStr) {
                if (order === 'asc') {
                    return 1;
                } else {
                    return -1;
                }
            } else {
                return 0;
            }
        });
        return this;
    }

    count(val: number): T | Array<T> {
        if (val === 0) {
            return undefined;
        }
        if (val === 1) {
            return (this.data.length > 0) ? this.data[0] : undefined;
        }
        if (val > 1 || val < 0) {
            return this.data.slice(0, val);
        }
    }
}