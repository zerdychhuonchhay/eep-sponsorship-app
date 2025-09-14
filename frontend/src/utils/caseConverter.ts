

const snakeToCamel = (str: string) => str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));

const camelToSnake = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const convertKeys = (obj: any, converter: (key: string) => string): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => convertKeys(v, converter));
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        // Handle special cases like File objects which should not be converted
        if (obj instanceof File) {
            return obj;
        }
        return Object.keys(obj).reduce((result, key) => {
            result[converter(key)] = convertKeys(obj[key], converter);
            return result;
        }, {} as { [key: string]: any });
    }
    return obj;
};

export const convertKeysToCamel = (obj: any) => convertKeys(obj, snakeToCamel);
export const convertKeysToSnake = (obj: any) => convertKeys(obj, camelToSnake);