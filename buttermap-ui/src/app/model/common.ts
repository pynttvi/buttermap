import {FullCoordinate, PersistedCoordinateChange} from "@/app/model/coordinate";
import {PersistedArea} from "@/app/model/area";

export interface MapData {
    coordinates: FullCoordinate[];
}

export enum MapMode {
    ROUTE = "ROUTE",
    EDIT = "EDIT",
}

export interface ButtermapSettings {
    avoidWater: boolean;
    use3D: boolean
    mapMode: MapMode
}

export interface PersistedData {
    changes: PersistedCoordinateChange[]
    areas: PersistedArea[]
}