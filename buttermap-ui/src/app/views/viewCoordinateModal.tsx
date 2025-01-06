'use client'
import React, {useCallback, useEffect, useState} from "react";
import {CoordinateChange, CoordinateFeature} from "@/app/model/coordinate";
import {setViewModalOpen, useAppDispatch, useAppSelector} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import Modal from "@/app/components/modal";
import {downloadJson} from "@/app/utils";

const isDev = process.env.NODE_ENV === "development";

const acceptChange = async (fileName: string) => {
    try {
        const response = await fetch(`/api/accept-change?filename=${fileName}`, {
            method: 'POST',
        });

        if (response.ok) {
            console.log("Ok")
        } else {
            console.error('Error fetching changes');
        }
    } catch (error) {
        console.error('Error:', error);
        console.error('An unexpected error occurred');
    }
};

const downloadChange = (change: CoordinateChange | null) => {
    downloadJson(change, `coordinate-change-${Date.now()}.json`)
};

const bm = ["z", "o", "m", "b", "i", "e"]

const ViewCoordinateModal: React.FC = () => {
    const dispatch = useAppDispatch(); // Dispatch actions

    const isOpen = useAppSelector((state: ButtermapState) => state.viewModalOpen, shallowEqual);
    const activeChange = useAppSelector((state: ButtermapState) => state.activeChange, shallowEqual);
    const coordinate = useAppSelector((state: ButtermapState) => state.activeCoordinate, shallowEqual);

    const changes = useAppSelector((state: ButtermapState) => state.changes, shallowEqual);
    const [change, setChange] = useState<CoordinateChange | null>(null);
    const [bestMud, setBestMud] = useState<string>(bm.join(""));

    const doAcceptChange = useCallback(() => {
        if (isDev) {
            acceptChange(activeChange?.fileName ?? "")
        } else {
            downloadChange(change)
        }
    }, [change, activeChange]);


    const onAccept = useCallback(() => {
        doAcceptChange()
        dispatch(setViewModalOpen(false));
    }, [dispatch, change, coordinate]);

    useEffect(() => {
        if (!coordinate) return;
        const c = changes.find((c1) => {
            return (
                c1?.coord?.x === coordinate.x &&
                c1?.coord?.y === coordinate.y &&
                c1?.coord?.z === coordinate.z
            );
        });
        if (c) setChange(c);
    }, [changes, coordinate]);

    if (!coordinate) return null;

    return (
        <Modal
            title={"View Coordinate"}
            isOpen={isOpen}
            onAccept={bestMud.indexOf(bm.join("")) !== -1 && activeChange ? onAccept : undefined}
            acceptButtonText={isDev ? "Accept" : "Download change file"}
            onCancel={() => dispatch(setViewModalOpen(false))}
        >
            <div className="p-6 bg-black rounded-lg shadow-md">
                {/* Full Coordinate Section */}
                <section className="mb-6">
                    <h2 className="text-xl font-bold mb-3 text-white">Coordinate</h2>
                    <div className="bg-gray-800 rounded-lg p-4 shadow">
                        <p className="text-gray-300">
                            <span className="font-semibold text-white">X:</span> {coordinate.x}
                        </p>
                        <p className="text-gray-300">
                            <span className="font-semibold text-white">Y:</span> {coordinate.y}
                        </p>
                        <p className="text-gray-300">
                            <span className="font-semibold text-white">Z:</span> {coordinate.z}
                        </p>
                        <p className="text-gray-300">
                            <span className="font-semibold text-white">Char:</span> {coordinate.char}
                        </p>
                        <p className="text-gray-300">
                            <span className="font-semibold text-white">Color:</span>{" "}
                            {coordinate.color || "None"}
                        </p>
                        {coordinate.name && (
                            <p className="text-gray-300">
                                <span className="font-semibold text-white">Name:</span>{" "}
                                {coordinate.name}
                            </p>
                        )}
                        {coordinate.features && (
                            <div className="text-gray-300">
                                <span className="font-semibold text-white">Features:</span>
                                <ul className="list-disc list-inside">
                                    {coordinate.features.map((feature: CoordinateFeature, index) => (
                                        <li key={index} className="text-gray-300">{CoordinateFeature[feature]}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {coordinate.transports && (
                            <div className="text-gray-300">
                                <span className="font-semibold text-white">Transports:</span>
                                <ul className="list-disc list-inside">
                                    {coordinate.transports.map((transport, index) => (
                                        <li key={index} className="text-gray-300">
                                            {transport.targetName} ({transport.moveCommand})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {coordinate.area && (
                            <div className="text-gray-300">
                                <span className="font-semibold text-white">Area:</span>
                                <ul className="list-disc list-inside">
                                    <li className="text-gray-300">Enter: {coordinate.area.enterCommand}</li>
                                    <li className="text-gray-300">Exit: {coordinate.area.exitCommand}</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </section>

                {/* Coordinate Change Section */}
                {change && (
                    <section>
                        <h2 className="text-xl font-bold mb-3 text-white">Coordinate Change</h2>
                        <div className="bg-gray-800 rounded-lg p-4 shadow">
                            <p className="text-gray-300">
                                <span className="font-semibold text-white">Feature action:</span>{" "}
                                {change.action}
                            </p>
                            <p className="text-gray-300">
                                <span className="font-semibold text-white">Status:</span>{" "}
                                {change.status}
                            </p>
                            {change.coord && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">
                                        Target Coordinate:
                                    </span>{" "}
                                    X: {change.coord.x}, Y: {change.coord.y}, Z: {change.coord.z}
                                </p>
                            )}
                            {change.features && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">Features:</span>{" "}
                                    {change.features.map((f) => CoordinateFeature[f]).join(", ")}
                                </p>
                            )}
                            {change.charChange && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">Char Change:</span>{" "}
                                    {change.charChange}
                                </p>
                            )}
                            {change.color && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">Color:</span>{" "}
                                    {change.color}
                                </p>
                            )}
                            {change.name && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">Name:</span>{" "}
                                    {change.name}
                                </p>
                            )}
                            {change.transports && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">Transports:</span>{" "}
                                    {change.transports
                                        .map(
                                            (transport) =>
                                                `${transport.targetName} (${transport.moveCommand})`
                                        )
                                        .join(", ")}
                                </p>
                            )}
                            {change.area && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">Area:</span>{" "}
                                    {change.area.enterCommand} / {change.area.exitCommand}
                                </p>
                            )}
                            {change.author && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">Author:</span>{" "}
                                    {change.author}
                                </p>
                            )}
                            {change.description && (
                                <p className="text-gray-300">
                                    <span className="font-semibold text-white">
                                        Description:
                                    </span>{" "}
                                    {change.description}
                                </p>
                            )}
                        </div>
                        {/*                        <TextField
                            label={"Bestmud"}
                            name={bestMud}
                            value={bestMud}
                            onChange={(event) => setBestMud(event.target.value)}/>*/}
                    </section>
                )}
            </div>
        </Modal>
    );
};

export default ViewCoordinateModal;
