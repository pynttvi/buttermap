'use client'
import Section from "@/app/components/section";
import ToggleButton from "@/app/components/toggleButton";
import RadioButtonGroup from "@/app/components/radioButtonGroup";
import {MapMode} from "@/app/model/common";
import LabeledButton from "@/app/components/labelledButton";
import CoordinateChangesList from "@/app/views/coordinateChangesList";
import React, {useCallback, useMemo} from "react";
import {
    resetState,
    setActiveRoute,
    setAvoidWater,
    setEditModalOpen,
    setMode,
    setUse3D,
    setViewModalOpen,
    useAppDispatch,
    useAppSelector
} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import {AnyCoordinate, CoordinateFeature} from "@/app/model/coordinate";
import {OptimizedRouteGenerator} from "@/app/map/mapRoute";
import {deepEqual} from "@/app/utils";

const modeOptions: { name: string, value: string }[] = Object.entries(MapMode).map((mm) => ({
    name: mm[1],
    value: mm[0]
}))

export interface ControlsProps {
}

export const Controls: React.FC<ControlsProps> = () => {
    const dispatch = useAppDispatch(); // Dispatch actions
    const settings = useAppSelector((state: ButtermapState) => state.settings, shallowEqual);
    const activeChange = useAppSelector((state: ButtermapState) => state.settings.avoidWater, shallowEqual);
    const activeRoute = useAppSelector((state: ButtermapState) => state.activeRoute, shallowEqual);
    const coords = useAppSelector((state: ButtermapState) => state.coords, shallowEqual);
    const activeCoordinate = useAppSelector((state: ButtermapState) => state.activeCoordinate, shallowEqual);
    const highlightedCoords = useAppSelector((state: ButtermapState) => state.highlightedCoords, deepEqual);
    const maxValues = useAppSelector((state: ButtermapState) => state.maxValues, shallowEqual);

    const openEditModal = useCallback(() => {
        dispatch(setEditModalOpen(true));
    }, [])


    const calculateRoute = async () => {
        const start = highlightedCoords[0]
        const end = highlightedCoords[1]
        if (!start || !end) {
            throw new Error("Route error. Start or end not found")
        }
        console.log("Generating route")
        const avoidFeatures = [ CoordinateFeature.MOUNTAIN, CoordinateFeature.BLOCKING]
        if(settings.avoidWater){
            avoidFeatures.push(CoordinateFeature.WATER)
        }
        const route = routeGenerator.generateRoute(
            findFullCoord(start),
            findFullCoord(end),
            {avoidFeatures: avoidFeatures}
        )
        const routeBack = routeGenerator.generateRoute(
            findFullCoord(end),
            findFullCoord(start),
            {avoidFeatures: avoidFeatures}
        )

        route.routeBack = routeBack
        console.log("Route generated", route)

        dispatch(setActiveRoute(route))
    }
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
            (c) => c.x === coordinate.x && c.y === coordinate.y && c.z === coordinate.z
        );
        if (!fullerCoord) {
            throw new Error("Full coord not found")
        }
        return fullerCoord
    }

    const handleUse3D = useCallback((use3d: boolean) => {
        dispatch(setUse3D(use3d));
    }, [])
    const handleAvoidVater = useCallback((use3d: boolean) => {
        dispatch(setAvoidWater(use3d));
    }, [])
    const handleMode = useCallback((mapMode: string) => {
        console.log(mapMode)
        dispatch(setMode(mapMode as MapMode));
    }, [])

    return <>
        <Section>
            <ToggleButton label={"Use 3D"} key={"3D"} state={settings.use3D} setState={handleUse3D}/>
        </Section>

        <Section>
            <RadioButtonGroup
                label={"Mode"}
                selectedOption={settings.mapMode}
                setSelectedOption={handleMode}
                options={modeOptions}
            /></Section>
        {settings.mapMode === MapMode.ROUTE && (
            <Section>
                <ToggleButton label={"Avoid water"} state={settings.avoidWater} setState={handleAvoidVater}/>
            </Section>
        )}

        <Section>
            {highlightedCoords && highlightedCoords.length === 2 && settings.mapMode === MapMode.ROUTE && (
                <>
                    <LabeledButton buttonText={"Route"} onClicked={calculateRoute}/>
                </>
            )}
            {highlightedCoords && highlightedCoords.length > 0 && settings.mapMode === MapMode.EDIT && (
                <LabeledButton buttonText={"Edit"} onClicked={openEditModal}/>
            )}
        </Section>
        {activeCoordinate && (
            <Section>
                <LabeledButton color={'blue'} buttonText={"View"} onClicked={viewCoordinate}/>
            </Section>
        )}
        {((highlightedCoords && highlightedCoords.length > 0) || activeChange !== null || activeRoute !== null) && (
            <Section>
                <LabeledButton color={'yellow'} buttonText={"Reset"} onClicked={reset}/>
            </Section>
        )}
        <Section>
            <CoordinateChangesList />
        </Section>
    </>;
}

export default Controls;