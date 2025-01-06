import {SimpleArea} from "@/app/model/area";

export enum CoordinateFeature {
    BLOCKING = 0,
    AREA_ENTRANCE = 1,
    WATER = 2,
    WET = 3,
    TRANSPORT_TARGET = 4,
    MOUNTAIN = 5,
    CASTLE = 6
}

export interface SimpleCoordinate {
    x: number
    y: number
    z: number
}

export interface BasicCoordinate extends SimpleCoordinate {
    char: string;
    color: string | null; // Raw hex color or null for default
}

export interface FullCoordinate extends BasicCoordinate {
    name?: string,
    features?: CoordinateFeature[]
    transports?: Transport[]
    area?: SimpleArea
}

export type AnyCoordinate = SimpleCoordinate | BasicCoordinate | FullCoordinate

export enum CoordinateChangeAction {
    NONE = "NONE",
    ADD = "ADD",
    REMOVE = "REMOVE"
}

export enum CoordinateChangeStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED"
}

export interface Transport {
    targetName: string,
    moveCommand: string
}

export interface CoordinateChange {
    action: CoordinateChangeAction
    coord: BasicCoordinate | FullCoordinate | null
    status: CoordinateChangeStatus
    features?: CoordinateFeature[]
    charChange?: string
    color?: string
    name?: string
    transports?: Transport[]
    area?: SimpleArea
    author?: string
    description?: string
}