export function capitalizeFirstChar(str: string): string {
    if (!str) return ""; // Handle empty strings
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getEnumValue(enumObj: any, key: string): number {
    if (key in enumObj) {
        return enumObj[key];
    }
    throw new Error(`Enum value not found ${key}`)
}

export function deepEqual(obj1: any, obj2: any) {
    if (obj1 === obj2) return true;

    if (
        typeof obj1 !== 'object' ||
        obj1 === null ||
        typeof obj2 !== 'object' ||
        obj2 === null
    ) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}