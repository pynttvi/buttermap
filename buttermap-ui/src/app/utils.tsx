'use client'

export function capitalizeFirstChar(str: string): string {
    if (!str) return ""; // Handle empty strings
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getEnumValue<T extends Record<string, number | string>>(
    enumObj: T,
    key: keyof T
): T[keyof T] {
    if (key in enumObj) {
        return enumObj[key];
    }
    throw new Error(`Enum value not found for key: ${key.toString()}`);
}

export function deepEqual<T>(obj1: T, obj2: T): boolean {
    if (obj1 === obj2) return true;

    if (
        typeof obj1 !== 'object' ||
        obj1 === null ||
        typeof obj2 !== 'object' ||
        obj2 === null
    ) {
        return false;
    }

    const keys1 = Object.keys(obj1) as Array<keyof T>;
    const keys2 = Object.keys(obj2) as Array<keyof T>;

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

export type MatchesPattern<T extends string, Pattern extends string> = T & { __pattern: Pattern };

export function matchesPattern<T extends string, Pattern extends string>(
    value: T,
    regex: RegExp,
    pattern: Pattern
): MatchesPattern<T, Pattern> {
    if (!regex.test(value)) {
        throw new Error(`Value "${value}" does not match pattern: ${pattern}`);
    }
    return value as MatchesPattern<T, Pattern>;
}


interface Serializable<T> {
    toJSON(): T;

    fromJSON(obj: T): this;
}

export class MultipartCommand {
    static readonly multipartCommandRegex = /^((n|ne|e|se|s|sw|w|nw|u|d)(;(n|ne|e|se|s|sw|w|nw|u|d))*)$/;

    private readonly value: MatchesPattern<string, "multipartCommand">;

    constructor(value: string) {
        if (!MultipartCommand.multipartCommandRegex.test(value)) {
            throw new Error(`Value "${value}" does not match the multipart command pattern`);
        }
        this.value = matchesPattern(value, MultipartCommand.multipartCommandRegex, "multipartCommand");
    }


    toString(): string {
        return this.value.toString();
    }
}


export const downloadJson = (jsonString: string, fileName: string) => {
    const blob = new Blob([jsonString], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const copyTextToClipboard = async (text: string) => {
    document.createElement("textarea");
    await navigator.clipboard.writeText(text);
};

export const createRandomId = () => {
    return Math.random().toString(36).substr(2, 9);
}

export type Auth = { username: string, token: string }
export const getAuth = () => {
    let auth: Auth | null = null

    if (localStorage.getItem("auth")) {
        auth = JSON.parse(localStorage.getItem("auth") ?? "") as unknown as Auth || {username: "", token: ""}

    }
    return auth
}

