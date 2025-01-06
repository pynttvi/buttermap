import React, {useEffect, useMemo, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {PerspectiveCamera} from 'three/src/cameras/PerspectiveCamera';

import {useAppSelector} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import {BasicCoordinate, SimpleCoordinate} from "@/app/model/coordinate";

interface SphereMapProps {
    gridData: BasicCoordinate[];
    onDoubleClick: (originalCoordinates: SimpleCoordinate) => void;
}

interface CameraSettings {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
}


const SphereMap: React.FC<SphereMapProps> = ({
                                                 gridData,
                                                 onDoubleClick,
                                             }) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const highlightedCoords = useAppSelector(
        (state: ButtermapState) => state.highlightedCoords,
        shallowEqual
    );

    const maxValues: { x: number; y: number } = gridData.reduce(
        (acc, coord) => ({
            x: Math.max(acc.x, coord.x),
            y: Math.max(acc.y, coord.y),
        }),
        {x: -Infinity, y: -Infinity} // Initial values
    );

    const sphereSettings = {
        rows: maxValues.y,
        columns: maxValues.x,
        radius: 100,
        polarCapHeight: 0.02,
        charSize: 16,
    };

    const {rows, columns, radius, polarCapHeight, charSize} = sphereSettings;

    const [cameraSettings] = useState<CameraSettings>({
        fov: 75,
        aspect: 2,
        near: 0.1,
        far: 2000,
    });

    const camera = useMemo(() => {
            return new PerspectiveCamera(
                cameraSettings.fov,
                cameraSettings.aspect,
                cameraSettings.near,
                cameraSettings.far
            )
        }, []
    );

    const [scene] = useState(new THREE.Scene());
    const [controls, setControls] = useState<OrbitControls | null>(null);
    const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;


        const newRenderer = new THREE.WebGLRenderer();
        newRenderer.setSize(mount.clientWidth, mount.clientHeight);
        mount.appendChild(newRenderer.domElement);
        setRenderer(newRenderer);

        camera.position.z = radius * 2;

        const orbitControls = new OrbitControls(camera, newRenderer.domElement);

        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;
        orbitControls.enablePan = false;
        orbitControls.rotateSpeed = 0.5;

        setControls(orbitControls);

        return () => {
            newRenderer.dispose();
            mount.removeChild(newRenderer.domElement);
            orbitControls.dispose();
        };
    }, [camera, radius]);

    useEffect(() => {
        if (!renderer || !controls) return;

        const adjustedRows = rows + Math.floor(rows * polarCapHeight * 2);
        const sphereGeometry = new THREE.SphereGeometry(
            radius,
            columns, // Horizontal segments
            adjustedRows, // Vertical segments
            0, // Start angle
            Math.PI * 2, // Horizontal sweep
            0, // Vertical start angle
            Math.PI // Vertical sweep (covers full sphere)
        );

        const textureCanvas = document.createElement('canvas');
        const ctx = textureCanvas.getContext('2d');
        if (!ctx) return;

        const redistributeY = (
            y: number,
            totalRows: number,
            polarCapRows: number
        ) => {
            if (y < polarCapRows) {
                return 0; // Map top polar cap rows to the top
            } else if (y >= totalRows - polarCapRows) {
                return totalRows - 1; // Map bottom polar cap rows to the bottom
            } else {
                return y - polarCapRows; // Normal rows mapped to usable rows
            }
        };
        const generatePolarCapData = (
            columns: number, polarCapRows: number, isTopCap: boolean) => {
            const polarCapData = [];
            for (let y = 0; y < polarCapRows; y++) {
                for (let x = 0; x < columns; x++) {
                    polarCapData.push({
                        x,
                        y: isTopCap ? -1 - y : rows + y, // Negative y for top cap, rows + y for bottom cap
                        char: '', // No character for polar caps
                        color: isTopCap ? 'blue' : 'red', // Different colors for top and bottom caps
                    });
                }
            }
            return polarCapData;
        };

        const totalRows = rows + Math.floor(rows * polarCapHeight * 2); // Total rows, including polar caps
        const polarCapRows = Math.floor(rows * polarCapHeight); // Rows reserved for polar caps

        const topPolarCapData = generatePolarCapData(columns, polarCapRows, true); // Top polar cap
        const bottomPolarCapData = generatePolarCapData(columns, polarCapRows, false); // Bottom polar cap

// Combine polar cap data with main grid data
        const combinedGridData = [...topPolarCapData, ...gridData, ...bottomPolarCapData];

        const drawMap = () => {

            textureCanvas.width = columns * charSize;
            textureCanvas.height = totalRows * charSize;

            // Clear canvas
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

            // Draw all grid data, including polar caps
            combinedGridData.forEach(({x, y, char, color}) => {
                let scaledY;

                if (y < 0) {
                    // Top polar cap
                    scaledY = (polarCapRows + y) * charSize + charSize / 2;
                } else if (y >= rows) {
                    // Bottom polar cap
                    scaledY = (polarCapRows + (y - rows)) * charSize + charSize / 2;
                } else {
                    // Usable rows
                    const redistributedY = y + polarCapRows; // Shift usable rows below the top cap
                    scaledY = redistributedY * charSize + charSize / 2;
                }

                const scaledX = x * charSize + charSize / 2;

                // Draw the point (either a filled rectangle or text)
                ctx.fillStyle = color || 'white';
                if (char) {
                    ctx.fillText(char, scaledX, scaledY);
                } else {
                    ctx.fillRect(scaledX - charSize / 2, scaledY - charSize / 2, charSize, charSize);
                }
            });
        };

        drawMap();

        scene.rotation.x = Math.PI;

        const dynamicTexture = new THREE.CanvasTexture(textureCanvas);
        dynamicTexture.wrapS = THREE.RepeatWrapping;
        dynamicTexture.wrapT = THREE.ClampToEdgeWrapping;

        const sphereMaterial = new THREE.MeshBasicMaterial({map: dynamicTexture});
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

        sphere.rotation.x = Math.PI;

        scene.clear();
        scene.add(sphere);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();
    }, [renderer, controls, gridData, highlightedCoords, rows, columns, radius, polarCapHeight, charSize]);

    return <div ref={mountRef} style={{width: '100%', height: '100%'}}/>;
};

export default SphereMap;
