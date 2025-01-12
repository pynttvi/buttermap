'use client';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {setActiveArea, setAreaModalOpen, showToast, useAppDispatch, useAppSelector} from '@/app/redux/buttermapReducer';
import {ButtermapState} from '@/app/redux/buttermapState';
import {shallowEqual} from 'react-redux';
import Modal, {ModalButton} from '@/app/components/modal';
import colors from '@/app/data/colors.json';
import ColorPicker from '@/app/components/colorPicker';
import Item from "@/app/components/item";
import AreaCoordinateEdit from "@/app/views/area/areaCoordinateEdit";
import {deepEqual, downloadJson} from "@/app/utils";
import {Area, AreaCoordinate} from "@/app/model/area";
import TextSlider from "@/app/components/textSlider";
import {SimpleCoordinate} from "@/app/model/coordinate";
import Accordion, {AccordionItem} from "@/app/components/accordion";
import FlexItem from "@/app/components/flexItem";
import TextField from "@/app/components/textField";
import {addArea} from "@/app/service/common";

const charShortcuts = ['o', 'O', '|', '-', '?', '/', '\\', '#', "*", "_"];

function getInitialGrid() {
    return Array.from({length: 3}, (_, y) =>
        Array.from({length: 3}, (_, x) => ({x, y, z: 0, char: '', color: null}))
    ).flat()
}

function getSingleLayerGrid(grid: AreaCoordinate[], layer: number) {
    return grid.filter((cell) => cell.z === layer)
}

function coordinatesMatch(coord1: SimpleCoordinate, coord2: SimpleCoordinate) {
    return coord1.x === coord2.x && coord1.y === coord2.y && coord1.z === coord2.z
}

function getZValueLimits(grid: AreaCoordinate[]) {

    let maxZ = 0;
    let minZ = 0;

    for (const coord of grid) {
        if (coord.zChanges) {
            const positiveSum = coord.zChanges
                .filter((zChange) => zChange.dir === "u" && zChange.count > 0)
                .reduce((sum, zChange) => sum + zChange.count, 0);

            const negativeSum = coord.zChanges
                .filter((zChange) => zChange.dir === "d" && zChange.count < 0)
                .reduce((sum, zChange) => sum + zChange.count, 0);

            maxZ = Math.max(maxZ, positiveSum);
            minZ = Math.min(minZ, negativeSum);
        }
    }

    return {maxZ, minZ};
}

const AreaEditorModal: React.FC = () => {
    const highlightedCoords = useAppSelector((state: ButtermapState) => state.highlightedCoords, shallowEqual);
    const isOpen = useAppSelector((state: ButtermapState) => state.areaModalOpen, shallowEqual);
    const isLogged = useAppSelector((state: ButtermapState) => state.isLogged, shallowEqual);
    const area = useAppSelector((state: ButtermapState) => state.activeArea, deepEqual);
    const dispatch = useAppDispatch();

    const grid = useMemo(() => area?.coordinates, [area])

    const closeModal = useCallback(() => {
        dispatch(setAreaModalOpen(false));
    }, [dispatch]);

    const setGrid = useCallback(
        (coordinates: AreaCoordinate[]) => {
            if (!deepEqual(area?.coordinates, coordinates)) {
                dispatch(setActiveArea({
                    enterCommand: "",
                    exitCommand: "",
                    name: "", ...area,
                    location: highlightedCoords.at(0) || {x: 0, y: 0, z: 0},
                    coordinates
                }));
            }
        },
        [area, dispatch]
    );

    useEffect(() => {
        if (!grid || grid.length === 0) {
            setGrid(getInitialGrid());
        }
    }, [grid, setGrid]);


    const [layer, setLayer] = useState<number>(0);
    const [selectedChar, setSelectedChar] = useState<string>(charShortcuts[0]);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [activeCell, setActiveCell] = useState<AreaCoordinate | null>(null);
    const [currentCoordinate, setCurrentCoordinate] = useState<SimpleCoordinate | null>(null);

    const onSave = useCallback((coordinates: AreaCoordinate[]) => {
        closeModal();
    }, [closeModal]);


    const zLimits = useMemo(() => {
        if (!grid) return {maxZ: 0, minZ: 0};
        return getZValueLimits(grid);
    }, [grid]);


    const findCell = useCallback(
        (x: number, y: number, z?: number) => {
            return grid?.find((cell) => cell.x === x && cell.y === y && cell.z === (z ?? layer));
        },
        [grid, layer]
    );


    const ensureGridGrowth = useCallback(
        (x: number, y: number) => {
            if (!grid) return
            const prevGrid = [...(grid ?? getInitialGrid())];
            const existingX = prevGrid.map((cell) => cell.x);
            const existingY = prevGrid.map((cell) => cell.y);
            const existingZ = prevGrid.map((cell) => cell.z);

            const minX = Math.min(...existingX);
            const maxX = Math.max(...existingX);
            const minY = Math.min(...existingY);
            const maxY = Math.max(...existingY);

            // Use zLimits from the memoized calculation
            const {maxZ, minZ} = getZValueLimits(grid)

            const newGrid = [...prevGrid];

            // Expand grid horizontally if adding at min or max boundary
            if (x <= minX) {
                for (let yCoord = minY; yCoord <= maxY; yCoord++) {
                    for (let zCoord = minZ; zCoord <= maxZ; zCoord++) {
                        if (!newGrid.some((cell) => cell.x === minX - 1 && cell.y === yCoord && cell.z === zCoord)) {
                            const newCell: AreaCoordinate = {x: minX - 1, y: yCoord, z: zCoord, char: '', color: null}
                            const existingCell: AreaCoordinate | undefined = findCell(newCell.x, newCell.y, newCell.z)
                            newGrid.push({...newCell, ...(existingCell ?? {})});
                        }
                    }
                }
            }
            if (x >= maxX) {
                for (let yCoord = minY; yCoord <= maxY; yCoord++) {
                    for (let zCoord = minZ; zCoord <= maxZ; zCoord++) {
                        if (!newGrid.some((cell) => cell.x === maxX + 1 && cell.y === yCoord && cell.z === zCoord)) {
                            const newCell: AreaCoordinate = {x: maxX + 1, y: yCoord, z: zCoord, char: '', color: null}
                            const existingCell: AreaCoordinate | undefined = findCell(newCell.x, newCell.y, newCell.z)
                            newGrid.push({...newCell, ...(existingCell ?? {})});
                        }
                    }
                }
            }

            // Expand grid vertically if adding at min or max boundary
            if (y <= minY) {
                for (let xCoord = minX; xCoord <= maxX; xCoord++) {
                    for (let zCoord = minZ; zCoord <= maxZ; zCoord++) {
                        if (!newGrid.some((cell) => cell.x === xCoord && cell.y === minY - 1 && cell.z === zCoord)) {
                            const newCell: AreaCoordinate = {x: xCoord, y: minY - 1, z: zCoord, char: '', color: null}
                            const existingCell: AreaCoordinate | undefined = findCell(newCell.x, newCell.y, newCell.z)
                            newGrid.push({...newCell, ...(existingCell ?? {})});
                        }
                    }
                }
            }
            if (y >= maxY) {
                for (let xCoord = minX; xCoord <= maxX; xCoord++) {
                    for (let zCoord = minZ; zCoord <= maxZ; zCoord++) {
                        if (!newGrid.some((cell) => cell.x === xCoord && cell.y === maxY + 1 && cell.z === zCoord)) {
                            const newCell: AreaCoordinate = {x: xCoord, y: maxY + 1, z: zCoord, char: '', color: null}
                            const existingCell: AreaCoordinate | undefined = findCell(newCell.x, newCell.y, newCell.z)
                            newGrid.push({...newCell, ...(existingCell ?? {})});
                        }
                    }
                }
            }

            // Expand grid in z axis if limits are set

            for (let zCoord = minZ; zCoord <= maxZ; zCoord++) {
                for (let xCoord = minX; xCoord <= maxX; xCoord++) {
                    for (let yCoord = minY; yCoord <= maxY; yCoord++) {
                        if (!newGrid.some((cell) => cell.x === xCoord && cell.y === yCoord && cell.z === zCoord)) {
                            const newCell: AreaCoordinate = {x: xCoord, y: yCoord, z: zCoord, char: '', color: null}
                            const existingCell: AreaCoordinate | undefined = findCell(newCell.x, newCell.y, newCell.z)
                            newGrid.push({...newCell, ...(existingCell ?? {})});
                        }
                    }
                }
            }


            setGrid(newGrid);
        },
        [findCell, grid, setGrid]
    );

    const updateCoordinate = useCallback(
        (coordinate: AreaCoordinate) => {
            setActiveCell(coordinate);
            setCurrentCoordinate(coordinate);
            const otherValues = grid?.filter(
                (cell) => !(cell.x === coordinate.x && cell.y === coordinate.y && cell.z === coordinate.z)
            ) || [];
            const newGrid = [...otherValues, coordinate];
            setGrid(newGrid);
        },
        [grid, setGrid]
    );


    const isSelectedCell = useCallback((x: number, y: number) => {
        return activeCell?.x === x && activeCell.y === y
    }, [activeCell]);

    const handleCellDoubleClick = useCallback((x: number, y: number) => {
        const newCoordinate: AreaCoordinate = {
            ...(findCell(x, y) ?? {x, y}),
            z: layer,
            char: selectedChar,
            color: selectedColor
        }
        updateCoordinate(newCoordinate)
        setCurrentCoordinate({x, y, z: layer})
    }, [findCell, layer, selectedChar, selectedColor, updateCoordinate]);


    const handleInputChange = useCallback((x: number, y: number, value: string) => {

        let newChar = value.slice(1, 2);
        if (!newChar) {
            newChar = value.slice(0, 1);
        }

        const newCoordinate: AreaCoordinate = {
            ...(findCell(x, y) ?? {x, y}),
            z: layer,
            char: newChar,
            color: selectedColor
        }
        updateCoordinate(newCoordinate);
        setCurrentCoordinate({x, y, z: layer})

    }, [findCell, layer, selectedColor, updateCoordinate]);

    const changeSelectedColor = useCallback(
        (color: string) => {
            setSelectedColor(color);
            if (activeCell) {
                handleCellDoubleClick(activeCell.x, activeCell.y);
            }
        },
        [activeCell, handleCellDoubleClick]
    );


    const layers: { name: string; value: number }[] = useMemo(() => {
        const layers: { name: string; value: number }[] = [];

        const {maxZ, minZ} = zLimits;
        if (maxZ === 0 && minZ === 0) return layers;

        for (let i = 1; i <= maxZ; i++) {
            layers.push({name: `Layer u${i}`, value: i});
        }

        layers.push({name: "Main", value: 0});

        for (let i = -1; i >= minZ; i--) {
            layers.push({name: `Layer d${Math.abs(i)}`, value: i});
        }

        return layers.sort((a, b) => a.value - b.value);
    }, [zLimits]);

    const singleLayerGrid = useMemo(() => {
        if (!grid) return []
        return getSingleLayerGrid(grid, layer)
    }, [grid, layer])


    useEffect(() => {
        if (activeCell) {
            ensureGridGrowth(activeCell.x, activeCell.y);
        }
    }, [activeCell, ensureGridGrowth]);


    useEffect(() => {
        if (currentCoordinate) {
            const layerCell = findCell(currentCoordinate.x, currentCoordinate.y, layer);
            if (layerCell && !deepEqual(layerCell, activeCell)) {
                setActiveCell(layerCell);
            }
        }
    }, [currentCoordinate, findCell, layer, activeCell]);

    const updateArea = useCallback((updates: Partial<Area>) => {
        dispatch(setActiveArea({
                coordinates: [],
                location: highlightedCoords?.at(0) ?? {x:0, y: 0,z:0},
                name: "",
                enterCommand: "",
                exitCommand: "",
                ...area,
                ...updates
            }
        ))
    }, [area, dispatch])


    useEffect(() => {
        if (activeCell?.zChanges) {
            const up = activeCell.zChanges.find((zc) => zc.dir === "u");
            const down = activeCell.zChanges.find((zc) => zc.dir === "d");

            // Handle upward (u) z-change
            if (up) {
                const upper = grid?.find((c) => coordinatesMatch(c, {...activeCell, z: activeCell.z + 1}));
                if (upper && !upper.zChanges?.some((zc) => zc.dir === "d")) {
                    updateCoordinate({
                        ...upper,
                        zChanges: [...(upper.zChanges ?? []), {dir: "d", count: 1}],
                    });
                }
            }

            // Handle downward (d) z-change
            if (down) {
                const lower = grid?.find((c) => coordinatesMatch(c, {...activeCell, z: activeCell.z - 1}));
                if (lower && !lower.zChanges?.some((zc) => zc.dir === "u")) {
                    updateCoordinate({
                        ...lower,
                        zChanges: [...(lower.zChanges ?? []), {dir: "u", count: 1}],
                    });
                }
            }
        }
    }, [activeCell, grid, updateCoordinate]);

    const accordionItems: AccordionItem[] = useMemo(() => ([
        {
            title: "Area",
            content: (
                <Item>
                    <FlexItem>
                        <TextField
                            label={"Name"}
                            name={"name"}
                            value={area?.name || ""}
                            onChange={(event) => updateArea({name: event.target.value})}
                        />
                    </FlexItem>
                    <FlexItem>
                        <TextField
                            label={"Enter command"}
                            name={"enter-command"}
                            value={area?.enterCommand || ""}
                            onChange={(event) => updateArea({
                                enterCommand: event.target.value
                            })}
                        />
                    </FlexItem>
                    <FlexItem>
                        <TextField
                            label={"Exit command"}
                            name={"exit-command"}
                            value={area?.exitCommand || ""}
                            onChange={(event) => updateArea({
                                exitCommand: event.target.value
                            })}
                        />
                    </FlexItem>
                </Item>

            )
        }
    ]), [area?.enterCommand, area?.exitCommand, area?.name, updateArea])


    const downloadArea = useCallback(() => {
        if (area) {
            downloadJson(JSON.stringify(area), `${area.name}-${Date.now()}.json`)

        } else {
            dispatch(showToast({message: "Error downloading are", type: "error"}))
        }
    }, [area, dispatch]);

    const handleSave = useCallback(() => {
        if (isLogged && area) {
            addArea(area).then(() => {
                dispatch(setActiveArea(null))
                dispatch(setAreaModalOpen(false))
                dispatch(showToast({type: "success", message: "Area sent"}))
            }).catch((err) => {
                dispatch(showToast({type: "error", message: "Sending area failed"}))
            })
        }
        if (!isLogged && area) {
            downloadArea()
        }

    }, [area, dispatch, downloadArea, isLogged]);

    const downloadButton = useMemo(() => {
        return isLogged ? (
            <ModalButton buttonText={"Download area file"} onClicked={downloadArea}/>
        ) : null
    }, [downloadArea, isLogged])

    if (!grid) {
        return null
    }
    return (
        <Modal title="Area Editor"
               fullWidth={true}
               isOpen={isOpen}
               onCancel={closeModal}
               onAccept={handleSave}
               acceptButtonText={isLogged ? "Send area" : "Download area"}
               extraButtons={downloadButton}
        >
            <div className="flex h-full">
                {/* Left Side Panel */}
                <div className="w-1/4 bg-gray-900 p-4 text-white h-screen">
                    <Item>
                        <Accordion items={accordionItems} defaultOpenIndex={0}/>
                    </Item>
                    {(zLimits.maxZ !== 0 || zLimits.minZ !== 0) && (
                        <Item>
                            <TextSlider items={layers}
                                        value={layer}
                                        sortKey={"value"}
                                        onTransition={(currentIndex: number, newItem: {
                                            name: string;
                                            value: number
                                        }) => setLayer(newItem.value)}/>
                        </Item>
                    )}
                    <Item>
                        <div className="flex flex-wrap self-center justify-center gap-2 mb-4 w-full">
                            {charShortcuts.map((char) => (
                                <button
                                    key={char}
                                    onClick={() => setSelectedChar(char)}
                                    className={`px-3 py-2 rounded ${
                                        selectedChar === char ? 'bg-blue-500' : 'bg-gray-700'
                                    }`}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    </Item>
                    <Item><ColorPicker colors={colors} onChange={changeSelectedColor}/></Item>
                    <FlexItem>
                        {activeCell && (
                            <AreaCoordinateEdit coordinate={activeCell}
                                                setCoordinate={updateCoordinate}
                                                maxZ={zLimits.maxZ}
                                                minZ={zLimits.minZ}
                            />
                        )}

                    </FlexItem>
                </div>

                <div className="flex-1 flex flex-col items-center space-y-4 p-4">
                    <h2 className="text-xl font-bold text-white">Area Editor</h2>
                    <table className="border-collapse border border-gray-300">
                        <tbody>
                        {/* Group cells into rows */}
                        {Array.from(
                            {length: Math.max(...singleLayerGrid.map((cell) => cell.y)) - Math.min(...singleLayerGrid.map((cell) => cell.y)) + 1},
                            (_, rowIndex) => {
                                const rowY = Math.min(...singleLayerGrid.map((cell) => cell.y)) + rowIndex;
                                return (
                                    <tr key={rowIndex}>
                                        {Array.from(
                                            {length: Math.max(...singleLayerGrid.map((cell) => cell.x)) - Math.min(...singleLayerGrid.map((cell) => cell.x)) + 1},
                                            (_, colIndex) => {
                                                const colX = Math.min(...singleLayerGrid.map((cell) => cell.x)) + colIndex;
                                                const cell = singleLayerGrid.find((c) => c.x === colX && c.y === rowY) as AreaCoordinate;
                                                return (
                                                    <td
                                                        key={`${colX},${rowY}`}
                                                        className={`border border-gray-300 w-10 h-10 ${isSelectedCell(colX, rowY) ? "bg-gray-400" : "bg-gray-800"} text-center align-middle`}
                                                        onDoubleClick={() => handleCellDoubleClick(colX, rowY)}
                                                    >
                                                        <input
                                                            value={cell?.char || ""}
                                                            onChange={(e) => handleInputChange(colX, rowY, e.target.value)}
                                                            className="w-full h-full text-center bg-transparent outline-none"
                                                            style={{
                                                                color: cell?.color || '#ffffff', // Display character color
                                                            }}
                                                        />
                                                    </td>
                                                );
                                            }
                                        )}
                                    </tr>
                                );
                            }
                        )}
                        </tbody>
                    </table>

                </div>
            </div>
        </Modal>
    );
};

export default AreaEditorModal;
