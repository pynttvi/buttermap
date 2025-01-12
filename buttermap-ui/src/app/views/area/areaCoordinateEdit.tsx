import React, {useCallback, useMemo} from "react";
import ToggleButton from "@/app/components/toggleButton";
import Accordion from "@/app/components/accordion";
import {AreaCoordinate, Door, Mob, SpecialDir} from "@/app/model/area";
import StringArrayInput from "@/app/components/stringArrayInput";
import Item from "@/app/components/item";
import {SpecialDirsEdit} from "@/app/views/area/specialDirEdit";
import FlexItem from "@/app/components/flexItem";
import LabeledButton from "@/app/components/labelledButton";

interface AreaCoordinateEditProps {
    coordinate: AreaCoordinate;
    setCoordinate: (coordinate: AreaCoordinate) => void
    maxZ: number
    minZ: number
}

const AreaCoordinateEdit: React.FC<AreaCoordinateEditProps> = ({coordinate, setCoordinate, maxZ, minZ}) => {

    const handleInputChange = useCallback((field: keyof AreaCoordinate, value: any) => {
        setCoordinate({...coordinate, [field]: value});
    }, [coordinate, setCoordinate]);


    const handleMobChange = useCallback(
        (index: number, field: keyof Mob, value: Mob[keyof Mob]) => {
            setCoordinate({
                    ...coordinate,
                    mobs: coordinate.mobs?.map((mob, idx) =>
                        idx === index ? {...mob, [field]: value} : mob
                    ) ?? [],
                }
            );
        },
        [coordinate, setCoordinate]
    );

    const handleDoorChange = useCallback(
        (index: number, field: keyof Door, value: Door[keyof Door]) => {
            setCoordinate({
                    ...coordinate,
                    doors: coordinate.doors?.map((mob, idx) =>
                        idx === index ? {...mob, [field]: value} : mob
                    ) ?? [],
                }
            );
        },
        [coordinate, setCoordinate]
    );

    // Remove a mob by index
    const handleRemoveMob = useCallback((index: number) => {
        setCoordinate({
                ...coordinate,
                mobs: coordinate.mobs?.filter((_, idx) => idx !== index) ?? [],
            }
        );
    }, [coordinate, setCoordinate]);

    // Add a new mob
    const handleAddMob = useCallback(() => {
        setCoordinate({
                ...coordinate,
                mobs: [...(coordinate.mobs || []), {name: "", desc: "", exp: 0, align: ""}],
            }
        );
    }, [coordinate, setCoordinate]);

    const handleRemoveDoor = useCallback((index: number) => {
        setCoordinate({
                ...coordinate,
                doors: coordinate.doors?.filter((_, idx) => idx !== index) ?? [],
            }
        );
    }, [coordinate, setCoordinate]);

    const addZCoord = useCallback((index: number) => {
        setCoordinate({
                ...coordinate,
                zChanges: [...(coordinate.zChanges ?? []), {dir: (index > 0 ? "u" : "d"), count: index}]
            }
        );

    }, [coordinate, setCoordinate]);

    // Add a new mob
    const handleAddDoor = useCallback(() => {
        setCoordinate({
                ...coordinate,
                doors: [...(coordinate.doors || []), {dir: ""}],
            }
        );
    }, [coordinate, setCoordinate]);


    const setExits = (exits: string[]) => {
        setCoordinate({
                ...coordinate,
                exits: exits
            }
        )
    }

    const setMobBlockDirs = (mob: Mob) => {
        setCoordinate({
                ...coordinate,
                mobs: [...(coordinate.mobs?.filter((m) => m.name !== mob.name) || []), mob]
            }
        )
    }
    console.log("mima", minZ, maxZ, coordinate.z)
    const accordionItems = useMemo(() => ([
        {
            title: "Up/Down",
            content: (
                <FlexItem>
                    {!coordinate.zChanges?.some((zc) => zc.dir === "u") && (
                        <LabeledButton buttonText={"Add up"} onClicked={() => addZCoord(1)}/>
                    )}
                    {!coordinate.zChanges?.some((zc) => zc.dir === "d") && (
                        <LabeledButton buttonText={"Add down"} onClicked={() => addZCoord(-1)}/>
                    )}
                </FlexItem>
            )
        },
        {
            title: "Mobs",
            content: (
                <div>
                    {coordinate.mobs?.map((mob: Mob, index) => (
                        <div key={index} className="mb-2 space-y-1">
                            <input
                                type="text"
                                placeholder="Name"
                                value={mob.name}
                                onChange={(e) => handleMobChange(index, "name", e.target.value)}
                                className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                            />
                            <textarea
                                placeholder="Description"
                                value={mob.desc || ""}
                                onChange={(e) => handleMobChange(index, "desc", e.target.value)}
                                className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                            />
                            <input
                                type="number"
                                placeholder="EXP"
                                value={mob.exp || ""}
                                onChange={(e) => handleMobChange(index, "exp", parseInt(e.target.value, 10))}
                                className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                            />
                            <Item>
                                <ToggleButton label={"Aggro"} state={mob?.isAggro || false}
                                              setState={() => handleMobChange(index, "isAggro", !mob.isAggro)}/>
                            </Item>
                            <Item>
                                <StringArrayInput
                                    label={"Block dirs"}
                                    value={mob.blockDirs || []}
                                    onChange={(blockDirs) => setMobBlockDirs({...mob, blockDirs})}
                                    placeholder="Add block dir"
                                />
                            </Item>
                            <button
                                onClick={() => handleRemoveMob(index)}
                                className="text-red-500 hover:underline"
                            >
                                Remove Mob
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={handleAddMob}
                        className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                    >
                        Add Mob
                    </button>
                </div>
            )
        },
        {
            title: "Doors",
            content: (
                <div>
                    {coordinate.doors?.map((door: Door, index) => (
                        <div key={index} className="mb-2 space-y-1">
                            <Item>
                                <input
                                    type="text"
                                    placeholder="Dir"
                                    value={door.dir}
                                    onChange={(e) => handleDoorChange(index, "dir", e.target.value)}
                                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                                />
                            </Item>
                            <Item>
                            <textarea
                                placeholder="Key info"
                                value={door.keyInfo || ""}
                                onChange={(e) => handleDoorChange(index, "keyInfo", e.target.value)}
                                className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                            />
                            </Item>
                            <Item>
                                <ToggleButton label={"Is locked"} state={door?.isLocked || false}
                                              setState={() => handleDoorChange(index, "isLocked", !door.isLocked)}/>
                            </Item>
                            <button
                                onClick={() => handleRemoveDoor(index)}
                                className="text-red-500 hover:underline"
                            >
                                Remove Door
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={handleAddDoor}
                        className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                    >
                        Add Door
                    </button>
                </div>
            )
        },
        {
            title: "Exits",
            content: (
                <div>
                    <h3 className="font-semibold mb-2">Exits:</h3>
                    <StringArrayInput
                        value={coordinate.exits || []}
                        onChange={setExits}
                        placeholder="Enter an exit"
                    />
                </div>
            )
        },
        {
            title: "Info",
            content: (
                <div>
                    <label className="block font-semibold mb-1">Info:</label>
                    <textarea
                        value={coordinate.info || ""}
                        onChange={(e) => handleInputChange("info", e.target.value)}
                        className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
                    />
                </div>
            ),
        },
        {
            title: "Special dirs",
            content: (
                <div>
                    <SpecialDirsEdit
                        areaCoordinate={coordinate}
                        onUpdateSpecialDirs={(specialDirs: SpecialDir[]) => setCoordinate({
                            ...coordinate,
                            spacialDirs: specialDirs.map((sd) => ({
                                alias: sd.alias,
                                equalToNormal: sd.equalToNormal
                            }))
                        })}/>
                </div>
            ),
        },
    ]), [addZCoord, coordinate, handleAddDoor, handleAddMob, handleDoorChange, handleInputChange, handleMobChange, handleRemoveDoor, handleRemoveMob, setCoordinate, setExits, setMobBlockDirs]);

    if (!coordinate) return null;

    return (
        <Accordion items={accordionItems}/>
    );
};

export default AreaCoordinateEdit;
