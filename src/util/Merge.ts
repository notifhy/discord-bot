/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */

//Taken from https://github.com/voodoocreation/ts-deepmerge because their implementation didn't support object in arrays the way I needed it

interface IObject {
    [key: string]: any;
}

type TUnionToIntersection<U> = (
    U extends any ? (k: U) => void : never
) extends (k: infer I) => void
    ? I
    : never;

// istanbul ignore next
const isObject = (obj: any) => {
    if (typeof obj === 'object' && obj !== null) {
        if (typeof Object.getPrototypeOf === 'function') {
            const prototype = Object.getPrototypeOf(obj);
            return prototype === Object.prototype || prototype === null;
        }

        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    return false;
};

export function merge<T extends IObject[]>(
    ...objects: T
): TUnionToIntersection<T[number]> {
    return objects.reduce((result, current) => {
        Object.keys(current).forEach(key => {
            if (Array.isArray(result[key]) && Array.isArray(current[key])) {
                for (let i = 0; i < result[key].length; i += 1) {
                    if (isObject(result[key]?.[i]) && isObject(current[key]?.[i])) {
                        Object.assign(result[key][i], current[key][i]);
                    } else {
                        Array.from(new Set(result[key].concat(current[key])));
                    }
                }
            } else if (isObject(result[key]) && isObject(current[key])) {
                result[key] = merge(result[key], current[key]);
            } else {
                result[key] = current[key];
            }
        });

        return result;
    }, {}) as any;
}
