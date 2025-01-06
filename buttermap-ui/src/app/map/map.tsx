'use client';
import React, {useEffect, useMemo, useRef, useState} from 'react';

import {useAppSelector} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import {BasicCoordinate, FullCoordinate, SimpleCoordinate} from "@/app/model/coordinate";

interface MudMapProps {
    coords: FullCoordinate[];
    onDoubleClick: (coord: SimpleCoordinate) => void;
    charSize: number;
}

const MudMap: React.FC<MudMapProps> = ({
                                           coords,
                                           onDoubleClick,
                                           charSize = 16,
                                       }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const coordinateChanges = useAppSelector(
        (state: ButtermapState) => state.changes,
        shallowEqual
    );
    const highlightedCoords = useAppSelector((state: ButtermapState) => state.highlightedCoords, shallowEqual);
    const activeRoute = useAppSelector((state: ButtermapState) => state.activeRoute, shallowEqual);
    const namedCoordinates = useMemo(() => {
        return coords.filter((c) => c.name)
    }, [coords])
    const centerOnCoordinate = (coordinate: SimpleCoordinate) => {
        if (!containerRef.current || !canvasRef.current) return;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const centerX = coordinate.x * charSize - containerWidth / 2 + charSize / 2;
        const centerY = coordinate.y * charSize - containerHeight / 2 + charSize / 2;

        setOffset({
            x: Math.max(0, centerX),
            y: Math.max(0, centerY),
        });
    };
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

    // Rendering logic
    const renderMap = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Determine canvas dimensions
        const maxX = Math.max(...coords.map((coord) => coord.x)) + 1;
        const maxY = Math.max(...coords.map((coord) => coord.y)) + 1;

        canvas.width = canvas.parentElement?.clientWidth || maxX * charSize;
        canvas.height = canvas.parentElement?.clientHeight || maxY * charSize;

        ctx.font = `${charSize}px monospace`;
        ctx.textBaseline = "top";

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Build a 2D grid representation of the map
        const grid: Record<number, Record<number, { char: string; color: string | null }>> = {};
        coords.forEach(({ x, y, char, color }) => {
            if (!grid[y]) grid[y] = {};
            grid[y][x] = { char, color: color || "#fff" };
        });

        // Render row by row with highlighting and offset
        for (let y = 0; y < maxY; y++) {
            for (let x = 0; x < maxX; x++) {
                const cell = grid[y]?.[x];

                // Highlight cell if it's in highlightedCoords
                highlightedCoords.forEach((highlightedCoord) => {
                    if (highlightedCoord && highlightedCoord.x === x && highlightedCoord.y === y) {
                        ctx.fillStyle = "yellow";
                        ctx.fillRect(
                            x * charSize - offset.x,
                            y * charSize - offset.y,
                            charSize,
                            charSize
                        ); // Adjust for dragging offset
                    }
                });
                coordinateChanges.forEach((change) => {
                    if (change && change?.coord?.x === x && change?.coord?.y === y) {
                        ctx.fillStyle = "yellow";
                        ctx.fillRect(
                            x * charSize - offset.x,
                            y * charSize - offset.y,
                            charSize,
                            charSize
                        ); // Adjust for dragging offset
                    }
                });
                activeRoute?.routeCoordinates.forEach((coord) => {
                    if (coord && coord?.x === x && coord?.y === y) {
                        ctx.fillStyle = "amber";
                        ctx.fillRect(
                            x * charSize - offset.x,
                            y * charSize - offset.y,
                            charSize,
                            charSize
                        ); // Adjust for dragging offset
                    }
                });

                namedCoordinates.forEach((coord) => {
                    if (coord && coord?.x === x && coord?.y === y) {
                        ctx.fillStyle = `rgb(0,66,66)`;
                        ctx.fillRect(
                            x * charSize - offset.x,
                            y * charSize - offset.y,
                            charSize,
                            charSize
                        ); // Adjust for dragging offset
                    }
                });

                // Draw the character
                if (cell) {
                    ctx.fillStyle = cell.color || "white";
                    ctx.fillText(
                        cell.char,
                        x * charSize - offset.x,
                        y * charSize - offset.y
                    ); // Adjust for dragging offset
                }
            }
        }
    };

    useEffect(() => {
        renderMap();
    }, [coords, charSize, highlightedCoords, coordinateChanges, offset]);

    // Handle double-click events
    const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left + offset.x;
        const mouseY = event.clientY - rect.top + offset.y;

        // Determine clicked character
        const clickedX = Math.floor(mouseX / charSize);
        const clickedY = Math.floor(mouseY / charSize);

        const clickedItem = coords.find((coord) => coord.x === clickedX && coord.y === clickedY);

        if (clickedItem) {
            onDoubleClick(clickedItem);
        }
    };

    // Handle mouse down for dragging
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setDragStart({ x: event.clientX, y: event.clientY });
    };

    // Handle mouse move for dragging
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !dragStart) return;

        const dx = dragStart.x - event.clientX;
        const dy = dragStart.y - event.clientY;

        setOffset((prevOffset) => ({
            x: Math.max(0, prevOffset.x + dx),
            y: Math.max(0, prevOffset.y + dy),
        }));

        setDragStart({ x: event.clientX, y: event.clientY });
    };

    // Handle mouse up to stop dragging
    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
                onDoubleClick={handleCanvasDoubleClick}
            ></canvas>
        </div>
    );
};

export default MudMap;
