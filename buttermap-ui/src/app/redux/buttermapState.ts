import mudMap from "@/app/data/enhanced_map.json";


import {ButtermapSettings, MapData, MapMode} from "@/app/model/common";
import {CoordinateChange, FullCoordinate, SimpleCoordinate} from "@/app/model/coordinate";
import {ChangeFile} from "@/app/views/coordinateChangesList";
import {RouteResult} from "@/app/map/mapRoute";


const maxValues: { x: number; y: number } = (mudMap as MapData).coordinates.reduce(
    (acc, coord) => ({
        x: Math.max(acc.x, coord.x),
        y: Math.max(acc.y, coord.y),
    }),
    {x: -Infinity, y: -Infinity} // Initial values
);
export type ButtermapStateFields = {
    coords: FullCoordinate[]
    highlightedCoords: SimpleCoordinate[]
    changes: CoordinateChange[],
    settings: ButtermapSettings
    editModalOpen: boolean
    activeRoute: RouteResult | null
    maxValues: {
        x: number,
        y: number
    }
}

export interface ButtermapState extends ButtermapStateFields {
    activeCoordinate: FullCoordinate | null;
    viewModalOpen: boolean;
    activeChange: ChangeFile | null;
}

export const initialMapState: ButtermapState = {
    coords: (mudMap as MapData).coordinates,
    highlightedCoords: [],
    settings: {
        use3D: true,
        mapMode: MapMode.ROUTE,
        avoidWater: false,
    },
    maxValues: maxValues,
    editModalOpen: false,
    viewModalOpen: false,
    changes: [],
    activeChange: null,
    activeRoute: null,
    activeCoordinate: null
}