import React, {useCallback, useEffect} from "react";
import MudMap from "@/app/map/map";
import {ButtermapState} from "@/app/redux/buttermapState";
import {
    setActiveCoordinate,
    setHighlightedCoords,
    setIsLogged,
    setPersistedData,
    useAppDispatch,
    useAppSelector
} from "@/app/redux/buttermapReducer";
import {shallowEqual} from "react-redux";
import {MapMode} from "@/app/model/common";
import CylinderMap from "@/app/map/cylinderMap";
import EditCoordinateModal from "@/app/views/editCoordinateModal";
import {AnyCoordinate, SimpleCoordinate} from "@/app/model/coordinate";
import {deepEqual} from "@/app/utils";
import Controls from "@/app/views/controls";
import ViewCoordinateModal from "@/app/views/viewCoordinateModal";
import Toast from "@/app/components/toastDisplay";
import AreaEditorModal from "@/app/views/area/areaEditorModal";
import {fetchData} from "@/app/service/common";

export const MainContent: React.FC = () => {
    const dispatch = useAppDispatch();

    const isLogged = useAppSelector((state: ButtermapState) => state.isLogged, shallowEqual);
    const settings = useAppSelector((state: ButtermapState) => state.settings, shallowEqual);
    const coords = useAppSelector((state: ButtermapState) => state.coords, shallowEqual);
    const highlightedCoords = useAppSelector((state: ButtermapState) => state.highlightedCoords, deepEqual);

    useEffect(() => {
        const auth = localStorage.getItem("auth")
        dispatch(setIsLogged(auth !== undefined && auth !== null));
    }, [dispatch])

    useEffect(() => {
        if (isLogged) {
            fetchData()
                .then((pd) => {
                    if (pd) {
                        dispatch(setPersistedData(pd))
                    }
                }).catch((err) => {
                console.log("Error fetching data", err)
            })
        }
    }, [dispatch, isLogged]);


    const handleDoubleClick = (coordinate: AnyCoordinate) => {
        const fullerCoord = coords.find(
            (c) => c.x === coordinate.x && c.y === coordinate.y && c.z === coordinate.z
        );

        if (fullerCoord) {
            dispatch(setActiveCoordinate(fullerCoord));
        }

        if (settings.mapMode === MapMode.EDIT) {
            const exists = highlightedCoords.some(
                (c) => c.x === coordinate.x && c.y === coordinate.y && c.z === coordinate.z
            );

            if (exists) {
                const updatedCoords = highlightedCoords.filter(
                    (c) => c.x !== coordinate.x || c.y !== coordinate.y || c.z !== coordinate.z
                );
                handleHighlightedCoords(updatedCoords);
            } else {
                handleHighlightedCoords([...highlightedCoords, coordinate]);
            }
        } else if (settings.mapMode === MapMode.ROUTE) {
            const exists = highlightedCoords.some(
                (c) => c.x === coordinate.x && c.y === coordinate.y && c.z === coordinate.z
            );

            if (exists) {
                const updatedCoords = highlightedCoords.filter(
                    (c) => c.x !== coordinate.x || c.y !== coordinate.y || c.z !== coordinate.z
                );
                handleHighlightedCoords(updatedCoords);
            } else {
                if (highlightedCoords.length >= 2) {
                    const updatedCoords = [highlightedCoords[0], coordinate];
                    handleHighlightedCoords(updatedCoords);
                } else {
                    handleHighlightedCoords([...highlightedCoords, coordinate]);
                }
            }
        }
    };

    const handleHighlightedCoords = useCallback((coords: SimpleCoordinate[]) => {
        dispatch(setHighlightedCoords(coords));
    }, [dispatch]);

    return (
        <>
            <div className="grid grid-cols-2 gap-1 lg:grid-cols-[4fr_1fr] w-full h-screen overflow-hidden">
                <div className="p-2 overflow-auto max-h-screen">
                    <Toast/>
                    {settings.use3D ? (
                        <CylinderMap gridData={coords} onDoubleClick={handleDoubleClick}/>
                    ) : (
                        <MudMap coords={coords} onDoubleClick={handleDoubleClick} charSize={16}/>
                    )}

                </div>
                <div className="w-full p-2 overflow-auto max-h-screen">
                    <Controls/>
                </div>
            </div>

            <EditCoordinateModal/>
            <ViewCoordinateModal/>
            <AreaEditorModal/>
        </>
    );
};
