import {CoordinateChange} from "@/app/model/coordinate";
import React, {useCallback, useEffect, useState} from "react";
import {
    setActiveChange,
    setActiveCoordinate,
    setChanges,
    setViewModalOpen,
    useAppDispatch,
    useAppSelector
} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import {deepEqual} from "@/app/utils";

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
            alert('Error fetching changes');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
    }
};


interface CoordinateChangesListProps {
}

const isDev = process.env.NODE_ENV === "development";
const CoordinateChangesList: React.FC<CoordinateChangesListProps> = ({}) => {
    const [changeFiles, setChangeFiles] = useState<ChangeFile[]>([])
    const dispatch = useAppDispatch(); // Dispatch actions
    const activeChange = useAppSelector(
        (state: ButtermapState) => state.activeChange,
        shallowEqual
    );
    const changes = useAppSelector(
        (state: ButtermapState) => state.changes,
        deepEqual
    );

    useEffect(() => {
        if (!isDev) {
            listPendingChanges().then((pc) => {
                setChangeFiles(pc)
                dispatch(setChanges(pc.map((pc) => pc.change)))
            })
        }
    }, [changes]);


    const activateChangeFile = useCallback(
        (change: ChangeFile) => {
            dispatch(setActiveChange(change))
            dispatch(setActiveCoordinate(change.change.coord))
            dispatch(setViewModalOpen(true))
        },
        []);
    const activateChange = useCallback(
        (change: CoordinateChange) => {
            dispatch(setActiveChange({change: change, fileName: `coordinate-change-${Date.now()}.json`}))
            dispatch(setActiveCoordinate(change.coord))
            dispatch(setViewModalOpen(true))
        },
        [changes]);


    if (isDev && changeFiles.length === 0) return null
    if (!isDev && changes.length === 0) return null

    return (
        <>
            {isDev && (
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

            {!isDev && (
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
    );
};

export default CoordinateChangesList;