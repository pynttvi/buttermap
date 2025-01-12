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
    setActiveRoute,
    setAreaModalOpen,
    setAvoidWater,
    setEditModalOpen,
    setIsLogged,
    setMode,
    setUse3D,
    setViewModalOpen,
    useAppDispatch,
    useAppSelector
} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import {AnyCoordinate, CoordinateFeature, FullCoordinate} from "@/app/model/coordinate";
import {OptimizedRouteGenerator} from "@/app/map/mapRoute";
import {copyTextToClipboard, createRandomId, deepEqual, getAuth} from "@/app/utils";
import Spacer from "@/app/components/spacer";
import Accordion from "@/app/components/accordion";
import LoginComponent from "@/app/views/login";

const modeOptions: { name: string, value: string }[] = Object.entries(MapMode).map((mm) => ({
    name: mm[1],
    value: mm[0]
}))


export const Controls: React.FC = () => {
    const dispatch = useAppDispatch(); // Dispatch actions

    const isLogged = useAppSelector((state: ButtermapState) => state.isLogged, shallowEqual);
    const settings = useAppSelector((state: ButtermapState) => state.settings, shallowEqual);
    const activeChange = useAppSelector((state: ButtermapState) => state.settings.avoidWater, shallowEqual);
    const activeRoute = useAppSelector((state: ButtermapState) => state.activeRoute, deepEqual);
    const coords = useAppSelector((state: ButtermapState) => state.coords, shallowEqual);
    const activeCoordinate = useAppSelector((state: ButtermapState) => state.activeCoordinate, shallowEqual);
    const highlightedCoords = useAppSelector((state: ButtermapState) => state.highlightedCoords, deepEqual);
    const maxValues = useAppSelector((state: ButtermapState) => state.maxValues, shallowEqual);

    const openEditModal = useCallback(() => {
        dispatch(setEditModalOpen(true));
    }, [dispatch])

    const openAreaModal = useCallback(() => {
        dispatch(setAreaModalOpen(true));
    }, [dispatch])

    const copyToClipboard = useCallback((text: string) => {
        copyTextToClipboard(text).then(() => {
            const id = createRandomId()
            dispatch(addToast({id: id, message: "Copied to clipboard", type: "info"}))
            setTimeout(() => {
                dispatch(removeToast(id))
            }, 2000)
        })
    }, [dispatch])


    const calculateRoute = async () => {
        const start = highlightedCoords[0]
        const end = highlightedCoords[1]
        if (!start || !end) {
            throw new Error("Route error. Start or end not found")
        }
        console.log("Generating route")
        const avoidFeatures = [CoordinateFeature.MOUNTAIN, CoordinateFeature.BLOCKING]
        if (settings.avoidWater) {
            avoidFeatures.push(CoordinateFeature.WATER)
        }
        const route = routeGenerator.generateRoute(
            findFullCoord(start),
            findFullCoord(end),
            {avoidFeatures: avoidFeatures}
        )
        route.routeBack = routeGenerator.generateRoute(
            findFullCoord(end),
            findFullCoord(start),
            {avoidFeatures: avoidFeatures}
        )

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

    const accordionItems = useMemo(() => [
        {
            title: isLogged ? getAuth()?.username ?? null: "Login",
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


    return <div className={"w-full"}>
        <Item>
            <Accordion items={accordionItems}/>
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
            /></Item>
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

    </div>;
}

export default Controls;