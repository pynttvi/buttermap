'use client'
import {CoordinateChange, PersistedCoordinateChange} from "@/app/model/coordinate";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    setActiveArea,
    setActiveChange,
    setActiveCoordinate,
    setAreaModalOpen,
    setChanges,
    setViewModalOpen,
    useAppDispatch,
    useAppSelector
} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {deepEqual} from "@/app/utils";
import Accordion, {AccordionItem} from "@/app/components/accordion";
import {Area} from "@/app/model/area";
import NotificationCounter from "@/app/components/notificationCounter";
import {fetchData} from "@/app/service/common";

export type ChangeFile = { fileName: string, change: CoordinateChange }

const listPendingChanges: () => Promise<ChangeFile[]> = async () => {
    try {
        const response = await fetch('/api/list-changes', {
            method: 'GET',
        });

        const result = await response.json();
        if (response.ok) {
            return result
        } else {
            console.error('Error fetching changes');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};


const isDev = process.env.NODE_ENV === "development";
const UpdatesList: React.FC = ({}) => {
    const [changeFiles, setChangeFiles] = useState<ChangeFile[]>([])
    const dispatch = useAppDispatch(); // Dispatch actions
    const changes = useAppSelector(
        (state: ButtermapState) => state.changes,
        deepEqual
    );
    const persistedData = useAppSelector(
        (state: ButtermapState) => state.persistedData,
        deepEqual
    );

    const areas = useMemo(() => {
        if(persistedData){
            return persistedData.areas || []
        }
        return []
    }, [persistedData])


    useEffect(() => {

        if (isDev) {
            listPendingChanges()
                .then((pc) => {
                    setChangeFiles(pc)
                })
                .catch((e: Error) => console.error("Error fetching change files", e))

        }

    }, [changes, dispatch]);


    const activateChangeFile = useCallback(
        (change: ChangeFile) => {
            dispatch(setActiveChange(change))
            dispatch(setActiveCoordinate(change.change.coord))
            dispatch(setViewModalOpen(true))
        },
        [dispatch]);
    const activateChange = useCallback(
        (change: CoordinateChange | PersistedCoordinateChange) => {
            dispatch(setActiveChange({
                change: change as CoordinateChange,
                fileName: `coordinate-change-${Date.now()}.json`
            }))
            dispatch(setActiveCoordinate(change.coord))
            dispatch(setViewModalOpen(true))
        },
        [dispatch]);

    const activateArea = useCallback(
        (area: Area) => {
            dispatch(setActiveArea(area))
            dispatch(setAreaModalOpen(true))
        },
        [dispatch]);

    const accordionContent: Array<AccordionItem | undefined> = useMemo(() => [
        {
            title: (
                <>
                    Waiting changes <NotificationCounter count={isDev ? changeFiles.length : changes?.length}/>
                </>
            ),
            content: (
                <>
                    {isDev && changeFiles.length > 0 && (
                        <>
                            <ul>
                                {changeFiles.map((change => (
                                    <li key={`change-${change.fileName}`} className={"mb-2"}>
                                        <a
                                            onClick={() => activateChangeFile(change)}
                                        >
                                            {change.fileName}
                                        </a>
                                    </li>
                                )))}
                            </ul>
                        </>
                    )}

                    {changes.length > 0 && (
                        <>
                            <ul>
                                {changes.map(((change, index) => (
                                    <li key={`change-${index}`} className={"mb-2"}>
                                        <a
                                            onClick={() => activateChange(change)}
                                        >
                                            change-{index}
                                        </a>
                                    </li>
                                )))}
                            </ul>

                        </>
                    )}

                </>
            )
        },
        (persistedData?.changes && {
            title: "Changes",
            content: (
                <>
                    <ul>
                        {persistedData?.changes?.map(((change, index) => (
                            <li key={`change-${index}`} className={"mb-2"}>
                                <a
                                    onClick={() => activateChange(change)}
                                >
                                    change-{index}
                                </a>
                            </li>
                        )))}
                    </ul>
                </>
            )
        }),
        (areas && {
            title: "Areas",
            content: (
                <>
                    <ul>
                        {areas?.map(((area, index) => (
                            <li key={`area-${index}`} className={"mb-2"}>
                                <a onClick={() => activateArea(area)}>
                                    {area.name}
                                </a>
                            </li>
                        )))}
                    </ul>
                </>
            )
        }),
    ], [activateArea, activateChange, activateChangeFile, areas, changeFiles, changes, persistedData?.changes])

    return (
        ((changeFiles.length !== 0 || changes.length !== 0)) || areas.length !== 0 ? (
           <>
               <Accordion items={accordionContent}/>
           </>
        ) : null
    );
};

export default UpdatesList;