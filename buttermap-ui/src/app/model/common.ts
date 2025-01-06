import {FullCoordinate} from "@/app/model/coordinate";

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