import {FullCoordinate, SimpleCoordinate} from "@/app/model/coordinate";

export interface SimpleArea {
    name: string,
    enterCommand?: string,
    exitCommand?: string,
}

export interface Area extends SimpleArea {
    location: SimpleCoordinate,
    coordinates: AreaCoordinate[]
}

export interface PersistedArea extends Area {
    author: string
    timestamp: string
}

export interface Mob {
    name: string,
    desc?: string,
    exp?: number,
    align?: string
    blockDirs?: string[],
    isAggro?: boolean,
}

export interface AreaCoordinate extends FullCoordinate {
    info?: string
    mobs?: Mob[]
    zChanges?: ZChange[]
    exits?: string[]
    doors?: Door[]
    spacialDirs?: SpecialDir[]
}

export interface ZChange {
    dir: "u" | "d"
    count: number
}

export interface SpecialDir {
    alias: string
    equalToNormal: string
}

export interface Door {
    isLocked?: boolean
    dir: string
    keyInfo?: string
}