import React, {useCallback, useState} from "react";
import {AreaCoordinate, SpecialDir} from "@/app/model/area";
import {MultipartCommand} from "@/app/utils";
import Item from "@/app/components/item";
import FlexItem from "@/app/components/flexItem";

interface SpecialDirsEditorProps {
    areaCoordinate: AreaCoordinate;
    onUpdateSpecialDirs: (specialDirs: SpecialDir[]) => void;
}

export const SpecialDirsEdit: React.FC<SpecialDirsEditorProps> = ({
                                                                      areaCoordinate,
                                                                      onUpdateSpecialDirs,
                                                                  }) => {
    const [alias, setAlias] = useState<string>("");
    const [equalToNormal, setEqualToNormal] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const updateEqualToNormal = useCallback((equalToNormal: string) => {
        setEqualToNormal(equalToNormal)
    }, [])

    const handleAddOrEditSpecialDir = () => {
        try {

            const newSpecialDir: SpecialDir = {
                alias,
                equalToNormal: new MultipartCommand(equalToNormal ?? "").toString(),
            };

            if (editIndex !== null) {
                const updatedDirs = [...(areaCoordinate.spacialDirs || [])];
                updatedDirs[editIndex] = newSpecialDir;
                onUpdateSpecialDirs(updatedDirs);
                setEditIndex(null);
            } else {
                onUpdateSpecialDirs([...(areaCoordinate.spacialDirs || []), newSpecialDir]);
            }

            setAlias("");
            updateEqualToNormal("");
            setError("");
        } catch (err: any) {
            setError(err.message || "Invalid input");
        }
    };

    const handleRemoveSpecialDir = (index: number) => {
        const updatedDirs = (areaCoordinate.spacialDirs || []).filter(
            (_: SpecialDir, i: number) => i !== index
        );
        onUpdateSpecialDirs(updatedDirs);
    };

    const handleEditSpecialDir = (index: number) => {
        const dirToEdit = areaCoordinate.spacialDirs?.[index];
        if (dirToEdit) {
            setAlias(dirToEdit.alias);
            updateEqualToNormal(dirToEdit.equalToNormal);
            setEditIndex(index);
        }
    };

    const handleCancelEdit = () => {
        setAlias("");
        setEqualToNormal("");
        setError("");
        setEditIndex(null);
    };

    return (
        <div className="space-y-4">
            <ul className="space-y-2">
                {areaCoordinate.spacialDirs?.map((dir: SpecialDir, index: number) => (
                    <li
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-800 border border-gray-700 rounded"
                    >
                        <FlexItem><span className="text-white">
                            Alias: {dir.alias}, EqualToNormal: {dir.equalToNormal.toString()}
                        </span></FlexItem>
                        <div className="space-x-3">
                            <FlexItem>
                                <button
                                    onClick={() => handleEditSpecialDir(index)}
                                    className="px-2 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none"
                                >
                                    Edit
                                </button>
                            </FlexItem>
                            <FlexItem>
                                <button
                                    onClick={() => handleRemoveSpecialDir(index)}
                                    className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
                                >
                                    Remove
                                </button>
                            </FlexItem>
                        </div>
                    </li>
                ))}
            </ul>
            <div className="space-y-2">
                <div className="flex flex-col space-y-2">
                    <label className="text-white font-medium">Alias</label>
                    <input
                        type="text"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        placeholder="Enter alias"
                        className="p-2 bg-gray-800 text-white border border-gray-700 rounded"
                    />
                </div>
                <div className="flex flex-col space-y-2">
                    <label className="text-white font-medium">Equal to Normal</label>
                    <input
                        type="text"
                        value={equalToNormal.toString()}
                        onChange={(e) => setEqualToNormal(e.target.value)}
                        placeholder="Enter multipart command (e.g., n;ne;w)"
                        className="p-2 bg-gray-800 text-white border border-gray-700 rounded"
                    />
                </div>
                {error && <div className="text-red-500">{error}</div>}
                <div className="flex space-x-2">
                    <Item>
                        <button
                            onClick={handleAddOrEditSpecialDir}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                        >
                            {editIndex !== null ? "Save Changes" : "Add Special Direction"}
                        </button>
                    </Item>
                    {editIndex !== null && (
                        <Item>
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 focus:outline-none"
                            >
                                Cancel
                            </button>
                        </Item>
                    )}
                </div>
            </div>
        </div>
    );
};
