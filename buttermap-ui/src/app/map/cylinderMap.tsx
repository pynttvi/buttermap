'use client'
import React, {useEffect, useMemo, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {PerspectiveCamera} from 'three/src/cameras/PerspectiveCamera';

import {useAppSelector} from "@/app/redux/buttermapReducer";
import {ButtermapState} from "@/app/redux/buttermapState";
import {shallowEqual} from "react-redux";
import {CoordinateChange, BasicCoordinate, SimpleCoordinate} from "@/app/model/coordinate";
import {deepEqual} from "@/app/utils";

interface CylinderMapProps {
    gridData: BasicCoordinate[];
    onDoubleClick: (originalCoordinates: SimpleCoordinate) => void;
}

interface CameraSettings {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
}

function generateProceduralTexture(size = 512) {
    if (!document) return;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill the canvas with a base color
    ctx.fillStyle = '#f5f5dc'; // Base eggshell color
    ctx.fillRect(0, 0, size, size);

    // Add noise for darker spots
    for (let i = 0; i < size * size * 0.01; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = Math.random() * 3;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`; // Semi-transparent dark spot
        ctx.fill();
    }

    // Add cracks as thin lines
    for (let i = 0; i < 10; i++) {
        const startX = Math.random() * size;
        const startY = Math.random() * size;
        const length = Math.random() * size * 0.2;
        const angle = Math.random() * Math.PI * 2;

        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = Math.random() * 1 + 0.5; // Random thin width
        ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`; // Semi-transparent crack
        ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
}


const CylinderMap: React.FC<CylinderMapProps> = ({gridData, onDoubleClick}) => {
    const mountRef = useRef<HTMLDivElement | null>(null);

    if(!document) return null

    const coords = useAppSelector(
        (state: ButtermapState) => state.coords,
        shallowEqual
    );
    const highlightedCoords = useAppSelector(
        (state: ButtermapState) => state.highlightedCoords,
        shallowEqual
    );
    const coordinateChanges = useAppSelector(
        (state: ButtermapState) => state.changes,
        deepEqual
    );
    const activeChange = useAppSelector(
        (state: ButtermapState) => state.activeChange,
        shallowEqual
    );
    const activeRoute = useAppSelector(
        (state: ButtermapState) => state.activeRoute,
        deepEqual
    );

    const centerCoordinate = (coordinate: SimpleCoordinate) => {
        if (!controls || !camera) return;

        // Calculate theta (longitude) and y (latitude) of the coordinate
        const theta = (coordinate.x / cylinderSettings.columns) * Math.PI * 2; // Convert grid X to radians
        const normalizedY = 1 - coordinate.y / cylinderSettings.rows; // Normalize Y (reverse direction for correct orientation)
        const stretchedY = normalizedY * cylinderSettings.height - cylinderSettings.height / 2; // Map Y to cylinder height

        // Calculate the new camera position to align the target coordinate at the center
        const cameraDistance = camera.position.distanceTo(controls.target); // Keep the same camera distance
        const newCameraPosition = new THREE.Vector3(
            Math.cos(theta) * cameraDistance,
            stretchedY,
            -Math.sin(theta) * cameraDistance // Negate Z for correct orientation
        );

        // Update the camera position and orientation
        camera.position.copy(newCameraPosition);
        camera.lookAt(
            Math.cos(theta) * cylinderSettings.radius,
            stretchedY,
            -Math.sin(theta) * cylinderSettings.radius
        );

        // Ensure the controls are updated
        controls.update();
    };


    const maxValues: { x: number; y: number } = gridData.reduce(
        (acc, coord) => ({
            x: Math.max(acc.x, coord.x),
            y: Math.max(acc.y, coord.y),
        }),
        {x: -Infinity, y: -Infinity} // Initial values
    );

    const cylinderSettings = useMemo(() => ({
        rows: maxValues.y,
        columns: maxValues.x,
        radius: 100,
        height: maxValues.y, // Proportional height based on rows and charSize
        charSize: 16,
        equatorStretch: 0.3
    }), []);


    const [cameraSettings] = useState<CameraSettings>({
        fov: 75,
        aspect: 1,
        near: 1,
        far: 1000,
    });

    const [camera] = useState(
        new PerspectiveCamera(
            cameraSettings.fov,
            cameraSettings.aspect,
            cameraSettings.near,
            cameraSettings.far
        )
    );

    const scene = useMemo(() => new THREE.Scene(), []);
    const [controls, setControls] = useState<OrbitControls | null>(null);
    const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);



    const capSettings = useMemo(() => ({
        radius: cylinderSettings.radius,
        columns: cylinderSettings.columns,
        rows: cylinderSettings.rows,
        phiStart: 0,
        phiLength: Math.PI * 2,
        thetaStart: 0,
        thetaLength: Math.PI / 5
    }), [])

    const topHemisphereGeometry = useMemo(() => new THREE.SphereGeometry(
        capSettings.radius, // Radius
        capSettings.columns, // Width segments
        capSettings.rows, // Height segments
        capSettings.phiStart, // Phi start
        capSettings.phiLength, // Phi length
        0, // Theta start
        Math.PI / 2 // Theta length (half sphere)
    ), []);


    const bottomHemisphereGeometry = useMemo(() => new THREE.SphereGeometry(
        capSettings.radius, // Radius
        capSettings.columns, // Width segments
        capSettings.rows, // Height segments
        capSettings.phiStart, // Phi start
        capSettings.phiLength, // Phi length
        Math.PI / 2, // Theta start
        Math.PI / 2 // Theta length (half sphere)
    ), []);

    const eggshellTexture = useMemo(() => generateProceduralTexture(512), [])
    const hemisphereMaterial = new THREE.MeshBasicMaterial({
        color: '#f5f5dc', // Base eggshell color
        map: eggshellTexture, // Use the generated procedural texture
    });
    const capScale = {
        x: 1,
        y: 0.2,
        z: 1
    }

    const topHemisphere = useMemo(() => {
        const topHemisphere = new THREE.Mesh(
            topHemisphereGeometry, hemisphereMaterial // Match the cylinder material
        );
        topHemisphere.position.y = cylinderSettings.height / 2; // Position at the top of the cylinder
        topHemisphere.scale.set(capScale.x, capScale.y, capScale.z);
        return topHemisphere;
    }, [])

    const bottomHemisphere = useMemo(() => {
        const bottomHemisphere = new THREE.Mesh(
            bottomHemisphereGeometry, hemisphereMaterial // Match the cylinder material
        );
        bottomHemisphere.position.y = -cylinderSettings.height / 2; // Position at the bottom of the cylinder
        bottomHemisphere.scale.set(capScale.x, capScale.y, capScale.z); // Reduce height (y-axis) by 50%

        return bottomHemisphere
    }, [])

    const cylinderGeometry = useMemo(() => {
        const cylinderGeometry = new THREE.CylinderGeometry(
            cylinderSettings.radius, // Top radius
            cylinderSettings.radius, // Bottom radius
            cylinderSettings.height, // Height of the cylinder
            cylinderSettings.columns, // Radial segments (columns)
            cylinderSettings.rows, // Height segments (rows)
            true // Open-ended cylinder

        )
        const vertices = cylinderGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];

            // Scale factor based on y-coordinate (height)
            const normalizedY = (y + cylinderSettings.height / 2) / cylinderSettings.height; // Map y to range [0, 1]
            const stretchFactor = 1 + Math.sin(normalizedY * Math.PI) * cylinderSettings.equatorStretch; // Adjust stretch

            // Apply scaling to x and z
            vertices[i] = x * stretchFactor;
            vertices[i + 2] = z * stretchFactor;
        }

        // Update the geometry after modifying vertices
        cylinderGeometry.attributes.position.needsUpdate = true;
        cylinderGeometry.attributes.uv.needsUpdate = true;

        return cylinderGeometry
    }, []);


    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const newRenderer = new THREE.WebGLRenderer();
        newRenderer.setSize(mount.clientWidth, mount.clientHeight);
        mount.appendChild(newRenderer.domElement);
        setRenderer(newRenderer);

        camera.position.z = cylinderSettings.radius * 4; // Pull the camera back to view the cylinder

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
    }, [camera]);

    const namedCoordinates = useMemo(() => {
        return coords.filter((c) => c.name)
    }, [coords])

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return
        if (!document) return;

        if (!renderer || !controls) return;

        // Create Dynamic Texture
        const textureCanvas = document.createElement('canvas');
        const ctx = textureCanvas.getContext('2d');
        if (!ctx) return;

        const drawMap = () => {
            textureCanvas.width = cylinderSettings.columns * cylinderSettings.charSize;
            textureCanvas.height = cylinderSettings.rows * cylinderSettings.charSize;

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

            ctx.translate(0, textureCanvas.height); // Move the origin to the bottom-left
            ctx.scale(1, -1); // Flip vertically

            ctx.font = `${cylinderSettings.charSize}px monospace`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            gridData.forEach(({x, y, char, color}) => {
                const scaledX = x * cylinderSettings.charSize + cylinderSettings.charSize / 2;
                const scaledY = y * cylinderSettings.charSize + cylinderSettings.charSize / 2;

                highlightedCoords.forEach((highlightedCoord) => {
                    if (highlightedCoord && highlightedCoord.x === x && highlightedCoord.y === y) {
                        ctx.fillStyle = 'yellow';
                        ctx.fillRect(x * cylinderSettings.charSize, y * cylinderSettings.charSize, cylinderSettings.charSize, cylinderSettings.charSize);
                    }
                });
                coordinateChanges.forEach((change: CoordinateChange) => {
                    if (change && change?.coord?.x === x && change?.coord?.y === y) {
                        ctx.fillStyle = 'red';
                        ctx.fillRect(x * cylinderSettings.charSize, y * cylinderSettings.charSize, cylinderSettings.charSize, cylinderSettings.charSize);
                    }
                });

                activeRoute?.routeCoordinates?.forEach((coord: SimpleCoordinate) => {
                    if (coord && coord.x === x && coord.y === y) {
                        ctx.fillStyle = 'amber';
                        ctx.fillRect(x * cylinderSettings.charSize, y * cylinderSettings.charSize, cylinderSettings.charSize, cylinderSettings.charSize);
                    }
                });

                namedCoordinates?.forEach((coord: SimpleCoordinate) => {
                    if (coord && coord.x === x && coord.y === y) {
                        ctx.fillStyle = `rgb(0,66,66)`;
                        ctx.fillRect(x * cylinderSettings.charSize, y * cylinderSettings.charSize, cylinderSettings.charSize, cylinderSettings.charSize);
                    }
                });

                ctx.fillStyle = color || 'white';
                ctx.fillText(char, scaledX, scaledY);
            });

            // Reset transformation after drawing
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        };


        drawMap();

        const dynamicTexture = new THREE.CanvasTexture(textureCanvas);
        dynamicTexture.wrapS = THREE.RepeatWrapping; // Ensure wrapping horizontally
        dynamicTexture.wrapT = THREE.ClampToEdgeWrapping; // Clamp vertically
        dynamicTexture.flipY = false; // Disable vertical flip (already handled in canvas)

        const cylinderMaterial = new THREE.MeshBasicMaterial({
            map: dynamicTexture,
            side: THREE.DoubleSide,
        });

        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        scene.clear();

        const mapGroup = new THREE.Group();
        mapGroup.add(cylinder);
        mapGroup.add(topHemisphere);
        mapGroup.add(bottomHemisphere);

        scene.add(mapGroup);

        const handleDoubleClick = (event: MouseEvent) => {
            if (!mount) return;

            const rect = mount.getBoundingClientRect();
            const mouseX = ((event.clientX - rect.left) / mount.clientWidth) * 2 - 1;
            const mouseY = -((event.clientY - rect.top) / mount.clientHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(mouseX, mouseY);
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObject(cylinder, true);

            if (intersects.length > 0) {
                const intersection = intersects[0].point;

                // Calculate Theta (longitude)
                let theta = Math.atan2(-intersection.z, intersection.x); // Flip Z-axis
                theta += Math.PI * 0.5; // Adjust for texture alignment
                if (theta < 0) theta += 2 * Math.PI; // Normalize to [0, 2π]

                const normalizedTheta = theta / (2 * Math.PI);

                // Calculate Stretched Y (latitude)
                const stretchedY = intersection.y + cylinderSettings.height / 2; // Convert Y to [0, height]

                // Reverse the stretching effect
                const correctedY = stretchedY; // Apply inverse stretch factor
                const normalizedY = correctedY / cylinderSettings.height; // Normalize to [0, 1]

                // Map to grid coordinates
                const gridX = Math.floor(normalizedTheta * cylinderSettings.columns);
                const gridY = Math.floor((1 - normalizedY) * cylinderSettings.rows); // Reverse Y-axis for correct orientation

                // Trigger the callback with the mapped coordinates
                onDoubleClick({x: gridX, y: gridY, z: 0});
            }
        };


        mountRef.current?.addEventListener('dblclick', handleDoubleClick);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();
        return () => {
            mount.removeEventListener('dblclick', handleDoubleClick);
        };

    }, [renderer, controls, gridData, highlightedCoords, coordinateChanges, cylinderSettings, activeRoute]);

    useEffect(() => {
        centerCoordinate(activeChange?.change?.coord as SimpleCoordinate)
    }, [activeChange]);
    return <div ref={mountRef} style={{width: '100%', height: '100%'}}/>;
};

export default CylinderMap;
