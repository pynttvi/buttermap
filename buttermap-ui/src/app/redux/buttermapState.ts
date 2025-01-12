import mudMap from "@/app/data/enhanced_map.json";
import {ButtermapSettings, MapData, MapMode} from "@/app/model/common";
import {CoordinateChange, FullCoordinate, SimpleCoordinate} from "@/app/model/coordinate";
import {ChangeFile} from "@/app/views/updatesList";
import {RouteResult} from "@/app/map/mapRoute";
import {Toast} from "@/app/redux/buttermapReducer";
import {Area} from "@/app/model/area";
import {PersistedData} from "@/app/service/common";

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
    },
    toasts: Toast[]
}

export interface ButtermapState extends ButtermapStateFields {
    activeCoordinate: FullCoordinate | null;
    viewModalOpen: boolean;
    areaModalOpen: boolean;
    activeArea: Area | undefined | null;
    activeChange: ChangeFile | null;
    isLogged: boolean
    persistedData: PersistedData | null
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
    areaModalOpen: false,
    changes: [],
    activeChange: null,
    activeRoute: null,
    activeCoordinate: null,
    activeArea: null,
    toasts: [],
    isLogged: false,
    persistedData: null
}