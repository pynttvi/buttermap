'use client'
import React, {useCallback, useMemo, useState} from 'react';
import {
    CoordinateChange,
    CoordinateChangeAction,
    CoordinateChangeStatus,
    CoordinateFeature,
    SimpleCoordinate,
} from "@/app/model/coordinate";
import CheckBox from "@/app/components/checkBox";
import Modal from "@/app/components/modal";
import {setChanges, setEditModalOpen, useAppDispatch, useAppSelector} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import {capitalizeFirstChar, deepEqual, getEnumValue} from "@/app/utils";
import ToggleButton from "@/app/components/toggleButton";
import TextField from "@/app/components/textField";
import Item from "@/app/components/item";
import colors from "@/app/data/colors.json";
import ColorPicker from "@/app/components/colorPicker";
import RadioButtonGroup from "@/app/components/radioButtonGroup";
import {addChange} from "@/app/service/common";

const isDev = process.env.NODE_ENV === "development";

const defaultChange: CoordinateChange = {
    action: CoordinateChangeAction.NONE,
    coord: null,
    status: CoordinateChangeStatus.PENDING,
};

const saveChange = async (coordinateChange: CoordinateChange) => {
    try {
        const response = await fetch('/api/save-coordinate-change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(coordinateChange),
        });

        const result = await response.json();
        if (response.ok) {
            console.log('File saved successfully: ' + result.filePath);
        } else {
            console.error('Error saving file: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        console.error('An unexpected error occurred');
    }
};

const EditCoordinateModal: React.FC = () => {
    const changes = useAppSelector((state: ButtermapState) => state.changes, shallowEqual);
    const isOpen = useAppSelector((state: ButtermapState) => state.editModalOpen, shallowEqual);
    const coords = useAppSelector((state: ButtermapState) => state.coords, shallowEqual);
    const dispatch = useAppDispatch(); // Dispatch actions

    const [coordinateChange, setCoordinateChange] = useState<CoordinateChange>(defaultChange);
    const [changeChar, setChangeChar] = useState<boolean>(false);
    const [changeName, setChangeName] = useState<boolean>(false);
    const [addTransport, setAddTransport] = useState<boolean>(false);
    const [addArea, setAddArea] = useState<boolean>(false);

    const highlightedCoords = useAppSelector((state: ButtermapState) => state.highlightedCoords, deepEqual);

    const isDev = process.env.NODE_ENV === "development";

    const onAccept = useCallback(() => {
        highlightedCoords.forEach((coord: SimpleCoordinate) => {
            const fullCoord = coords.find((c) => c.y === coord.y && c.x === coord.x && c.z === coord.z);
            if (!fullCoord) {
                throw new Error("Full coordinate not found");
            }
            const fullChange = {...coordinateChange, coord: fullCoord};
            if (isDev) {
                saveChange(fullChange);
            } else {
                addChange(fullChange)
            }
            dispatch(setChanges([...changes, fullChange]));
            dispatch(setEditModalOpen(false));
            setCoordinateChange(defaultChange);
        });
    }, [changes, coordinateChange, coords, dispatch, highlightedCoords]);

    const blockFeatures: string[] = useMemo(() => {
        return Object.keys(CoordinateFeature)
            .filter((key) => isNaN(Number(key)))
            .map((bf) => bf);
    }, []);

    const isFeatureSelected = useCallback(
        (key: keyof typeof CoordinateFeature) => {
            const feature = getEnumValue(CoordinateFeature, key);
            return (coordinateChange.features ?? []).findIndex((bf) => bf === feature) !== -1;
        },
        [coordinateChange]
    );

    const toggleFeature = useCallback((blockFeature: keyof typeof CoordinateFeature) => {
            const feature = getEnumValue(CoordinateFeature, blockFeature);

            if (!coordinateChange.features) {
                coordinateChange.features = [];
            }
            const idx = coordinateChange.features.findIndex((bf) => bf === feature);
            if (idx !== -1) {
                const newFeatures = coordinateChange.features;
                newFeatures.splice(idx, 1);
                setCoordinateChange({...coordinateChange, features: newFeatures});
            } else {
                setCoordinateChange({...coordinateChange, features: [...(coordinateChange.features ?? []), feature]});
            }
        },
        [coordinateChange]
    );

    if (!isOpen) return null;

    return (
        <Modal
            title={"Edit coordinate"}
            isOpen={isOpen}
            onAccept={onAccept}
            onCancel={() => dispatch(setEditModalOpen(false))}
        >
            {/* Action Section */}
            <Item>
                <RadioButtonGroup
                    label={"Feature action"}
                    selectedOption={coordinateChange.action ?? ""}
                    setSelectedOption={(option: string) =>
                        setCoordinateChange({...coordinateChange, action: option as CoordinateChangeAction})
                    }
                    options={Object.values(CoordinateChangeAction).map((cc) => ({
                        name: capitalizeFirstChar(cc),
                        value: cc,
                    }))}
                />
                {coordinateChange.action !== "NONE" && (
                    <>
                        {coordinateChange.action === "ADD" ? (
                            <h3>Add selected features</h3>
                        ) : (
                            <h3>Remove selected features</h3>
                        )}
                        {blockFeatures &&
                            blockFeatures.map((bf) => (
                                <CheckBox
                                    key={`feature-${bf}`}
                                    title={bf}
                                    checked={isFeatureSelected(bf as keyof typeof CoordinateFeature)}
                                    onChange={() => toggleFeature(bf as keyof typeof CoordinateFeature)}
                                />
                            ))}
                    </>
                )}
            </Item>

            {/* Name Section */}
            {highlightedCoords && highlightedCoords.length === 1 && (

                <Item>
                    <ToggleButton label={"Change name"} state={changeName} setState={setChangeName}/>
                    {changeName && (
                        <TextField
                            label={"Name"}
                            name={"name"}
                            value={coordinateChange.name ?? ""}
                            onChange={(event) =>
                                setCoordinateChange({
                                    ...coordinateChange,
                                    name: event.target.value,
                                })
                            }
                        />
                    )}
                </Item>
            )}

            {/* Transports Section */}
            <Item>

                <ToggleButton label={"Add transport"} state={addTransport} setState={setAddTransport}/>
                {addTransport && (
                    <>
                        <TextField
                            label={"Transport Target Name"}
                            name={"transport-target"}
                            value={coordinateChange.transports?.[0]?.targetName ?? ""}
                            onChange={(event) =>
                                setCoordinateChange({
                                    ...coordinateChange,
                                    transports: [{targetName: event.target.value, moveCommand: ""}],
                                })
                            }
                        />
                        <TextField
                            label={"Transport Command"}
                            name={"transport-command"}
                            value={coordinateChange.transports?.[0]?.moveCommand ?? ""}
                            onChange={(event) =>
                                setCoordinateChange({
                                    ...coordinateChange,
                                    transports: [
                                        {
                                            targetName: coordinateChange.transports?.[0]?.targetName ?? "",
                                            moveCommand: event.target.value,
                                        },
                                    ],
                                })
                            }
                        />
                    </>
                )}
            </Item>

            {/* Area Section */}
            {highlightedCoords && highlightedCoords.length === 1 && (
                <Item>

                    <ToggleButton label={"Add area"} state={addArea} setState={setAddArea}/>
                    {addArea && (
                        <>
                            <TextField
                                label={"Area Name"}
                                name={"area-name"}
                                value={coordinateChange.area?.name ?? ""}
                                onChange={(event) =>
                                    setCoordinateChange({
                                        ...coordinateChange,
                                        area: {
                                            exitCommand: coordinateChange?.area?.exitCommand ?? "",
                                            enterCommand: coordinateChange?.area?.enterCommand ?? "",
                                            name: event.target.value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label={"Area Enter Command"}
                                name={"area-enter"}
                                value={coordinateChange.area?.enterCommand ?? ""}
                                onChange={(event) =>
                                    setCoordinateChange({
                                        ...coordinateChange,
                                        area: {
                                            exitCommand: coordinateChange?.area?.exitCommand ?? "",
                                            name: coordinateChange?.area?.name ?? "",
                                            enterCommand: event.target.value,
                                        },
                                    })
                                }
                            />
                            <TextField
                                label={"Area Exit Command"}
                                name={"area-exit"}
                                value={coordinateChange.area?.exitCommand ?? ""}
                                onChange={(event) =>
                                    setCoordinateChange({
                                        ...coordinateChange,
                                        area: {
                                            enterCommand: coordinateChange?.area?.enterCommand ?? "",
                                            name: coordinateChange?.area?.name ?? "",
                                            exitCommand: event.target.value,
                                        },
                                    })
                                }
                            />
                        </>
                    )}
                </Item>
            )}

            { /* Char and Color Section */
            }
            <Item>

                <ToggleButton label={"Change char"} state={changeChar} setState={setChangeChar}/>
                {changeChar && (

                    <>
                        <TextField
                            label={"New char"}
                            name={"new-char"}
                            value={coordinateChange.charChange ?? ""}
                            maxLength={1}
                            onChange={(event) =>
                                setCoordinateChange({
                                    ...coordinateChange,
                                    charChange: event.target.value,
                                })
                            }
                        />
                        <ColorPicker
                            colors={colors}
                            onChange={(color: string) => {
                                setCoordinateChange({...coordinateChange, color});
                            }}
                        />
                    </>
                )}
            </Item>

        </Modal>
    );
};

export default EditCoordinateModal;
