function isObject(value: unknown): value is Record<string, unknown> {
    const type = Object.prototype.toString.call(value as string);
    return type === '[object Object]';
}

export function deepMerge<
    Target extends Record<string, unknown>,
    Value extends Record<string, unknown>
>(target: Target, object: Value) {
    const keys = Object.keys(target).concat(Object.keys(object));

    for (const key of keys) {
        if (
            Array.isArray(target[key]) &&
            Array.isArray(object[key])
        ) {
            const targetKeys = Object.keys(target[key] as unknown[]);
            const objectKeys = Object.keys(object[key] as unknown[]);

            for (
                let i = 0;
                i < Math.max(targetKeys.length, objectKeys.length);
                i += 1
            ) {
                if (
                    isObject((target[key] as unknown[])?.[i]) &&
                    isObject((object[key] as unknown[])?.[i])
                ) {
                    Object.assign(
                        (target[key] as unknown[])[i],
                        (object[key] as unknown[])[i],
                    );
                }
            }
        } else if (
            isObject(target[key]) &&
            isObject(object[key])
        ) {
            deepMerge(
                target[key] as Record<string, unknown>,
                object[key] as Record<string, unknown>,
            );
        } else if (
            object[key] !== undefined &&
            target[key] === undefined
        ) {
            Object.assign(
                target,
                { [key]: object[key] },
            );
        }
    }

    return target;
}