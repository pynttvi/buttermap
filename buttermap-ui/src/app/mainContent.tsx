// import Image from "next/image";
'use client'
import React, {useCallback} from "react";
import MudMap from "@/app/map/map";
import {ButtermapState} from "@/app/redux/buttermapState";
import {setActiveCoordinate, setHighlightedCoords, useAppDispatch, useAppSelector} from "@/app/redux/buttermapReducer";
import {shallowEqual} from 'react-redux';
import {MapMode} from "@/app/model/common";
import CylinderMap from "@/app/map/cylinderMap";
import EditCoordinateModal from "@/app/views/editCoordinateModal";
import {AnyCoordinate, SimpleCoordinate} from "@/app/model/coordinate";
import {deepEqual} from "@/app/utils";
import Controls from "@/app/views/controls";
import ViewCoordinateModal from "@/app/views/viewCoordinateModal";


export const MainContent: React.FC<{}> = ({}) => {

    const dispatch = useAppDispatch(); // Dispatch actions

    const settings = useAppSelector((state: ButtermapState) => state.settings, shallowEqual);
    const coords = useAppSelector((state: ButtermapState) => state.coords, shallowEqual);

    const highlightedCoords = useAppSelector((state: ButtermapState) => state.highlightedCoords, deepEqual);


    const handleDoubleClick = (coordinate: AnyCoordinate) => {
        const fullerCoord = coords.find(
            (c) => c.x === coordinate.x && c.y === coordinate.y && c.z === coordinate.z
        );

        if (fullerCoord) {
            dispatch(setActiveCoordinate(fullerCoord))
        }
        console.log(`Clicked`, fullerCoord);

        if (settings.mapMode === MapMode.EDIT) {
            // In Edit mode, allow selecting multiple coordinates
            const exists = highlightedCoords.some(
                (c) => c.x === coordinate.x && c.y === coordinate.y && c.z === coordinate.z
            );

            if (exists) {
                // Remove the coordinate if it's already selected
                const updatedCoords = highlightedCoords.filter(
                    (c) => c.x !== coordinate.x || c.y !== coordinate.y || c.z !== coordinate.z
                );
                handleHighlightedCoords(updatedCoords);
            } else {
                // Add the coordinate if it's not already selected
                handleHighlightedCoords([...highlightedCoords, coordinate]);
            }
        } else if (settings.mapMode === MapMode.ROUTE) {
            // In Route mode, ensure only two coordinates can be selected
            const exists = highlightedCoords.some(
                (c) => c.x === coordinate.x && c.y === coordinate.y && c.z === coordinate.z
            );

            if (exists) {
                // Remove the coordinate if it's already selected
                const updatedCoords = highlightedCoords.filter(
                    (c) => c.x !== coordinate.x || c.y !== coordinate.y || c.z !== coordinate.z
                );
                handleHighlightedCoords(updatedCoords);
            } else {
                if (highlightedCoords.length >= 2) {
                    // Replace the second coordinate with the new selection
                    const updatedCoords = [highlightedCoords[0], coordinate];
                    handleHighlightedCoords(updatedCoords);
                } else {
                    // Add the new coordinate
                    handleHighlightedCoords([...highlightedCoords, coordinate]);
                }
            }
        }
    };


    const handleHighlightedCoords = useCallback((coords: SimpleCoordinate[]) => {
        dispatch(setHighlightedCoords(coords));
    }, [])


    return (
        <div className="grid grid-cols-[9fr_0.1fr] gap-1" style={{width: '150vh', height: '100vh'}}>
            <div className="p-1">
                {settings.use3D ? (
                    <CylinderMap
                        gridData={coords}
                        onDoubleClick={handleDoubleClick}
                    />
                ) : (
                    <MudMap
                        coords={coords}
                        onDoubleClick={handleDoubleClick}
                        charSize={16}
                    />

                )
                }
            </div>
            <div className="p-1">
                <Controls/>
            </div>
            <EditCoordinateModal/>
            <ViewCoordinateModal/>
        </div>
    );
}
