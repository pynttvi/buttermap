'use client'
import Item from "@/app/components/item";
import ToggleButton from "@/app/components/toggleButton";
import RadioButtonGroup from "@/app/components/radioButtonGroup";
import {MapMode} from "@/app/model/common";
import LabeledButton from "@/app/components/labelledButton";
import UpdatesList from "@/app/views/updatesList";
import React, {useCallback, useMemo} from "react";
import {
    addToast,
    removeToast,
    resetState,
    setActiveCoordinate,
    setActiveRoute,
    setActiveTour,
    setAreaModalOpen,
    setAvoidWater,
    setEditModalOpen,
    setHighlightedCoords,
    setIsLogged,
    setMode,
    setUse3D,
    setViewModalOpen,
    showToast,
    useAppDispatch,
    useAppSelector
} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import {AnyCoordinate, CoordinateFeature, FullCoordinate, SimpleCoordinate} from "@/app/model/coordinate";
import {OptimizedRouteGenerator, RouteOptions} from "@/app/map/mapRoute";
import {copyTextToClipboard, createRandomId, deepEqual, getAuth} from "@/app/utils";
import Spacer from "@/app/components/spacer";
import Accordion from "@/app/components/accordion";
import LoginComponent from "@/app/views/login";
import tourIndex from "@/app/data/tour_index.json";


const toSimpleCoordinates = (coords: [number, number][]) => {
    return coords.map((c) => ({x: c[0], y: c[1], z: 0}))
}

const modeOptions: { name: string, value: string }[] = Object.entries(MapMode).map((mm) => ({
    name: mm[1],
    value: mm[0]
}))


export interface TourEntry {
    name: string;      // e.g., "Continent1"
    file: string;      // e.g., "mass_1_north-92_east-350_south-102_west-335.json"
    path: string;      // e.g., "continent/mass_1_north-92_east-350_south-102_west-335.json"
    x: number;         // starting x coordinate
    y: number;         // starting y coordinate
}

export interface TourIndex {
    tour: TourEntry[];
}

export interface TourRoute {
    name: string;          // e.g., "north:46, east:62, south:49, west:59"
    type: "continent" | "mountain" | "island";  // restrict to known types
    dirs: string;          // semicolon-separated directions, e.g. "nw;2 e;se"
    coordinates: [number, number][];  // list of [x, y] points
}

export interface FullTourRoute {
    name: string;
    type: "continent" | "mountain" | "island";
    dirs: string;
    coordinates: FullCoordinate[]
    startDirs: string,
    backDirs: string,
}

const indexData: TourIndex = tourIndex as unknown as TourIndex
console.log(indexData, "IDDATA")


export const Controls: React.FC = () => {
    const dispatch = useAppDispatch(); // Dispatch actions

    const isLogged = useAppSelector((state: ButtermapState) => state.isLogged, shallowEqual);
    const settings = useAppSelector((state: ButtermapState) => state.settings, shallowEqual);
    const activeChange = useAppSelector((state: ButtermapState) => state.settings.avoidWater, shallowEqual);
    const activeRoute = useAppSelector((state: ButtermapState) => state.activeRoute, deepEqual);
    const coords = useAppSelector((state: ButtermapState) => state.coords, shallowEqual);
    const changes = useAppSelector((state: ButtermapState) => state.changes, shallowEqual);
    const activeCoordinate = useAppSelector((state: ButtermapState) => state.activeCoordinate, shallowEqual);
    const highlightedCoords = useAppSelector((state: ButtermapState) => state.highlightedCoords, deepEqual);
    const maxValues = useAppSelector((state: ButtermapState) => state.maxValues, shallowEqual);
    const activeTour = useAppSelector((state: ButtermapState) => state.activeTour, deepEqual);


    const openEditModal = useCallback(() => {
        dispatch(setEditModalOpen(true));
    }, [dispatch])

    const openAreaModal = useCallback(() => {
        dispatch(setAreaModalOpen(true));
    }, [dispatch])

    const getFullCoordinate = (coord: SimpleCoordinate): FullCoordinate | null => {
        return coords.find((fc) => fc.x === coord.x && fc.y === coord.y) ?? null
    }

    const getStartCoordinate = (): FullCoordinate | null => {
        return coords.find((fc) => fc.x === 119 && fc.y === 55) ?? null
    }

    const fetchTourRoute = async (path: string) => {
        const res = await fetch(`/tours/${path}`);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        return res.json();
    };


    const getTour = useCallback(async (coordinate: SimpleCoordinate) => {

        const file = indexData.tour.find(t => t.x === coordinate.x && t.y === coordinate.y)?.path;

        if (!file) {
            console.log("Tour file not found for this coordinate");
            return;
        }

        try {
            dispatch(showToast({
                type: "success",
                message: "Generating routes"
            }))

            const tourData: TourRoute = await fetchTourRoute(file);  // Load JSON route from the indexed path
            if (!tourData?.coordinates?.length) {
                throw new Error("No coordinates in route file");
            }
            if (!tourData) {
                console.log("Tour file not found for this coordinate");
                return;
            }
            const start = getStartCoordinate();

            if (start) {
                const fullCoords = toSimpleCoordinates(tourData.coordinates).map((sc) => findFullCoord(sc))
                const first = fullCoords[0]
                const last = fullCoords[fullCoords.length - 1]
                const toCoords = await doCalculateRoute(start, first, {avoidFeatures: [CoordinateFeature.BLOCKING], useTransports: false})
                const fromCoords = await doCalculateRoute(last, start, {avoidFeatures: [CoordinateFeature.BLOCKING], useTransports: false})
                console.log("SETTING ACTIVE TOUR")
                dispatch(setActiveTour({
                    backDirs: fromCoords?.directions + ";9 e" || "error",
                    dirs: tourData.dirs,
                    name: tourData.name,
                    startDirs: "9 w;" + toCoords?.directions || "error",
                    type: tourData?.type || "continent",
                    coordinates: fullCoords
                }))
            }

            return tourData

        } catch (err) {
            console.log(`Failed to load tour index`);
            console.error(err);
        }
        return null

    }, [activeRoute, dispatch]);

    const viewTour = useCallback(async (coordinate: SimpleCoordinate) => {

        const tour = await getTour(coordinate)
        if (tour) {
            dispatch(setHighlightedCoords(toSimpleCoordinates(tour.coordinates)));
        } else {
            console.log("No tour")
        }

    }, [dispatch]);

    const openTour = useCallback(async (coordinate: SimpleCoordinate) => {
        const tourStart = getFullCoordinate(coordinate)
        const ninewest = getStartCoordinate();

        if (!tourStart || !ninewest) {
            console.log("Full coordinate found for this coordinate");
            return;
        }
        dispatch(setViewModalOpen(true))

        const tour = await getTour(coordinate)

        if (tour) {
            dispatch(setActiveCoordinate(tourStart));
            dispatch(setHighlightedCoords(toSimpleCoordinates(tour.coordinates)));

        } else {
            console.log("No tour")
        }
        console.log("Tour", tourStart, ninewest)


    }, [highlightedCoords])

    const copyToClipboard = useCallback((text: string) => {
        copyTextToClipboard(text).then(() => {
            const id = createRandomId()
            dispatch(addToast({id: id, message: "Copied to clipboard", type: "info"}))
            setTimeout(() => {
                dispatch(removeToast(id))
            }, 2000)
        })
    }, [dispatch])


    const calculateRoute = useCallback(async (options: RouteOptions) => {
        const start = highlightedCoords[0]
        const end = highlightedCoords[1]
        if (start || end) {
            const route = await doCalculateRoute(start, end, options);
            if (route) {
                dispatch(setActiveRoute(route))
            }
        }

    }, [highlightedCoords, activeTour])

    const doCalculateRoute = useCallback(async (start: SimpleCoordinate, end: SimpleCoordinate, options: RouteOptions) => {

        if (start || end) {
            console.log("Generating route")
            const avoidFeatures = [CoordinateFeature.MOUNTAIN, CoordinateFeature.BLOCKING]
            if (settings.avoidWater) {
                avoidFeatures.push(CoordinateFeature.WATER)
            }
            const route = routeGenerator.generateRoute(
                findFullCoord(start),
                findFullCoord(end),
                options
            )
            route.routeBack = routeGenerator.generateRoute(
                findFullCoord(end),
                findFullCoord(start)
            )

            return route
        }
        return null
    }, [highlightedCoords, activeTour])

    const reset = async () => {
        dispatch(resetState())
    }
    const viewCoordinate = async () => {
        dispatch(setViewModalOpen(true))
    }


    const routeGenerator = useMemo(() => {
        return new OptimizedRouteGenerator(coords, maxValues.x, maxValues.y)
    }, [coords, maxValues])

    const findFullCoord = (coordinate: AnyCoordinate) => {
        const fullerCoord = coords.find(
            (c: FullCoordinate) => c.x === coordinate.x && c.y === coordinate.y && c.z === coordinate.z
        );
        if (!fullerCoord) {
            throw new Error("Full coord not found")
        }
        return fullerCoord
    }

    const handleUse3D = useCallback((use3d: boolean) => {
        dispatch(setUse3D(use3d));
    }, [dispatch])
    const handleAvoidVater = useCallback((use3d: boolean) => {
        dispatch(setAvoidWater(use3d));
    }, [dispatch])
    const handleMode = useCallback((mapMode: string) => {
        console.log(mapMode)
        dispatch(setMode(mapMode as MapMode));
    }, [dispatch])
    const logout = useCallback(() => {
        localStorage.removeItem("auth")
        dispatch(setIsLogged(false))
    }, [dispatch])


    const topAccordionItems = useMemo(() => [
        {
            title: isLogged ? getAuth()?.username ?? null : "Login",
            content: (
                <>
                    {!isLogged &&
                        <LoginComponent/>
                    }
                    {isLogged &&
                        <a className={`text-amber-700 self-end`} onClick={logout}>Logout</a>
                    }
                </>
            )

        }
    ], [isLogged, logout])

    const accordionItems = useMemo(() => [
        {
            title: "Tours",
            content:
                <>
                    {
                        indexData?.tour?.map((tourStart, idx) => (
                                <Item key={`tour-` + idx}><a onClick={() => openTour({
                                    x: tourStart.x,
                                    y: tourStart.y,
                                    z: 0
                                })}>Tour-{idx}</a>
                                    <a className={`text-emerald-700 ml-1 mr-1 size-0.5`}
                                       onClick={() => openTour({
                                           x: tourStart.x,
                                           y: tourStart.y,
                                           z: 0
                                       })}>open</a>
                                    <a className={`text-amber-700 justify-end self-end size-0.5`}
                                       onClick={() => viewTour({
                                           x: tourStart.x,
                                           y: tourStart.y,
                                           z: 0
                                       })}>view</a></Item>
                            )
                        )
                    }
                </>
        }
    ], [indexData, coords])

    return <div className={"w-full"}>
        <Item>
            <Accordion items={topAccordionItems}/>
        </Item>

        <Item>
            <ToggleButton label={"Use 3D"} key={"3D"} state={settings.use3D} setState={handleUse3D}/>
        </Item>

        <Item>
            <RadioButtonGroup
                label={"Mode"}
                selectedOption={settings.mapMode}
                setSelectedOption={handleMode}
                options={modeOptions}
            />
        </Item>
        {settings.mapMode === MapMode.ROUTE && (
            <Item>
                <ToggleButton label={"Avoid water"} state={settings.avoidWater} setState={handleAvoidVater}/>
            </Item>
        )}

        <Item>
            {highlightedCoords && highlightedCoords.length === 2 && settings.mapMode === MapMode.ROUTE && (
                <>
                    <LabeledButton buttonText={"Route"} onClicked={calculateRoute}/>
                </>
            )}
            {highlightedCoords && highlightedCoords.length > 0 && settings.mapMode === MapMode.EDIT && (
                <LabeledButton buttonText={"Edit"} onClicked={openEditModal}/>
            )}
            {activeRoute && (
                <Item>
                    <LabeledButton
                        color={'green'}
                        buttonText={"Copy dir"}
                        onClicked={() => copyToClipboard(activeRoute?.directions)}/>
                    <Spacer/>
                    <LabeledButton
                        color={'green'}
                        buttonText={"Copy dir back"}
                        onClicked={() => copyToClipboard(activeRoute?.routeBack?.directions ?? "")}/>
                </Item>
            )}
        </Item>
        {activeCoordinate && (
            <Item>
                <LabeledButton color={'blue'} buttonText={"View"} onClicked={viewCoordinate}/>
            </Item>
        )}
        {((highlightedCoords && highlightedCoords.length > 0) || activeChange !== null || activeRoute !== null) && (
            <Item>
                <LabeledButton color={'yellow'} buttonText={"Reset"} onClicked={reset}/>
            </Item>
        )}


        <Item>
            <UpdatesList/>
        </Item>


        {highlightedCoords && highlightedCoords.length === 1 && settings.mapMode === MapMode.EDIT && (
            <Item>
                <LabeledButton color={'green'} buttonText={"Add area"} onClicked={openAreaModal}/>
            </Item>
        )}

        <Item>
            <Accordion items={accordionItems}/>
        </Item>
    </div>;
}

export default Controls;